const { v4: uuidv4 } = require('uuid');
const _ = require('lodash');
const checkWin = require('./checkwin');
const Board = require('../board/board.model');
const chalk = require('chalk');
const { forEach } = require('lodash');


const genHist = () => {
  return _.map(Array(BOARD_SIZE).fill(null), () => {
    return Array(BOARD_SIZE).fill(null);
  });
};

const BOARD_SIZE = 20;

let boards = [];
let users = [];
let playNowUsers = [];
let playingUsers = [];
let reconnectingUsers = [];

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
    io.emit('reconnecting-users', reconnectingUsers)
  });
  socket.on('get-list-board', () => {
    socket.emit('list-board', { data: boards });
  });
  socket.on('create-board', async ({ name, user, moveDuration = 20, password = '' }) => {
    const id = uuidv4();
    const board = {
      _id: id,
      name,
      playerX: user,
      password,
      grid: JSON.parse(JSON.stringify(genHist())),
      conversation: [],
      // status: '1/2 players',
      isReady: {
        X: null,
        O: null
      },
      history: [],
      currentUsers: [user],
      isXTurn: true,
      moveDuration
    };
    boards.push(board);
    socket.board = id;
    socket.join(id);
    reconnectingUsers = _.filter(reconnectingUsers, r => r.userId !== user)
    io.to(socket.board).emit('user-join-room', { board });
    io.emit('list-board', { data: boards });
  });
  socket.on('join-board', ({ boardId, user }) => {
    const board = _.find(boards, (b) => b._id.toString() === boardId);
    // const otherBoard = _.filter(boards, b=>b._id !==boardId)
    // _.map(otherBoard, b=> )
    if (board) {
      reconnectingUsers = _.filter(reconnectingUsers, r => r.userId !== user)
      const { playerX, playerO } = board;
      if (!_.includes(board.currentUsers, user) && board.currentUsers.length < 2) {
        board.currentUsers.push(user)
      }


      if (playerX && playerO) {
        socket.board = boardId;
        socket.join(boardId);
      } else {
        if (playerX) {
          board.playerO = user;
        } else if (playerO) {
          board.playerX = user;
        }
        if (!playerX && !playerO) {
          board.playerX = user;
        }
        socket.board = boardId;
        socket.join(boardId);
      }
      io.to(socket.board).emit('user-join-room', { board, user });
      io.emit('list-board', { data: boards });
    }
  });
  socket.on('surrender', async ({ boardId, user }) => {
    const board = _.find(boards, (b) => b._id.toString() === boardId);
    if (board) {

      board.winner = user === board.playerX.toString() ? 1 : -1
      let val = board.winner === 1 ? 'O' : 'X'
      let loser = board.winner === 1 ? 'X' : 'O'

      io.to(socket.board).emit('surrender', { winner: val, loser, grid: board.grid, board });
      boards = _.filter(boards, b => b._id !== board._id)
      reconnectingUsers = _.filter(reconnectingUsers, r => r.boardId !== boardId)

      io.emit('list-board', ({ data: boards }))
      const { isReady, status, _id, grid, isXTurn, ...rest } = board
      const newBoard = new Board(rest)
      await newBoard.save()
    }
  });
  socket.on('send-message', ({ username, msg }) => {
    console.log(chalk.greenBright(`send-message: ${msg}`));
    const board = _.find(
      boards,
      (b) => b._id.toString() === socket.board.toString()
    );
    board.conversation = [
      ...board.conversation,
      { user: username, value: msg }
    ];
    io.to(socket.board).emit('message', {
      type: 'text',
      user: username,
      text: msg,
      createdAt: Date.now()
    });
  });
  socket.on('play-at', async ({ row, col, val }) => {
    const board = _.find(
      boards,
      (b) => b._id.toString() === socket.board.toString()
    );
    board.grid[row][col] = val;
    board.isXTurn = !board.isXTurn
    board.history.push(JSON.stringify(board.grid));
    if (checkWin(row, col, val, board.grid)) {
      console.log("win");
      board.winner = val === 'X' ? -1 : 1
      console.log(board);
      io.to(socket.board).emit('win', { winner: val, grid: board.grid, board });
      boards = _.filter(boards, b => b._id !== board._id)
      reconnectingUsers = _.filter(reconnectingUsers, r => r.boardId !== board._id)

      io.emit('list-board', ({ data: boards }))
      // _id: uuid, grid, isReady, status, ...rest
      const { isReady, _id, grid, currentUsers, moveDuration, isXTurn, ...rest } = board
      const newBoard = new Board(rest)
      await newBoard.save()
    }
    io.to(socket.board).emit('move', { row, col, val, isXTurn: board.isXTurn });
  });
  socket.on('search-room-id', ({ roomId, user }) => {
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
      if (!_.includes(board.currentUsers, user)) board.currentUsers.push(user)
      reconnectingUsers = _.filter(reconnectingUsers, r => r.userId !== user)
      socket.board = board._id;
      socket.join(board._id);
      io.to(socket.board).emit('user-join-room', { board, playingUsers });
      io.emit('list-board', { data: boards });
    }
  });

  socket.on('invite', ({ userId, boardId }) => {
    console.log('ok');
    const board = _.find(boards, (b) => b._id.toString() === boardId);
    if (board) {
      const user = users.find((u) => u._id === userId);
      if (user) {
        io.emit(`on-inviting-${userId}`, { data: boardId });
      }
    }
  });

  socket.on('deny-invite', ({ username, boardId }) => {
    io.to(boardId).emit('on-deny-invite', {
      msg: `${username} has denied your invitation`
    });
  });

  socket.on('play-now', async ({ userId, cups }) => {
    let found = false;
    for (user of playNowUsers) {
      if (Math.abs(user.cups - cups) <= 1000 && user.userId !== userId) {
        const id = uuidv4();
        const board = {
          _id: id,
          name: `Play Now`,
          password: '',
          grid: JSON.parse(JSON.stringify(genHist())),
          playerX: userId,
          playerO: user.userId,
          conversation: [],
          currentUsers: [user.userId, userId],
          isReady: {
            X: null,
            O: null
          },
          history: [],
          moveDuration: 20,
          isXTurn: true
        };
        boards.push(board);
        socket.board = board._id;
        socket.join(board._id);
        io.to(socket.board).emit('user-join-room', { board });
        //emit to other user to join room
        playNowUsers = _.filter(playNowUsers, (u) => u.userId !== user.userId);
        reconnectingUsers = _.filter(reconnectingUsers, r => r.userId !== user)
        io.emit(`on-play-now-${user.userId}`, { data: board._id });
        io.emit(`on-play-now-${userId}`, { data: board._id });
        found = true;
        break;
      }
    }
    if (!found)
      playNowUsers.push({
        socketId: socket.id,
        userId,
        cups
      });
  });

  socket.on('game-ready', ({ boardId, userId }) => {
    console.log('OK');
    const board = _.find(boards, b => b._id === boardId)

    if (userId === board.playerX) board.isReady.X = userId
    if (userId === board.playerO) board.isReady.O = userId
    if (board.isReady.X && board.isReady.O) {
      io.to(boardId).emit('ready')
      io.emit('list-board', ({ data: boards }))
    }
  })

  socket.on('cancel-play-now', ({ userId }) => {
    playNowUsers = _.filter(playNowUsers, (u) => u.userId !== userId);
    console.log(playNowUsers);
    socket.emit(`cancel-ok-${userId}`)
  })

  socket.on('request-draw', ({ boardId, userId }) => {
    const board = _.find(boards, b => b._id === boardId)
    const { playerX, playerO } = board
    const otherUser = userId === playerX ? playerO : playerX
    io.emit(`request-draw-${otherUser}`)
  })

  socket.on('accept-draw', ({ boardId }) => {
    boards = _.filter(boards, b => b._id !== boardId)
    io.emit('list-board', ({ data: boards }))
    io.to(boardId).emit('accept-draw')
  })
  socket.on('cancel-draw', ({ boardId, userId }) => {
    const board = _.find(boards, b => b._id === boardId)
    const { playerX, playerO } = board
    const otherUser = userId === playerX ? playerO : playerX
    io.emit(`cancel-draw-${otherUser}`)
  })
  socket.on('user-disconnect', ({ boardId, userId }) => {
    console.log('USER DISCONNECT FROM BOARD');
    const board = _.find(boards, b => b._id === boardId)
    if (board) {

      const { playerX, playerO } = board
      const otherUser = userId === playerX ? playerO : playerX
      if (!_.find(reconnectingUsers, (u) => { u.userId === userId })) {
        reconnectingUsers.push({
          userId,
          boardId
        })
      }
      io.emit(`opponent-disconnect-${otherUser}`)
      io.emit('reconnecting-users', reconnectingUsers)
    }

  })

  socket.on('set-win', async ({ boardId, userId }) => {
    const board = _.find(boards, (b) => b._id.toString() === boardId);
    if (board) {

      board.winner = userId === board.playerX.toString() ? -1 : 1
      let val = board.winner === 1 ? 'X' : 'O'
      let loser = board.winner === 1 ? 'O' : 'X'

      io.to(socket.board).emit('surrender', { winner: val, loser, grid: board.grid, board });
      boards = _.filter(boards, b => b._id !== board._id)
      reconnectingUsers = _.filter(reconnectingUsers, r => r.boardId !== boardId)

      io.emit('list-board', ({ data: boards }))
      const { isReady, status, _id, grid, isXTurn, ...rest } = board
      const newBoard = new Board(rest)
      await newBoard.save()
    }
  })

  socket.on('user-reconnect', ({ userId }) => {
    const board = _.find(reconnectingUsers, r => r.userId === userId)
    if (board) {
      io.emit(`user-reconnect-${userId}`, { data: board.boardId })
    }
  })

  socket.on('leave-board-not-start', ({ boardId, userId }) => {
    const board = _.find(boards, (b) => b._id.toString() === boardId);
    if (board) {
      const { playerX, playerO } = board;
      //1 player in board
      if (board.currentUsers.length < 2) {
        boards = _.filter(boards, b => b._id !== boardId);
      }
      else {
        if (playerX === userId) {
          board.playerX = null;
        }
        else if (playerO === userId) {
          board.playerO = null;
        }
        board.currentUsers = _.filter(board.currentUsers, u => u !== userId);
      }
    }
    io.emit('list-board', ({ data: boards }));
  })
};
