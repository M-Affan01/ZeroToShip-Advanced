require('dotenv').config();
const { WebSocketServer } = require('ws');
const Redis = require('ioredis');
const { v4: uuidv4 } = require('uuid');
const http = require('http');

const PORT = process.env.WS_PORT || 8080;
const REDIS_HOST = process.env.REDIS_HOST || 'redis-event-bus';
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_CHANNEL = process.env.REDIS_CHANNEL || 'cis_events';
const HEARTBEAT_INTERVAL = parseInt(process.env.HEARTBEAT_INTERVAL) || 30000;
const RECONNECT_ATTEMPTS = parseInt(process.env.RECONNECT_ATTEMPTS) || 10;

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      service: 'websocket-server',
      connections: clients.size,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

const wss = new WebSocketServer({ server });

const redisSub = new Redis({ host: REDIS_HOST, port: REDIS_PORT, retryStrategy: (times) => Math.min(times * 100, 5000) });
const redisPub = new Redis({ host: REDIS_HOST, port: REDIS_PORT, retryStrategy: (times) => Math.min(times * 100, 5000) });

const clients = new Map();
const subscriptions = new Map();

redisSub.on('connect', () => console.log('[Redis] Subscriber connected'));
redisSub.on('error', (err) => console.error('[Redis] Subscriber error:', err.message));
redisPub.on('connect', () => console.log('[Redis] Publisher connected'));
redisPub.on('error', (err) => console.error('[Redis] Publisher error:', err.message));

redisSub.on('message', (channel, message) => {
  try {
    const event = JSON.parse(message);
    broadcastToSubscribers(channel, event);
  } catch (err) {
    console.error('[Redis] Failed to parse message:', err.message);
  }
});

function broadcastToSubscribers(channel, event) {
  const subscribers = subscriptions.get(channel) || new Set();
  const payload = JSON.stringify({ type: 'event', channel, data: event, timestamp: new Date().toISOString() });

  clients.forEach((clientInfo, ws) => {
    if (ws.readyState === 1 && (subscribers.has(ws) || subscribers.size === 0)) {
      ws.send(payload);
      clientInfo.messageCount.sent++;
    }
  });
}

function broadcastToAll(event) {
  const payload = JSON.stringify({ type: 'notification', data: event, timestamp: new Date().toISOString() });
  clients.forEach((clientInfo, ws) => {
    if (ws.readyState === 1) {
      ws.send(payload);
      clientInfo.messageCount.sent++;
    }
  });
}

wss.on('connection', (ws, req) => {
  const connectionId = uuidv4();
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'] || 'unknown';

  console.log(`[WS] Client connected: ${connectionId} from ${ipAddress}`);

  clients.set(ws, {
    connectionId,
    userId: null,
    clientType: 'DASHBOARD',
    ipAddress,
    userAgent,
    connectedAt: new Date().toISOString(),
    messageCount: { sent: 0, received: 0 },
    subscriptions: new Set()
  });

  ws.send(JSON.stringify({
    type: 'connected',
    connectionId,
    message: 'Connected to Sentinel-Sync WebSocket',
    timestamp: new Date().toISOString()
  }));

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      handleClientMessage(ws, message);
    } catch (err) {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });

  ws.on('close', () => {
    const clientInfo = clients.get(ws);
    if (clientInfo) {
      console.log(`[WS] Client disconnected: ${clientInfo.connectionId}`);
      clientInfo.subscriptions.forEach((channel) => {
        const subs = subscriptions.get(channel);
        if (subs) subs.delete(ws);
      });
    }
    clients.delete(ws);
  });

  ws.on('error', (err) => {
    console.error(`[WS] Client error:`, err.message);
  });
});

function handleClientMessage(ws, message) {
  const clientInfo = clients.get(ws);
  if (!clientInfo) return;

  clientInfo.messageCount.received++;

  switch (message.type) {
    case 'authenticate':
      clientInfo.userId = message.userId || 'anonymous';
      clientInfo.clientType = message.clientType || 'DASHBOARD';
      ws.send(JSON.stringify({ type: 'authenticated', userId: clientInfo.userId, timestamp: new Date().toISOString() }));
      break;

    case 'subscribe':
      const channel = message.channel || REDIS_CHANNEL;
      if (!subscriptions.has(channel)) {
        subscriptions.set(channel, new Set());
        redisSub.subscribe(channel).catch((err) => console.error('[Redis] Subscribe error:', err.message));
      }
      subscriptions.get(channel).add(ws);
      clientInfo.subscriptions.add(channel);
      ws.send(JSON.stringify({ type: 'subscribed', channel, timestamp: new Date().toISOString() }));
      break;

    case 'unsubscribe':
      const unsubChannel = message.channel || REDIS_CHANNEL;
      const subs = subscriptions.get(unsubChannel);
      if (subs) subs.delete(ws);
      clientInfo.subscriptions.delete(unsubChannel);
      ws.send(JSON.stringify({ type: 'unsubscribed', channel: unsubChannel, timestamp: new Date().toISOString() }));
      break;

    case 'publish':
      const eventData = {
        id: uuidv4(),
        type: message.eventType || 'custom',
        source: 'websocket-client',
        data: message.data,
        timestamp: new Date().toISOString()
      };
      redisPub.publish(message.channel || REDIS_CHANNEL, JSON.stringify(eventData));
      ws.send(JSON.stringify({ type: 'published', eventId: eventData.id, timestamp: new Date().toISOString() }));
      break;

    case 'ping':
      ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
      break;

    default:
      ws.send(JSON.stringify({ type: 'error', message: `Unknown message type: ${message.type}` }));
  }
}

const heartbeat = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, HEARTBEAT_INTERVAL);

wss.on('connection', (ws) => { ws.isAlive = true; ws.on('pong', () => { ws.isAlive = true; }); });

wss.on('close', () => clearInterval(heartbeat));

redisSub.subscribe(REDIS_CHANNEL).then(() => {
  console.log(`[Redis] Subscribed to channel: ${REDIS_CHANNEL}`);
}).catch((err) => {
  console.error('[Redis] Initial subscribe failed:', err.message);
});

server.listen(PORT, () => {
  console.log(`[WebSocket] Server running on port ${PORT}`);
  console.log(`[WebSocket] Health check: http://localhost:${PORT}/health`);
});

process.on('SIGTERM', () => { clearInterval(heartbeat); wss.close(); redisSub.quit(); redisPub.quit(); server.close(); process.exit(0); });
process.on('SIGINT', () => { clearInterval(heartbeat); wss.close(); redisSub.quit(); redisPub.quit(); server.close(); process.exit(0); });
