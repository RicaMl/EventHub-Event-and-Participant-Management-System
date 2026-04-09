const express = require('express');
const participantController = require('../controllers/participant.controller');

const router = express.Router();

/**
 * @swagger
 * /api/participants:
 *   get:
 *     summary: Get all participants
 *     tags: [Participants]
 *     responses:
 *       200:
 *         description: List of participants
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Participant'
 *   post:
 *     summary: Create a new participant
 *     tags: [Participants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ParticipantInput'
 *     responses:
 *       201:
 *         description: Participant created successfully
 *       400:
 *         description: Invalid input
 *       409:
 *         description: Email already exists
 */
router.get('/', participantController.getAllParticipants);
router.post('/', participantController.createParticipant);

/**
 * @swagger
 * /api/participants/{user_id}/events:
 *   get:
 *     summary: Get events of a participant
 *     tags: [Participants]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Participant user ID
 *     responses:
 *       200:
 *         description: Events registered by the participant
 *       404:
 *         description: Participant not found
 */
router.get('/:user_id/events', participantController.getParticipantEvents);

/**
 * @swagger
 * /api/participants/{user_id}:
 *   get:
 *     summary: Get participant by user_id
 *     tags: [Participants]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Participant user ID
 *     responses:
 *       200:
 *         description: Participant detail
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Participant'
 *       404:
 *         description: Participant not found
 *   put:
 *     summary: Update participant
 *     tags: [Participants]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Participant user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ParticipantInput'
 *     responses:
 *       200:
 *         description: Participant updated successfully
 *       404:
 *         description: Participant not found
 *       409:
 *         description: Email already exists
 *   patch:
 *     summary: Partially update participant
 *     tags: [Participants]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Participant user ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, participant]
 *               status:
 *                 type: string
 *                 enum: [active, deleted]
 *     responses:
 *       200:
 *         description: Participant updated successfully
 *       404:
 *         description: Participant not found
 *       409:
 *         description: Email already exists
 *   delete:
 *     summary: Soft delete participant
 *     tags: [Participants]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Participant user ID
 *     responses:
 *       200:
 *         description: Participant soft-deleted successfully
 *       400:
 *         description: Only active users can be deleted
 *       404:
 *         description: Participant not found
 */
router.get('/:user_id', participantController.getParticipantById);
router.put('/:user_id', participantController.updateParticipant);
router.patch('/:user_id', participantController.updateParticipant);
router.delete('/:user_id', participantController.deleteParticipant);

module.exports = router;