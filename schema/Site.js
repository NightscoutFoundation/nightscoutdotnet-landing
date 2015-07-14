'use strict';

exports = module.exports = function(app, mongoose) {
  var siteSchema = new mongoose.Schema({
    name: { type: String, default: '' },
    internal_name: { type: String, default: '' },
    origin: { type: String, default: '' },
    apikey: { type: String, default: '' },
    api_secret: { type: String, default: '' },
    internal: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now },
    uploader_prefix: { type: String, default: '' },
    account: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
      name: { type: String, default: '' },
      time: { type: Date, default: Date.now }
    }
  });

  siteSchema.methods.statusURL = function() {
    return this.origin.split('/').slice(0, 1) + '/api/v1/status.json';
  };

  siteSchema.plugin(require('./plugins/pagedFind'));
  siteSchema.index({ name: 1 });
  siteSchema.index({ origin: 1 });
  siteSchema.index({ created_at: -1 });
  siteSchema.index({ apikey: -1 });
  siteSchema.index({ uploader_prefix: -1 });

  app.db.model('Site', siteSchema);
};
