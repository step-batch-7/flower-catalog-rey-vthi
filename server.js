const http = require('http');
const {app} = require('./handler.js');

const main = (port = 4000) => {
  const server = new http.Server(app.processRequest.bind(app));

  server.listen(port, () => {
    console.warn('started listening', server.address());
  });
  server.on('error', err => {
    console.log('server error', err);
  });
};
main(process.argv[2]);
