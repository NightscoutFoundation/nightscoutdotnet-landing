
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

  $(document).ready(function() {
    // app.mainView = new app.MainView();
    console.log('sites ready');
    $.get('/account/sites/list.json', function (body, status, xhr) {
      console.log('args', arguments);
      console.log('body', body);
      console.log('xhr', xhr);
      var template = cloner($('TBODY.template-site TR').clone(true));
      var root = $('#site-list');
      body.map(function (site) {
        var elem = template(site);
        root.append(elem);

      });
    });
  });
}());
