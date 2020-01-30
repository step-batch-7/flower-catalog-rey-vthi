const fs = require('fs');
const url = require('url');
const {App} = require('./app.js');
const loadTemplate = require('./lib/loadTemplate');
const CONTENT_TYPES = require('./lib/mime');

const STATIC_FOLDER = `${__dirname}/public`;

const statusCode = {
  FILE_NOT_FOUND: 404,
  OK: 200,
  NOT_ALLOWED: 400,
  REDIRECT: 301
};

const getFormattedText = function(text) {
  const replaceSpecialChar = function(txt) {
    const text = txt.replace(/\+/g, ' ');
    return text.replace(/%0D%0A/g, '\n');
  };
  const [name, comment] = text.map(replaceSpecialChar);
  return [name, comment];
};

const getFormattedHtml = function(text) {
  const replaceSpaceToHtmlTag = function(text) {
    const txt = text.replace(/ /g, '&nbsp;');
    return txt.replace(/\n/g, '<br>');
  };
  const [name, comment] = text.map(replaceSpaceToHtmlTag);
  return [name, comment];
};

const addComment = function(allComments, newLog) {
  const [name, comment] = getFormattedHtml([newLog.name, newLog.comment]);
  const newCommentHtml = `
  <div class="comment">
    <tr>
      <td class="bold">${name}</td>
      <td class="small-text">
      <span>Submitted on:<span> ${newLog.date}</br>${comment}</td>
    </tr>
  </div>`;
  return allComments + newCommentHtml;
};

const getExistingComments = function() {
  const commentsFilePath = './public/commentsLog.json';
  if (!fs.existsSync(commentsFilePath)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(commentsFilePath, 'utf8'));
};

const updateCommentsLog = function(newName, newComment) {
  const date = new Date();
  let comments = getExistingComments();
  const [name, comment] = getFormattedText([newName, newComment]);
  const newCommentDetail = {date, name, comment};
  comments.unshift(newCommentDetail);
  comments = JSON.stringify(comments);
  fs.writeFileSync('./public/commentsLog.json', comments, 'utf8');
};

const notFound = function(req, res) {
  const errorMsg = '404 File not found';
  sendResponse(res, errorMsg, 'text/html', statusCode.FILE_NOT_FOUND);
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
  const contentType = CONTENT_TYPES[extension];
  const content = fs.readFileSync(path);
  sendResponse(res, content, contentType, statusCode.OK);
};

const sendResponse = function(res, content, contentType, statusCode) {
  res.setHeader('Content-Type', contentType);
  res.writeHead(statusCode);
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
  sendResponse(res, guestBook, CONTENT_TYPES.html, statusCode.OK);
};

const redirectTo = function(res, path) {
  res.setHeader('location', path);
  res.writeHead(statusCode.REDIRECT);
  res.end();
};

const serveGuestPage = function(req, res, next) {
  serveGuestBookPage(req, res, next);
};

const saveAndRedirect = function(req, res) {
  const {name, comment} = url.parse(`?${req.body}`, true).query;
  updateCommentsLog(name, comment);
  redirectTo(res, 'GuestBook.html');
};

const methodNotAllowed = function(req, res) {
  res.writeHead(statusCode.NOT_ALLOWED, 'Method Not Allowed');
  res.end();
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
app.get('/GuestBook.html', serveGuestPage);
app.get('', serveStaticFile);
app.post('/saveComment.html', saveAndRedirect);
app.get('', notFound);
app.post('', notFound);
app.use(methodNotAllowed);

module.exports = {app};
