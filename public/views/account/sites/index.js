
/* global app:true */

(function() {
  'use strict';

  app = app || {};

  function cloner (template) {
    function iter (item) {
      var clone = template.clone(true);
      return fill_details(clone, item);
      /*
      */
      var names = clone.find('.v.name');
      names.filter(':input').val(item.name);
      names.not(':input').text(item.name);
      // var base = '//' + item.name + '-login.diabetes.watch';
      var base = '//' + item.domain;
      clone.find('IMG.status').attr('src', base + '/api/v1/status.png');
      clone.find('A.v.view').attr('href', base + '/');
      clone.find('A.v.clock-mode').attr('href', base + '/clock.html');
      clone.find('A.mqtt-upload').attr('href', item.mqtt_monitor);
      clone.find('A.http-upload').attr('href', item.upload);
      clone.find('A.v.settings').attr('href', item.settings);
      return clone;
    }

    return iter;
  }

  function fill_details (clone, item) {
    var names = clone.find('.v.name');
    names.filter(':input').val(item.name);
    names.not(':input').text(item.name);
    // var base = '//' + item.name + '-login.diabetes.watch';
    var base = '//' + item.domain;
    clone.find('IMG.status').attr('src', base + '/api/v1/status.png');
    clone.find('A.v.view').attr('href', base + '/');
    clone.find('A.v.clock-mode').attr('href', base + '/clock.html');
    clone.find('A.mqtt-upload').attr('href', item.mqtt_monitor);
    clone.find('A.http-upload').attr('href', item.upload);
    clone.find('A.v.settings').attr('href', item.settings);
    return clone;
  }

  function delete_site (ev) {
    var row = $(this).closest('.site-row');
    var name = row.find('.v.name:first').text( );
    var opts = {
      url: '/account/sites/' + name
    , method: 'delete'
    };

    function done (data, status, xhr) {
      row.remove( );
    }
    $.ajax(opts).done(done);
  }

  function upload_details (ev) {
  }

  $(document).ready(function ( ) {
    // app.mainView = new app.MainView();
    console.log('sites ready');
    var root = $('#site-list');
    // $.get('/account/sites/list.json',
    root.on('loaded', function (ev, body, status, xhr) {
      var template = cloner($('TBODY.template-site TR').clone(true));
      body.map(function (site) {
        var elem = template(site);
        root.append(elem);

      });
    });

    var inspector = $('#Inspector');
    inspector.on('loaded', function (ev, body) {
      console.log('loaded inspector', body);
      fill_details($(this), body.site);
      fill_details($(this), body);
      $('#Details').trigger('show.bs.modal');
    });
    
    root.on('click', 'TR.site-row .delete-site', delete_site);
    root.on('click', '.btn.upload-details', upload_details);
    $('#Details').on('show.bs.modal', function (ev) {
      var button = $(ev.relatedTarget || ev.target);
      var uris = {
        mqtt: button.find('A.mqtt-upload').attr('href')
      , rest: button.find('A.http-upload').attr('href')
      };
      var json;
      json = {mqtt: { uri: uris.mqtt }};
      $('#mqtt-upload-qr .code').empty( ).qrcode(JSON.stringify(json));
      $('#mqtt-upload-qr .uri').empty( ).text(uris.mqtt);
      json = {rest: { endpoint: [uris.rest] } };
      $('#http-upload-qr .code').empty( ).qrcode(JSON.stringify(json));
      $('#http-upload-qr .uri').empty( ).text(uris.rest);
    });

    $('[data-ajax-target]').each(function (idx, elem) {
      var url = $(this).data('ajax-target');
      $.get(url, function (body, status, xhr) {
         // var ev = $.Event("loaded");
         // ev.data = body;
         $(elem).trigger('loaded', [body]);
      });
    });
  });
}( ));
