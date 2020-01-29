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

const notFound = function(req, res) {
  sendResponse(res, '404 File not found', 'text/html', 404);
};

const serveStaticFile = function(req, res, next) {
  let path = STATIC_FOLDER;
  path += req.url == '/' ? `/home.html` : `${req.url}`;
  const stat = fs.existsSync(path) && fs.statSync(path);
  if (!stat || !stat.isFile()) return next();
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

const serveGuestPage = function(req, res) {
  if (req.body) {
    const {name, comment} = url.parse(`?${req.body}`, true).query;
    updateCommentsLog(name, comment);
  }
  serveGuestBookPage(res);
};

const methodNotAllowed = function(req, res) {
  res.writeHead(400, 'Method Not Allowed');
  res.end();
};

const readBody = function(req, res, next) {
  let data = '';
  req.on('data', chunk => (data += chunk));
  req.on('end', () => {
    req.body = data;
    next();
  });
};

class App {
  constructor() {
    this.routes = [];
  }
  get(path, handler) {
    this.routes.push({path, handler, method: 'GET'});
  }
  post(path, handler) {
    this.routes.push({path, handler, method: 'POST'});
  }
  use(middleware) {
    this.routes.push({handler: middleware});
  }
  serve(req, res) {
    console.log('Request: ', req.url, req.method);
    const matchingHandlers = this.routes.filter(route =>
      matchRoute(route, req)
    );
    const next = function() {
      if (matchingHandlers.length === 0) return;
      const router = matchingHandlers.shift();
      router.handler(req, res, next);
    };
    next();
  }
}

const matchRoute = function(route, req) {
  if (route.method)
    return req.method == route.method && req.url.match(route.path);
  return true;
};

const app = new App();

app.use(readBody);
app.get('/GuestBook.html', serveGuestPage);
app.get('', serveStaticFile);
app.post('/GuestBook.html', serveGuestPage);
app.get('', notFound);
app.post('', notFound);
app.use(methodNotAllowed);

module.exports = {app};
