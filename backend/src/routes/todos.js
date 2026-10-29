const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const { toView, toObjectId } = require('../utils/serialize');

const COLLECTION = 'todos';

// Attach a lightweight { id, name } client object to each todo, mirroring
// "clients:linked_client_id(id, name)" join the frontend expects.
async function attachClients(db, todos) {
  const clientIds = [...new Set(todos.map((t) => t.linked_client_id).filter(Boolean))];
  if (clientIds.length === 0) return todos.map((t) => ({ ...t, clients: null }));

  const oids = clientIds.map(toObjectId).filter(Boolean);
  const clientDocs = await db
    .collection('clients')
    .find({ _id: { $in: oids } })
    .project({ name: 1 })
    .toArray();

  const map = Object.fromEntries(clientDocs.map((c) => [c._id.toString(), { id: c._id.toString(), name: c.name }]));

  return todos.map((t) => ({ ...t, clients: t.linked_client_id ? map[t.linked_client_id] ?? null : null }));
}

// GET /api/todos?priority=&category=&timing=&status=&clientId=
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const { priority, category, timing, status, clientId } = req.query;
    const filter = {};
    if (priority && priority !== 'all') filter.priority = priority;
    if (category && category !== 'all') filter.category = category;
    if (timing && timing !== 'all') filter.timing = timing;
    if (status && status !== 'all') filter.status = status;
    if (clientId) filter.linked_client_id = clientId;

    const docs = await db.collection(COLLECTION).find(filter).sort({ created_at: -1 }).toArray();
    const withClients = await attachClients(db, docs);
    res.json(withClients.map(toView));
  } catch (err) {
    console.error('GET /todos error:', err);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// POST /api/todos
router.post('/', async (req, res) => {
  try {
    const db = getDB();
    const body = req.body || {};

    if (!body.title || !String(body.title).trim()) {
      return res.status(400).json({ error: 'title is required' });
    }

    const now = new Date().toISOString();
    const doc = {
      title: body.title,
      description: body.description ?? null,
      linked_client_id: body.linked_client_id ?? null,
      due_date: body.due_date ?? null,
      priority: body.priority ?? 'Medium',
      status: body.status ?? 'Pending',
      category: body.category ?? 'General',
      timing: body.timing ?? 'Do Later',
      created_at: now,
      updated_at: now,
    };

    const result = await db.collection(COLLECTION).insertOne(doc);
    const [withClient] = await attachClients(db, [{ _id: result.insertedId, ...doc }]);
    res.status(201).json(toView(withClient));
  } catch (err) {
    console.error('POST /todos error:', err);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// PUT /api/todos/:id
router.put('/:id', async (req, res) => {
  try {
    const db = getDB();
    const oid = toObjectId(req.params.id);
    if (!oid) return res.status(400).json({ error: 'Invalid todo id' });

    const update = { ...req.body, updated_at: new Date().toISOString() };
    delete update.id;
    delete update._id;
    delete update.clients;
    delete update.created_at;

    const result = await db
      .collection(COLLECTION)
      .findOneAndUpdate({ _id: oid }, { $set: update }, { returnDocument: 'after' });

    const updated = result && result.value ? result.value : result;
    if (!updated) return res.status(404).json({ error: 'Todo not found' });

    const [withClient] = await attachClients(db, [updated]);
    res.json(toView(withClient));
  } catch (err) {
    console.error('PUT /todos/:id error:', err);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// DELETE /api/todos/:id
router.delete('/:id', async (req, res) => {
  try {
    const db = getDB();
    const oid = toObjectId(req.params.id);
    if (!oid) return res.status(400).json({ error: 'Invalid todo id' });

    const result = await db.collection(COLLECTION).deleteOne({ _id: oid });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Todo not found' });

    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /todos/:id error:', err);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

module.exports = router;
