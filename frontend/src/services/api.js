const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';
const WS_BASE = import.meta.env.VITE_WS_URL || `ws://${window.location.hostname}:8080`;

class ApiService {
  constructor() {
    this.baseURL = API_BASE;
    this.token = localStorage.getItem('sentinel_token');
  }

  setToken(token) {
    this.token = token;
    if (token) localStorage.setItem('sentinel_token', token);
    else localStorage.removeItem('sentinel_token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    try {
      const response = await fetch(url, { ...options, headers, signal: AbortSignal.timeout(10000) });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new ApiError(error.message || 'Request failed', response.status, error);
      }
      return await response.json();
    } catch (err) {
      if (err.name === 'AbortError') throw new ApiError('Request timeout', 408);
      if (err instanceof ApiError) throw err;
      throw new ApiError(err.message || 'Network error', 0);
    }
  }

  get(endpoint) { return this.request(endpoint, { method: 'GET' }); }
  post(endpoint, data) { return this.request(endpoint, { method: 'POST', body: JSON.stringify(data) }); }
  put(endpoint, data) { return this.request(endpoint, { method: 'PUT', body: JSON.stringify(data) }); }
  patch(endpoint, data) { return this.request(endpoint, { method: 'PATCH', body: JSON.stringify(data) }); }
  delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); }

  async getDashboard() { return this.get('/dashboard'); }
  async getEquipment(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/equipment${query ? `?${query}` : ''}`);
  }
  async getEquipmentById(id) { return this.get(`/equipment/${id}`); }
  async createEquipment(data) { return this.post('/equipment', data); }
  async updateEquipment(id, data) { return this.patch(`/equipment/${id}`, data); }
  async deleteEquipment(id) { return this.delete(`/equipment/${id}`); }
  async getNotices(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/notices${query ? `?${query}` : ''}`);
  }
  async getNoticeById(id) { return this.get(`/notices/${id}`); }
  async createNotice(data) { return this.post('/notices', data); }
  async updateNotice(id, data) { return this.patch(`/notices/${id}`, data); }
  async deleteNotice(id) { return this.delete(`/notices/${id}`); }
  async aiQuery(query, stream = false) { return this.post('/ai/query', { query_text: query, stream }); }
  async aiFeedback(queryId, rating, feedback) { return this.post('/ai/feedback', { query_id: queryId, rating, feedback }); }
  async getHealth() { return this.get('/health'); }
  async login(email, password) {
    const result = await this.post('/auth/login', { email, password });
    if (result.access_token) this.setToken(result.access_token);
    return result;
  }
  async register(email, password, fullName) { return this.post('/auth/register', { email, password, full_name: fullName }); }
  logout() { this.setToken(null); }
}

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

class WebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
    this.isConnected = false;
    this.subscriptions = new Set();
    this._intentionalClose = false;
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;

    try {
      this.ws = new WebSocket(WS_BASE);

      this.ws.onopen = () => {
        console.log('[WebSocket] Connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connected');
        this.subscriptions.forEach((channel) => this.send({ type: 'subscribe', channel }));
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit(data.type, data);
          this.emit('message', data);
        } catch (err) { console.error('[WebSocket] Parse error:', err); }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.emit('disconnected');
        if (!this._intentionalClose) {
          this.reconnect();
        }
        this._intentionalClose = false;
      };

      this.ws.onerror = () => {};
    } catch (err) { console.error('[WebSocket] Connection failed:', err); }
  }

  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnect attempts reached');
      return;
    }
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    setTimeout(() => this.connect(), delay);
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  subscribe(channel) {
    this.subscriptions.add(channel);
    if (this.isConnected) this.send({ type: 'subscribe', channel });
  }

  unsubscribe(channel) {
    this.subscriptions.delete(channel);
    if (this.isConnected) this.send({ type: 'unsubscribe', channel });
  }

  on(event, callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  emit(event, data) {
    this.listeners.get(event)?.forEach((callback) => {
      try { callback(data); } catch (err) { console.error('[WebSocket] Listener error:', err); }
    });
  }

  disconnect() {
    this._intentionalClose = true;
    if (this.ws) { this.ws.close(); this.ws = null; }
    this.isConnected = false;
  }
}

export const api = new ApiService();
export const ws = new WebSocketService();
export { ApiError };
export default api;
