const fs = require('fs');
const url = require('url');
const loadTemplate = require('./lib/loadTemplate');
const CONTENT_TYPES = require('./lib/mime');

const STATIC_FOLDER = `${__dirname}/public`;

const getFormattedText = function(text) {
  let txt = text.replace(/\+/g, ' ');
  txt = txt.replace(/%0D%0A/g, '\n');
  return txt;
};

const getFormattedHtml = function(text) {
  let txt = text.replace(/ /g, '&nbsp;');
  txt = txt.replace(/\n/g, '<br>');
  return txt;
};

const addComment = function(allComments, newComment) {
  const comment = getFormattedHtml(newComment.comment);
  const name = getFormattedHtml(newComment.name);

  const newCommentHtml = `
<div class="comment">
  <tr>
    <td class="bold">${name}</td>
    <td class="small-text">
    <span>Submitted on:<span> ${newComment.date}</br>${comment}</td>
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
  const comment = getFormattedText(newComment);
  const name = getFormattedText(newName);
  const newCommentDetail = {date, name, comment};
  comments.unshift(newCommentDetail);
  comments = JSON.stringify(comments);
  fs.writeFileSync('./public/commentsLog.json', comments, 'utf8');
};

const serveStaticFile = function(req, res) {
  const path = `${STATIC_FOLDER}${req.url}`;
  const stat = fs.existsSync(path) && fs.statSync(path);
  if (!stat || !stat.isFile()) return new Response();
  const [, extension] = path.match(/.*\.(.*)$/) || [];
  const contentType = CONTENT_TYPES[extension];
  const content = fs.readFileSync(path);
  sendResponse(res, content, contentType, 200);
};
const sendResponse = function(res, content, contentType, statusCode) {
  res.setHeader('Content-Type', contentType);
  res.writeHead(statusCode);
  res.end(content);
};

const serveGuestBookPage = function(res) {
  const commentDetails = getExistingComments();
  const comments = commentDetails.reduce(addComment, '');
  const guestBookPage = loadTemplate('./public/GuestBook.html', {comments});
  sendResponse(res, guestBookPage, CONTENT_TYPES.html, 200);
};

const extract = function(text) {
  return ({name, comment} = url.parse(`?${text}`, true).query);
};

const serveGuestPage = function(req, res) {
  let userComment = '';
  req.on('data', chunk => (userComment += chunk));
  req.on('end', () => {
    if (req.method === 'POST') {
      const {name, comment} = extract(userComment);
      updateCommentsLog(name, comment);
    }
    serveGuestBookPage(res);
  });
};

const findHandler = req => {
  if (req.method === 'GET' && req.url === '/') {
    req.url = '/home.html';
    return serveStaticFile;
  }
  if (req.url === '/GuestBook.html') return serveGuestPage;
  if (req.method === 'GET') return serveStaticFile;
  return () => new Response();
};

const processRequest = function(req, res) {
  const handler = findHandler(req);
  return handler(req, res);
};

module.exports = {processRequest};
