// Add optional support for using the `mime` npm package for more accurate lookups
let mime = null;
try {
  // eslint-disable-next-line global-require
  mime = require("mime");
  // eslint-disable-next-line no-empty
} catch(_) {}

module.exports = function lookup(ext) {
  ext = ext.replace(/^\./, "");
  if(mime) return mime.getType(ext);
  // Basic common mime types.
  // Enough to send simple types such as images/json/favicon.ico/robots.txt/html
  switch(ext) {
    case "json":
      return "application/json";
    case "png":
      return "image/png";
    case "txt":
      return "text/plain";
    case "html":
    case "htm":
      return "text/html";
    case "gif":
      return "image/gif";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "ico":
      return "image/x-icon";
    case "js":
      return "application/javascript";
    case "css":
      return "text/css";
    case "xml":
      return "application/xml";
    case "md":
      return "text/markdown";
  }
};
