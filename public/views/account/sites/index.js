
/* global app:true */

(function() {
  'use strict';

  app = app || {};

  function cloner (template) {
    function iter (item) {
      var clone = template.clone(true);
      var names = clone.find('.v.name');
      names.filter(':input').val(item.name);
      names.not(':input').text(item.name);
      // var base = '//' + item.name + '-login.diabetes.watch';
      var base = '//' + item.domain;
      clone.find('IMG.status').attr('src', base + '/api/v1/status.png');
      clone.find('A.v.view').attr('href', base + '/');
      clone.find('A.v.clock-mode').attr('href', base + '/clock.html');
      clone.find('A.mqtt-upload').attr('href', item.upload);
      clone.find('A.http-upload').attr('href', item.mqtt_monitor);
      return clone;
    }

    return iter;
  }

  function delete_site (ev) {
    console.log('DELETE', this, arguments);
    var row = $(this).closest('.site-row');
    var name = row.find('.v.name:first').text( );
    var opts = {
      url: '/account/sites/' + name
    , method: 'delete'
    };

    function done (data, status, xhr) {
      console.log('done', data, status);
      row.remove( );
    }
    $.ajax(opts).done(done);
  }

  function upload_details (ev) {
    console.log('got', ev.target, this);
  }

  $(document).ready(function ( ) {
    // app.mainView = new app.MainView();
    console.log('sites ready');
    var root = $('#site-list');
    $.get('/account/sites/list.json', function (body, status, xhr) {
      console.log('args', arguments);
      console.log('body', body);
      console.log('xhr', xhr);
      var template = cloner($('TBODY.template-site TR').clone(true));
      body.map(function (site) {
        var elem = template(site);
        root.append(elem);

      });
    });
    root.on('click', 'TR.site-row .delete-site', delete_site);
    root.on('click', '.btn.upload-details', upload_details);
    $('#Details').on('show.bs.modal', function (ev) {
      var button = $(ev.relatedTarget);
      console.log('clicked on ', button);
      var uris = {
        mqtt: button.find('A.mqtt-upload').attr('href')
      , rest: button.find('A.mqtt-upload').attr('href')
      };
      $('#mqtt-upload-qr').qrcode(JSON.stringify({mqtt: { uri: uris.mqtt }}));
      $('#http-upload-qr').qrcode(JSON.stringify({rest: { endpoint: [uris.rest] } }));
    });
  });
}( ));
