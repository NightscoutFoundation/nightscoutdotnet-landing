var cluster = require('cluster');
var os = require('os');

if (!module.parent) {
  var cpus = os.cpus( ).length;
  var NUM_WORKERS = process.env['NUM_WORKERS'] || cpus;
  cluster.setupMaster(
    {
      exec: 'app.js'
    }
  );

  for (var i = 0; i < NUM_WORKERS; i++) {
    cluster.fork( );
  }
}

