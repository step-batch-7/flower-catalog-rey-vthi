const request = require('supertest');
const {app} = require('./../lib/handler.js');

describe('GET / method', function() {
  it('should give home page, when the url is /', function(done) {
    request(app.processRequest.bind(app))
      .get('/')
      .expect(200, done)
      .expect('Content-Type', 'text/html');
  });
});

describe('GET gif', function() {
  it('should give gif of the home page', function(done) {
    request(app.processRequest.bind(app))
      .get('/images/animated-flower-image-0021.gif')
      .expect(200, done)
      .expect('Content-Type', 'image/gif');
  });
});

describe('GET /style page', function() {
  it('should load style page ', function(done) {
    request(app.processRequest.bind(app))
      .get('/style.css')
      .expect(200, done)
      .expect('Content-Type', 'text/css');
  });
});

describe('GET /js/flowerCatalog page', function() {
  it('should load script page', function(done) {
    request(app.processRequest.bind(app))
      .get('/js/flowerCatalog.js')
      .expect(200, done)
      .expect('Content-Type', 'application/javascript')
      .expect(/hideForOneSec/);
  });
});

describe('GET /flowerImage ', function() {
  it('should load flower image', function(done) {
    request(app.processRequest.bind(app))
      .get('/images/freshorigins.jpg')
      .expect(200, done)
      .expect('Content-Type', 'image/jpg');
  });
});

describe('GET Not found', function() {
  it('should give not found page', function(done) {
    request(app.processRequest.bind(app))
      .get('/notExistingPage')
      .expect(404, done)
      .expect('Content-Type', 'text/html')
      .expect(/404 File not found/);
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

describe('GET Abeliophyllum.html File', function() {
  it('should give Abeliophyllum page', function(done) {
    request(app.processRequest.bind(app))
      .get('/Abeliophyllum.html')
      .expect(200, done)
      .expect('Content-Type', 'text/html')
      .expect(/Abeliophyllum/);
  });
});

describe('GET Ageratum.html File', function() {
  it('should give Ageratum page', function(done) {
    request(app.processRequest.bind(app))
      .get('/Ageratum.html')
      .expect(200, done)
      .expect('Content-Type', 'text/html')
      .expect(/Ageratum/);
  });
});
