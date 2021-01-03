const { v4: uuidv4 } = require('uuid');
const _ = require('lodash');
const Board = require('../board/board.model');
const chalk = require('chalk');
let boards = [];

(async function () {
  boards = await Board.find({})
})()

let users = [];

module.exports = function (io, socket) {
  console.log('New user connected');
  socket.on('disconnect', () => {
    users = users.filter((user) => user.socketId !== socket.id);
    console.log('Socket disconnected ...');
    io.emit('updateUsers', users);
  });
  socket.on('identity', ({ id: userId, username, _id }) => {
    users.push({
      socketId: socket.id,
      userId,
      username,
      _id
    });
    socket.user = userId;
    socket.username = username;
    io.emit('updateUsers', users);
  });
  socket.on('create-board', async ({ name, user, password = '' }) => {
    // const id = uuidv4();
    const newBoard = await Board.create({ name, playerX: user });
    boards.push({
      id: newBoard._id,
      name: newBoard.name,
      playerX: user,
      password
    });
    socket.board = newBoard._id;
    socket.join(newBoard._id);
    socket.emit('board-id', newBoard._id);
  });
  socket.on('join-board', ({ boardId, user }) => {
    let size = 0;
    console.log(boardId, boards)
    const board = _.find(boards, b => b._id.toString() === boardId)
    console.log(board);
    console.log('USER JOIN', user);
    if (board) {
      const { playerX, playerO } = board
      if (playerX) {
        console.log('if1');
        board.playerO = user;
      }
      else if (playerO) {
        console.log('if2');

        board.playerX = user;
      }
      if (!playerX && !playerO) {
        console.log('if3');

        board.playerX = user;
      }
      if (board.playerX || board.playerO) size = 1;
      if (board.playerX && board.playerO) size = 2;

      socket.board = boardId;
      socket.join(boardId);
      console.log('cc', socket.board);
      io.to(socket.board).emit('user-join-room', { board, user, size });
    }
  });
  socket.on('leave-board', async ({ boardId, user }) => {
    const board = _.find(boards, b => b._id.toString() === boardId)
    if (board) {
      const { playerX, playerO } = board;
      if (playerX && user === playerX.toString()) {
        board.playerX = null;
      }
      if (playerO && user === playerO.toString()) {
        board.playerO = null;
      }
    }
    io.to(boardId).emit('user-leave-room', { board });
  });
  socket.on('send-message', ({ username, msg }) => {
    console.log(chalk.greenBright(`send-message: ${msg}`));
    io.to(socket.board).emit('message', {
      user: username,
      text: msg,
      createdAt: Date.now()
    });
  });
  socket.on('play-at', ({ row, col, val }) => {

    console.log(chalk('play-at'), { row, col, val });
    io.to(socket.board).emit('move', { row, col, val });
  });
};
