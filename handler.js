const fs = require('fs');
const url = require('url');
const {App} = require('./app.js');
const loadTemplate = require('./lib/loadTemplate');
const CONTENT_TYPES = require('./lib/mime');
const statusCode = require('./lib/statusCode');
const STATIC_FOLDER = `${__dirname}/public`;

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
  const commentsFilePath = './public/../data/commentsLog.json';
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
  fs.writeFileSync('./public/../data/commentsLog.json', comments, 'utf8');
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
  const {name, comment} = url.parse(`?${req.body}`, true).query;
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
