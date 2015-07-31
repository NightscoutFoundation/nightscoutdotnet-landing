/* global app:true */


(function() {
  'use strict';

  function get_plan_row (clone) {
    var cloned = clone.clone(true).removeClass('template');
    function iter (item) {
      var dom = cloned.clone(true);
      return fill_plan_details(dom, item);
    }
    return iter;
  }

  function fill_plan_details (dom, item) {
    var prefix = '.p.';
    var selector;
    for (var f in item) {
      selector = prefix + f;
      var fields = dom.find(selector);
      fields.not(':input').text(item[f]);
    }
    dom.find('.p.plan_id').filter('[type="radio"]').val(item.id);
    return dom;
  }

  $(document).ready(function ( ) {
    // app.mainView = new app.MainView();
    console.log('billing ready');

    var checkout = $('#checkout');
    checkout.on('loaded', function (ev, data) {
      console.log(this, data);
      var template = get_plan_row(checkout.find('.template'));
      var tail = checkout.find('.plan-list');
      data.plans.forEach(function (v, i) {
        console.log(i, v);
        // tail.find('TBODY').not('.template').filter(':last').after(template(v));
        tail.append(template(v).find('TR'));
        
      });
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
