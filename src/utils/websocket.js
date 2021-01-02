const { v4: uuidv4 } = require('uuid');
const Board = require('../board/board.model');
let boards = [];
let users = [];

module.exports = function (io, socket) {
  console.log('New user connected');
  socket.on('disconnect', () => {
    users = users.filter((user) => user.socketId !== socket.id);
    console.log('Socket disconnected ...');
    io.emit('updateUsers', users);
  });
  socket.on('identity', ({ id: userId, username }) => {
    users.push({
      socketId: socket.id,
      userId,
      username
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
  socket.on('join-board', async ({ boardId, user }) => {
    let size = 0;
    const board = await Board.findById(boardId, { winner: 0 });
    console.log('join', user);
    if (board) {
      const { playerX, playerO } = board
      if (playerX){
        await Board.updateOne({ _id: boardId }, { $set: { playerO: user } });
      } 
      else if (playerO) {
        await Board.updateOne({ _id: boardId }, { $set: { playerX: user } });
      }

      if (playerX) size++;
      else if (playerX && playerO) size++;

      socket.board = boardId;
      socket.join(boardId);
      io.to(socket.board).emit('user-join-room', { user, size });
    }
  });
  socket.on('leave-board', async({ boardId, user }) => {
    const board = await Board.findById(boardId);
    if (board) {
      const { playerX, playerO } = board;
      if (playerX && user.toString() === playerX.toString()) {
        await Board.updateOne({ _id: boardId }, { $set: { playerX: null }});
      }
      if (playerO && user.toString() === playerO.toString()) {
        await Board.updateOne({ _id: boardId }, { $set: { playerO: null }});
      }
    }
    io.to(boardId).emit('user-leave-room', { msg: `User ${user} has left`});
  });
  socket.on('send-message', ({ username, msg }) => {
    console.log(msg);
    console.log(socket.username);
    io.to(socket.board).emit('message', {
      user: username,
      text: msg,
      createdAt: Date.now()
    });
  });
  socket.on('play-at', ({ row, col, val }) => {
    console.log(row, col, val);
    io.to(socket.board).emit('move', { row, col, val });
  });
};
