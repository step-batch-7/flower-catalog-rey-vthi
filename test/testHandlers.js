const request = require('supertest');
const sinon = require('sinon');
const fs = require('fs');
const {app} = require('../lib/handler.js');

describe('GET method', () => {
  it('should give the home page when the url is /', done => {
    request(app.processRequest.bind(app))
      .get('/')
      .expect('Content-Type', 'text/html')
      .expect(200, done)
      .expect(/Flower Catalog/);
  });

  it('should give /flowerCatalog.js file', done => {
    request(app.processRequest.bind(app))
      .get('/js/flowerCatalog.js')
      .expect('Content-Type', 'application/javascript')
      .expect(/const hideForOneSec/)
      .expect(200, done);
  });

  it('should give /flowerCatalog.css', done => {
    request(app.processRequest.bind(app))
      .get('/style.css')
      .expect('Content-Type', 'text/css')
      .expect(200, done);
  });

  it('should give the image file when the request is for an image file', done => {
    request(app.processRequest.bind(app))
      .get('/images/freshorigins.jpg')
      .expect('Content-Type', 'image/jpg')
      .expect(200, done);
  });

  it('should give the pdf file when the request is for pdf file', done => {
    request(app.processRequest.bind(app))
      .get('/pdf/Ageratum.pdf')
      .expect('Content-Type', 'application/pdf')
      .expect(200, done);
  });

  it('should give 404 for not existing file', done => {
    request(app.processRequest.bind(app))
      .get('/badPage')
      .expect('Content-Type', 'text/html')
      .expect(/404 File not found/)
      .expect(404, done);
  });

  it('should give guestBook page when the url is /guestBook.html', done => {
    request(app.processRequest.bind(app))
      .get('/GuestBook.html')
      .expect('Content-Type', 'text/html')
      .expect(/Leave a Comment/)
      .expect(200, done);
  });

  it('should give guestBook for /guestBook.html', done => {
    request(app.processRequest.bind(app))
      .get('/GuestBook.htmlhtml')
      .expect('Content-Type', 'text/html')
      .expect(/404 File not found/)
      .expect(404, done);
  });

  it('should give the gif for /animated-flower-image-0021.gif', done => {
    request(app.processRequest.bind(app))
      .get('/images/animated-flower-image-0021.gif')
      .expect('Content-Type', 'image/gif')
      .expect(200, done);
  });

  it('should give the homePage and should send data through request', done => {
    request(app.processRequest.bind(app))
      .get('/')
      .send('name=revathi&school=stAnthonys')
      .expect('Content-Type', 'text/html')
      .expect(200, done)
      .expect(/Flower Catalog/);
  });
});

describe('Not Allowed Method', () => {
  it('should give 405 status code when the method is not allowed', done => {
    request(app.processRequest.bind(app))
      .put('/GuestBook.html')
      .expect(/Method Not Allowed/)
      .expect(405, done);
  });
});

describe('POST method', () => {
  before(() => sinon.replace(fs, 'writeFileSync', () => {}));

  it('should be able to handle post request', done => {
    request(app.processRequest.bind(app))
      .post('/saveComment.html')
      .send('name=revathi&comment=nice')
      .expect('Location', 'GuestBook.html')
      .expect(302, done);
  });

  after(() => sinon.restore());
});
