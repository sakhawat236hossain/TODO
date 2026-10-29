const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const { getDB } = require('../db');

const COLLECTION = 'daily_plans';

function isDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function emptyPlan(date) {
  return { date, notes: '', tasks: [] };
}

function basePlan(date) {
  const now = new Date().toISOString();
  return { date, created_at: now };
}

// GET /api/daily-plan?date=YYYY-MM-DD
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    if (!isDate(date)) return res.status(400).json({ error: 'date must be YYYY-MM-DD' });

    const plan = await getDB().collection(COLLECTION).findOne({ date });
    res.json(plan ? { ...plan, notes: plan.notes || '', tasks: plan.tasks || [] } : emptyPlan(date));
  } catch (err) {
    console.error('GET /daily-plan error:', err);
    res.status(500).json({ error: 'Failed to fetch daily plan' });
  }
});

// PUT /api/daily-plan?date=YYYY-MM-DD
router.put('/', async (req, res) => {
  try {
    const { date } = req.query;
    if (!isDate(date)) return res.status(400).json({ error: 'date must be YYYY-MM-DD' });
    if (typeof req.body?.notes !== 'string') return res.status(400).json({ error: 'notes must be text' });

    const now = new Date().toISOString();
    const result = await getDB().collection(COLLECTION).findOneAndUpdate(
      { date },
      { $set: { notes: req.body.notes, updated_at: now }, $setOnInsert: { ...basePlan(date), tasks: [] } },
      { upsert: true, returnDocument: 'after' }
    );
    res.json(result.value || result);
  } catch (err) {
    console.error('PUT /daily-plan error:', err);
    res.status(500).json({ error: 'Failed to save notes' });
  }
});

// POST /api/daily-plan/tasks
router.post('/tasks', async (req, res) => {
  try {
    const { date, title } = req.body || {};
    if (!isDate(date)) return res.status(400).json({ error: 'date must be YYYY-MM-DD' });
    if (!title || !String(title).trim()) return res.status(400).json({ error: 'task title is required' });

    const now = new Date().toISOString();
    const task = { id: crypto.randomUUID(), title: String(title).trim(), completed: false, created_at: now, completed_at: null };
    await getDB().collection(COLLECTION).updateOne(
      { date },
      { $setOnInsert: { ...basePlan(date), notes: '' }, $set: { updated_at: now }, $push: { tasks: task } },
      { upsert: true }
    );
    res.status(201).json(task);
  } catch (err) {
    console.error('POST /daily-plan/tasks error:', err);
    res.status(500).json({ error: 'Failed to add task' });
  }
});

// PATCH /api/daily-plan/tasks/:id?date=YYYY-MM-DD
router.patch('/tasks/:id', async (req, res) => {
  try {
    const { date } = req.query;
    if (!isDate(date)) return res.status(400).json({ error: 'date must be YYYY-MM-DD' });
    if (typeof req.body?.completed !== 'boolean') return res.status(400).json({ error: 'completed must be true or false' });

    const now = new Date().toISOString();
    const completed = req.body.completed;
    const result = await getDB().collection(COLLECTION).findOneAndUpdate(
      { date, 'tasks.id': req.params.id },
      {
        $set: {
          'tasks.$.completed': completed,
          'tasks.$.completed_at': completed ? now : null,
          updated_at: now,
        },
      },
      { returnDocument: 'after' }
    );
    const plan = result.value || result;
    const task = plan?.tasks?.find((item) => item.id === req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    console.error('PATCH /daily-plan/tasks error:', err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/daily-plan/tasks/:id?date=YYYY-MM-DD
router.delete('/tasks/:id', async (req, res) => {
  try {
    const { date } = req.query;
    if (!isDate(date)) return res.status(400).json({ error: 'date must be YYYY-MM-DD' });

    const result = await getDB().collection(COLLECTION).updateOne(
      { date, 'tasks.id': req.params.id },
      { $pull: { tasks: { id: req.params.id } }, $set: { updated_at: new Date().toISOString() } }
    );
    if (!result.matchedCount) return res.status(404).json({ error: 'Task not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /daily-plan/tasks error:', err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;
