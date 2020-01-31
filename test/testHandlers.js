const request = require('supertest');
const {app} = require('./../lib/handler.js');

describe('GET / method', function() {
  it('should give home page, when the url is /', function(done) {
    request(app.processRequest.bind(app))
      .get('/')
      .expect(200, done)
      .expect('Content-Type', 'text/html');
  });
  it('should give gif of the home page', function(done) {
    request(app.processRequest.bind(app))
      .get('/images/animated-flower-image-0021.gif')
      .expect(200, done)
      .expect('Content-Type', 'image/gif');
  });
  it('should load style page ', function(done) {
    request(app.processRequest.bind(app))
      .get('/style.css')
      .expect(200, done)
      .expect('Content-Type', 'text/css');
  });
  it('should load script page', function(done) {
    request(app.processRequest.bind(app))
      .get('/js/flowerCatalog.js')
      .expect(200, done)
      .expect('Content-Type', 'application/javascript')
      .expect(/hideForOneSec/);
  });
  it('should load flower image', function(done) {
    request(app.processRequest.bind(app))
      .get('/images/freshorigins.jpg')
      .expect(200, done)
      .expect('Content-Type', 'image/jpg');
  });
  it('should give not found page', function(done) {
    request(app.processRequest.bind(app))
      .get('/notExistingPage')
      .expect(404, done)
      .expect('Content-Type', 'text/html')
      .expect(/404 File not found/);
  });
  it('should readBody', function(done) {
    request(app.processRequest.bind(app))
      .get('/')
      .send('hello')
      .expect(200, done)
      .expect('Content-Type', 'text/html');
  });
  it('should load guest book page', function(done) {
    request(app.processRequest.bind(app))
      .get('/GuestBook.html')
      .expect(200, done)
      .expect(/Leave a Comment/);
  });
  it('should get pdf of Abeliophyllum', function(done) {
    request(app.processRequest.bind(app))
      .get('/pdf/Abeliophyllum.pdf')
      .expect(200, done)
      .expect('Content-Type', 'application/pdf');
  });
});

describe('PUT Not allowed method', function() {
  it('should give not found page', function(done) {
    request(app.processRequest.bind(app))
      .put('/')
      .expect(405, done)
      .expect(/Method Not Allowed/);
  });
});

describe('GET Not found page', function() {
  it('should give not found page', function(done) {
    request(app.processRequest.bind(app))
      .get('/badFile')
      .expect(404, done);
  });
});
