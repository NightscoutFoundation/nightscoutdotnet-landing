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

app.use(function (req, res, next) {
    console.log('URL', req.url);
  if (req.body)
    console.log('body', req.body._csrf);
  if (req.query)
    console.log('query', req.query._csrf);
  console.log('COOKIE', req.cookies);
  console.log('headers', JSON.stringify(req.headers, 0, 2));
  next( );
});

app.use(cookieParser(config.cryptoKey));
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: config.cryptoKey,
  name: 'drywall.connect.sid',
  store: new mongoStore({ url: config.mongodb.uri })
}));
app.use(passport.initialize());
app.use(passport.session());

function csrfValue (req) {
}
function defaultValue(req) {
  return (req.cookies && req.cookies._csrfTokenDryWall)
    || (req.body && req.body._csrf)
    || (req.query && req.query._csrf)
    || (req.headers['csrf-token'])
    || (req.headers['xsrf-token'])
    || (req.headers['x-csrf-token'])
    || (req.headers['x-xsrf-token']);
}

// helmet(app);

//response locals
app.use(function(req, res, next) {
  console.log('req COOKIE', req.cookies);
  console.log('req SESSION', req.session);
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
    return next( );
  }
}

// app.get('/', maybeProxy);
// app.all('*', maybeProxy);
app.all('/', removePrefix, noForgeries, setCSRFToken, unprotected);
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
