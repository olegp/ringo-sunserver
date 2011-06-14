var Stream = require('io').Stream;
var ByteString = require('binary').ByteString;

function receive(exchange) {
  var uri = exchange.getRequestURI();
  var requestHeaders = exchange.getRequestHeaders();
  var headers = {};
  var iterator = requestHeaders.keySet().iterator();
  while (iterator.hasNext()) {
     var header = iterator.next();
     headers[header.toLowerCase()] = requestHeaders.get(header);
  }
  return {
    method: exchange.getRequestMethod(),
    scriptName: '',
    pathInfo: uri.getPath(),
    queryString: uri.getQuery(),
    host: uri.getHost(),
    port: uri.getPort(),
    scheme: uri.getScheme(),
    input: new Stream(exchange.getRequestBody()),
    headers: headers,
    jsgi: {
      version: [0, 3],
      errors: null, //TODO provide an output stream
      multithread: false,
      multiprocess: true,
      runOnce: false,
      async: false,
      cgi: false
    },
    env: {}
  };
}

function send(exchange, response) {
  var headers = response.headers;
  var responseHeaders = exchange.getResponseHeaders();
  if(headers) {
    for(var header in headers) {
      responseHeaders.set(header, headers[header]);
    }
  }
  exchange.sendResponseHeaders(response.status, 0);
  var body = response.body;
  if(body && typeof body.forEach == "function") {
    var output = exchange.getResponseBody();
    var writer = function(part) {
      if (!(part instanceof Binary)) {
          part = part.toByteString(); //TODO include charset param
      }
      output.write(part);
    };
    body.forEach(writer);
    if(typeof body.close == "function") {
      body.close(writer);
    }
  } else {
    throw new Error("Response body doesn't implement forEach: " + body);
  }
  output.close();
}

function create(app) {
  return new com.sun.net.httpserver.HttpHandler({
    handle: function(exchange) {      
      try {
        var request = receive(exchange);
        var response = app(request);
        send(exchange, response);
      } catch(e) {
        //TODO modify e.toString output to print only package/module names
        send(exchange, {status: 500, body: [e.toString()]} );
      }
    }
  });
}

exports.run = function(app, port) {
  var address = new java.net.InetSocketAddress(port);
  var server = com.sun.net.httpserver.HttpServer.create(address, 0);
  server.createContext("/", create(app));
  server.setExecutor(java.util.concurrent.Executors.newSingleThreadExecutor());
  server.start();
}

if (require.main == module) {
  var app = require(system.args[1]).app;
  exports.run(app, system.args[2] || 8080);
}

