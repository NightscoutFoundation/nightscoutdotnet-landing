'use strict';

exports = module.exports = function(app, mongoose) {
  var siteSchema = new mongoose.Schema({
    name: { type: String, default: '' },
    expected_name: { type: String, default: '' },
    key: { type: String, default: '' },
    pebble_disabled: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
    site: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'Site' },
      internal_name: { type: String, default: '' },
    },
    created_by: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
      time: { type: Date, default: Date.now }
    }
  });

  siteSchema.methods.statusURL = function() {
    return this.expected_name.split('/').slice(0, 1) + '/api/v1/status.json';
  };

  siteSchema.plugin(require('./plugins/pagedFind'));
  siteSchema.index({ name: 1 });
  siteSchema.index({ expected_name: 1 });
  siteSchema.index({ created_at: -1 });
  siteSchema.index({ key: -1 });

  app.db.model('View', siteSchema);
};
