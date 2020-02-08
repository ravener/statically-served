const http = require("http");
const fs = require("fs");
const url = require("url");
const path = require("path");
const mime = require("./mime.js");

const readFile = fs.promises
  ? fs.promises.readFile // Node.js >= 10
  : require("util").promisify(fs.readFile); // Node.js < 10

class StaticServer {
  constructor(options = {}) {
    this.options = Object.assign({
      logging: true,
      path: process.cwd(),
      disableCache: false
    }, options);

    // Null until actually listen() is called.
    this.server = null;
    this.middlewares = [];
  }

  use(...fns) {
    fns.forEach((fn) => {
      if(typeof fn !== "function")
        throw new TypeError(`use(): Expected a function but got '${typeof fn}'`);
      return this.middlewares.push(fn);
    });
    return this;
  }

  _onListening() {
    if(!this.options.logging) return;

    const address = this.server.address();

    const text = typeof this.options.listeningMessage === "function"
      ? this.options.listeningMessage(address)
      : typeof this.options.listeningMessage === "string"
        ? this.options.listeningMessage
        : `Static Server Listening on port ${address.port}`;

    // eslint-disable-next-line no-console
    if(typeof text === "string") console.log(text);
  }

  logResponse(req) {
    const { logFormat, logging } = this.options;
    if(!logging) return;
    const text = logFormat ? logFormat(req) : `${req.method} -> ${req.path}`;
    // eslint-disable-next-line no-console
    if(text) console.log(text);
  }

  cors(res) {
    const { cors, corsMethods, corsHeaders } = this.options;

    if(cors)
      res.setHeader("Access-Control-Allow-Origin", Array.isArray(cors)
        ? cors.join(", ")
        : cors);

    if(corsMethods)
      res.setHeader("Access-Control-Allow-Methods", Array.isArray(corsMethods)
        ? corsMethods.join(", ")
        : corsMethods);

    if(corsHeaders)
      res.setHeader("Access-Control-Allow-Headers", Array.isArray(corsHeaders)
        ? corsHeaders.join(", ")
        : corsHeaders);
  }

  notFound(req, res) {
    const { notFoundHandler, logging } = this.options;
    if(!logging) return;
    const headers = { "Content-Type": "text/html; charset=UTF-8" };

    if(typeof notFoundHandler === "string") {
      res.writeHead(404, headers);
      return res.end(notFoundHandler);
    } else if(typeof notFoundHandler === "function") {
      const results = notFoundHandler(req, res);
      if(typeof results === "string") {
        res.writeHead(404, headers);
        return res.end(results);
      }
    } else {
      res.writeHead(404, headers);
      return res.end("Not Found");
    }
  }

  middleware() {
    return this.handler.bind(this);
  }

  errorHandler(err, req, res) {
    const { errorHandler } = this.options;
    const headers = { "Content-Type": "text/html; charset=UTF-8" };

    if(typeof errorHandler === "string") {
      res.writeHead(500, headers);
      return res.end(errorHandler);
    } else if(typeof errorHandler === "function") {
      const results = errorHandler(err, req, res);
      if(typeof results === "string") {
        res.writeHead(500, headers);
        return res.end(results);
      }
    } else {
      res.writeHead(500, headers);
      return res.end("Internal Server Error");
    }
  }

  async handler(req, res, next) {
    const { prefix = "" } = this.options;
    if(!req.url.startsWith(prefix))
      return next ? next() : this.notFound(req, res);
    const { query, pathname } = url.parse(req.url);
    req.query = query;
    req.path = pathname;
    const filePath = pathname !== "/" || !this.options.index
      ? path.join(this.options.path, ...pathname.slice(prefix.length).split("/"))
      : path.join(this.options.path, this.options.index);
    req.filePath = filePath;
    req.filename = path.basename(filePath);

    if(this.options.disableCache)
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

    // Set CORS
    this.cors(res);

    try {
      const file = await readFile(filePath);
      const ext = path.extname(filePath);

      if(ext) {
        const type = mime(ext);
        if(type) res.setHeader("Content-Type", type);
      }

      await Promise.all(this.middlewares.map((m) => m(req, res)));
      res.end(file);
      this.logResponse(req);
    } catch(err) {
      if(err.code === "ENOENT" || err.code === "EISDIR")
        return next ? next() : this.notFound(req, res);
      return this.errorHandler(err, req, res);
    }
  }

  listen(...args) {
    const server = this.server = http.createServer(this.handler.bind(this));
    server.once("listening", this._onListening.bind(this));
    return server.listen(...args);
  }
}

module.exports = StaticServer;
