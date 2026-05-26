const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const port = isLocalhost ? '3002' : '3001';
const API_BASE = `${window.location.protocol}//${window.location.hostname}:${port}`;

export default API_BASE;

