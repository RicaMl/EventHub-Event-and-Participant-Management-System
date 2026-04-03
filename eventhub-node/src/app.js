const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = require('./config/swagger');
const healthRoutes = require('./routes/health.routes');
const eventRoutes = require('./routes/event.routes');
const participantRoutes = require('./routes/participant.routes');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/participants', participantRoutes);

app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/', (req, res) => {
  res.json({
    message: 'EventHub Node API',
    docs: 'http://localhost:5000/api/v1/docs'
  });
});

app.use(errorHandler);

module.exports = app;