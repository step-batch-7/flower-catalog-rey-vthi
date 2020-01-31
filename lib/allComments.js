const Comment = require('./comment');

class CommentLog {
  constructor() {
    this.comments = [];
  }

  addComment(comment) {
    this.comments.unshift(comment);
  }

  toHTML() {
    return this.comments.map(comment => comment.toHTML()).join('');
  }

  static load(commentList) {
    const comments = new CommentLog();
    commentList.forEach(comment => {
      const {name, date} = comment;
      comments.addComment(new Comment(name, comment.comment, new Date(date)));
    });
    return comments;
  }

  toJSON() {
    return JSON.stringify(this.comments);
  }
}

module.exports = CommentLog;
