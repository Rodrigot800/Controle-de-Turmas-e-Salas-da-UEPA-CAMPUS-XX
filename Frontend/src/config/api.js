const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const port = isLocalhost ? '3002' : '3001';
// O Nginx no Docker exige HTTPS na porta 3001, mesmo quando acessado de um frontend HTTP (ex: localhost:5173)
const protocol = port === '3001' ? 'https:' : window.location.protocol;
const API_BASE = `${protocol}//${window.location.hostname}:${port}`;

export default API_BASE;

