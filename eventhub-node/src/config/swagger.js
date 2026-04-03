const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EventHub Node API',
      version: '1.0.0',
      description: 'Node.js comparative backend for EventHub'
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local server'
      }
    ],
    components: {
      schemas: {
        Event: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            title: { type: 'string', example: 'AI Conference 2026' },
            description: { type: 'string', example: 'Conference about applied AI systems.' },
            date: { type: 'string', format: 'date', example: '2026-06-10' },
            status: {
              type: 'string',
              enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
              example: 'upcoming'
            },
            location: { type: 'string', example: 'Paris' },
            max_participants: { type: 'integer', example: 100 },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        EventInput: {
          type: 'object',
          required: ['title', 'date', 'status', 'max_participants'],
          properties: {
            title: { type: 'string', example: 'AI Conference 2026' },
            description: { type: 'string', example: 'Conference about applied AI systems.' },
            date: { type: 'string', format: 'date', example: '2026-06-10' },
            status: {
              type: 'string',
              enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
              example: 'upcoming'
            },
            location: { type: 'string', example: 'Paris' },
            max_participants: { type: 'integer', example: 100 }
          }
        },
        Participant: {
          type: 'object',
          properties: {
            user_id: { type: 'integer', example: 12 },
            first_name: { type: 'string', example: 'John' },
            last_name: { type: 'string', example: 'Doe' },
            email: { type: 'string', example: 'john@example.com' },
            role: { type: 'string', example: 'participant' },
            status: { type: 'string', example: 'active' },
            phone: { type: 'string', example: '0123456789' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        ParticipantInput: {
          type: 'object',
          required: ['first_name', 'last_name', 'email', 'password'],
          properties: {
            first_name: { type: 'string', example: 'John' },
            last_name: { type: 'string', example: 'Doe' },
            email: { type: 'string', example: 'john@example.com' },
            password: { type: 'string', example: 'SecurePass123' },
            phone: { type: 'string', example: '0123456789' },
            role: {
              type: 'string',
              enum: ['admin', 'participant'],
              example: 'participant'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Something went wrong' }
          }
        }
      }
    }
  },
  apis: ['./app.js', './src/routes/*.js']
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;