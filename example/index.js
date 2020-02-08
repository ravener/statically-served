
// NOTE: when running the example directly from the repo files
// this line is used to load the source code directly
// for your own projects after installing
// import it like `require("statically-served")` 
const { Server } = require("..");
const path = require("path");

new Server({
  logging: true,
  path: path.join(__dirname, "static"),
  index: "index.html"
}).listen(3000);
