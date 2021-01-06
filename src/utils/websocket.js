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
let playNowUsers = [];

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
    const newBoard = await Board.create({ name, playerX: user, password });
    boards.push({
      _id: newBoard._id,
      name: newBoard.name,
      playerX: user,
      password,
      grid: JSON.parse(JSON.stringify(genHist())),
      conversation: []
    });
    socket.board = newBoard._id;
    socket.join(newBoard._id);
    io.to(socket.board).emit('user-join-room', { board: newBoard });
  });
  socket.on('join-board', ({ boardId, user }) => {
    let size = 0;
    const board = _.find(boards, (b) => b._id.toString() === boardId);
    // if (password === board.password || board.password === '') {
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
      // }
    }
    // }
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
      }
    }
    io.to(boardId).emit('user-leave-room', { msg: `User ${user} has left` });
  });
  socket.on('send-message', ({ username, msg }) => {
    console.log(chalk.greenBright(`send-message: ${msg}`));
    const board = _.find(boards, b => b._id.toString() === socket.board.toString());
    board.conversation = [...board.conversation, { name: username, text: msg}];
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
      io.to(socket.board).emit('win', { winner: val, grid: board.grid });
    }
    io.to(socket.board).emit('move', { row, col, val });
  });
  socket.on('search-room-id', ({ roomId, user }) => {
    // const board = boards[parseInt(roomId)];
    // if (!board) socket.emit('room-not-found');
    // else {
    //   if (board.password !== '') {
    //     socket.emit('room-require-password', { board, roomId });
    //   } else {
    //     const { playerX, playerO } = board;
    //     if (playerX) {
    //       board.playerO = user;
    //     } else if (playerO) {
    //       board.playerX = user;
    //     }
    //     if (!playerX && !playerO) {
    //       board.playerX = user;
    //     }
    //     if (board.playerX || board.playerO) size = 1;
    //     if (board.playerX && board.playerO) size = 2;
    //     socket.board = board._id;
    //     socket.join(board._id);
    //     io.to(socket.board).emit('user-join-room-id', { board });
    //   }
    // }
    const board = boards[parseInt(roomId)];
    if (!board) socket.emit('room-not-found');
    else {
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
      io.to(socket.board).emit('user-join-room', { board });

    }
  });
  socket.on('invite', ({ userId, boardId }) => {
    console.log('ok')
    const board = _.find(boards, (b) => b._id.toString() === boardId);
    if (board) {
      const user = users.find(u => u._id === userId);
      if (user) {
        console.log(userId);
        io.emit(`on-inviting-${userId}`, { data: boardId });
      }
    }
  });

  socket.on('deny-invite', ({ username, boardId }) => {
    io.to(boardId).emit('on-deny-invite', { msg: `${username} has denied your invitation` });
  });

  socket.on('cancel-play-now', ({ userId }) => {
    playNowUsers = playNowUsers.filter(user => user.userId === userId);
    const user = users.find(u => u._id === userId);
    io.to(user.socketId).emit('cancel-play-now');
  });

  socket.on('play-now', async ({ userId, cups }) => {
    let found = false;
    for (user of playNowUsers) {
      if (Math.abs(user.cups - cups) <= 5) {
        const newBoard = await Board.create({ name: `${userId} play now`, playerX: userId, password: '', playerO: user.userId });
        boards.push({
          _id: newBoard._id,
          name: newBoard.name,
          playerX: userId,
          playerO: user.userId,
          password: '',
          grid: JSON.parse(JSON.stringify(genHist()))
        });
        socket.board = newBoard._id;
        socket.join(newBoard._id);
        io.to(socket.board).emit('user-join-room', { board: newBoard });
        //emit to other user to join room
        io.emit(`on-play-now-${user.userId}`, { data: newBoard._id });
        found = true;
        break;
      }
    }
    if (!found) playNowUsers.push({
      socketId: socket.id,
      userId,
      cups
    });
  });
};
