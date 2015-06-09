'use strict';

var renderSettings = function(req, res, next, oauthMessage) {
  var outcome = {};

  var getAccountData = function(callback) {
    req.app.db.models.Account.findById(req.user.roles.account.id, 'name company phone zip').exec(function(err, account) {
      if (err) {
        return callback(err, null);
      }

      outcome.account = account;
      callback(null, 'done');
    });
  };

  var getUserData = function(callback) {
    req.app.db.models.User.findById(req.user.id, 'username email twitter.id github.id facebook.id google.id tumblr.id').exec(function(err, user) {
      if (err) {
        callback(err, null);
      }

      outcome.user = user;
      return callback(null, 'done');
    });
  };

  var asyncFinally = function(err, results) {
    if (err) {
      return next(err);
    }

    console.log("OUTCOME", outcome);
    console.log("req.app.config", req.app.config);
    console.log("OAUTH", req.app.config.oauth);
    res.render('account/groups/index', {
      data: {
        account: escape(JSON.stringify(outcome.account)),
        user: escape(JSON.stringify(outcome.user))
      },
      oauthMessage: oauthMessage,
      oauthTwitter: !!req.app.config.oauth.twitter.key,
      oauthTwitterActive: outcome.user.twitter ? !!outcome.user.twitter.id : false,
      oauthGitHub: !!req.app.config.oauth.github.key,
      oauthGitHubActive: outcome.user.github ? !!outcome.user.github.id : false,
      oauthFacebook: !!req.app.config.oauth.facebook.key,
      oauthFacebookActive: outcome.user.facebook ? !!outcome.user.facebook.id : false,
      oauthGoogle: !!req.app.config.oauth.google.key,
      oauthGoogleActive: outcome.user.google ? !!outcome.user.google.id : false,
      oauthTumblr: !!req.app.config.oauth.tumblr.key,
      oauthTumblrActive: outcome.user.tumblr ? !!outcome.user.tumblr.id : false
    });
  };

  require('async').parallel([getAccountData, getUserData], asyncFinally);
};

exports.init = function(req, res, next){
  renderSettings(req, res, next, '');
};

exports.ensureFacebook = function (req, res, next) {
  // var key = req.app.config.oauth.facebook.key;
  var secret = req.app.config.oauth.facebook.secret;
  req.facebook = require('fbgraph')
    .setAppSecret(secret)
    .setAccessToken(req.session.tokens.facebook);
  return next( );
};

exports.groups = function(req, res, next){
  var workflow = req.app.utility.workflow(req, res);
  console.log(req.user, req.session);
  console.log(req.params, req.query);

  workflow.on('groups', function() {
    req.facebook.get('/me?fields=groups', function (err, results) {
      console.log("FACEBOOK", arguments);
      workflow.outcome = results;
      return workflow.emit('response');
    });

    if (workflow.hasErrors()) {
      return workflow.emit('response');
    }

    // workflow.outcome = [ ];

  });

  console.log("REQUEST FOR GROUPS", req.user);
  workflow.emit('groups');
};


