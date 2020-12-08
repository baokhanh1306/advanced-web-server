class WebSockets {
    users = [];
    connection(client) {
        client.on('disconnect', () => {
            this.users = this.users.filter((user) => user.socketId !== client.id);
        });
        client.on('identity', (userId,username) => {
            this.users.push({
                socketId: client.id,
                userId,
                username
            });
            client.emit('updateUsers', users);
        });
    }
};

module.exports = new WebSockets();