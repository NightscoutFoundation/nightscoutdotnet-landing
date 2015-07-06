
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
      var base = '//' + item.name + '-login.diabetes.watch';
      clone.find('IMG.status').attr('src', base + '/api/v1/status.png');
      clone.find('A.v.view').attr('href', base + '/');
      clone.find('A.v.clock-mode').attr('href', base + '/clock.html');
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
  });
}( ));
