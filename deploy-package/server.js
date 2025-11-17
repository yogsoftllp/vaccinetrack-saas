const express = require('express');
const path = require('path');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
const apiRoutes = require('./api/app.js');
app.use('/api', apiRoutes);

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 VaccineTrack Server running on port ${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔧 API: http://localhost:${PORT}/api`);
  console.log(`❤️  Health: http://localhost:${PORT}/health`);
});

module.exports = app;