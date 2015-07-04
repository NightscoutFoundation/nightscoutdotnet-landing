'use strict';

//dependencies
var config = require('./config'),
    express = require('express'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    mongoStore = require('connect-mongo')(session),
    http = require('http'),
    path = require('path'),
    passport = require('passport'),
    mongoose = require('mongoose'),
    helmet = require('helmet'),
    csrf = require('csurf');

//create express app
var app = express();

//keep reference to config
app.config = config;

//setup the web server
app.server = http.createServer(app);

//setup mongoose
app.db = mongoose.createConnection(config.mongodb.uri);
app.db.on('error', console.error.bind(console, 'mongoose connection error: '));
app.db.once('open', function () {
  //and... we have a data store
});

//config data models
require('./models')(app, mongoose);

//settings
app.disable('x-powered-by');
app.set('port', config.port);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//middleware
app.use(require('morgan')('dev'));
app.use(require('compression')());
app.use(require('method-override')());

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser(config.cryptoKey));
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: config.cryptoKey,
  // cookie: { path: '/', domain: '.diabetes.watch', maxAge: 1000 * 60 * 60 * 24 * 30 },
  cookie: { domain: config.cookie.domain },
  name: 'drywall.connect.sid',
  store: new mongoStore({ url: config.mongodb.uri })
}));
app.use(passport.initialize());
app.use(passport.session());


app.use(function (req, res, next) {
    console.log('URL', req.url);
  if (req.body)
    // console.log('body', req.body._csrf);
  if (req.query)
    console.log('query', req.query._csrf);
  // console.log('COOKIE', req.session.cookie);
  // console.log('COOKIE', req.cookies);
  console.log('headers', JSON.stringify(req.headers, 0, 2));
  next( );
});

function csrfValue (req) {
}
function defaultValue(req) {
  var value = (req.cookies && req.cookies._csrfTokenDryWall);
  console.log('get value for token', 'default', value);
  if (!value)
    value = value || (req.body && req.body._csrf)
    || (req.query && req.query._csrf)
    || (req.headers['csrf-token'])
    || (req.headers['xsrf-token'])
    || (req.headers['x-csrf-token'])
    || (req.headers['x-xsrf-token']);
  console.log('get value for token', 'final', value);
  return 
}

// helmet(app);

//response locals
app.use(function(req, res, next) {
  // console.log('req COOKIE', req.cookies);
  // console.log('req SESSION', req.session);
  res.locals.user = {};
  res.locals.user.defaultReturnUrl = req.user && req.user.defaultReturnUrl();
  res.locals.user.username = req.user && req.user.username;
  next();
});


//global locals
app.locals.projectName = app.config.projectName;
app.locals.copyrightYear = new Date().getFullYear();
app.locals.copyrightName = app.config.companyName;
app.locals.cacheBreaker = 'br34k-01';

// Use static resources normally...
app.use(require('serve-static')(path.join(__dirname, 'public')));

//setup passport
require('./passport')(app, passport);

// setup unprotected routes, all the local routes
var unprotected = express.Router( );
unprotected.locals = app.locals;
unprotected.config = app.config;
unprotected.use(bodyParser.json());
unprotected.use(bodyParser.urlencoded({ extended: true }));
// Use static resources normally...
unprotected.use(require('serve-static')(path.join(__dirname, 'public')));

//setup routes
// require('./routes')(app, passport);
require('./routes')(unprotected, passport);

// Set up proxy module.
var proxy = require('./proxy');
// Set up proxy module.
var myProxy = proxy(app.config.proxy);

// Some middleware to detect if proxy app should be used or if local
// auth/drywall should be used.
function maybeProxy (req, res, next) {
  // Debug.
  // If user is not authorized/unknown, use local logic to force signin.
  console.log('XX', 'authorized?', req.isAuthenticated( ));
  if (req.url.indexOf('/local') === 0) {
    // req.url = req.url.split(/\^\/local/g).pop( );
    return next( );
  }
  if (!req.user || !req.isAuthenticated( )) {
    console.log('SKIPPING PROXY sending to next');
    return next( );
  }
  console.log('PROXY PROXY myProxy', myProxy);
  // Otherwise, proxy.
  // myProxy.on('proxyRes', function (proxyRes, req, res) { console.log('YY proxyRes', proxyRes); });
  return myProxy(req, res, next);

}

var noForgeries = csrf({ cookie: { signed: true, key: '_csrfDryKey', value: defaultValue } });
function setCSRFToken (req, res, next) {
  // This should be used separately in the body or header.
  res.cookie('_csrfTokenDryWall', req.csrfToken());
  next();
}
function removePrefix (req, res, next) {
  if (req.url.indexOf('/local') === 0) {
    console.log('should remove');
    req.url = req.url.split(/^\/local/g).pop( );
    console.log('should remove', req.url);
  }
  return next( );
}

// middleware leveraging nginx to re-proxy
// this function intercepts almost all requests to nginx
function do_nginx_rewrite (req, res, next) {
  var ORIGIN = process.env['ORIGIN'];
  var original_host = req.headers['x-forwarded-host'] || req.hostname;
  var prefix = original_host.split('-login.diabetes.watch').slice(0, -1).join("");
  var scheme = req.headers['x-forwarded-proto'];
  if (!req.user || !req.isAuthenticated( )) {
    console.log('SKIPPING PROXY sending to next');
    if (prefix) {
      console.log('on invalid prefix', prefix);
      var url = scheme + "://" + req.hostname;
      console.log('sending', url);
      res.redirect(url);
      return res.end( );
    }
    return next( );
  }
  // lookup in db, resolve permissions, etc
  // hardcode for simple POC
  var allowedFirstUsers = [null, 'bewest', 'first'];
  if (prefix == 'first' && allowedFirstUsers.indexOf(req.user.username)) {
    ORIGIN = '/x-accel-redirect/' + 'ns-dev2.cbrese.com';
  }
  if (req.user.username == 'bewest' && prefix == 'demo') {
    ORIGIN = '/x-accel-redirectssl/' + 'p5001-backends.diabetes.watch';
  }
  var uri = ORIGIN + '/' + encodeURIComponent(req.url.slice(1));
  // if (req.session.do_proxy) {
  if (prefix) {
    console.log("SITES FOR prefix", prefix, req.user.username, req.user.roles.account.sites);
    for (var x in req.user.roles.account.sites) {
      var site = req.user.roles.account.sites[x];
      if (site.name == prefix) {
        uri = '/x-accel-redirectssl/u-' + prefix + '-backends.diabetes.watch/' + encodeURIComponent(req.url.slice(1));
        console.log('MATCHING SITE', prefix, uri, site);
        break;
      }
    }
    console.log("PROXY FOR HOST", original_host, prefix);
    console.log('redirecting internally', req.user);
    if (req.url.indexOf('/logout') === 0) {
      console.log('logout', req.url);
      req.session.do_proxy = false;
      req.session.save( );
      res.redirect('/logout');
      return;
      return next( );
    }
    if (req.url.indexOf('/nightscout') === 0) {
      return res.redirect('/');
    }
    console.log('redirecting', 'to', uri);
    res.header('X-Accel-Redirect', uri)
    res.end( );
    // res.send("")
  } else {
    if (req.url.indexOf('/nightscout') === 0) {
      console.log('ns start proxy', req.url);
      req.session.do_proxy = true;
      req.session.save( );
      var url = scheme + "://" + req.user.username + '-' + req.hostname + '/';
      res.redirect(url);
      return res.end( );
      // return next( );
    }
    return next( );
  }
  // res.redirect('/');
  return next( );
  console.error("XXX", "SHOULD NOT HAPPEN");
}

// app.get('/', maybeProxy);
// app.all('*', maybeProxy);
// app.all('/', removePrefix, noForgeries, setCSRFToken, unprotected);
// app.all('/*', noForgeries, setCSRFToken, unprotected);
function fetches_sites (req, res, next) {
  req.sites = [ ];
  if (req.user &&  req.isAuthenticated( )) {
    req.user.roles.account.populate('sites', function (err, account) {
      console.log('account', account, account.sites);
      req.sites = account.sites;
      next( );
    });
    return;
  } else {
    next( );
  }
}
app.all('/*', fetches_sites, do_nginx_rewrite, unprotected);
// app.use(maybeProxy);

//custom (friendly) error handler
app.use(require('./views/http/index').http500);

//setup utilities
app.utility = {};
app.utility.sendmail = require('./util/sendmail');
app.utility.slugify = require('./util/slugify');
app.utility.workflow = require('./util/workflow');

//listen up
app.server.listen(app.config.port, function(){
  //and... we're live
});
