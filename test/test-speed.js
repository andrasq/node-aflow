'use strict';

var qflow = require('../index');

module.exports = {
    'repeatUntil 500k': function(t) {
        var n = 0;
        t.expect(2);
        qflow.repeatUntil(
            function(cb) {
                n++;
                cb(null, n >= 500000);
            },
            function(err, flag) {
                t.equal(flag, true);
                t.equal(n, 500000);
                t.done();
            }
        );
    },
};
