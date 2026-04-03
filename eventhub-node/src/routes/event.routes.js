const express = require('express');
const eventController = require('../controllers/event.controller');

const router = express.Router();

/**
 * @swagger
 * /api/v1/events:
 *   get:
 *     summary: Get all events
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *         description: Filter by exact date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title or location
 *       - in: query
 *         name: ordering
 *         schema:
 *           type: string
 *         description: Sort by date or -date
 *     responses:
 *       200:
 *         description: List of events
 *   post:
 *     summary: Create new event
 *     tags: [Events]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventInput'
 *     responses:
 *       201:
 *         description: Event created
 */
router.get('/', eventController.getAllEvents);
router.post('/', eventController.createEvent);

/**
 * @swagger
 * /api/v1/events/{id}:
 *   get:
 *     summary: Get event by id
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Event detail
 *       404:
 *         description: Event not found
 *   put:
 *     summary: Update full event
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventInput'
 *     responses:
 *       200:
 *         description: Event updated
 *   patch:
 *     summary: Update partial event
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Event updated
 *   delete:
 *     summary: Delete event
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Event deleted
 */
router.get('/:id', eventController.getEventById);
router.put('/:id', eventController.updateEvent);
router.patch('/:id', eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);

module.exports = router;