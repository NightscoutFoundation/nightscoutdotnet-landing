
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

  function viewTemplate (template) {
    function iter (item, x) {
      var clone = template.clone(true);
      return fill_view_details(clone, item, x);
    }
    return iter;
  }

  function fill_view_details (clone, item, x) {
    var names = clone.find('.t.name');
    names.filter(':input').val(item.name);
    names.not(':input').text(item.name);
    clone.find('A.t.url').attr('href', item.url);
    clone.find('A.t.guest').attr('href', item.guest);
    clone.find('A.t.domain').attr('href', item.domain);
    clone.find('A.t.pebble').attr('href', item.pebble);
    clone.find('.t.domain').text(item.domain);
    clone.find('.t.href').text(item.url);
    clone.find('A.t.pebble').attr('href', item.pebble);
    clone.find('.t.pebble-text').text(item.pebble);
    clone.find('.t.number').text(item.number);
    return clone;
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
    clone.find('A.http-xdrip-upload').attr('href', item.xdrip);
    clone.find('A.v.settings').attr('href', item.settings);
    return clone;
  }

  function fill_editor (dom, item) {
    var prefix = '.e.env';
    var f;
    for (f in item) {
      console.log(f);
      dom.find(prefix + '.' + f).not(':input').text(item[f]);
      dom.find(prefix + '.' + f).filter('input').not(':checkbox, select').val(item[f]);
      dom.find(prefix + '.' + f).filter('select').val(item[f]).trigger('chosen:updated');
      // console.log(dom.find(prefix + '.' + f), dom.find(prefix + '.' + f).filter('.data-binary-label'));
      dom.find(prefix + '.' + f).filter('.binary-data-label').each(function ( ) {
        var val = item[f];
        var elem = $(this);
        console.log('filling', elem, val);
        if (elem.data('on').toString( ).toLowerCase( ) == val.toLowerCase( )) {
          elem.attr('checked', 'checked').trigger('change');
        } else {
          elem.attr('checked', null).trigger('change');
        }
      });
      dom.find(prefix + '.' + f).filter('.binary-data-on-off').each(function ( ) {
        var val = item[f];
        var elem = $(this);
        if (val.toLowerCase( ) == 'on') {
          elem.attr('checked', 'checked').trigger('change');
        } else {
          elem.attr('checked', null).trigger('change');
        }
      });

    }
    for (f in item) {
      dom.find('A' + prefix + '.' + f).not(':input').attr('href', item[f + '-href']);
    }
    var enabled = (item.ENABLE || '').split(' ');
    if (enabled) {
      dom.find('.enabler').attr('checked', null).trigger('change');
      for (f in enabled) {
        console.log(f, enabled[f]);
        dom.find('.enabler' + '.enable_' + enabled[f]).prop('checked', 'checked').trigger('change');
        // dom.find('.enabler' + '.enable_' + enabled[f]).bootstrapSwitch('setState', 
      }
    }
    var enabled = (item.ALARM_TYPES || 'predict').split(' ');
    if (enabled) {
      dom.find('.alarm_type').prop('checked', null).trigger('change');
      for (f in enabled) {
        dom.find('.alarm_type' + '.enable_' + enabled[f]).attr('checked', 'checked').trigger('change');
      }
    }
    return dom;
  }

  function delete_view (ev) {
    var row = $(this).closest('.site-row');
    var viewName = row.find('.t.name:first').text( );
    var siteName = $('#Inspector').find('.v.name:first').text( );
    var opts = {
      url: '/account/sites/' + siteName + '/views/' + viewName
    , method: 'delete'
    };

    function done (data, status, xhr) {
      row.remove( );
    }
    $.ajax(opts).done(done);
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

  function env_config (env) {
    var enabled = [null].concat((env.ENABLE || '').split(' '));
    var config = { };
    var known = [
        'careportal' , 'rawbg' , 'iob' , 'cob'
      , 'bwp' , 'cage' , 'delta'
      , 'direction' , 'upbat' , 'ar2'
      , 'simplealarms' , 'errorcodes' , 'treatmentnotify'
      , 'basal' , 'pushover' , 'maker'
      ];
    var field;
    for (var i in known) {
      field = known[i];
      if (enabled.indexOf(field) > 0) {
        config[field] = true;
      }
    }
    return config;
  }

  $(document).ready(function ( ) {
    // app.mainView = new app.MainView();
    console.log('sites ready');
    $('.toggle-check').each(function ( ) {
      var elem = $(this);
      elem.bootstrapSwitch(
        {
          onText: elem.data('on')
        , offText: elem.data('off')
        }
      );
    });
    $('.chosen-select').each(function ( ) {
      var elem = $(this);
      elem.chosen({
        width: elem.data('width') || '91%'
      });
    });
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
      if (body && body.site) {
        fill_details($(this), body.site);
        // fill_details($(this), body);
        $('#Details').trigger('show.bs.modal');
      }
    });

    var views = $('#views-list');
    views.on('loaded', function (ev, data) {
      console.log('loaded', views, data);
      var body = views.find('.body');
      if (data) {
        var template = viewTemplate(views.find('.template TR').clone(true).removeClass('template'));
        data.map(function (site, i) {
          site.number = i;
          var elem = template(site, i);
          body.append(elem);
        });
      }

    });

    var overview = $('#Overview');
    overview.on('loaded', function (ev, data) {
      var api = overview.data('ajax-target');
      var config = env_config(data.custom_env);
      data.config = config;
      console.log("CONFIG", api, config);
      if (data && data.state) {
        fill_editor(overview, data);
        fill_editor(overview, data.custom_env);
        console.log('updated', overview);
      }
      overview.off('change switchChange.bootstrapSwitch')
        .on('change switchChange.bootstrapSwitch', '.panel :input', data,
      function (ev, state) {
        console.log("changing", ev, ev.target);
        var target = $(ev.target);
        var name = target.attr('name') || target.data('field-name');
        console.log('name', name, target.attr('class'), target.val( ), state);
        var payload = { };
        payload[name] = target.is('.toggle-check') ? state : target.val( );
        if (target.is('.binary-data-label')) {
          console.log(',,', target.data('on'), target.data('off'), target.attr('data-off'));
          console.log('target binarydata', target, target.attr('data-off'));
          payload[name] = (state ? target.data('on') : target.data('off')).toString( ).toLowerCase( );
        }
        if (target.is('.binary-data-on-off')) {
          payload[name] = state ? 'on' : 'off';
        }
        if (target.is('.alarm_type')) {
          name = 'ALARM_TYPES';
          payload = { };
          var alarms = [ ];
          target.closest('.configure_alarms').find('.alarm_type:checked').each(function ( ) {
            alarms.push($(this).val( ));
          });
          
          payload[name] = ' ' + alarms;
        }
        if (target.is('.enabler')) {
          name = 'ENABLE';
          payload = { };
          var enabled = ['',  ];
          overview.find('.enabler:checked').each(function ( ) {
            enabled.push($(this).val( ));
          });
          payload[name] = ' ' + enabled.join(' ');
        }
        var url = api + '/' + name;
        console.log('payload', payload, url);
        if (name) {
          $.post(url, payload, function (body, status, xhr) {
             console.log("SAVED RESULTS!", body, status);
             overview.trigger('ns.saved', [body]);
          });
          
        }
      });
    });
    var pebble = $('#Pebble').on('loaded', function (ev, data) {
      var body = pebble.find('.list-group');
      if (data) {
        var template = viewTemplate(pebble.find('.pebble-template').clone(true).removeClass('pebble-template'));
        data.map(function (site, i) {
          site.number = i;
          var elem = template(site, i);
          body.append(elem);
        });
      }
    });
    
    root.on('click', 'TR.site-row .delete-site', delete_site);
    $('#Inspector').on('click', '.site-row .delete-view', delete_view);
    root.on('click', '.btn.upload-details', upload_details);
    $('#Details').on('show.bs.modal', function (ev) {
      var button = $(ev.relatedTarget || ev.target);
      var uris = {
        mqtt: button.find('A.mqtt-upload').attr('href')
      , rest: button.find('A.http-upload').attr('href')
      , v1: button.find('A.http-upload').attr('href') + '/'
      , xdrip: button.find('A.http-xdrip-upload').attr('href') + '/'
      };
      var json;
      json = {mqtt: { uri: uris.mqtt }};
      $('#mqtt-upload-qr .code').empty( ).qrcode(JSON.stringify(json));
      $('#mqtt-upload-qr .uri').empty( ).text(uris.mqtt);
      json = {rest: { endpoint: [uris.rest] } };
      $('#http-upload-qr .code').empty( ).qrcode(JSON.stringify(json));
      $('#http-upload-qr .uri').empty( ).text(uris.rest);
      json = {rest: { endpoint: [uris.v1] } };
      console.log('HEy', json);
      $('#http-xdrip-beta-upload-qr .code').empty( ).qrcode(JSON.stringify(json));
      $('#http-xdrip-beta-upload-qr .uri').empty( ).text(uris.v1);
      json = {rest: { endpoint: [uris.xdrip] } };
      $('#http-xdrip-upload-qr .code').empty( ).qrcode(JSON.stringify(json));
      $('#http-xdrip-upload-qr .uri').empty( ).text(uris.xdrip);
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
