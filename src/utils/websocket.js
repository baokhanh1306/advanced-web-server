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

// (async function () {
//   boards = await Board.find({});

//   boards = _.map(boards, (b) => {
//     return {
//       grid: JSON.parse(JSON.stringify(genHist())),
//       ...b.toObject()
//     };
//   });
// })();

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
  socket.on('get-list-board', () => {
    socket.emit('list-board', ({ data: boards }))
  })
  socket.on('create-board', async ({ name, user, password = '' }) => {
    const id = uuidv4();
    // const newBoard = await Board.create({ name, playerX: user, password });
    const board = {
      _id: id,
      name,
      playerX: user,
      password,
      grid: JSON.parse(JSON.stringify(genHist())),
      conversation: [],
      status: "1/2 players"
    }
    boards.push(board);
    socket.board = id;
    socket.join(id);
    io.to(socket.board).emit('user-join-room', { board });
    io.emit('list-board', ({ data: boards }))
  });
  socket.on('join-board', ({ boardId, user }) => {
    const board = _.find(boards, (b) => b._id.toString() === boardId);
    // if (password === board.password || board.password === '') {
    if (board) {
      const { playerX, playerO } = board;
      if (playerX && playerO) {
        socket.board = boardId;
        socket.join(boardId);
        io.to(socket.board).emit('user-join-room', { board, user });
      }
      else {
        if (playerX) {
          board.playerO = user;
        } else if (playerO) {
          board.playerX = user;
        }
        if (!playerX && !playerO) {
          board.playerX = user;
        }
        if (board.playerX || board.playerO) board.status = "1/2 players";
        if (board.playerX && board.playerO) size = "2/2 players";

        socket.board = boardId;
        socket.join(boardId);
        io.to(socket.board).emit('user-join-room', { board, user });
        io.emit('list-board', ({ data: boards }))
      }
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
      if (board.playerX || board.playerO) board.status = "1/2 players";
      if (!board.playerX && !board.playerO) board.status = "0/2 players";
    }
    io.to(boardId).emit('user-leave-room', { msg: `User ${user} has left` });
    io.emit('list-board', ({ data: boards }))
  });
  socket.on('send-message', ({ username, msg }) => {
    console.log(chalk.greenBright(`send-message: ${msg}`));
    const board = _.find(boards, b => b._id.toString() === socket.board.toString());
    board.conversation = [...board.conversation, { user: username, value: msg, createdAt: Date.now(), type: 'text' }];
    io.to(socket.board).emit('message', {
      type: 'text',
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
      if (Math.abs(user.cups - cups) <= 5 && user.userId !== userId) {
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
        playNowUsers = _.filter(playNowUsers, u => u.userId === user.userId)
        io.emit(`on-play-now-${user.userId}`, { data: newBoard._id });
        io.emit(`on-play-now-${userId}`, { data: newBoard._id })
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
