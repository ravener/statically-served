# Statically Served
Serve Static Files using Node.js

## Why Statically Served?
- Lightweight (no dependencies)
- Fast (uses plain http)
- Customizable (Easily customize all the core operations.)
- Easy, takes little setup to get working.
- Middleware usable, use it as a middleware in your favourite frameworks such as express!

## Install
```sh
$ npm install statically-served
# or if using yarn
$ yarn add statically-served
```

## Usage
```js
const { Server } = require("statically-served");
const path = require("path");

const server = new Server({
  // Root path to serve files from, defaults to process.cwd();
  path: path.join(__dirname, "assets"),
  // Simple logger
  logging: true,
  // Format log messages, add terminal coloring etc here.
  // req is a node http.IncomingMessage but with addition to
  // req.path a string for pathname without query etc
  // req.query an object for the querystring.
  // req.filePath a string for the file it tries to access.
  // req.filename a string for the filename, equal to path.basename(req.filePath);
  logFormat: (req) => `${req.method} -> ${req.path}`,
  // Base path to serve the files from.
  // /assets means files are accessed from domain.com/assets/filepath
  // Useful if re-using a domain in use, etc.
  prefix: "/assets",
  // 404 handler if file not found, can be any of
  // - string: the string is simply sent to client as html.
  // - function returning string: the returned output is sent to client as html.
  // - function ending the response: Nothing is done here it is under your control.
  // Functions take req and res which is a node IncomingMessage and ServerResponse.
  // The status code is automatically set to 404 for strings and string returns
  // for function you have the ability to set it to anything yourself.
  notFoundHandler: (req, res) => res.end("Not Found"),
  // Error handler, triggered on errors when reading files
  // Note that ENOENT/EISDIR is already handled and is redirected to notFoundHandler
  // How this option works is same as the notFoundHandler with what you can pass.
  errorHandler: (err, req, res) => res.end("Internal Server Error"), 
  // Disable browser cache using Cache-Control header, useful on development
  disableCache: false,
  // Set Host(s) for Cross-Origin Resource Sharing.
  // using Access-Control-Allow-Origin header.
  cors: "*",
  // Sets cors methods using Access-Control-Allow-Methods
  corsMethods: ["GET"],
  // Sets cors headers using Access-Control-Allow-Headers
  corsHeaders: ["User-Agent", "Content-Type"]
  // All cors options can be a plain text or an array that is joined by a comma.

  // The message that is logged when the server is ready and listening.
  // Can also be just a string if you don't need the address info.
  // Note: this is useless if logging option is off.
  // The argument is what server.address() returns which essentially like:
  // { address: '::', family: 'IPv6', port: 3000 }
  listeningMessage: ({ port }) => `Listening on port ${port}!`,
  // Index file to send if path is just a /
  index: "index.html"
});

// Add middleware to run before the static serving part.
// Unlike express you are not allowed to end the request and have a next option
// All middlewares are ran and they can do asynchronous work with promises
// Do also note that there is no order here the middlewares could be ran at any order
// The idea is to keep it basic and use it to pre-process some things such as:
// Adding extra headers, asynchronous logging, etc.
// Middlewares are also chainable
// Also note that middlewares are only ran on valid requests which means it doesn't
// trigger on 404 responses.
server.use(async(req, res) => {
  console.log("Hello, World! Got a request!");
});


// Middlewares can't have paths but you can conditionally handle it inside it
// - using req.path for path matches
// - using req.filename for file matches.
server.use(async(req, res) => {
  if(req.filename !== "script.js") return;
  // do some pre-processing before serving script.js
});

server.listen(3000, (err) => {
  if(err) throw err;
  // Since logging is on we don't need to print a message since it does it for us.
});
```
As middleware
```js
const { Server } = require("statically-served");
const express = require("express");
const app = express();
const staticServer = new Server({ /* all the same options here */ });

// This example is with express but it works for any framework that uses the
// signature (req, res, next) for middlewares.
// Middleware API is the same but calls next() on notFound
// So passing a notFoundHandler is useless.
app.use(staticServer.middleware());

app.listen(3000);
```
Misc
```js
const { version, mime } = require("statically-served");
console.log(version); // The Version of the package.

// The mime lookup function used, see below.
console.log(mime(".json")); // => "application/json"
```

## Mime Types
You can optionally install the package `mime` to get mime type supports
```sh
$ npm install mime
# or yarn
$ yarn add mime
```
If it doesn't exist don't worry, we map very basic mime types to keep you going for simple stuff, the types we support are:
- `.txt` Plain text files, i.e for `robots.txt`
- `.html` and `.htm` files for html.
- `.js` for scripts
- `.json` for json encoded data.
- `.png`/`.gif`/`.jpeg`/`.jpg` for basic image types.
- `.ico` for `favicon.ico` etc.
- `.md` for markdown files.
- `.xml` for xml documents.
- `.css` for stylesheets.

If you think an additional extension is needed to be there, open an issue or a pull request.

## See it in action!
See the [example](https://github.com/pollen5/statically-served/blob/master/example) for an example usage.

## License
MIT
