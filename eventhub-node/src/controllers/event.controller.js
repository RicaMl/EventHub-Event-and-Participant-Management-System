const pool = require('../config/db');

const allowedStatuses = ['upcoming', 'ongoing', 'completed', 'cancelled'];

const buildEventFilters = (query) => {
  const conditions = [];
  const values = [];
  let index = 1;

  if (query.date) {
    conditions.push(`e.date = $${index++}`);
    values.push(query.date);
  }

  if (query.status) {
    conditions.push(`e.status = $${index++}`);
    values.push(query.status);
  }

  if (query.search) {
    conditions.push(`(e.title ILIKE $${index} OR e.location ILIKE $${index})`);
    values.push(`%${query.search}%`);
    index++;
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  let orderClause = 'ORDER BY e.date ASC, e.id ASC';
  if (query.ordering === 'date') orderClause = 'ORDER BY e.date ASC';
  if (query.ordering === '-date') orderClause = 'ORDER BY e.date DESC';

  return { whereClause, values, orderClause };
};

const getAllEvents = async (req, res, next) => {
  try {
    const { whereClause, values, orderClause } = buildEventFilters(req.query);

    const sql = `
      SELECT
        e.id,
        e.title,
        e.description,
        e.date,
        e.status,
        e.location,
        e.max_participants,
        e.created_at,
        e.updated_at,
        COUNT(r.id)::int AS registered_count,
        (e.max_participants - COUNT(r.id))::int AS available_slots
      FROM eventhub.events e
      LEFT JOIN eventhub.registrations r ON r.event_id = e.id
      ${whereClause}
      GROUP BY e.id
      ${orderClause};
    `;

    const result = await pool.query(sql, values);
    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
};

const getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const eventResult = await pool.query(
      `
      SELECT
        e.id,
        e.title,
        e.description,
        e.date,
        e.status,
        e.location,
        e.max_participants,
        e.created_at,
        e.updated_at,
        COUNT(r.id)::int AS registered_count,
        (e.max_participants - COUNT(r.id))::int AS available_slots
      FROM eventhub.events e
      LEFT JOIN eventhub.registrations r ON r.event_id = e.id
      WHERE e.id = $1
      GROUP BY e.id;
      `,
      [id]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const participantsResult = await pool.query(
      `
      SELECT
        u.user_id,
        u.first_name,
        u.last_name,
        u.email
      FROM eventhub.registrations r
      JOIN eventhub.users u ON u.user_id = r.user_id
      WHERE r.event_id = $1
      ORDER BY u.user_id ASC;
      `,
      [id]
    );

    const event = eventResult.rows[0];
    event.participants = participantsResult.rows;

    res.status(200).json(event);
  } catch (error) {
    next(error);
  }
};

const createEvent = async (req, res, next) => {
  try {
    const { title, description, date, status, location, max_participants } = req.body;

    if (!title || !date || !status || max_participants === undefined) {
      return res.status(400).json({
        message: 'title, date, status, max_participants are required'
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid event status'
      });
    }

    const result = await pool.query(
      `
      INSERT INTO eventhub.events (title, description, date, status, location, max_participants)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
      `,
      [title, description || null, date, status, location || null, max_participants]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, date, status, location, max_participants } = req.body;

    const existing = await pool.query(
      `SELECT * FROM eventhub.events WHERE id = $1`,
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const current = existing.rows[0];

    const nextTitle = title ?? current.title;
    const nextDescription = description ?? current.description;
    const nextDate = date ?? current.date;
    const nextStatus = status ?? current.status;
    const nextLocation = location ?? current.location;
    const nextMaxParticipants = max_participants ?? current.max_participants;

    if (!allowedStatuses.includes(nextStatus)) {
      return res.status(400).json({ message: 'Invalid event status' });
    }

    const result = await pool.query(
      `
      UPDATE eventhub.events
      SET title = $1,
          description = $2,
          date = $3,
          status = $4,
          location = $5,
          max_participants = $6
      WHERE id = $7
      RETURNING *;
      `,
      [
        nextTitle,
        nextDescription,
        nextDate,
        nextStatus,
        nextLocation,
        nextMaxParticipants,
        id
      ]
    );

    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await pool.query(
      `SELECT * FROM eventhub.events WHERE id = $1`,
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (existing.rows[0].status !== 'upcoming') {
      return res.status(400).json({
        message: 'Only upcoming events can be deleted'
      });
    }

    await pool.query(`DELETE FROM eventhub.events WHERE id = $1`, [id]);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
};