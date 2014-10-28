qflow
=====

simple, quick little serial flow control package

## Install

        npm install aflow

or `git clone git://github.com/andrasq/node-aflow`

## Calls

### repeatUntil( function, callback )

keep calling function until it returns a truthy value, then return that value
via callback.

        var aflow = require('aflow');
        var count = 0;
        aflow.repeatUntil(
            function(cb) {
                count += 1;
                var stopNow = count >= 10;
                cb(null, stopNow);
            },
            function(err) {
                console.log("count =", count);
            }
        )
        // => count = 10

### repeatWhile( loopCondition, function, callback )

keep calling function as long as loopCondition holds.

    var aflow = require('aflow');
    var count = 0;
    aflow.repeatWhile(
        function() {
            return count < 10;
        },
        function(cb) {
            count += 1;
            cb();
        },
        function(err) {
            console.log("count =", count);
        }
    )
    // => count = 10

### iterate( functionList, callback )

call each function in turn.  Each function is passed two arguments, a
callback and the returned value from the previous function.  An error
will interrupt the flow.  Callback will be called with the returned
value from the last function, or the error.

        var aflow = require('aflow');
        aflow.iterate([
            function(cb, last) { console.log("first, last", last); cb(null, 1); },
            function(cb, last) { console.log("second, last", last); cb(null, 2); },
            function(cb, last) { console.log("third, last", last); cb(null, 3); }
            ],
            function(err, last) {
                console.log("done, last", last);
            }
        );
        // => first, last undefined
        // => second, last 1
        // => third, last 2
        // => done, last 3
