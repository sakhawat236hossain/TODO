const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const { toView } = require('../utils/serialize');

function isToday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function isPast(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return d < now;
}

// GET /api/stats
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const [clients, meetings, todos] = await Promise.all([
      db.collection('clients').find({}).toArray(),
      db.collection('meetings').find({}).toArray(),
      db.collection('todos').find({}).toArray(),
    ]);

    const clientList = clients.map(toView);
    const meetingList = meetings.map(toView);
    const todoList = todos.map(toView);

    const totalClients = clientList.length;
    const totalClientsContacted = clientList.filter((c) => c.status !== 'Not Contacted').length;
    const totalReplied = clientList.filter((c) =>
      ['Replied', 'Meeting Scheduled', 'Meeting Done', 'Converted'].includes(c.status)
    ).length;
    const totalMeetingsScheduled = meetingList.filter((m) => m.status === 'Scheduled' || m.status === 'Rescheduled').length;
    const totalConverted = clientList.filter((c) => c.status === 'Converted').length;

    const replyRate = totalClientsContacted > 0 ? Math.round((totalReplied / totalClientsContacted) * 100) : 0;
    const conversionRate = totalClientsContacted > 0 ? Math.round((totalConverted / totalClientsContacted) * 100) : 0;

    const todaysFollowUps = clientList
      .filter((c) => isToday(c.next_follow_up_date) && c.status !== 'Converted' && c.status !== 'Rejected')
      .sort((a, b) => (a.next_follow_up_date ?? '').localeCompare(b.next_follow_up_date ?? ''));

    const todaysTodos = todoList
      .filter((t) => isToday(t.due_date) && t.status !== 'Done')
      .sort((a, b) => (a.priority === 'High' ? -1 : 1));

    const overdueFollowUps = clientList
      .filter((c) => isPast(c.next_follow_up_date) && c.status !== 'Converted' && c.status !== 'Rejected')
      .sort((a, b) => (a.next_follow_up_date ?? '').localeCompare(b.next_follow_up_date ?? ''));

    const activeTodos = todoList.filter((t) => t.status !== 'Done');
    const doNowTodos = activeTodos
      .filter((t) => t.timing === 'Do Now')
      .sort((a, b) => (a.priority === 'High' ? -1 : b.priority === 'High' ? 1 : 0));
    const doLaterTodos = activeTodos
      .filter((t) => t.timing === 'Do Later')
      .sort((a, b) => (a.priority === 'High' ? -1 : b.priority === 'High' ? 1 : 0));

    res.json({
      totalClients,
      totalClientsContacted,
      totalReplied,
      totalMeetingsScheduled,
      totalConverted,
      replyRate,
      conversionRate,
      todaysFollowUps,
      todaysTodos,
      overdueFollowUps,
      doNowTodos,
      doLaterTodos,
    });
  } catch (err) {
    console.error('GET /stats error:', err);
    res.status(500).json({ error: 'Failed to compute stats' });
  }
});

module.exports = router;
