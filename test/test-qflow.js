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

    'should parse package.json': function(t) {
        require('../package.json');
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
                    t.ok(err instanceof Error);
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
        },

        'should re-throw subsequent func errors': function(t) {
            t.expect(2);
            try {
                qflow.repeatUntil(
                    function(cb) {
                        cb(new Error("first error"));
                        throw new Error("second error");
                    },
                    function(err) {
                        t.equal(err.message, "first error");
                    }
                );
            }
            catch (err) {
                t.equal(err.message, "second error");
                t.done();
            }
        },

        'should re-throw callback errors': function(t) {
            t.expect(1);
            try {
                qflow.repeatUntil(
                    function(cb) {
                        cb(null, true);
                    },
                    function(err) {
                        throw new Error("callback error");
                    }
                );
            }
            catch (err) {
                t.equal(err.message, "callback error");
                t.done();
            }
        },
    },

    'repeatWhile': {
        'should test loop condition at top': function(t) {
            var ncalls = 0;
            t.expect(1);
            qflow.repeatWhile(
                function() { return false; },
                function(next) { ncalls += 1; next(); },
                function(err) {
                    t.equal(ncalls, 0);
                    t.done();
                }
            );
        },

        'should loop n times': function(t) {
            var ncalls = 0;
            t.expect(1);
            qflow.repeatWhile(
                function() { return ncalls < 1234; },
                function(next) { ncalls += 1; next(); },
                function(err) {
                    t.equal(ncalls, 1234);
                    t.done();
                }
            );
        },

        'should stop loop on error': function(t) {
            var ncalls = 0;
            t.expect(3);
            qflow.repeatWhile(
                function() { return ncalls < 1234; },
                function(next) { ncalls += 1; if (ncalls < 111) next(); else throw new Error("stop at 111"); },
                function(err) {
                    t.equal(ncalls, 111);
                    t.ok(err instanceof Error);
                    t.equal(err.message, "stop at 111");
                    t.done();
                }
            );
        },
    },

    'applyVisitor': {
        'should call visitor with each item': function(t) {
            var visited = [];
            qflow.applyVisitor(
                [1,2,3,4],
                function(item, cb) {
                    visited.push(item);
                    cb();
                },
                function(err) {
                    t.deepEqual(visited, [1,2,3,4]);
                    t.done();
                }
            );
        },

        'should return error and stop looping on error': function(t) {
            var visited = [];
            t.expect(3);
            qflow.applyVisitor(
                [1,2,3,4],
                function(item, cb) {
                    visited.push(item);
                    if (item == 3) throw new Error("stop at 3");
                    cb();
                },
                function(err) {
                    t.deepEqual(visited, [1,2,3]);
                    t.ok(err instanceof Error);
                    t.equal(err.message, "stop at 3");
                    t.done();
                }
            );
        },
    },

    'iterate': {
        'should call each function': function(t) {
            var items = [];
            t.expect(1);
            qflow.iterate([
                function(cb) { items.push(1); cb() },
                function(cb) { items.push(2); cb() },
                function(cb) { items.push(3); cb() },
                ],
                function(err) {
                    t.deepEqual(items, [1,2,3]);
                    t.done();
                }
            );
        },

        'should pass previous result to each next function and return the last result': function(t) {
            var args = [];
            t.expect(3);
            qflow.iterate([
                function(cb, arg, arg2) { args.push(arg); args.push(arg2); cb(null, 1, 11); },
                function(cb, arg, arg2) { args.push(arg); args.push(arg2); cb(null, 2, 22); },
                function(cb, arg, arg2) { args.push(arg); args.push(arg2); cb(null, 3, 33); },
                ],
                function(err, arg, arg2) {
                    t.deepEqual(args, [undefined, undefined, 1, 11, 2, 22]);
                    t.equal(arg, 3);
                    t.equal(arg2, 33);
                    t.done();
                }
            );
        },

        'should stop on error': function(t) {
            var items = [];
            t.expect(3);
            qflow.iterate([
                function(cb) { items.push(1); cb(); },
                function(cb) { items.push(2); throw new Error("stop at 2"); cb() },
                function(cb) { items.push(3); cb() },
                ],
                function(err) {
                    t.deepEqual(items, [1,2]);
                    t.ok(err instanceof Error);
                    t.equal(err.message, "stop at 2");
                    t.done();
                }
            );
        },
    },

    'reduce': {
        'should combine items': function(t) {
            var items = [1,2,3,4,5];
            t.expect(1);
            qflow.reduce(
                items,
                '',
                function(total, item, cb) {
                    total += '.' + item;
                    cb(null, total);
                },
                function(err, final) {
                    t.equal(final, '.1.2.3.4.5');
                    t.done();
                }
            );
        },

        'returns errors along with partial results': function(t) {
            var items = [1,2,3,4,5];
            t.expect(3);
            qflow.reduce(
                items,
                '',
                function(total, item, cb) {
                    if (item === 3) throw new Error("err at 3");
                    total += '.' + item;
                    cb(null, total);
                },
                function(err, final) {
                    t.ok(err instanceof Error);
                    t.equal(err.message, "err at 3");
                    t.equal(final, ".1.2");
                    t.done();
                }
            );
        },
    },

    'map': {
        'should apply function to all items': function(t) {
            var items = [1,2,3,4];
            t.expect(1);
            qflow.map(
                items,
                function(item, cb) { cb(null, item + item); },
                function(err, mapped) {
                    t.deepEqual(mapped, [2,4,6,8]);
                    t.done();
                }
            );
        },

        'should return error and partial results': function(t) {
            var items = [1,2,3,4];
            t.expect(3);
            qflow.map(
                items,
                function(item, cb) { if (item === 3) throw new Error("three"); else cb(null, item + item); },
                function(err, mapped) {
                    t.deepEqual(mapped, [2,4]);
                    t.ok(err instanceof Error);
                    t.equal(err.message, "three");
                    t.done();
                }
            );
        },

        'should include a defined item that came with error': function(t) {
            var items = [1,2,3,4];
            t.expect(1);
            qflow.map(
                items,
                function(item, cb) { cb((item === 3 ? new Error("three") : null), item); },
                function(err, mapped) {
                    t.equal(mapped[2], 3);
                    t.done();
                }
            );
        },
    },

    'filter': {
        'should return array of items selected by filter function': function(t) {
            var items = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];
            t.expect(1);
            qflow.filter(
                items,
                function(item, cb) {
                    // odd multiples of 3
                    var yesInclude = (item % 2) && (item % 3 == 0)
                    cb(null, yesInclude);
                },
                function(err, found) {
                    t.deepEqual(found, [3, 9, 15]);
                    t.done();
                }
            );
        },

        'should return any errors': function(t) {
            var items = [1,2,3,4];
            t.expect(3);
            qflow.filter(
                items,
                function(item, cb) { if (item == 3) throw new Error("err on 3"); cb(null, true); },
                function(err, found) {
                    t.ok(err instanceof Error);
                    t.equal(err.message, "err on 3");
                    t.deepEqual(found, [1,2]);
                    t.done();
                }
            );
        },

        'should include a defined item that came with error': function(t) {
            var items = [1,2,3,4];
            t.expect(1);
            qflow.filter(
                items,
                function(item, cb) { cb((item === 3 ? new Error("three") : null), item); },
                function(err, picked) {
                    t.equal(picked[2], 3);
                    t.done();
                }
            );
        },
    },
};
