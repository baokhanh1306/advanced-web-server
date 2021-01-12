const express = require('express');
if (process.env.NODE_ENV !== 'prod') require('dotenv').config();
const morgan = require('morgan');
const cors = require('cors');
const chalk = require('chalk');
const http = require('http');
const socketIO = require('socket.io');
require('./middlewares/passport');

const db = require('./services/db');
const { handleError } = require('./middlewares/ErrorHandler');

const app = express();

db(process.env.DB_URI_LOCAL);

if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
}

app.use(morgan('dev'));
app.use(cors({
  origin: '*'
}));
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ msg: 'Hello' });
});

app.use('/api', require('./route'));

app.use((err, req, res, next) => {
  handleError(err, res);
});

const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
  }
});
io.on('connection', (socket) => require('./utils/websocket')(io, socket));

const PORT = process.env.PORT || 4000;
server.listen(PORT, () =>
  console.log(
    chalk.yellow(`
⚡️ ==> Visit server at ${process.env.HOST_URL}
⚡️ ==> Server is running on port ${PORT}
`)
  )
);
