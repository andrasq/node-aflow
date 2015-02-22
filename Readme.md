aflow
=====

simple, quick little serial flow control package

All functions run sequentially and stop immediately on error.


## Installation

        npm install aflow
        npm test aflow


## Functions

### repeatUntil( repeatedFunction(cb), callback(err, stoppedWithValue) )

Keep calling the repeated function until it returns a truthy value, then
return that value via the callback.  Stops looping on error.  This call is
recursion-safe, it periodically yields to the event loop with setImmediate().
The repeated call must call its callback, the loop will wait indefinitely and
will not time out.

        var aflow = require('aflow');
        var count = 0;
        aflow.repeatUntil(
            function repeated(cb) {
                count += 1;
                if (count < 10) cb(null, false);
                else cb(null, count);
            },
            function whenDone(err, stoppingCount) {
                console.log("stoppingCount = %d, count = %d", stoppingCount, count);
                // => stoppingCount = 10, count = 10
            }
        );

### repeatWhile( loopTest, repeatedFunction(cb), callback(err) )

Keep calling repeated function as long as the loopTest() function returns
truthy.  Stops looping on error.  Any value returned by the repeated function
is ignored.

        var aflow = require('aflow');
        var count = 0;
        aflow.repeatWhile(
            function loopTest() {
                return count < 10;
            },
            function repeated(cb) {
                count += 1;
                cb();
            },
            function whenDone(err) {
                console.log("final count =", count);
                // => final count = 10
            }
        );

### applyVisitor( dataItems, visitorFunction(item, cb), callback(err) )

Invoke the visitor function on each data item in turn.  Stops on error.

    var aflow = require('aflow');
    var visitedItems = [];
    aflow.applyVisitor(
        [1,2,3,4],
        function visitor(item, cb) {
            visitedItems.push(2 * item);
            cb();
        },
        function whenDone(err) {
            // visitedItems = [2,4,6,8];
        }
    );

### iterate( functionList, callback(err, ret1, ret2) )

Call each function on the list.  The functions are passed three arguments, a
callback and the first two returned values from the previous function called.
An error will interrupt the flow.  The when done callback will be called with
the first two returned values from the last function.  On error, the callback
will be called with the error and the first two results returned by the call
that produced the error (if the call returned results).

        var aflow = require('aflow');
        var allArgs = [];
        aflow.iterate([
            function(cb, arg1, arg2) { allArgs.push(arg1); allArgs.push(arg2); cb(null, 1, 11); },
            function(cb, arg1, arg2) { allArgs.push(arg1); allArgs.push(arg2); cb(null, 2, 22,); },
            function(cb, arg1, arg2) { allArgs.push(arg1); allArgs.push(arg2); cb(null, 3, 33, 333); },
            ],
            function(err, arg1, arg2, arg3) {
                allArgs.push(arg1);
                allArgs.push(arg2);
                allArgs.push(arg3);
                // allArgs = [undefined, undefined, 1, 11, 2, 22, 3, 33, undefined]
            }
        );


### reduce( dataItems, subtotal, combineFunction(subtotal, item, cb), callback(err, total) )

Combine all data items with the subtotal using the given combine function.
The result returned from the last combine function becomes the subtotal passed
to the next next combine function.  Stops processing on error and returns the
subtotal so far.  If a combiner function returs a defined subtotal along with
an error object, that subtotal will be the final subtotal returned.

        var aflow = require('aflow');
        aflow.reduce(
            ['a', 'b', 'c', 'd'],
            ':',
            function concatenate(subtotal, item, cb) {
                cb(null, subtotal + item);
            },
            function whenDone(err, total) {
                // total = ":abcd"
            }
        );

### map( dataItems, transformFunction(item, cb), callback(err, transformedItems) )

Apply the transformation to each data item, and return the list of transformed
items.  The transfor function is provided the item and a callback, and should
call its callback with any error and the transformed item.  Stops and returns
the partial results so far on error.  If the transform returns an error object
along with a defined result, it will be included in the partial results.

        var aflow = require('aflow');
        aflow.map(
            [1,2,3,4,5],
            function double(item, cb) {
                cb(null, 2 * item);
            },
            function whenDone(err, items) {
                // items = [2,4,6,8,10]
            }
        );

### filter( dataItems, selectFunction(item, cb), callback(err, selectedItems) )

Evaluate each data item with the select function and return the list of items
that were selected.  The select function is provided the item and a callback,
and should call its callback with any error and a truthy value to select that
item.  If the select function returns an error object along with a truthy
selection flag, the item generating the error will be included in the partial
results.

        var aflow = require('aflow');
        aflow.filter(
            [1,2,3,4,5],
            function oddItems(item, cb) {
                if (item % 2) cb(null, true);
                else cb(null, false);
            },
            function whenDone(err, items) {
                // items = [1,3,5]
            }
        );

## ChangeLog

0.9.0

- document all calls
- better unit test coverage
- allow applyVisitor() to iterate any object with a numeric length, eg `arguments` or a `Buffer`

## Todo

- benchmark the speed of each of the primitives
