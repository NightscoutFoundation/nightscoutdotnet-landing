'use strict';

var request = require('request');
var renderSites = function(req, res, next) {

  req.user.roles.account.populate('sites', 
    function (err, account) {
      var sites = account.sites;
      console.log('SITES', sites);
      res.render('account/sites/index', {user: req.user, sites: sites });
  }) ;
  // next( );
}

exports.init = function(req, res, next){
  renderSites(req, res, next, '');
};

exports.list = function list (req, res, next) {
  // req.app.db

  req.user.roles.account.populate('sites', 
    function (err, account) {
      var sites = account.sites;
      console.log('SITES', sites);
      res.json(sites);
  }) ;
  // var sites = req.user.roles.account.sites;
  console.log('account', req.user.roles.account);
  // req.app.db.models.Site.find
}

exports.create = function(req, res, next){
  console.log("GOT NEW SITE REQUEST", req.body);
  // console.log("config", req.app.config);
  console.log("config", req.app.config.hosted.uri);
  console.log("config", req.app.config.hosted.prefix);
  var prefix = req.app.config.hosted.prefix + req.body.name + '_internal_';
  var inst = {
    mongo: req.app.config.hosted.uri,
    internal_name: req.body.name,
    MONGO_COLLECTION: prefix + 'entries',
    MONGO_SETTINGS_COLLECTION: prefix + 'settings',
    MONGO_TREATMENTS_COLLECTION: prefix + 'treatments',
    MONGO_PROFILE_COLLECTION: prefix + 'profile',
    MONGO_DEVICESTATUS_COLLECTION: prefix + 'devicestatus'
    // MQTT_MONITOR
    // DISPLAY_UNITS
    // ENABLE
  };
  var api = req.app.config.proxy.api;
  var creator_url = api + '/environs/' + inst.internal_name;
  console.log('sending', creator_url, inst);
  request.post({ url: creator_url, json: inst }, function done (err, result, body) {
    console.log("DONE", err, result, body);
    // req.db.
    if (err) {
      next(err);
    }

    var fieldsToSet = {
      name: body.internal_name,
      account: { id: req.user.roles.account._id },
      response: body
    };

    req.app.db.models.Site.create(fieldsToSet, function (err, site) {
      req.site = site;
      req.user.roles.account.sites.push(site);
      req.user.roles.account.save( );
      
      // renderSites(req, res, next, '');
      console.log("CREATED NEW SITE!", err, site);
      res.render('account/sites/index', {user: req.user, site: site });
    });
  });

};
