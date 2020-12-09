var users = [];
class WebSockets {
  // users = []
  // constructor() {
  //   this.users = [];
  // }
  connection(client) {
    console.log('New user connected');
    client.on('disconnect', () => {
      users = [...users.filter((user) => user.socketId !== client.id)];
      client.emit('updateUsers', []);
      console.log('User disconected', users);
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