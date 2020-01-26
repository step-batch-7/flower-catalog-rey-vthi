const fs = require('fs');
const Response = require('./lib/response');
const CONTENT_TYPES = require('./lib/mime');

const STATIC_FOLDER = `${__dirname}/public`;

const serveStaticFile = req => {
  const path = `${STATIC_FOLDER}${req.url}`;
  const stat = fs.existsSync(path) && fs.statSync(path);
  if (!stat || !stat.isFile()) return new Response();
  const [, extension] = path.match(/.*\.(.*)$/) || [];
  const contentType = CONTENT_TYPES[extension];
  const content = fs.readFileSync(path);
  const response = getResponse(content, contentType, 200);
  return response;
};

const getResponse = function(content, type, statusCode) {
  const response = new Response();
  response.setHeader('Content-Type', type);
  response.setHeader('Content-Length', content.length);
  response.statusCode = statusCode;
  response.body = content;
  return response;
};

const serveGuestBookPage = function() {
  const commentDetails = getExistingComments();
  const comments = commentDetails.reduce(addComment, '');
  const guestBookPage = loadTemplate('./public/GuestBook.html', {comments});
  const response = getResponse(guestBookPage, CONTENT_TYPES.html, 200);
  return response;
};

const addComment = function(allComments, newComment) {
  const newCommentHtml = `<div class="comment">
                            <tr>
                               <td class="bold">${newComment.name}</td>
                               <td class="small-text">Submitted on: ${newComment.date}</br>
                               ${newComment.comment}</td>
                            </tr>
                          </div>`;
  return allComments + newCommentHtml;
};

const getExistingComments = function() {
  if (!fs.existsSync('./public/commentsLog.json')) {
    return [];
  }
  return JSON.parse(fs.readFileSync('./public/commentsLog.json', 'utf8'));
};

const loadTemplate = function(templateFileName, propertyBag) {
  const replaceKeyWithValue = (content, key) => {
    const pattern = new RegExp(`__${key}__`, 'g');
    return content.replace(pattern, propertyBag[key]);
  };

  const content = fs.readFileSync(templateFileName, 'utf8');
  const keys = Object.keys(propertyBag);
  return keys.reduce(replaceKeyWithValue, content);
};

const updateCommentsLog = req => {
  const date = new Date().toLocaleString();
  let comments = getExistingComments();

  const newCommentDetail = {...req.body, date};
  comments.unshift(newCommentDetail);

  comments = JSON.stringify(comments);
  fs.writeFileSync('./public/commentsLog.json', comments, 'utf8');
};

const serveGuestPage = req => {
  if (req.body.name && req.body.comment) updateCommentsLog(req);
  return serveGuestBookPage(req);
};

const findHandler = req => {
  console.log(req.url);
  if (req.method === 'POST' && req.url === '/updateComment')
    return serveGuestPage;

  if (req.method === 'GET' && req.url === '/GuestBook.html')
    return serveGuestPage;

  if (req.method === 'GET' && req.url === '/') {
    req.url = '/home.html';
    return serveStaticFile;
  }

  if (req.method === 'GET') return serveStaticFile;
  return () => new Response();
};

const processRequest = req => {
  const handler = findHandler(req);
  return handler(req);
};

module.exports = {processRequest};
