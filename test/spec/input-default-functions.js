'use strict';

var _ = require('underscore');
var JuttleMoment = require('../../lib/runtime/types/juttle-moment');
var Filter = require('../../lib/runtime/types/filter');

function computeListDefault(input) {
    var items = input.options.items;
    var multi = input.options.multi;

    if (items && items.length > 0) {
        var item = items[0];
        var firstValue = _.isUndefined(item.value) || _.isUndefined(item.label) ? item : item.value;
        return multi ? [firstValue] : firstValue;
    } else {
        return multi ? [] : '';
    }
}

module.exports = {
    text: function() {
        return '';
    },

    number: function() {
        return 0;
    },

    date: function() {
        return new JuttleMoment({rawDate : new Date()});
    },

    duration: function() {
        return JuttleMoment.duration('1h');
    },

    filter: function() {
        return Filter.PASS_ALL;
    },

    dropdown: computeListDefault,
    combobox: computeListDefault
};
