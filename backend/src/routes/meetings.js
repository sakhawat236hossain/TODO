const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const { toView, toObjectId } = require('../utils/serialize');

const COLLECTION = 'meetings';

// Attach a lightweight { id, name, phone } client object to each meeting,
// mirroring the "clients:client_id(id, name, phone)" join the frontend expects.
async function attachClients(db, meetings) {
  const clientIds = [...new Set(meetings.map((m) => m.client_id).filter(Boolean))];
  if (clientIds.length === 0) return meetings.map((m) => ({ ...m, clients: null }));

  const oids = clientIds.map(toObjectId).filter(Boolean);
  const clientDocs = await db
    .collection('clients')
    .find({ _id: { $in: oids } })
    .project({ name: 1, phone: 1 })
    .toArray();

  const map = Object.fromEntries(
    clientDocs.map((c) => [c._id.toString(), { id: c._id.toString(), name: c.name, phone: c.phone }])
  );

  return meetings.map((m) => ({ ...m, clients: m.client_id ? map[m.client_id] ?? null : null }));
}

// GET /api/meetings?clientId=&status=
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const { clientId, status } = req.query;
    const filter = {};
    if (clientId) filter.client_id = clientId;
    if (status && status !== 'all') filter.status = status;

    const docs = await db.collection(COLLECTION).find(filter).sort({ date: 1 }).toArray();
    const withClients = await attachClients(db, docs);
    res.json(withClients.map(toView));
  } catch (err) {
    console.error('GET /meetings error:', err);
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

// POST /api/meetings
router.post('/', async (req, res) => {
  try {
    const db = getDB();
    const body = req.body || {};

    if (!body.client_id) return res.status(400).json({ error: 'client_id is required' });
    if (!body.date) return res.status(400).json({ error: 'date is required' });

    const now = new Date().toISOString();
    const doc = {
      client_id: body.client_id,
      date: body.date,
      mode: body.mode ?? null,
      agenda: body.agenda ?? null,
      outcome_notes: body.outcome_notes ?? null,
      status: body.status ?? 'Scheduled',
      created_at: now,
      updated_at: now,
    };

    const result = await db.collection(COLLECTION).insertOne(doc);
    const [withClient] = await attachClients(db, [{ _id: result.insertedId, ...doc }]);
    res.status(201).json(toView(withClient));
  } catch (err) {
    console.error('POST /meetings error:', err);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
});

// PUT /api/meetings/:id
router.put('/:id', async (req, res) => {
  try {
    const db = getDB();
    const oid = toObjectId(req.params.id);
    if (!oid) return res.status(400).json({ error: 'Invalid meeting id' });

    const update = { ...req.body, updated_at: new Date().toISOString() };
    delete update.id;
    delete update._id;
    delete update.clients;
    delete update.created_at;

    const result = await db
      .collection(COLLECTION)
      .findOneAndUpdate({ _id: oid }, { $set: update }, { returnDocument: 'after' });

    const updated = result && result.value ? result.value : result;
    if (!updated) return res.status(404).json({ error: 'Meeting not found' });

    const [withClient] = await attachClients(db, [updated]);
    res.json(toView(withClient));
  } catch (err) {
    console.error('PUT /meetings/:id error:', err);
    res.status(500).json({ error: 'Failed to update meeting' });
  }
});

// DELETE /api/meetings/:id
router.delete('/:id', async (req, res) => {
  try {
    const db = getDB();
    const oid = toObjectId(req.params.id);
    if (!oid) return res.status(400).json({ error: 'Invalid meeting id' });

    const result = await db.collection(COLLECTION).deleteOne({ _id: oid });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Meeting not found' });

    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /meetings/:id error:', err);
    res.status(500).json({ error: 'Failed to delete meeting' });
  }
});

module.exports = router;
