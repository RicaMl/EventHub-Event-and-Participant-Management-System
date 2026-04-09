const pool = require('../config/db');

const allowedStatuses = ['upcoming', 'ongoing', 'completed', 'cancelled'];

const buildEventFilters = (query) => {
  const conditions = [];
  const values = [];
  let index = 1;

  if (query.start_date) {
    conditions.push(`e.start_date = $${index++}`);
    values.push(query.start_date);
  }

  if (query.price !== undefined) {
    conditions.push(`e.price = $${index++}`);
    values.push(query.price);
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

  let orderClause = 'ORDER BY e.created_at DESC';
  if (query.ordering === 'price') orderClause = 'ORDER BY e.price ASC';
  if (query.ordering === '-price') orderClause = 'ORDER BY e.price DESC';
  if (query.ordering === 'start_date') orderClause = 'ORDER BY e.start_date ASC';
  if (query.ordering === '-start_date') orderClause = 'ORDER BY e.start_date DESC';
  if (query.ordering === 'created_at') orderClause = 'ORDER BY e.created_at ASC';

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
        e.price,
        e.start_date,
        e.end_date,
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
        e.price,
        e.start_date,
        e.end_date,
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
    const { title, description, price, start_date, end_date, status, location, max_participants } = req.body;

    if (!title || !start_date || !end_date || !status || max_participants === undefined) {
      return res.status(400).json({
        message: 'title, start_date, end_date, status, max_participants are required'
      });
    }

    if (new Date(end_date) <= new Date(start_date)) {
      return res.status(400).json({
        message: 'end_date must be after start_date'
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid event status'
      });
    }

    const result = await pool.query(
      `
      INSERT INTO eventhub.events (title, description, price, start_date, end_date, status, location, max_participants)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
      `,
      [title, description || null, price || 0, start_date, end_date, status, location || null, max_participants]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, price, start_date, end_date, status, location, max_participants } = req.body;

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
    const nextPrice = price ?? current.price;
    const nextStartDate = start_date ?? current.start_date;
    const nextEndDate = end_date ?? current.end_date;
    const nextStatus = status ?? current.status;
    const nextLocation = location ?? current.location;
    const nextMaxParticipants = max_participants ?? current.max_participants;

    if (new Date(nextEndDate) <= new Date(nextStartDate)) {
      return res.status(400).json({
        message: 'end_date must be after start_date'
      });
    }

    if (!allowedStatuses.includes(nextStatus)) {
      return res.status(400).json({ message: 'Invalid event status' });
    }

    const result = await pool.query(
      `
      UPDATE eventhub.events
      SET title = $1,
          description = $2,
          price = $3,
          start_date = $4,
          end_date = $5,
          status = $6,
          location = $7,
          max_participants = $8
      WHERE id = $9
      RETURNING *;
      `,
      [
        nextTitle,
        nextDescription,
        nextPrice,
        nextStartDate,
        nextEndDate,
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
      return res.status(404).json({ detail: 'Event not found' });
    }

    if (existing.rows[0].status !== 'upcoming') {
      return res.status(400).json({
        detail: 'Only upcoming events can be deleted'
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