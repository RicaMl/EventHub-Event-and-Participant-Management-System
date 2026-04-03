const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const allowedRoles = ['admin', 'participant'];

const getAllParticipants = async (req, res, next) => {
  try {
    const result = await pool.query(
      `
      SELECT
        user_id,
        first_name,
        last_name,
        email,
        role,
        status,
        phone,
        created_at,
        updated_at
      FROM eventhub.users
      ORDER BY user_id ASC;
      `
    );

    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
};

const getParticipantById = async (req, res, next) => {
  try {
    const { user_id } = req.params;

    const result = await pool.query(
      `
      SELECT
        user_id,
        first_name,
        last_name,
        email,
        role,
        status,
        phone,
        created_at,
        updated_at
      FROM eventhub.users
      WHERE user_id = $1;
      `,
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const createParticipant = async (req, res, next) => {
  try {
    const {
      first_name,
      last_name,
      email,
      password,
      phone,
      role
    } = req.body;

    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({
        message: 'first_name, last_name, email, password are required'
      });
    }

    const normalizedRole = role || 'participant';

    if (!allowedRoles.includes(normalizedRole)) {
      return res.status(400).json({
        message: 'Invalid role'
      });
    }

    const existingUser = await pool.query(
      `SELECT user_id FROM eventhub.users WHERE email = $1`,
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: 'Email already exists'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO eventhub.users (
        first_name,
        last_name,
        email,
        password_hash,
        role,
        status,
        phone
      )
      VALUES ($1, $2, $3, $4, $5, 'active', $6)
      RETURNING
        user_id,
        first_name,
        last_name,
        email,
        role,
        status,
        phone,
        created_at,
        updated_at;
      `,
      [
        first_name.trim(),
        last_name.trim(),
        email.trim().toLowerCase(),
        passwordHash,
        normalizedRole,
        phone ? phone.trim() : null
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Email already exists' });
    }
    next(error);
  }
};

const updateParticipant = async (req, res, next) => {
  try {
    const { user_id } = req.params;
    const {
      first_name,
      last_name,
      email,
      phone,
      role,
      status,
      password
    } = req.body;

    const existing = await pool.query(
      `SELECT * FROM eventhub.users WHERE user_id = $1`,
      [user_id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    const current = existing.rows[0];

    const nextFirstName = first_name ?? current.first_name;
    const nextLastName = last_name ?? current.last_name;
    const nextEmail = email ? email.trim().toLowerCase() : current.email;
    const nextPhone = phone !== undefined ? (phone ? phone.trim() : null) : current.phone;
    const nextRole = role ?? current.role;
    const nextStatus = status ?? current.status;

    if (!allowedRoles.includes(nextRole)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    if (!['active', 'deleted'].includes(nextStatus)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const duplicatedEmail = await pool.query(
      `
      SELECT user_id
      FROM eventhub.users
      WHERE email = $1 AND user_id <> $2
      `,
      [nextEmail, user_id]
    );

    if (duplicatedEmail.rows.length > 0) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    let nextPasswordHash = current.password_hash;
    if (password) {
      nextPasswordHash = await bcrypt.hash(password, 10);
    }

    const result = await pool.query(
      `
      UPDATE eventhub.users
      SET first_name = $1,
          last_name = $2,
          email = $3,
          password_hash = $4,
          role = $5,
          status = $6,
          phone = $7
      WHERE user_id = $8
      RETURNING
        user_id,
        first_name,
        last_name,
        email,
        role,
        status,
        phone,
        created_at,
        updated_at;
      `,
      [
        nextFirstName,
        nextLastName,
        nextEmail,
        nextPasswordHash,
        nextRole,
        nextStatus,
        nextPhone,
        user_id
      ]
    );

    res.status(200).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Email already exists' });
    }
    next(error);
  }
};

const deleteParticipant = async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { user_id } = req.params;

    await client.query('BEGIN');

    const userResult = await client.query(
      `
      SELECT *
      FROM eventhub.users
      WHERE user_id = $1
      FOR UPDATE;
      `,
      [user_id]
    );

    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Participant not found' });
    }

    const user = userResult.rows[0];

    if (user.status !== 'active') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: 'Only active users can be deleted'
      });
    }

    await client.query(
      `
      DELETE FROM eventhub.registrations r
      USING eventhub.events e
      WHERE r.event_id = e.id
        AND r.user_id = $1
        AND e.status = 'upcoming';
      `,
      [user_id]
    );

    const updateResult = await client.query(
      `
      UPDATE eventhub.users
      SET status = 'deleted'
      WHERE user_id = $1
      RETURNING
        user_id,
        first_name,
        last_name,
        email,
        role,
        status,
        phone,
        created_at,
        updated_at;
      `,
      [user_id]
    );

    await client.query('COMMIT');

    res.status(200).json({
      message: 'Participant soft-deleted successfully',
      user: updateResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

const getParticipantEvents = async (req, res, next) => {
  try {
    const { user_id } = req.params;

    const userResult = await pool.query(
      `SELECT user_id FROM eventhub.users WHERE user_id = $1`,
      [user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    const result = await pool.query(
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
        r.registered_at
      FROM eventhub.registrations r
      JOIN eventhub.events e ON e.id = r.event_id
      WHERE r.user_id = $1
      ORDER BY e.date ASC, e.id ASC;
      `,
      [user_id]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllParticipants,
  getParticipantById,
  createParticipant,
  updateParticipant,
  deleteParticipant,
  getParticipantEvents
};