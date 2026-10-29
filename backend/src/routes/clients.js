const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const { toView, toObjectId } = require('../utils/serialize');

const COLLECTION = 'clients';

// GET /api/clients?status=&search=
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const { status, search } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search && String(search).trim()) {
      const re = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: re }, { phone: re }, { source: re }, { whatsapp_number: re }];
    }

    const docs = await db.collection(COLLECTION).find(filter).sort({ created_at: -1 }).toArray();
    res.json(docs.map(toView));
  } catch (err) {
    console.error('GET /clients error:', err);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// GET /api/clients/:id
router.get('/:id', async (req, res) => {
  try {
    const db = getDB();
    const oid = toObjectId(req.params.id);
    if (!oid) return res.status(400).json({ error: 'Invalid client id' });

    const doc = await db.collection(COLLECTION).findOne({ _id: oid });
    if (!doc) return res.status(404).json({ error: 'Client not found' });

    res.json(toView(doc));
  } catch (err) {
    console.error('GET /clients/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

// POST /api/clients
router.post('/', async (req, res) => {
  try {
    const db = getDB();
    const body = req.body || {};

    if (!body.name || !String(body.name).trim()) {
      return res.status(400).json({ error: 'name is required' });
    }
    if (!body.phone || !String(body.phone).trim()) {
      return res.status(400).json({ error: 'phone is required' });
    }

    const now = new Date().toISOString();
    const doc = {
      name: body.name,
      phone: body.phone,
      whatsapp_number: body.whatsapp_number ?? null,
      facebook_id: body.facebook_id ?? null,
      source: body.source ?? null,
      post_link: body.post_link ?? null,
      status: body.status ?? 'Not Contacted',
      project_type: body.project_type ?? null,
      budget: body.budget ?? null,
      notes: body.notes ?? null,
      contacted_date: body.contacted_date ?? null,
      last_follow_up_date: body.last_follow_up_date ?? null,
      next_follow_up_date: body.next_follow_up_date ?? null,
      created_at: now,
      updated_at: now,
    };

    const result = await db.collection(COLLECTION).insertOne(doc);
    res.status(201).json(toView({ _id: result.insertedId, ...doc }));
  } catch (err) {
    console.error('POST /clients error:', err);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

// PUT /api/clients/:id
router.put('/:id', async (req, res) => {
  try {
    const db = getDB();
    const oid = toObjectId(req.params.id);
    if (!oid) return res.status(400).json({ error: 'Invalid client id' });

    const update = { ...req.body, updated_at: new Date().toISOString() };
    delete update.id;
    delete update._id;
    delete update.created_at;

    const result = await db
      .collection(COLLECTION)
      .findOneAndUpdate({ _id: oid }, { $set: update }, { returnDocument: 'after' });

    const updated = result && result.value ? result.value : result;
    if (!updated) return res.status(404).json({ error: 'Client not found' });

    res.json(toView(updated));
  } catch (err) {
    console.error('PUT /clients/:id error:', err);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// DELETE /api/clients/:id
router.delete('/:id', async (req, res) => {
  try {
    const db = getDB();
    const oid = toObjectId(req.params.id);
    if (!oid) return res.status(400).json({ error: 'Invalid client id' });

    const result = await db.collection(COLLECTION).deleteOne({ _id: oid });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Client not found' });

    // Cascade delete anything linked to this client
    await db.collection('meetings').deleteMany({ client_id: req.params.id });
    await db.collection('todos').deleteMany({ linked_client_id: req.params.id });

    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /clients/:id error:', err);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

module.exports = router;
