const express = require('express');
require('dotenv').config();
const morgan = require('morgan');
const cors = require('cors');
const chalk = require('chalk');
const http = require('http');
const socketIO = require('socket.io');

const db = require('./services/db');
const { handleError } = require('./middlewares/ErrorHandler');
const websocket = require('./utils/websocket');

const app = express();

db(process.env.DB_URI);

if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
}

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ msg: 'Hello' });
});

app.use('/api', require('./route'));

app.use((err, req, res, next) => {
  handleError(err, res);
});

const server = http.createServer(app);
const io = socketIO(server);
io.on('connection', websocket.connection);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () =>
  console.log(
    chalk.yellow(`
${process.env.NODE_ENV} server

⚡️ ==> Visit server at http://localhost:${PORT}
⚡️ ==> Server is running on port ${PORT}
`)
  )
);
