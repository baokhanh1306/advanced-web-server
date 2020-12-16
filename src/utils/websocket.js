const { v4: uuidv4 } = require('uuid');
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
    console.log(users);
  });
  socket.on('create-board', async (name) => {
    const id = uuidv4();
    boards.push({ id, name, playerX: socket.username });
    socket.board = id;
    socket.join(id);
  });
  socket.on('join-board', async ({ boardId }) => {
    const board = await Board.findById(boardId, { winner: 0 });
    if (board) {
      socket.emit('user-join-chat', `${socket.username} has join the chat`);
      socket.board = boardId;
      socket.join(boardId);
    }
  });
  socket.on('send-message', ({ username, msg }) => {
    io.to(socket.board).emit('message', {
      user: username,
      text: msg,
      createdAt: Date.now()
    });
  });
};
