// Builds the Express app (kept separate from server.js so it is easy to test).
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { parseAllowedOrigins } = require('./config/cors');

const app = express();

// CORS lets the React app (running on a different address) call this API.
// CLIENT_URL can hold one or more addresses separated by commas.
const allowedOrigins = parseAllowedOrigins(process.env.CLIENT_URL);
if (process.env.NODE_ENV === 'production' && !process.env.CLIENT_URL) {
  console.warn('CLIENT_URL is not set: only http://localhost:5173 is allowed by CORS.');
}

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '10kb' })); // read JSON bodies (small limit: tasks are tiny)

app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'Task Manager API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
