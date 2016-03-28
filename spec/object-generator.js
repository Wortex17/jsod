"use strict";

let _ = require('lodash');
let chai = require('chai');
let expect = chai.expect;
let gen = require('../spec-tools/object-generator');

describe('Self-Test: Object Generator', function() {

    describe('#bool()', function() {
        it('should return a boolean', function() {
            expect(gen.bool()).to.be.a('boolean');
        });
    });
    describe('#int()', function() {
        it('should return a number', function() {
            expect(gen.int()).to.satisfy(_.isInteger);
        });
    });
    describe('#float()', function() {
        it('should return a number', function() {
            expect(gen.float()).to.satisfy(function nonIntegerNumber(a){return _.isNumber(a) && !_.isInteger(a)});
        });
    });
    describe('#nan()', function() {
        it('should return a NaN', function() {
            expect(gen.nan()).to.satisfy(_.isNaN);
        });
    });
    describe('#string()', function() {
        it('should return a string', function() {
            expect(gen.string()).to.be.a('string');
        });
    });
    describe('#buffer()', function() {
        it('should return a buffer', function() {
            expect(gen.buffer()).to.satisfy(_.isBuffer);
        });
    });
    describe('#typedArray()', function() {
        it('should return a typedArray', function() {
            expect(gen.typedArray()).to.satisfy(_.isTypedArray);
        });
    });
    describe('#arrayBuffer()', function() {
        it('should return an arrayBuffer', function() {
            expect(gen.arrayBuffer()).to.satisfy(_.isArrayBuffer);
        });
    });
    describe('#date()', function() {
        it('should return a date', function() {
            expect(gen.date()).to.be.a('date');
        });
    });
    describe('#regex()', function() {
        it('should return a regex', function() {
            expect(gen.regex()).to.satisfy(_.isRegExp);
        });
    });
    describe('#func()', function() {
        it('should return a function', function() {
            expect(gen.func()).to.be.a('function');
        });
    });
    describe('#null()', function() {
        it('should return a null', function() {
            expect(gen.null()).to.be.a('null');
        });
    });
    describe('#array()', function() {
        it('should return an array', function() {
            expect(gen.array()).to.be.a('array');
        });
    });
    describe('#array(object-generator...)', function() {
        it('should contain generated children', function() {
            let result = gen.array(gen.int);
            expect(result).to.be.a('array');
            expect(result).to.deep.equal([gen.int()]);
        });
    });
    describe('#object()', function() {
        it('should return an object', function() {
            expect(gen.object()).to.be.a('object');
        });
    });
    describe('#object(object-generator...)', function() {
        it('should contain generated children', function() {
            let result = gen.object(gen.int);
            expect(result).to.be.a('object');
            expect(result).to.deep.equal({
                'int': gen.int()
            });
        });
        it('handle nested generated children', function() {
            let result = gen.object(gen.int);
            expect(result).to.be.a('object');
            expect(result).to.deep.equal({
                'int': gen.int()
            });
        });
    });
});
