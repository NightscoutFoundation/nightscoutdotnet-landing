'use strict';

var request = require('request');
function get_bases (req) {
  var bases = {
    viewer: req.app.config.proxy.PREFIX.VIEWER
  , uploader: '-u' + req.app.config.cookie.domain
  , mqtt: req.app.config.mqtt
  , guest: req.app.config.proxy.PREFIX.GUEST
  , billing: req.app.config.proxy.billing
  , pebble: req.app.config.proxy.PREFIX.PEBBLE
  };

  return bases;
}

exports.jsonIfXHR = function (req, res, next) {
  if (req.xhr) {
    res.set('json');
    res.set('Content-Type', 'application/json');
  }

  next( );
};

function set_bases (req, res, next) {
  req.bases = get_bases(req);
  next( );
}

function fetch_payment_token (req, res, next) {
  var url = req.bases.billing + '/client/token';
  request.get({url: url, json: true}, function (err, resp, body) {
    req.payment_token = body;
    next( );
  });
}

function fetch_plans (req, res, next) {
  var url = req.bases.billing + '/plans/available';
  request.get({url: url, json: true}, function (err, resp, body) {
    req.plans_available = body;
    next( );
  });
}

function suggest_subscription (req, res, next) {
  var payload = {
    plan_id: req.body.plan_id
  , role_id: req.user.roles.account._id
  , payment_method_nonce: req.body.payment_method_nonce
  };
  req.suggested_subscription = payload;
  next( );
}

function create_subscription (req, res, next) {
  var payload = req.suggested_subscription;
  var url = req.bases.billing + '/client/' + payload.role_id + '/payment';
  request.post({url: url, json: payload}, function (err, resp, body) {
    if (err) { return next(err); }
    res.subscription = body;
    next( );
  });
}

function fmt_subscription (req, res, next) {
  res.json(res.subscription);
}

function fmt_plans (req, res, next) {
  res.json(req.plans_available);
}

function fmt_token (req, res, next) {
  res.json(req.payment_token);
}

function renderPhase (req, res, next) {

  res.render('account/billing/index', { user: req.user, payment_token: req.payment_token, bases: req.bases });

}

exports.renderPhase = renderPhase;
exports.set_bases = set_bases;
exports.fetch_payment_token = fetch_payment_token;
exports.fmt_token = fmt_token;
exports.fmt_plans = fmt_plans;
exports.fetch_plans = fetch_plans;
exports.create_subscription = create_subscription;
exports.suggest_subscription = suggest_subscription;
exports.fmt_subscription = fmt_subscription;

