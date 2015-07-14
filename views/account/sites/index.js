'use strict';

var request = require('request');
var crypto = require('crypto');
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

exports.remove = function(req, res, next) {
  var name = req.params.name;
  var account_id = req.user.roles.account._id;
  // var site = req.sites.filter(function (f) { return f.name == name && req.user.roles.account._id == f.account.id; });
  var site = req.sites.filter(function (f) { 
    return (f.name == name && f.account.id.toString( ) == account_id.toString( ));
  }).pop( );
  console.log("REMOVE XX", site);
  if (site.name != name) {
    throw "bad";
  }
  var api = req.app.config.proxy.api;
  var delete_url = api + '/environs/' + site.internal_name;
  var q = {
    name: name
  , account: { id: req.user.roles.account._id },
  };
  console.log('removing', name, 'from backend', delete_url);
  request.del(delete_url, function done (err, result, body) {
    console.log('removed from backends', result.statusCode, body);
    // req.user.roles.account.sites.pull(q);
    console.log('begin sites for account', req.user.roles.account.sites.length);
    req.user.roles.account.sites = req.sites.filter(function (c) {
      console.log('considering removing', c.name, name);
      return c.name.toString( ) != name;
    });
    req.user.roles.account.update(req.user.roles.account, function (err, saved) {
      console.log('saved account', err, saved);
      req.app.db.models.Site.remove(q, function (err, site) {
          // req.app.db.models.Site.findOneAndRemove(q, function (err, site) { });
          console.log('removed from db', 'query', q, 'err', err, 'site??', site);
          /*
          req.user.roles.account.update(function (err) { });
          */
          console.log('sites for account', req.user.roles.account.sites.length);
          res.status(204).send("").end( );

      });
    });

    /* */
  });
}

exports.create = function(req, res, next) {
  console.log("GOT NEW SITE REQUEST", req.body);
  // console.log("config", req.app.config);
  console.log("config", req.app.config.hosted.uri);
  console.log("config", req.app.config.hosted.prefix);
  var internal_name = req.body.name + '.' + req.user.roles.account._id;
  var prefix = req.app.config.hosted.prefix + internal_name + '_internal_';
  var inst = {
    mongo: req.app.config.hosted.uri,
    internal_name: internal_name,
    MONGO_COLLECTION: prefix + 'entries',
    MONGO_SETTINGS_COLLECTION: prefix + 'settings',
    MONGO_TREATMENTS_COLLECTION: prefix + 'treatments',
    MONGO_PROFILE_COLLECTION: prefix + 'profile',
    MONGO_DEVICESTATUS_COLLECTION: prefix + 'devicestatus'
    // MQTT_MONITOR
    // DISPLAY_UNITS
    // ENABLE
  };
  var api_secret = crypto.randomBytes(256).slice(0, 20).toString('hex');
  var uploader_prefix = crypto.randomBytes(12).toString('hex');
  inst.API_SECRET = api_secret;
  var api = req.app.config.proxy.api;
  var creator_url = api + '/environs/' + inst.internal_name;
  console.log('sending', creator_url, inst);
  request.post({ url: creator_url, json: inst }, function done (err, result, body) {
    console.log("DONE", err, result, body);
    // req.db.
    if (err) {
      next(err);
    }

    var shasum = crypto.createHash('sha1');
    shasum.update(body.API_SECRET);
    var api_key = shasum.digest('hex');
    var fieldsToSet = {
      name: req.body.name,
      internal_name: body.internal_name,
      account: { id: req.user.roles.account._id },
      apikey: api_key,
      api_secret: body.API_SECRET,
      uploader_prefix: uploader_prefix,
      response: body
    };

    /*
    function createSite (fieldsToSet, cb) { }
    */
    // req.user.createSite(fieldsToSet,
    var q = {
      name: fieldsToSet.name
    , account: fieldsToSet.account
    };
    req.app.db.models.Site.findOneAndUpdate(q, fieldsToSet, {upsert: true}, function (err, site) {
      req.site = site;
      // req.user.roles.account.sites.push(site);
      req.user.roles.account.sites.addToSet(site);
      req.user.roles.account.save( );
      
      // renderSites(req, res, next, '');
      console.log("CREATED NEW SITE!", err, site);
      res.render('account/sites/index', {user: req.user, site: site });
    });
  });

};
