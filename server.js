const http = require('http');
const {stdout} = process;
const {app} = require('./lib/handler.js');
const DEFAULT_PORT_NUMBER = 4000;
const main = (port = DEFAULT_PORT_NUMBER) => {
  const server = new http.Server(app.processRequest.bind(app));

  server.listen(port, () => {
    stdout.write('started listening');
  });
  server.on('error', err => {
    stdout.write('server error', err);
  });
};

const [, , userInPortNum] = process.argv;
main(userInPortNum);
