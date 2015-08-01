'use strict';

/*
var nconf = require('nconf');

function configure ( ) {
  nconf.use('config', { file: './drywall_config.json' });
  nconf.defaults({
    port: 3000
  });
  nconf.argv({
    "mongodb.uri": ""
  });
  return nconf;
}
*/
exports.port = process.env.PORT || 3000;
exports.mongodb = {
  uri: process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/drywall'
};
exports.companyName = decodeURIComponent(process.env.COMPANY_NAME) || 'Acme, Inc.';
exports.projectName = decodeURIComponent(process.env.PROJECT_NAME) || 'Drywall';
exports.systemEmail = process.env.SMTP_FROM_ADDRESS || 'your@email.addy';
exports.cryptoKey = 'k3f1ng3rp1n';
exports.loginAttempts = {
  forIp: 30,
  forIpAndUser: 6,
  logExpiration: '60m'
};
exports.proxy = {
  ORIGIN: process.env['ORIGIN'] || '@proxy/',
  PREFIX: {
    VIEWER: process.env['PROXY_PREFIX_VIEWER'] || '-login.diabetes.watch',
    LOGIN: process.env['PROXY_PREFIX_VIEWER'] || 'login.nightscout.net',
    BACKENDS: process.env['PROXY_PREFIX_BACKEND'] || '-backends.diabetes.watch',
    PEBBLE: process.env['PROXY_PREFIX_PEBBLE'] || 'pebble.nightscout.net/pebbler',
    GUEST: process.env['PROXY_PREFIX_GUEST'] || '-guest.nightscout.net'
  },
  api: process.env['MULTIENV_API'] || 'http://localhost:3434',
  billing: process.env['BILLING_API'] || 'http://localhost:6161',
  provision: process.env['PROVISION_API'] || 'http://localhost:6060' // provision.docker:6060
}
exports.mqtt = {
  public: process.env['MQTT_PUBLIC'] || 'nightscout.net'
, private: process.env['MQTT_PRIVATE'] || 'mqtt-mm2.docker'
};
exports.requireAccountVerification = false;
exports.smtp = {
  from: {
    name: process.env.SMTP_FROM_NAME || exports.projectName +' Website',
    address: process.env.SMTP_FROM_ADDRESS || 'your@email.addy'
  },
  credentials: {
    user: process.env.SMTP_USERNAME || 'your@email.addy',
    password: process.env.SMTP_PASSWORD || 'bl4rg!',
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    ssl: true
  }
};
exports.SCRIPT_NAME = process.env.SCRIPT_NAME || '';
exports.oauth_base = process.env.OAUTH_BASE;
exports.oauth = {
  twitter: {
    key: process.env.TWITTER_OAUTH_KEY || '',
    secret: process.env.TWITTER_OAUTH_SECRET || ''
  },
  facebook: {
    key: process.env.FACEBOOK_OAUTH_KEY || '',
    secret: process.env.FACEBOOK_OAUTH_SECRET || ''
  },
  github: {
    key: process.env.GITHUB_OAUTH_KEY || '',
    secret: process.env.GITHUB_OAUTH_SECRET || ''
  },
  google: {
    key: process.env.GOOGLE_OAUTH_KEY || '',
    secret: process.env.GOOGLE_OAUTH_SECRET || ''
  },
  tumblr: {
    key: process.env.TUMBLR_OAUTH_KEY || '',
    secret: process.env.TUMBLR_OAUTH_SECRET || ''
  }
};
exports.hosted = {
  prefix: process.env.HOSTED_MONGO_PREFIX || 'hosted_',
  uri: process.env.HOSTED_MONGO_URI || exports.mongodb.uri
};
exports.cookie = {
  domain: process.env.COOKIE_DOMAIN || ''
};
if (!module.parent) {
  // configure( );

}
