'use strict';

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.set('X-Auth-Required', 'true');
  req.session.returnUrl = req.originalUrl;
  res.redirect('/login/');
}

function ensureAdmin(req, res, next) {
  if (req.user.canPlayRoleOf('admin')) {
    return next();
  }
  res.redirect('/');
}

function ensureAccount(req, res, next) {
  if (req.user.canPlayRoleOf('account')) {
    if (req.app.config.requireAccountVerification) {
      if (req.user.roles.account.isVerified !== 'yes' && !/^\/account\/verification\//.test(req.url)) {
        return res.redirect('/account/verification/');
      }
    }
    return next();
  }
  res.redirect('/');
}

// Set up proxy module.
var proxy = require('./proxy');

exports = module.exports = function(app, passport) {
  //front end

  // Set up proxy module.
  var myProxy = proxy(app.config.proxy);

  // Some middleware to detect if proxy app should be used or if local
  // auth/drywall should be used.
  function maybeProxy (req, res, next) {
    // Debug.
    // If user is not authorized/unknown, use local logic to force signin.
    if (!req.user || !req.isAuthenticated( )) {
      console.log('sending to next');
      return next( );
    }
    console.log('myProxy');
    // Otherwise, proxy.
    return myProxy(req, res, next);

  }
  console.log('base', app.config);

  // Neither of these variation seems to make much difference.

  var oauth_base = app.config.oauth_base;
  // Theory is to allow local logic and views to take over for admin UI
  // controls, otherwise proxy to single page app with it's own data store.
  // app.get('/', maybeProxy, require('./views/index').init);
  app.get('/', require('./views/index').init);

  // app.get('/', require('./views/index').init);
  app.get('/about/', require('./views/about/index').init);
  app.get('/contact/', require('./views/contact/index').init);
  app.post('/contact/', require('./views/contact/index').sendMessage);

  //sign up
  app.get('/signup/', require('./views/signup/index').init);
  app.post('/signup/', require('./views/signup/index').signup);

  //social sign up
  app.post('/signup/social/', require('./views/signup/index').signupSocial);
  app.get('/signup/twitter/', passport.authenticate('twitter', { callbackURL: oauth_base + '/signup/twitter/callback/' }));
  app.get('/signup/twitter/callback/', require('./views/signup/index').signupTwitter);
  app.get('/signup/github/', passport.authenticate('github', { callbackURL: oauth_base + '/oauth/signup/github/callback/', scope: ['user:email'] }));
  app.get('/oauth/signup/github/callback/', require('./views/signup/index').signupGitHub);
  app.get('/signup/facebook/', passport.authenticate('facebook', { callbackURL: oauth_base + '/signup/facebook/callback/', scope: ['email'] }));
  app.get('/signup/facebook/callback/', require('./views/signup/index').signupFacebook);
  app.get('/signup/google/', passport.authenticate('google', { callbackURL: oauth_base + '/signup/google/callback/', scope: ['profile email'] }));
  app.get('/signup/google/callback/', require('./views/signup/index').signupGoogle);
  app.get('/signup/tumblr/', passport.authenticate('tumblr', { callbackURL: oauth_base + '/signup/tumblr/callback/' }));
  app.get('/signup/tumblr/callback/', require('./views/signup/index').signupTumblr);

  //login/out
  app.get('/login/', require('./views/login/index').init);
  app.post('/login/', require('./views/login/index').login);
  app.get('/login/forgot/', require('./views/login/forgot/index').init);
  app.post('/login/forgot/', require('./views/login/forgot/index').send);
  app.get('/login/reset/', require('./views/login/reset/index').init);
  app.get('/login/reset/:email/:token/', require('./views/login/reset/index').init);
  app.put('/login/reset/:email/:token/', require('./views/login/reset/index').set);
  app.get('/logout/', require('./views/logout/index').init);

  //social login
  app.get('/login/twitter/', passport.authenticate('twitter', { callbackURL: oauth_base + '/login/twitter/callback/' }));
  app.get('/login/twitter/callback/', require('./views/login/index').loginTwitter);
  app.get('/login/github/', passport.authenticate('github', { callbackURL: oauth_base + '/oauth/login/github/callback/' }));
  app.get('/oauth/login/github/callback/', require('./views/login/index').loginGitHub);
  app.get('/login/facebook/', passport.authenticate('facebook', { callbackURL: oauth_base + '/login/facebook/callback/' }));
  app.get('/login/facebook/callback/', require('./views/login/index').loginFacebook);
  app.get('/login/google/', passport.authenticate('google', { callbackURL: oauth_base + '/login/google/callback/', scope: ['profile email'] }));
  app.get('/login/google/callback/', require('./views/login/index').loginGoogle);
  app.get('/login/tumblr/', passport.authenticate('tumblr', { callbackURL: oauth_base + '/login/tumblr/callback/', scope: ['profile email'] }));
  app.get('/login/tumblr/callback/', require('./views/login/index').loginTumblr);

  //admin
  app.all('/admin*', ensureAuthenticated);
  app.all('/admin*', ensureAdmin);
  app.get('/admin/', require('./views/admin/index').init);

  //admin > users
  app.get('/admin/users/', require('./views/admin/users/index').find);
  app.post('/admin/users/', require('./views/admin/users/index').create);
  app.get('/admin/users/:id/', require('./views/admin/users/index').read);
  app.put('/admin/users/:id/', require('./views/admin/users/index').update);
  app.put('/admin/users/:id/password/', require('./views/admin/users/index').password);
  app.put('/admin/users/:id/role-admin/', require('./views/admin/users/index').linkAdmin);
  app.delete('/admin/users/:id/role-admin/', require('./views/admin/users/index').unlinkAdmin);
  app.put('/admin/users/:id/role-account/', require('./views/admin/users/index').linkAccount);
  app.delete('/admin/users/:id/role-account/', require('./views/admin/users/index').unlinkAccount);
  app.delete('/admin/users/:id/', require('./views/admin/users/index').delete);

  //admin > administrators
  app.get('/admin/administrators/', require('./views/admin/administrators/index').find);
  app.post('/admin/administrators/', require('./views/admin/administrators/index').create);
  app.get('/admin/administrators/:id/', require('./views/admin/administrators/index').read);
  app.put('/admin/administrators/:id/', require('./views/admin/administrators/index').update);
  app.put('/admin/administrators/:id/permissions/', require('./views/admin/administrators/index').permissions);
  app.put('/admin/administrators/:id/groups/', require('./views/admin/administrators/index').groups);
  app.put('/admin/administrators/:id/user/', require('./views/admin/administrators/index').linkUser);
  app.delete('/admin/administrators/:id/user/', require('./views/admin/administrators/index').unlinkUser);
  app.delete('/admin/administrators/:id/', require('./views/admin/administrators/index').delete);

  //admin > admin groups
  app.get('/admin/admin-groups/', require('./views/admin/admin-groups/index').find);
  app.post('/admin/admin-groups/', require('./views/admin/admin-groups/index').create);
  app.get('/admin/admin-groups/:id/', require('./views/admin/admin-groups/index').read);
  app.put('/admin/admin-groups/:id/', require('./views/admin/admin-groups/index').update);
  app.put('/admin/admin-groups/:id/permissions/', require('./views/admin/admin-groups/index').permissions);
  app.delete('/admin/admin-groups/:id/', require('./views/admin/admin-groups/index').delete);

  //admin > accounts
  app.get('/admin/accounts/', require('./views/admin/accounts/index').find);
  app.post('/admin/accounts/', require('./views/admin/accounts/index').create);
  app.get('/admin/accounts/:id/', require('./views/admin/accounts/index').read);
  app.put('/admin/accounts/:id/', require('./views/admin/accounts/index').update);
  app.put('/admin/accounts/:id/user/', require('./views/admin/accounts/index').linkUser);
  app.delete('/admin/accounts/:id/user/', require('./views/admin/accounts/index').unlinkUser);
  app.post('/admin/accounts/:id/notes/', require('./views/admin/accounts/index').newNote);
  app.post('/admin/accounts/:id/status/', require('./views/admin/accounts/index').newStatus);
  app.delete('/admin/accounts/:id/', require('./views/admin/accounts/index').delete);

  //admin > statuses
  app.get('/admin/statuses/', require('./views/admin/statuses/index').find);
  app.post('/admin/statuses/', require('./views/admin/statuses/index').create);
  app.get('/admin/statuses/:id/', require('./views/admin/statuses/index').read);
  app.put('/admin/statuses/:id/', require('./views/admin/statuses/index').update);
  app.delete('/admin/statuses/:id/', require('./views/admin/statuses/index').delete);

  //admin > categories
  app.get('/admin/categories/', require('./views/admin/categories/index').find);
  app.post('/admin/categories/', require('./views/admin/categories/index').create);
  app.get('/admin/categories/:id/', require('./views/admin/categories/index').read);
  app.put('/admin/categories/:id/', require('./views/admin/categories/index').update);
  app.delete('/admin/categories/:id/', require('./views/admin/categories/index').delete);

  //admin > search
  app.get('/admin/search/', require('./views/admin/search/index').find);

  //account
  app.all('/account*', ensureAuthenticated);
  app.all('/account*', ensureAccount);
  app.get('/account/', require('./views/account/index').init);

  //account > verification
  app.get('/account/verification/', require('./views/account/verification/index').init);
  app.post('/account/verification/', require('./views/account/verification/index').resendVerification);
  app.get('/account/verification/:token/', require('./views/account/verification/index').verify);

  //account > settings
  app.get('/account/settings/', require('./views/account/settings/index').init);
  app.put('/account/settings/', require('./views/account/settings/index').update);
  app.put('/account/settings/identity/', require('./views/account/settings/index').identity);
  app.put('/account/settings/password/', require('./views/account/settings/index').password);

  // billing
  var billing = require('./views/account/billing/index');
  app.get('/account/billing/'
    , billing.jsonIfXHR
    , billing.set_bases
    , billing.fetch_payment_token
    , billing.renderPhase
  ) ;
  app.get('/account/billing/plans'
    , billing.set_bases
    , billing.jsonIfXHR, billing.fetch_plans
    , billing.fmt_plans
  ) ;
  app.post('/account/billing/paid'
    , billing.jsonIfXHR
    , billing.set_bases
    , billing.fetch_plans
    , billing.suggest_subscription
    , billing.create_subscription
    , billing.fmt_subscription
  ) ;


  // account > sites
  var sites = require('./views/account/sites/index');
  app.get('/account/sites/', sites.jsonIfXHR, sites.init);
  app.post('/account/sites/', sites.create);
  app.delete('/account/sites/:name', sites.remove);
  app.get('/account/sites/list.json', sites.list);
  app.get('/account/sites/:name', sites.examine);
  app.get('/account/sites/:name/views', sites.jsonIfXHR, sites.findSite, sites.listView);
  app.get('/account/sites/:name/runtime', sites.findSite, sites.getRunTime, sites.fmtRunTime);
  app.post('/account/sites/:name/runtime', sites.findSite, sites.getRunTime, sites.suggestRunTime, sites.setRunTime, sites.clean_proc_runtime, sites.fmtRunTime);
  app.get('/account/sites/:name/runtime', sites.findSite, sites.getRunTime, sites.fmtRunTime);
  app.get('/account/sites/:name/runtime/:field', sites.findSite, sites.getRunTime, sites.getRunTimeOption, sites.fmtRunTime);
  app.post('/account/sites/:name/runtime/:field', sites.findSite, sites.getRunTime,  sites.setRunTimeOption, sites.clean_proc_runtime, sites.fmtRunTime);
  app.delete('/account/sites/:name/runtime/:field', sites.findSite, sites.getRunTime, sites.delRunTimeOption, sites.clean_proc_runtime, sites.fmtRunTime);
  app.post('/account/sites/:name/views', sites.findSite, sites.createView);
  app.delete('/account/sites/:name/views/:viewName', sites.findSite, sites.deleteView);

  // account > groups
  var groups = require('./views/account/groups/index');
  app.all('/account/groups*', groups.ensureFacebook);
  app.get('/account/groups/', groups.init);
  app.get('/account/groups/api/*', groups.groups);

  //account > settings > social
  app.get('/account/settings/twitter/', passport.authenticate('twitter', { callbackURL: oauth_base + '/account/settings/twitter/callback/' }));
  app.get('/account/settings/twitter/callback/', require('./views/account/settings/index').connectTwitter);
  app.get('/account/settings/twitter/disconnect/', require('./views/account/settings/index').disconnectTwitter);
  app.get('/account/settings/github/', passport.authenticate('github', { callbackURL: oauth_base + '/oauth/account/settings/github/callback/' }));
  app.get('/oauth/account/settings/github/callback/', require('./views/account/settings/index').connectGitHub);
  app.get('/account/settings/github/disconnect/', require('./views/account/settings/index').disconnectGitHub);
  app.get('/account/settings/facebook/', passport.authenticate('facebook', { callbackURL: oauth_base + '/account/settings/facebook/callback/' }));
  app.get('/account/settings/facebook/callback/', require('./views/account/settings/index').connectFacebook);
  app.get('/account/settings/facebook/disconnect/', require('./views/account/settings/index').disconnectFacebook);
  app.get('/account/settings/google/', passport.authenticate('google', { callbackURL: oauth_base + '/account/settings/google/callback/', scope: ['profile email'] }));
  app.get('/account/settings/google/callback/', require('./views/account/settings/index').connectGoogle);
  app.get('/account/settings/google/disconnect/', require('./views/account/settings/index').disconnectGoogle);
  app.get('/account/settings/tumblr/', passport.authenticate('tumblr', { callbackURL: oauth_base + '/account/settings/tumblr/callback/' }));
  app.get('/account/settings/tumblr/callback/', require('./views/account/settings/index').connectTumblr);
  app.get('/account/settings/tumblr/disconnect/', require('./views/account/settings/index').disconnectTumblr);

  /*
  // Some debug testing, remove.
  app.all('/x*', ensureAuthenticated);
  app.all('/x*', ensureAccount);
  var path = require('path');
  app.all('/x/*', function (req, res, next) {
    console.log("X OLD", req.url);
    req.url = req.url.replace('/x/', '/');
    console.log("X NEW", req.url);
    // req.url
    next( );
  }, proxy(app.config.proxy));
  */

  //route not found
  // Proxy anything not listed above or not found into the ORIGIN target if
  // logged in, otherwise send to usual 404 handler.
  // app.all('*', maybeProxy, require('./views/http/index').http404);
  app.all('*', require('./views/http/index').http404);
};
