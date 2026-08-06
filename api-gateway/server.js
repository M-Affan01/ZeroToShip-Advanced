require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { createProxyMiddleware } = require('http-proxy-middleware');
const Redis = require('ioredis');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.API_GATEWAY_PORT || 3000;

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-api:8000';
const CONTENT_SERVICE_URL = process.env.CONTENT_SERVICE_URL || 'http://content-service:8001';
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://ai-assistant:8002';
const REDIS_HOST = process.env.REDIS_HOST || 'redis-event-bus';
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const redis = new Redis({ host: REDIS_HOST, port: REDIS_PORT, retryStrategy: (times) => Math.min(times * 100, 5000) });
const redisPub = new Redis({ host: REDIS_HOST, port: REDIS_PORT, retryStrategy: (times) => Math.min(times * 100, 5000) });

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(morgan('combined'));
app.use(cors({ origin: process.env.CORS_ORIGINS || '*', credentials: true }));
app.use(express.json());

const serviceHealth = { 'auth-api': 'unknown', 'content-service': 'unknown', 'ai-assistant': 'unknown' };

async function checkServiceHealth(name, url) {
  try {
    const response = await fetch(`${url}/health`, { signal: AbortSignal.timeout(5000) });
    serviceHealth[name] = response.ok ? 'healthy' : 'degraded';
  } catch {
    serviceHealth[name] = 'unreachable';
  }
}

setInterval(() => {
  checkServiceHealth('auth-api', AUTH_SERVICE_URL);
  checkServiceHealth('content-service', CONTENT_SERVICE_URL);
  checkServiceHealth('ai-assistant', AI_SERVICE_URL);
}, 30000);

app.get('/api/v1/health', async (req, res) => {
  await Promise.all([
    checkServiceHealth('auth-api', AUTH_SERVICE_URL),
    checkServiceHealth('content-service', CONTENT_SERVICE_URL),
    checkServiceHealth('ai-assistant', AI_SERVICE_URL)
  ]);
  const allHealthy = Object.values(serviceHealth).every((s) => s === 'healthy');
  res.json({
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services: serviceHealth,
    version: '1.0.0'
  });
});

app.use('/api/v1/auth', createProxyMiddleware({
  target: AUTH_SERVICE_URL, changeOrigin: true, pathRewrite: { '^/api/v1/auth': '' },
  onError: (err, req, res) => { res.status(502).json({ error: 'AUTH_SERVICE_UNAVAILABLE', message: 'Auth service is currently unavailable' }); }
}));

app.use('/api/v1/notices', createProxyMiddleware({
  target: CONTENT_SERVICE_URL, changeOrigin: true, pathRewrite: { '^/api/v1/notices': '/api/notices' },
  onError: (err, req, res) => { res.status(502).json({ error: 'CONTENT_SERVICE_UNAVAILABLE', message: 'Content service is currently unavailable' }); }
}));

app.use('/api/v1/equipment', createProxyMiddleware({
  target: CONTENT_SERVICE_URL, changeOrigin: true, pathRewrite: { '^/api/v1/equipment': '/api/equipment' },
  onError: (err, req, res) => { res.status(502).json({ error: 'CONTENT_SERVICE_UNAVAILABLE', message: 'Content service is currently unavailable' }); }
}));

app.use('/api/v1/ai', createProxyMiddleware({
  target: AI_SERVICE_URL, changeOrigin: true, pathRewrite: { '^/api/v1/ai': '/api/ai' },
  onError: (err, req, res) => { res.status(502).json({ error: 'AI_SERVICE_UNAVAILABLE', message: 'AI service is currently unavailable' }); }
}));

app.use('/api/v1/cafe', createProxyMiddleware({
  target: CONTENT_SERVICE_URL, changeOrigin: true, pathRewrite: { '^/api/v1/cafe': '/api/cafe' },
  onError: (err, req, res) => { res.status(502).json({ error: 'CONTENT_SERVICE_UNAVAILABLE', message: 'Content service is currently unavailable' }); }
}));

app.use('/api/v1/transit', createProxyMiddleware({
  target: CONTENT_SERVICE_URL, changeOrigin: true, pathRewrite: { '^/api/v1/transit': '/api/transit' },
  onError: (err, req, res) => { res.status(502).json({ error: 'CONTENT_SERVICE_UNAVAILABLE', message: 'Content service is currently unavailable' }); }
}));

app.get('/api/v1/dashboard', async (req, res) => {
  try {
    const [equipmentRes, noticesRes, cafeRes, transitRes] = await Promise.allSettled([
      fetch(`${CONTENT_SERVICE_URL}/api/equipment`, { signal: AbortSignal.timeout(5000) }),
      fetch(`${CONTENT_SERVICE_URL}/api/notices`, { signal: AbortSignal.timeout(5000) }),
      fetch(`${CONTENT_SERVICE_URL}/api/cafe`, { signal: AbortSignal.timeout(5000) }),
      fetch(`${CONTENT_SERVICE_URL}/api/transit`, { signal: AbortSignal.timeout(5000) })
    ]);

    const equipment = equipmentRes.status === 'fulfilled' && equipmentRes.value.ok ? await equipmentRes.value.json() : {};
    const notices = noticesRes.status === 'fulfilled' && noticesRes.value.ok ? await noticesRes.value.json() : {};
    const cafe = cafeRes.status === 'fulfilled' && cafeRes.value.ok ? await cafeRes.value.json() : {};
    const transit = transitRes.status === 'fulfilled' && transitRes.value.ok ? await transitRes.value.json() : {};

    const items = equipment.equipment || equipment.items || [];
    const noticeItems = notices.notices || notices.items || [];
    const cafeItems = cafe.cafe || cafe.items || [];
    const transitItems = transit.transit || transit.items || [];
    const metrics = {
      totalServices: items.length,
      activeServices: items.filter((i) => i.status === 'available').length,
      inUseServices: items.filter((i) => i.status === 'in_use').length,
      maintenanceServices: items.filter((i) => i.status === 'maintenance').length,
      totalNotices: noticeItems.length,
      publishedNotices: noticeItems.filter((n) => n.status === 'published').length
    };

    res.json({ services: items, notices: noticeItems, cafe: cafeItems, transit: transitItems, metrics, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: 'DASHBOARD_ERROR', message: 'Failed to fetch dashboard data' });
  }
});

app.post('/api/v1/events/publish', async (req, res) => {
  const { type, data, channel = 'cis_events' } = req.body;
  if (!type || !data) return res.status(400).json({ error: 'MISSING_FIELDS', message: 'type and data are required' });

  const event = { id: uuidv4(), type, source: 'api-gateway', data, timestamp: new Date().toISOString() };
  try {
    await redisPub.publish(channel, JSON.stringify(event));
    res.json({ success: true, eventId: event.id, timestamp: event.timestamp });
  } catch (err) {
    res.status(500).json({ error: 'PUBLISH_FAILED', message: err.message });
  }
});

app.get('/api/v1/events', (req, res) => {
  res.json({ message: 'Event stream endpoint', channels: ['cis_events', 'content.events', 'equipment.events', 'notification.events'] });
});

app.use((req, res) => { res.status(404).json({ error: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` }); });
app.use((err, req, res, next) => { console.error('[Gateway] Error:', err.message); res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Internal gateway error' }); });

redis.on('connect', () => console.log('[Redis] Gateway connected'));
redis.on('error', (err) => console.error('[Redis] Gateway error:', err.message));

app.listen(PORT, () => {
  console.log(`[API Gateway] Running on port ${PORT}`);
  console.log(`[API Gateway] Auth: ${AUTH_SERVICE_URL}`);
  console.log(`[API Gateway] Content: ${CONTENT_SERVICE_URL}`);
  console.log(`[API Gateway] AI: ${AI_SERVICE_URL}`);
});

process.on('SIGTERM', () => { redis.quit(); redisPub.quit(); process.exit(0); });
process.on('SIGINT', () => { redis.quit(); redisPub.quit(); process.exit(0); });
