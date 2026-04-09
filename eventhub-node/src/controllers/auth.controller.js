const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { JWT_SECRET } = require('../middlewares/auth.middleware');

// POST /api/auth/login/
// Django's obtain_auth_token returns { token } by default.
const login = async (req, res, next) => {
  try {
    const { email, password, username } = req.body;

    // Django's obtain_auth_token accepts 'username' + 'password',
    // but we also support 'email' for convenience.
    const identifier = email || username;

    if (!identifier || !password) {
      return res.status(400).json({
        non_field_errors: ['email (or username) and password are required']
      });
    }

    const result = await pool.query(
      `
      SELECT *
      FROM eventhub.users
      WHERE email = $1 OR username = $1;
      `,
      [identifier.trim().toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        non_field_errors: ['Unable to log in with provided credentials.']
      });
    }

    const user = result.rows[0];

    if (user.status !== 'active') {
      return res.status(400).json({
        non_field_errors: ['This account has been deactivated.']
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(400).json({
        non_field_errors: ['Unable to log in with provided credentials.']
      });
    }

    const token = jwt.sign(
      {
        user_id: user.user_id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return token + user info at the SAME level (flat JSON, no nested 'user' key)
    // to match Django's customized obtain_auth_token response
    res.status(200).json({
      token,
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      is_staff: user.role === 'admin',
      status: user.status,
      phone: user.phone,
      created_at: user.created_at,
      updated_at: user.updated_at
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { login };
