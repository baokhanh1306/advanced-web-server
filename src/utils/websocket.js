const Board = require('../board/board.model');
const ErrorHandler = require('../middlewares/ErrorHandler');
let boards = [];
let users = [];

module.exports = function (io, socket) {
  console.log('Socket connected ...');
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
  socket.on('create-board', async ({ name }) => {
    const board = new Board({
      name,
      playerX: socket.user
    });
    await board.save();
    boards.push(board);
    socket.board = board._id;
    socket.join(socket.board);
  });
  socket.on('join-board', async ({ boardId }) => {
    const board = await Board.findById(boardId, { winner: 0 });
    if (board) {
      socket.board = boardId;
      socket.join(boardId);
    }
  });
  socket.on('send-message', ({ msg }) => {
    io.to(socket.board).emit('message', { user: socket.username, text: msg });
  });
};