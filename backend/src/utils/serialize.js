const { ObjectId } = require('mongodb');

// Converts a MongoDB document ({_id, ...fields}) into the shape the frontend
// expects ({id: string, ...fields}). Never exposes the raw ObjectId.
function toView(doc) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { id: _id.toString(), ...rest };
}

function toObjectId(id) {
  if (!id || typeof id !== 'string' || !ObjectId.isValid(id)) return null;
  return new ObjectId(id);
}

module.exports = { toView, toObjectId };
