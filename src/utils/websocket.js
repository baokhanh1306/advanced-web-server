class WebSockets {
  // users = []
  // constructor() {
  //   this.users = [];
  // }
  connection(client) {
    let users = [];
    console.log('New user connected');
    client.on('disconnect', () => {
      users = users.filter((user) => user.socketId !== client.id);
      console.log('User disconected');
    });
    client.on('identity', ({ id: userId, username }) => {
      users.push({
        socketId: client.id,
        userId,
        username
      });
      client.emit('updateUsers', users);
    });
  }
};

module.exports = new WebSockets();