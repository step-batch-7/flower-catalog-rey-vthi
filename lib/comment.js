const getHtml = function(txt) {
  return txt.replace(/ /g, '&nbsp;').replace(/\r\n/g, '<br>');
};

class Comment {
  constructor(name, comment, date) {
    this.name = name;
    this.comment = comment;
    this.date = date;
  }
  toHTML() {
    return `<tr>
      <td class="bold">${getHtml(this.name)}</td>
      <td class="small-text">
      Submitted on:${this.date.toLocaleString()}
      </br>${getHtml(this.comment)}</td>
    </tr>`;
  }
}

module.exports = Comment;
