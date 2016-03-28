"use strict";
let _ = require('lodash');

exports.bool = function(){
    return true;
};
exports.boolAlt = function(){
    return false;
};
exports.int = function(){
    return 42;
};
exports.intAlt = function(){
    return 73;
};
exports.float = function(){
    return 3.1415;
};
exports.floatAlt = function(){
    return 2.718;
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
    return "string";
};
exports.stringAlt = function(){
    return "foobar";
};
exports.date = function(){
    return new Date(99,5,24,11,33,30,0);
};
exports.dateAlt = function(){
    return new Date(90,5,12,2,1,20,0);
};
exports.regex = function(){
    return /regex/i;
};
exports.regexAlt = function(){
    return /alternative/i;
};
function funcReturn(){return true;}
function funcAltReturn(){return true;}
exports.func = function(){
    return funcReturn;
};
exports.funcAlt = function(){
    return funcAltReturn;
};
exports.null = function(){
    return null;
};


_.forEach(exports, function(method, methodName){
    method.isPrimitiveGen = true;
});


exports.buffer = function(){
    return new Buffer("buffer");
};
exports.bufferAlt = function(){
    return new Buffer("wavvah");
};
exports.typedArray = function(){
    return new Uint8Array(4);
};
exports.arrayBuffer = function(){
    return new ArrayBuffer(2);
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
exports.array.isValuelist = true;

//Shorthands
exports.abcObject = function(){
    return {
        A: 'a',
        B: 'b',
        C: 'c'
    };
};
exports.abcObjectAlt = function(){
    return {
        A: 'A',
        B: 'B',
        C: 'C'
    };
};
exports.abcArray = function(){
    return ['a', 'b', 'c'];
};
exports.abcArray.isValuelist = true;
exports.abcArrayAlt = function(){
    return ['A', 'B', 'C'];
};
exports.abcArrayAlt.isValuelist = true;

_.forEach(exports, function(method, methodName){
    method.isSimpleGen = true;
    if(methodName.substr(-3) == 'Alt')
    {
        method.isAlternate = true;
    }
    let alternative = methodName + 'Alt';
    alternative = exports[alternative];
    if(_.isFunction(alternative))
    {
        method.alternate = alternative;
    }
});

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