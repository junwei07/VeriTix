// server.js - main backend entry point
const express = require('express');
require('dotenv').config(); // Load .env variables
const path = require('path');

// Import your route files
const authRoutes = require('./src/routes/authRoutes');
const ticketRoutes = require('./src/routes/ticketRoutes');

const app = express(); // Create Express app, backend server

// Middleware to parse JSON bodies
app.use(express.json());

// Optional: serve static frontend if you have a build folder
// app.use(express.static(path.join(__dirname, '../frontend/build')));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);

// Default route to check server status
app.get('/', (req, res) => {
  res.send('VeriTix Backend is running!');
});

// Handle 404
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler (optional but useful)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
