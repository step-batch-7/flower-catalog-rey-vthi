const fs = require('fs');
const querystring = require('querystring');
const {App} = require('./app.js');
const Comment = require('./Comment.js');
const loadTemplate = require('./loadTemplate');
const CONTENT_TYPES = require('./mime');
const statusCode = require('./statusCode');
const CommentLog = require('./allComments.js');

const STATIC_FOLDER = `${__dirname}/../public`;
const COMMENT_STORE = `${__dirname}/../data/commentsLog.json`;

const isFileNotExist = function(path) {
  const stat = fs.existsSync(path) && fs.statSync(path);
  return !stat || !stat.isFile();
};

const getExistingComments = function() {
  if (isFileNotExist(COMMENT_STORE)) {
    return [];
  }
  const comments = JSON.parse(fs.readFileSync(COMMENT_STORE));
  return comments;
};

const allComments = CommentLog.load(getExistingComments());

const getContentType = function(path) {
  const [, extension] = path.match(/.*\.(.*)$/);
  return CONTENT_TYPES[extension];
};

const serveStaticFile = function(req, res, next) {
  let path = STATIC_FOLDER;
  path += req.url === '/' ? '/home.html' : `${req.url}`;
  if (isFileNotExist(path)) {
    return next();
  }
  const contentType = getContentType(path);
  const body = fs.readFileSync(path);
  res.setHeader('Content-Type', contentType);
  res.writeHead(statusCode.OK);
  res.end(body);
};

const updateCommentsLog = function(name, comment) {
  const date = new Date();
  const newComment = new Comment(name, comment, date);
  allComments.addComment(newComment);
  fs.writeFileSync(COMMENT_STORE, allComments.toJSON());
};

const notFound = function(req, res) {
  const errorMsg = '404 File not found';
  res.setHeader('Content-Type', 'text/html');
  res.writeHead(statusCode.FILE_NOT_FOUND);
  res.end(errorMsg);
};

const serveGuestBookPage = function(req, res, next) {
  const guestBookPath = `./public/templates${req.url}`;
  const tableHtml = allComments.toHTML();
  if (isFileNotExist(guestBookPath)) {
    return next();
  }
  let body = fs.readFileSync(guestBookPath, 'utf8');
  body = loadTemplate(guestBookPath, {
    comment: tableHtml
  });
  res.setHeader('Content-Type', CONTENT_TYPES.html);
  res.writeHead(statusCode.OK);
  res.end(body);
};

const saveAndRedirect = function(req, res) {
  const {name, comment} = querystring.parse(req.body);
  updateCommentsLog(name, comment);
  res.setHeader('location', 'GuestBook.html');
  res.writeHead(statusCode.REDIRECT);
  res.end();
};

const methodNotAllowed = function(req, res) {
  res.writeHead(statusCode.NOT_ALLOWED, 'Method Not Allowed');
  res.end('Method Not Allowed');
};

const readBody = function(req, res, next) {
  let data = '';
  req.on('data', chunk => {
    data += chunk;
  });
  req.on('end', () => {
    req.body = data;
    next();
  });
};

const app = new App();

app.use(readBody);
app.get('/GuestBook.html', serveGuestBookPage);
app.get('', serveStaticFile);
app.post('/saveComment.html', saveAndRedirect);
app.get('', notFound);
app.post('', notFound);
app.use(methodNotAllowed);

module.exports = {app};
