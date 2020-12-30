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
  socket.on('create-board', async ({ name, user }) => {
    // const id = uuidv4();
    const newBoard = await Board.create({ name, playerX: user });
    boards.push({
      id: newBoard._id,
      name: newBoard.name,
      playerX: user
    });
    socket.board = newBoard._id;
    socket.join(newBoard._id);
    socket.emit('board-id', newBoard._id);
  });
  socket.on('join-board', async ({ boardId, user }) => {
    const board = await Board.findById(boardId, { winner: 0 });
    console.log('join', user);
    if (board) {
      const { playerX, playerO } = board
      // if (user.toString() === playerX.toString()) { }
      if (!playerO && user.toString() !== playerX.toString()) {
        console.log("HELO");
        await Board.updateOne({ _id: boardId }, { $set: { playerO: user } })
      }
      socket.emit('user-join-chat', `${socket.username} has join the chat`);
      socket.board = boardId;
      socket.join(boardId);
    }
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
