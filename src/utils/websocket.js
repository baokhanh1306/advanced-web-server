const { v4: uuidv4 } = require('uuid');
let boards = [];
let users = [];

module.exports = function (io, socket) {
  console.log('New user connected');
  socket.on('disconnect', () => {
    users = users.filter((user) => user.socketId !== socket.id);
    io.emit('updateUsers', users);
    console.log('Socket disconnected ...');
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
  socket.on('join-board', async (id) => {
    socket.board = id;
    socket.join(id);
  });
  socket.on('send-message', ({ username, msg }) => {
    console.log(msg);
    io.to(socket.board).emit('message', { user: username, text: msg });
  });
};
