const { v4: uuidv4 } = require('uuid');
let boards = [];
let users = [];

module.exports = function(io, socket) {
  console.log('Socket connected ...');
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
  socket.on('create-board',  (name) => {
    const id = uuidv4();
    boards.push({ id, name, playerX: socket.user });
    socket.board = id;
    socket.join(socket.board);
    const ids = await io.of("/").in(socket.board).allSockets();
    console.log(ids);
    console.log(socket.board);
  });
  socket.on('join-board', async (id) => {
    socket.board = id;
    socket.join(id);
    const ids = await io.of("/").in(socket.board).allSockets();
    console.log(ids);
    console.log(socket.board);
  });
  socket.on('send-message', async (msg) => {
    console.log(msg);
    console.log(socket.username);
    const ids = await io.of("/").in(socket.board).allSockets();
    console.log(ids);
    console.log(socket.board);
    io.to(socket.board).emit('message', { user: socket.username, text: msg });
  });
};