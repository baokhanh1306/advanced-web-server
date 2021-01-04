const { v4: uuidv4 } = require('uuid');
const _ = require('lodash');
const checkWin = require('./checkwin');
const Board = require('../board/board.model');
const chalk = require('chalk');
const { emit } = require('nodemon');
let boards = [];

const genHist = () => {
  return _.map(Array(BOARD_SIZE).fill(null), () => {
    return Array(BOARD_SIZE).fill(null);
  });
};

const BOARD_SIZE = 20;

(async function () {
  boards = await Board.find({});

  boards = _.map(boards, (b) => {
    return {
      grid: JSON.parse(JSON.stringify(genHist())),
      ...b.toObject()
    };
  });
})();

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
      _id,
      grid: JSON.parse(JSON.stringify(genHist()))
    });
    socket.user = userId;
    socket.username = username;
    io.emit('updateUsers', users);
  });
  socket.on('create-board', async ({ name, user, password = '' }) => {
    // const id = uuidv4();
    const newBoard = await Board.create({ name, playerX: user, password });
    boards.push({
      _id: newBoard._id,
      name: newBoard.name,
      playerX: user,
      password
    });
    socket.board = newBoard._id;
    socket.join(newBoard._id);
    io.to(socket.board).emit('user-join-room', { board: newBoard });
  });
<<<<<<< HEAD
  socket.on('join-board', async ({ boardId, user }) => {
    let size = 0;
    const board = await Board.findById(boardId, { winner: 0 });

    if (board) {
      const { playerX, playerO } = board
      if (!playerX && !playerO) {
        console.log('2 thang null');
        await Board.updateOne({ _id: boardId }, { $set: { playerX: user } });
      }
      if (playerX && !playerO) {
        console.log('X joined');
        await Board.updateOne({ _id: boardId }, { $set: { playerO: user } });
      }
      else {
        console.log('O joined');
        await Board.updateOne({ _id: boardId }, { $set: { playerX: user } });
      }

      // if (size === 0) {
      //   await Board.updateOne({ _id: boardId }, { $set: { playerX: user } })
      // }
      if (playerX) size++;
      else if (playerX && playerO) size++;

      socket.board = boardId;
      socket.join(boardId);
      io.to(socket.board).emit('user-join-room', { user, size });
    }
  });
  socket.on('leave-board', async ({ boardId, user }) => {
    const board = await Board.findById(boardId);
    if (board) {
      const { playerX, playerO } = board;
      console.log(user);
      if (playerX && user.toString() === playerX.toString()) {
        await Board.updateOne({ _id: boardId }, { $set: { playerX: null } });
      }
      if (playerO && user.toString() === playerO.toString()) {
        await Board.updateOne({ _id: boardId }, { $set: { playerO: null } });
=======
  socket.on('join-board', ({ boardId, user, password }) => {
    let size = 0;
    const board = _.find(boards, (b) => b._id.toString() === boardId);
    if (password === board.password || board.password === '') {
      if (board) {
        const { playerX, playerO } = board;
        if (playerX) {

          board.playerO = user;
        } else if (playerO) {


          board.playerX = user;
        }
        if (!playerX && !playerO) {


          board.playerX = user;
        }
        if (board.playerX || board.playerO) size = 1;
        if (board.playerX && board.playerO) size = 2;

        socket.board = boardId;
        socket.join(boardId);
        io.to(socket.board).emit('user-join-room', { board, user, size });
      }
    }
  });
  socket.on('leave-board', async ({ boardId, user }) => {
    const board = _.find(boards, (b) => b._id.toString() === boardId);
    if (board) {
      const { playerX, playerO } = board;
      if (playerX && user === playerX.toString()) {
        board.playerX = null;
      }
      if (playerO && user === playerO.toString()) {
        board.playerO = null;
>>>>>>> 97a7fa2a7a29adf6fa31994de4d370e4d43f68d8
      }
    }
    io.to(boardId).emit('user-leave-room', { msg: `User ${user} has left` });
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
    const board = _.find(
      boards,
      (b) => b._id.toString() === socket.board.toString()
    );
    board.grid[row][col] = val;
    if (checkWin(row, col, val, board.grid)) {
      io.to(socket.board).emit('win', { msg: 'Ok win' });
    }
    io.to(socket.board).emit('move', { row, col, val });
  });
  socket.on('search-room-id', ({ roomId, user }) => {
    const board = boards[parseInt(roomId)];
    if (!board) socket.emit('room-not-found')
    else {
      if (board.password !== '') {
        socket.emit('room-require-password', { board, roomId })
      } else {
        const { playerX, playerO } = board;
        if (playerX) {

          board.playerO = user;
        } else if (playerO) {


          board.playerX = user;
        }
        if (!playerX && !playerO) {


          board.playerX = user;
        }
        if (board.playerX || board.playerO) size = 1;
        if (board.playerX && board.playerO) size = 2;
        socket.board = board._id;
        socket.join(board._id);
        io.to(socket.board).emit('user-join-room-id', { board });
      }
    }
  })
  socket.on('join-room-id-password', ({ id, password, user }) => {
    const board = boards[parseInt(id)];
    if (password === board.password) {
      console.log(board);
      const { playerX, playerO } = board;
      if (playerX) {

        board.playerO = user;
      } else if (playerO) {


        board.playerX = user;
      }
      if (!playerX && !playerO) {


        board.playerX = user;
      }
      if (board.playerX || board.playerO) size = 1;
      if (board.playerX && board.playerO) size = 2;
      socket.board = board._id;
      socket.join(board._id);

      io.to(socket.board).emit('user-join-room-id', { board });
    }
  });
  socket.on('invite', ({ userId, boardId }) => {
    const board = boards[parseInt(boardId)];
    if (board) {
      const { playerX, playerO } = board;
        if (playerX) {
          board.playerO = user;
        } else if (playerO) {

          board.playerX = user;
        }
        if (!playerX && !playerO) {

          board.playerX = user;
        }
        if (board.playerX || board.playerO) size = 1;
        if (board.playerX && board.playerO) size = 2;

        socket.board = boardId;
        socket.join(boardId);
        io.to(socket.board).emit('user-join-room', { board, user, size });
    }
  });
};
