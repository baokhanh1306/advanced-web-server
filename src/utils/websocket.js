const Board = require('../board/board.model');
const ErrorHandler = require('../middlewares/ErrorHandler');
let boards = [];
let users = [];

module.exports = function(io, socket) {
  console.log('Socket connected ...');
  socket.on('disconnect', () => {
    users = users.filter((user) => user.socketId !== socket.id);
    io.emit('updateUsers', users);
  });
  socket.on('identity', ({ id: userId, username }) => {
    users.push({
      socketId: socket.id,
      userId,
      username
    });
    socket.emit('updateUsers', users);
  });
  socket.on('create-board', async ({ id: userId, name }) => {
    const board = new Board({
      name,
      playerX: id
    });
    await board.save();
    boards.push(board);
    socket.board = board._id;
    socket.join(socket.board);
  });
  socket.on('join-board', async ({ id: userId, boardId }) => {
    const board = await Board.findById(boardId, { winner: 0 } );
    if (board) {
      socket.join(boardId);
    }
  });
};