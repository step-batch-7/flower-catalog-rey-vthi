const http = require('http');
const {app} = require('./app');
// const {processRequest} = require('./app');

const main = (port = 4000) => {
  const server = new http.Server(app.serve.bind(app));

  server.listen(port, () => {
    console.warn('started listening', server.address());
  });
  server.on('error', err => {
    console.log('server error', err);
  });
};
main(process.argv[2]);
