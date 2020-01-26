const fs = require('fs');

const loadTemplate = function(templateFileName, propertyBag) {
  const replaceKeyWithValue = (content, key) => {
    const pattern = new RegExp(`__${key}__`, 'g');
    return content.replace(pattern, propertyBag[key]);
  };

  const content = fs.readFileSync(templateFileName, 'utf8');
  const keys = Object.keys(propertyBag);
  return keys.reduce(replaceKeyWithValue, content);
};

module.exports = loadTemplate;
