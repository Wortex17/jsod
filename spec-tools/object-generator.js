"use strict";
let _ = require('lodash');

exports.bool = function(){
    return true;
};
exports.int = function(){
    return 42;
};
exports.float = function(){
    return 3.1415;
};
exports.inf = function(){
    return Infinity;
};
exports.ninf = function(){
    return -Infinity;
};
exports.nan = function(){
    return NaN;
};
exports.string = function(){
    return "foobar";
};
exports.buffer = function(){
    return new Buffer("buffer");
};
exports.typedArray = function(){
    return new Uint8Array(4);
};
exports.arrayBuffer = function(){
    return new ArrayBuffer(2);
};
exports.date = function(){
    return new Date(99,5,24,11,33,30,0);
};
exports.regex = function(){
    return /regex/i;
};
exports.func = function(){
    return function(){return true;};
};
exports.null = function(){
    return null;
};

//Nestable Collection types
exports.object = function(){
    let obj =  {};

    _.forEach(arguments, function(child, key)
    {
        if(_.isFunction(child) && _.includes(exports, child))
        {
            obj[child.methodName] = child();
        } else {
            obj[key] = child;
        }
    });

    return obj;
};

exports.array = function(){
    let array = [];

    _.forEach(arguments, function(child, key)
    {
        if(_.isFunction(child) && _.includes(exports, child))
        {
            array.push(child());
        } else {
            array.push(child);
        }
    });

    return array;
};


_.forEach(exports, function(method, methodName){
    method.isSimpleGen = true;
});

//Shorthands
exports.abc = function(){
    return {
        A: 'a',
        B: 'b',
        C: 'c'
    };
};

_.forEach(exports, function(method, methodName){
    method.methodName = methodName;
});

// Iterator
exports.forEachSimple = function(callback){
    _.forEach(exports, function(method, methodName){
        if(method.isSimpleGen)
        {
            callback(method, methodName);
        }
    });
};