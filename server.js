const {Server} = require('net');
const Request = require('./lib/request');

const handleConnection = function(socket) {
  // console.log(socket);
};

const main = function() {
  const server = new Server();
  server.listen(8000);
  server.on('listening', () => console.warn('Server is listening'));
  server.on('error', err => console.error('server error', err));
  server.on('connection', handleConnection);
};

main();
