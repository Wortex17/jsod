/*!
 * jsod
 * https://github.com/wortex17/jsod
 * Created 14.03.2016 by Patrick Michael Hopf
 *
 * Released under The MIT License
 */
"use strict";

var
    util = require('util')
    ;
var
    _ = require('lodash')
    ;
var
    jsod = require('.')
    ;

var obj = {
    int: 42,
    bool: true,
    float: 17.7,
    string: "foobar",
    array: [0,1,2, {x: 'x'}],
    buffer: new Buffer("buffer"),
    date: new Date(99,5,24,11,33,30,0),
    regex: /magpie/i,
    func: function(){return true;},
    null: null,
    child: {
        A: 'a',
        B: 'b',
        C: 'c'
    },
    inf: Infinity,
    ninf: -Infinity,
    nan: NaN,
    typedArray: new Uint8Array(4),
    arrayBuffer: new ArrayBuffer(2)
};
var obj2 = _.extend({}, obj, {
    int: 43,
    string: "mooba",
    newInt: 17,
    float: '17.7',
    array: [0,2,3, {x: 'x', y: 'y'}],
    buffer: new Buffer("buf!e"),/*
    regex: /magpi2e/i,
    func: function(){return true;},
    child: {
        'A': 'A',
        'B': 'b',
        'C': 'c',
        'X': {
            Y: 'y'
        }
    },
    typedArray: new Uint8Array(3),
    arrayBuffer: new ArrayBuffer(3)*/
});
delete obj2.bool;

var obj3 = _.extend({}, obj, {
    int: 41,
    string: "barfoo",
    array: [0,2,2, {x: 'x', y: 'y'}],
    buffer: new Buffer("buff!"),/*
    child: {
        'A': 'a',
        'B': 'B',
        'C': 'c'
    }*/
});
delete obj3.bool;



let t_origin = obj;
let t_changed = obj2;
let t_changed2 = obj3;

let delta = jsod.diff(t_origin, t_changed);
let delta2 = jsod.diff(t_origin, t_changed2);

/*/
console.log(util.inspect(delta, {showHidden: false, depth: null}));
let patched = jsod.patchClone(t_origin, delta);
console.log(patched);
/**/

/*/
console.log(util.inspect(delta, {showHidden: false, depth: null}));
console.log();
console.log(util.inspect(delta2, {showHidden: false, depth: null}));
console.log();
/**/

/*/
let conflicts = [];
let combined = jsod.mergeDeltas(delta, delta2, null, conflicts);
/**/
let conflicts = [];
let combined = jsod.diff3(t_changed, t_origin, t_changed, null, null, conflicts);
/**/
console.log("COMB", util.inspect(combined, {showHidden: false, depth: null}));
console.log("CONF", util.inspect(conflicts, {showHidden: false, depth: null}));
let patched = jsod.patchClone(t_origin, combined);
console.log(patched);
//console.log(patched);
/**/