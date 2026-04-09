const express = require('express');
const authController = require('../controllers/auth.controller');
const participantController = require('../controllers/participant.controller');

const router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login and obtain token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful, returns token and user info (flat)
 *       400:
 *         description: Invalid credentials
 */
router.post('/login', authController.login);

// Django path: auth/login/  (with trailing slash)
// We support both /login and /login/ for compatibility
router.post('/login/', authController.login);

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new participant
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ParticipantInput'
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid input
 *       409:
 *         description: Email already exists
 */
router.post('/signup', participantController.createParticipant);
router.post('/signup/', participantController.createParticipant);

module.exports = router;
