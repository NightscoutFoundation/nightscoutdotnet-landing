'use strict';

var request = require('request');
var crypto = require('crypto');

function get_bases (req) {
  var bases = {
    viewer: req.app.config.proxy.PREFIX.VIEWER
  , uploader: '-u' + req.app.config.cookie.domain
  , mqtt: req.app.config.mqtt
  , guest: req.app.config.proxy.PREFIX.GUEST
  , pebble: req.app.config.proxy.PREFIX.PEBBLE
  };

  return bases;
}

var renderSites = function(req, res, next) {

  var bases = get_bases(req);

  req.user.roles.account.populate('sites', 
    function (err, account) {
      var sites = account.sites;
      sites = sites.map(sitePrefixes(bases));
      console.log('SITES', sites);
      res.render('account/sites/index', {user: req.user, sites: sites, bases: bases });
  }) ;
  // next( );
}

exports.init = function(req, res, next){
  renderSites(req, res, next, '');
};

exports.listView = function (req, res, next) {
  var q = {
    created_by: { id: req.user.roles.account._id }
  , site: { id: req.hosted_site._id
          , internal_name: req.hosted_site.internal_name
    }
  };
  req.app.db.models.View.find(q, function (err, docs) {
    var views = docs.map(guestPrefixes(req.bases));
    res.format({
      json: function ( ) {
        if (err) {
          return next(err);
        }
        res.json(views || [ ]);
      }
    });
  });
};

exports.createView = function (req, res, next) {
  var key = req.hosted_site.uploader_prefix.slice(0, 6);
  var name = req.body.viewName;
  var expected_name = name + '-' + key;
  var inputs = {
    name: name
  , created_by: { id: req.user.roles.account._id }
  , site: { id: req.hosted_site._id
          , internal_name: req.hosted_site.internal_name
    }
  , key: key
  , expected_name: expected_name

  };
  console.log('creating new view', inputs);
  var q = {
    name: name
  , key: key
  , site: inputs.site
  };

  req.app.db.models.View.findOneAndUpdate(q, inputs, {upsert: true}, function (err, view) {
    if (err) {
      return next(err);
    }
    res.status(201);
    res.format({
      json: function ( ) {
        res.json(view);
      },
      html: function ( ) {
        res.redirect('/account/sites/' + req.hosted_site.name);
      }
    });
  });
};

exports.deleteView = function (req, res, next) {
  var q = {
    name: req.params.viewName
  , site: { id: req.hosted_site._id
          , internal_name: req.hosted_site.internal_name
    }
  };
  req.app.db.models.View.remove(q, function (err, site) {
    if (err) {
      return next(err);
    }
    res.status(204).send("").end( );
  });
};

exports.jsonIfXHR = function (req, res, next) {
  if (req.xhr) {
    res.set('json');
    res.set('Content-Type', 'application/json');
  }

  next( );
};

exports.findSite = function (req, res, next) {
  var bases = get_bases(req);
  var q = {
    name: req.params.name
  , account: { id: req.user.roles.account._id },
  };
  req.bases = bases;
  if (req.xhr) {
    res.set('json');
    res.set('Content-Type', 'application/json');
  }

  req.app.db.models.Site.findOne(q, function (err, sites) {

    if (err || sites == null) {
      return next(err);
    }
    req.hosted_site = sites;
    var site = [sites].map(sitePrefixes(bases)).pop( );
    req.site = site;
    return next( );
  });
};

var blacklistedENV = [null, 'HOSTEDPORTS', 'MONGO_COLLECTION', 'MONGO_DEVICESTATUS_COLLECTION', 'MONGO_PROFILE_COLLECTION', 'MONGO_SETTINGS_COLLECTION', 'MONGO_TREATMENTS_COLLECTION', 'PATH', 'WEB_NAME', 'WORKER_DIR', 'WORKER_ENV', 'base', 'envfile', 'mongo', 'internal_name', 'PORT'  ];
exports.getRunTime = function (req, res, next) {
  var account_id = req.user.roles.account._id;
  var api = req.app.config.proxy.api;
  var url = api + '/environs/' + req.site.internal_name;
  // var api = req.app.config.proxy.provision;
  // var url = api + '/accounts/' + account_id + '/sites/' + req.site.internal_name;
  request.get({ url: url, json: true }, function done (err, result, body) {
    if (err) { return next(err); }
    var safe = { };
    var env = body.custom_env;
    for (var f in env) {
      if (blacklistedENV.indexOf(f) < 1) {
        safe[f] = env[f];
      }
    }
    body.custom_env = safe;

    req.site.proc = body;
    next( );
  });
};

exports.clean_proc_runtime = function clean_proc_runtime (req, res, next) {
  if (req.site && req.site.proc && req.site.proc.custom_env) {
    var body = req.site.proc;
    var safe = { };
    var env = body.custom_env;
    for (var f in env) {
      if (blacklistedENV.indexOf(f) < 1) {
        safe[f] = env[f];
      }
    }
    body.custom_env = safe;

    req.site.proc = body;
  }
  next( );
}

exports.getRunTimeOption = function (req, res, next) {
  var field = req.params.field;
  res.json(req.site.proc[field]);
};

exports.suggestRunTimeOption = function (req, res, next) {
  var update = { };
  update[req.params.field] = req.params[req.params.field];
  req.suggested = update;
  next( );
};

exports.setRunTimeOption = function (req, res, next) {
  var api = req.app.config.proxy.api;
  var field = req.params.field;
  var url = api + '/environs/' + req.site.internal_name + '/env/' + field;
  var value = req.params[field] || req.body[field];
  var update = { };
  update[field] = value;
  request.post({ url: url, json: update }, function done (err, result, body) {
    if (err) { return next(err); }
    console.log(update, body);
    var refresh = api + result.headers['location'];
    request.get({url: refresh, json: true }, function finish (err, resp, body) {
      if (err) { return next(err); }
      req.site.proc = body;
      next( );
    });
  });
};

exports.delRunTimeOption = function (req, res, next) {
  var api = req.app.config.proxy.api;
  var field = req.params.field;
  var url = api + '/environs/' + req.site.internal_name + '/env/' + field;
  request.del({ url: url, json: true }, function done (err, result, body) {
    if (err) { return next(err); }
    var refresh = api + result.headers('Location');
    request.get({url: refresh, json: true }, function finish (err, resp, body) {
      if (err) { return next(err); }
      req.site.proc = body;
      next( );
    });
  });
};

exports.suggestRunTime = function (req, res, next) {
  var env = req.params.env;
  var existing = req.site.proc.custom_env;
  var patch_env = { };
  for (x in env) {
    existing[x] = env[x];
    patch_env[x] = env[x];
  }
  req.patch_env = patch_env;
  req.suggested = existing;
  next( );
};

exports.setRunTime = function (req, res, next) {

  var api = req.app.config.proxy.api;
  var url = api + '/environs/' + req.site.internal_name;
  var payload = req.suggested;
  request.post({ url: url, json: payload }, function done (err, result, body) {
    if (err) { return next(err); }
    var refresh = api + result.headers('Location');
    request.get({url: refresh, json: true }, function finish (err, resp, body) {
      if (err) { return next(err); }
      req.site.proc = body;
      next( );
    });
  });
};

exports.fmtRunTime = function (req, res, next) {
  res.format({
    json: function ( ) {
      res.json(req.site.proc);
    }
  });
};

exports.examine = function (req, res, next) {
  var bases = get_bases(req);
  var q = {
    name: req.params.name
  , account: { id: req.user.roles.account._id },
  };
  if (req.xhr) {
    res.set('json');
    res.set('Content-Type', 'application/json');
  }
  req.app.db.models.Site.findOne(q, function (err, sites) {

    req.accept
    if (err || sites == null) {
      return next(err);
    }
    var site = [sites].map(sitePrefixes(get_bases(req))).pop( );
    var data = { user: req.user, name: req.params.name, site: site, bases: bases };
    res.format({
      'json': function ( ) {
        res.json(data);
      },
      'html': function ( ) {
        res.render('account/sites/examine', data);
      }
    });
  });
};

function guestPrefixes (bases) {
  function iter (item) {
    item = item.toJSON( );
    item.domain = item.expected_name + bases.guest;
    item.url = 'https://' + item.domain + '/';
    item.pebble = 'https://' + item.domain + '/pebble';
    return item;
  }
  return iter;
}

function sitePrefixes (bases) {
  function iter (item) {
    item = item.toJSON( );
    var mqtt_auth = [ item.uploader_prefix, item.api_secret ].join(':');
    item.domain = item.name + bases.viewer;
    item.upload = 'https://' + item.api_secret + '@' + item.uploader_prefix + bases.uploader + '/api/v1';
    item.mqtt_monitor = 'tcp://' + mqtt_auth + '@' + bases.mqtt.public;
    item.settings = '/account/sites/' + item.name;
    item.guest = '-' + item.uploader_prefix.slice(0, 6) + bases.guest;
    return item;
  }
  return iter;
}

exports.list = function list (req, res, next) {
  // req.app.db

  req.user.roles.account.populate('sites', 
    function (err, account) {
      var sites = account.sites;
      sites = sites.map(sitePrefixes(get_bases(req)));
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
    if (err) {
      return next(err);
    }
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
  var bases = get_bases(req);
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
  var mqtt_auth = [ uploader_prefix, api_secret ].join(':');
  var private_mqtt = 'tcp://' + mqtt_auth + '@' + req.app.config.mqtt.private;
  inst.MQTT_MONITOR = private_mqtt;
  var posted = {
    name: req.body.name
  , uploader_prefix: uploader_prefix
  , salter: internal_name
  , api_secret: api_secret
  , internal_name: internal_name
  };
  var api = req.app.config.proxy.provision;
  // var api = req.app.config.proxy.api;
  // var creator_url = api + '/environs/' + inst.internal_name;
  // XXX
  var account_id = req.user.roles.account._id;
  var creator_url = api + '/accounts/' + account_id + '/sites';
  console.log('sending', creator_url, posted);
  // request.post({ url: creator_url, json: inst }, function done (err, result, body) { });
  request.post({ url: creator_url, json: posted }, function done (err, result, body) {
    console.log("DONE", err, body);
    // req.db.
    if (err) {
      return next(err);
    }

    var shasum = crypto.createHash('sha1');
    // shasum.update(body.API_SECRET);
    shasum.update(api_secret);
    var api_key = shasum.digest('hex');
    var fieldsToSet = {
      name: req.body.name,
      internal_name: internal_name,
      account: { id: req.user.roles.account._id },
      apikey: api_key,
      api_secret: api_secret,
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
      setTimeout(function ( ) {
        res.redirect('/account/sites/');
      }, 2500);
      // res.render('account/sites/index', {user: req.user, site: site, bases: bases });
    });
  });

};
