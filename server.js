

var env = {
  ORIGIN: process.env['ORIGIN']
, PORT: process.env['PORT']
}

var httpProxy = require('http-proxy');
var http = require('http');
var url = require('url');

function createServer(opts) {
  var parsed = url.parse(opts.ORIGIN);
  var target = {
    host: parsed.host
  , port: parsed.port || 80
  };
  console.log(parsed);
  var proxy = httpProxy.createProxyServer({headers: { host: target.host }, ws: true });

  proxy.on('proxyReq', function (proxyReq, req, res, options) {
    proxyReq.setHeader('X-Custom-Hdr', 'foobar');
    // proxyReq.setHeader('Host', target.host);
    console.log('proxyReq', options);
  });
  proxy.on('proxyRes', function (proxyRes, req, res) {
    console.log('proxyRes');
  });

  var server = http.createServer(function (req, res) {
    // 
    // Put your custom server logic here 
    // 
    proxy.web(req, res, {
      target: {
        host: target.host
      , port: target.port
      }
    });
  });

  proxy.on('open', function (proxySocket) {
    console.log("OPEN");
  });
   

  proxy.on('close', function (req, socket, head) {
    console.log("CLOSE");
  });
   
  server.on('upgrade', function (req, socket, head) {
    // 
    // Put your custom server logic here 
    // 
    /*
    server.proxy.ws(req, socket, head, {
      target: {
        host: target.host
      , port: target.port
      }
    });
    */
    console.log('upgrading websocket');
  });
  return server;
}


if (!module.parent) {
  
  var server = createServer(env);
  server.listen(env.PORT);
}

