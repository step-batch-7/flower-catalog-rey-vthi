const fs = require('fs');
const Response = require('./lib/response');
const loadTemplate = require('./lib/loadTemplate');

const CONTENT_TYPES = require('./lib/mime');

const STATIC_FOLDER = `${__dirname}/public`;

const getResponse = function(content, type, statusCode) {
  const response = new Response();
  response.setHeader('Content-Type', type);
  response.setHeader('Content-Length', content.length);
  response.statusCode = statusCode;
  response.body = content;
  return response;
};

const addComment = function(allComments, newComment) {
  const newCommentHtml = `<div class="comment">
                            <tr>
                               <td class="bold">${newComment.name}</td>
                               <td class="small-text">
                               <span>Submitted on:<span> ${newComment.date}</br>
                               ${newComment.comment}</td>
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

const getFormattedText = function(text) {
  let txt = text.replace(/\+/g, ' ');
  txt = txt.replace(/%0D%0A/g, '<br>');
  return txt;
};

const updateCommentsLog = req => {
  const date = new Date().toLocaleString();
  let comments = getExistingComments();

  const comment = getFormattedText(req.body.comment);
  const name = getFormattedText(req.body.name);
  const newCommentDetail = {date, comment, name};
  comments.unshift(newCommentDetail);

  comments = JSON.stringify(comments);
  fs.writeFileSync('./public/commentsLog.json', comments, 'utf8');
};

const serveStaticFile = req => {
  const path = `${STATIC_FOLDER}${req.url}`;
  const stat = fs.existsSync(path) && fs.statSync(path);
  if (!stat || !stat.isFile()) return new Response();
  const [, extension] = path.match(/.*\.(.*)$/) || [];
  const contentType = CONTENT_TYPES[extension];
  const content = fs.readFileSync(path);
  return getResponse(content, contentType, 200);
};

const serveGuestBookPage = function() {
  const commentDetails = getExistingComments();
  const comments = commentDetails.reduce(addComment, '');
  const guestBookPage = loadTemplate('./public/GuestBook.html', {comments});
  return getResponse(guestBookPage, CONTENT_TYPES.html, 200);
};

const serveGuestPage = req => {
  if (req.body.name && req.body.comment) updateCommentsLog(req);
  return serveGuestBookPage(req);
};

const findHandler = req => {
  if (req.method === 'GET' && req.url === '/') {
    req.url = '/home.html';
    return serveStaticFile;
  }
  if (req.url === '/updateComment' || req.url === '/GuestBook.html')
    return serveGuestPage;

  if (req.method === 'GET') return serveStaticFile;
  return () => new Response();
};

const processRequest = req => {
  const handler = findHandler(req);
  return handler(req);
};

module.exports = {processRequest};
