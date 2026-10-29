require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db');

const clientsRouter = require('./routes/clients');
const meetingsRouter = require('./routes/meetings');
const todosRouter = require('./routes/todos');
const statsRouter = require('./routes/stats');
const dailyPlanRouter = require('./routes/daily-plan');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/clients', clientsRouter);
app.use('/api/meetings', meetingsRouter);
app.use('/api/todos', todosRouter);
app.use('/api/stats', statsRouter);
app.use('/api/daily-plan', dailyPlanRouter);

app.get('/health', (req, res) => res.json({ ok: true }));

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`ClientNest API running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
