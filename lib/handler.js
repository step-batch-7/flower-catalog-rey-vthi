const fs = require('fs');
const querystring = require('querystring');
const {App} = require('./app.js');
const Comment = require('./Comment.js');
const loadTemplate = require('./loadTemplate');
const CONTENT_TYPES = require('./mime');
const statusCode = require('./statusCode');
const STATIC_FOLDER = `${__dirname}/../public`;

const addComment = function(allComments, newLog) {
  const comment = new Comment(newLog.name, newLog.comment, newLog.date);
  const newCommentHtml = comment.toHTML();
  return allComments + newCommentHtml;
};

const getExistingComments = function() {
  const commentsFilePath = `${__dirname}/../data/commentsLog.json`;
  if (!fs.existsSync(commentsFilePath)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(commentsFilePath, 'utf8'));
};

const updateCommentsLog = function(name, comment) {
  const date = new Date();
  let comments = getExistingComments();
  comments.unshift({date, name, comment});
  comments = JSON.stringify(comments);
  fs.writeFileSync(`${__dirname}/../data/commentsLog.json`, comments, 'utf8');
};

const notFound = function(req, res) {
  const errorMsg = '404 File not found';
  res.setHeader('Content-Type', 'text/html');
  res.writeHead(statusCode.FILE_NOT_FOUND);
  res.end(errorMsg);
};

const isFileNotExist = function(path) {
  const stat = fs.existsSync(path) && fs.statSync(path);
  return !stat || !stat.isFile();
};

const serveStaticFile = function(req, res, next) {
  let path = STATIC_FOLDER;
  path += req.url === '/' ? '/home.html' : `${req.url}`;
  if (isFileNotExist(path)) {
    return next();
  }
  const [, extension] = path.match(/.*\.(.*)$/) || [];
  const content = fs.readFileSync(path);
  res.setHeader('Content-Type', CONTENT_TYPES[extension]);
  res.writeHead(statusCode.OK);
  res.end(content);
};

const serveGuestBookPage = function(req, res, next) {
  const guestBookPath = `./public/templates${req.url}`;
  if (isFileNotExist(guestBookPath)) {
    return next();
  }
  const commentDetails = getExistingComments();
  const comments = commentDetails.reduce(addComment, '');
  const guestBook = loadTemplate(guestBookPath, {
    comments
  });
  res.setHeader('Content-Type', CONTENT_TYPES.html);
  res.writeHead(statusCode.OK);
  res.end(guestBook);
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
