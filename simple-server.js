import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5175;

// Enable CORS
app.use(cors());
app.use(express.json());

// Serve static files from the project root
app.use(express.static(__dirname, { index: false })); // Disable automatic index.html serving

// Serve the main HTML file - SaaS Landing Page
app.get('/', (req, res) => {
  console.log('Serving landing.html - SaaS Landing Page');
  res.sendFile(path.join(__dirname, 'landing.html'));
});

// Serve test page
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'test.html'));
});

// Serve parent dashboard demo
app.get('/parent-dashboard', (req, res) => {
  console.log('Serving parent-dashboard-demo.html - Parent Dashboard');
  res.sendFile(path.join(__dirname, 'parent-dashboard-demo.html'));
});

// Proxy API requests to the backend
app.use('/api', (req, res) => {
  // Forward to backend server
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: req.url,
    method: req.method,
    headers: req.headers
  };
  
  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  
  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Backend server not available' });
  });
  
  req.pipe(proxyReq);
});

app.listen(PORT, () => {
  console.log(`🚀 Simple development server running on http://localhost:${PORT}`);
  console.log(`📁 Serving files from: ${__dirname}`);
});