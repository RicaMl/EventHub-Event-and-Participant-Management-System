const express = require('express');
const pool = require('../config/db');

const router = express.Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Basic health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Node backend is running
 */
router.get('/', (req, res) => {
  res.status(200).json({
    message: 'Node backend is running'
  });
});

/**
 * @swagger
 * /api/health/db:
 *   get:
 *     summary: Database connection test
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Database connection successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Database connected successfully
 *                 time:
 *                   type: string
 *                   example: 2026-04-03T10:00:00.000Z
 *       500:
 *         description: Database connection failed
 */
router.get('/db', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT NOW() AS current_time');
    res.status(200).json({
      message: 'Database connected successfully',
      time: result.rows[0].current_time
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;