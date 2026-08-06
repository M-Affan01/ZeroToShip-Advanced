require('dotenv').config();
const Redis = require('ioredis');
const { v4: uuidv4 } = require('uuid');

const REDIS_HOST = process.env.REDIS_HOST || 'redis-event-bus';
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const CHANNELS = (process.env.EVENT_CHANNELS || 'cis_events,content.events,equipment.events,notification.events,service.events').split(',');

const pub = new Redis({ host: REDIS_HOST, port: REDIS_PORT, retryStrategy: (times) => Math.min(times * 100, 5000) });
const sub = new Redis({ host: REDIS_HOST, port: REDIS_PORT, retryStrategy: (times) => Math.min(times * 100, 5000) });

const eventLog = [];
const MAX_LOG_SIZE = 1000;
const subscribers = new Map();

function createEvent(type, source, data, channel = 'cis_events') {
  return {
    id: uuidv4(),
    type,
    source,
    channel,
    data,
    timestamp: new Date().toISOString(),
    metadata: { version: '1.0', environment: process.env.NODE_ENV || 'development' }
  };
}

async function publishEvent(type, source, data, channel = 'cis_events') {
  const event = createEvent(type, source, data, channel);
  try {
    await pub.publish(channel, JSON.stringify(event));
    eventLog.push(event);
    if (eventLog.length > MAX_LOG_SIZE) eventLog.shift();
    console.log(`[EventBus] Published: ${event.type} to ${channel}`);
    return { success: true, eventId: event.id };
  } catch (err) {
    console.error(`[EventBus] Publish failed:`, err.message);
    return { success: false, error: err.message };
  }
}

sub.on('message', (channel, message) => {
  try {
    const event = JSON.parse(message);
    console.log(`[EventBus] Received: ${event.type} on ${channel}`);
    const channelSubscribers = subscribers.get(channel) || [];
    channelSubscribers.forEach((callback) => {
      try { callback(event); } catch (err) { console.error('[EventBus] Subscriber callback error:', err.message); }
    });
  } catch (err) {
    console.error('[EventBus] Message parse error:', err.message);
  }
});

async function subscribe(channel, callback) {
  if (!subscribers.has(channel)) subscribers.set(channel, []);
  subscribers.get(channel).push(callback);
  await sub.subscribe(channel);
  console.log(`[EventBus] Subscribed to: ${channel}`);
}

function getEventLog(limit = 50) {
  return eventLog.slice(-limit);
}

function getStats() {
  return {
    channels: CHANNELS,
    totalPublished: eventLog.length,
    subscribers: Array.from(subscribers.entries()).map(([ch, subs]) => ({ channel: ch, count: subs.length })),
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  };
}

async function start() {
  for (const channel of CHANNELS) {
    await sub.subscribe(channel);
    console.log(`[EventBus] Subscribed to channel: ${channel}`);
  }
  console.log(`[EventBus] Event bus running with ${CHANNELS.length} channels`);
}

pub.on('connect', () => console.log('[EventBus] Publisher connected to Redis'));
pub.on('error', (err) => console.error('[EventBus] Publisher error:', err.message));
sub.on('connect', () => console.log('[EventBus] Subscriber connected to Redis'));
sub.on('error', (err) => console.error('[EventBus] Subscriber error:', err.message));

process.on('SIGTERM', async () => { await pub.quit(); await sub.quit(); process.exit(0); });
process.on('SIGINT', async () => { await pub.quit(); await sub.quit(); process.exit(0); });

start();

module.exports = { publishEvent, subscribe, getEventLog, getStats, createEvent };
