'use strict';

var qflow = require('../index');

function uniqid() {
    return Math.floor(Math.random() * 0x1000000).toString(16);
}

module.exports = {
    'should include file': function(t) {
        t.ok(qflow.repeatUntil);
        t.done();
    },

    'repeatUntil': {
        'should trap errors and return them in callback': function(t) {
            t.expect(2);
            qflow.repeatUntil(
                function(cb) {
                    throw new Error("die");
                },
                function(err, last) {
                    t.ok(err);
                    t.equal(err.message, "die");
                    t.done();
                }
            );
        },

        'should stop looping when visitor returns truthy': function(t) {
            var nloops = 0;
            var id = uniqid();
            t.expect(2);
            qflow.repeatUntil(
                function(cb) {
                    cb(false, ++nloops >= 10 ? id : false);
                },
                function(err, last) {
                    t.equal(last, id, "expected to see value that stopped loop");
                    t.equal(nloops, 10, "expected 10 loopp iterations");
                    t.done();
                }
            );
        },

        'should not overflow stack': function(t) {
            t.expect(1);
            var nloops = 0;
            qflow.repeatUntil(
                function(cb) {
                    cb(false, ++nloops > 20000);
                },
                function(err, last) {
                    t.ok(nloops == 20001);
                    t.done();
                }
            );
        }
    },
};
