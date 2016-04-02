"use strict";

let
    _ = require('lodash')
    ,chai = require('chai')
    ,expect = chai.expect
    ;

let gen = require('../spec-tools/object-generator');

let jsod = require('../');


describe('jsod#patch()', function() {

    describe("Simple patches", function(){
        _.forEach(gen, function(generator){
            if(!generator.isAlternate && !_.isUndefined(generator.alternate))
            {
                if(generator == gen.abcArray)
                {
                    describeUnorderedPatchEquality(generator, generator.methodName+'s');
                } else {
                    describeSimplePatchEquality(generator, generator.methodName+'s');
                }
            }
        })
    });

    describe("Cross-type patch", function(){
        let O = gen.int();
        let A = gen.string();
        let delta = jsod.diff(O, A);

        it("should make int O to string O that equals string A", function(){
            let patched = jsod.patch(O, delta);
            if(_.isArray(patched) && _.isArray(A))
            {
                patched.sort();
                A.sort();
            }

            expect(patched).to.deep.equal(A);
        });
    });

    describeOrderedListPatchSuite();

    describe("mutate target by patching", function() {
        context("when using jsod#patch()", function(){

            let O = gen.abcObject();
            let A = gen.abcObjectAlt();
            let diff = jsod.diff(O, A);
            let patched = jsod.patch(O, diff);

            it("should mutate O", function(){
                expect(O).to.not.deep.equal(gen.abcObject());
            });

            it("should return O", function(){
                expect(patched).to.equal(O);
            });
        });

        context("when using jsod#patchClone()", function(){

            let O = gen.abcObject();
            let A = gen.abcObjectAlt();
            let diff = jsod.diff(O, A);
            let patched = jsod.patchClone(O, diff);

            it("should mutate O", function(){
                expect(O).to.deep.equal(gen.abcObject());
            });

            it("should return O", function(){
                expect(patched).to.not.equal(O);
            });
        });
    });

});

function nest(object, nestDepth)
{
    let pivot = object;
    for(let i = 0; i < nestDepth; i++)
    {
        let nPivot = {};
        if(!_.isUndefined(object))
        {
            nPivot['lvl'+(nestDepth-i)] = pivot;
        }
        pivot = nPivot;
    }
    return pivot;
}

function describeSimplePatchEquality(generator, readableName)
{
    describe('when patching ' + readableName, function(){
        equality(nest(generator(), 0), nest(generator.alternate(), 0));
    });
    describe('when patching ' + readableName+" nested in object", function(){
        equality(nest(generator(), 1), nest(generator.alternate(), 1));
    });
    describe('when patching ' + readableName+" nested in object in object", function(){
        equality(nest(generator(), 2), nest(generator.alternate(), 2));
    });

    function equality(O, A)
    {
        let delta = jsod.diff(O, A);
        it("should make O deep equal to A", function(){
            let patched = jsod.patch(O, delta);
            expect(patched).to.satisfy(function deepEqual(){
                return _.isEqual(patched, A);
            });
        });
    }
}

function describeUnorderedPatchEquality(generator, readableName)
{
    describe('when patching ' + readableName, function(){
        equality(nest(generator(), 0), nest(generator.alternate(), 0));
    });
    describe('when patching ' + readableName+" nested in object", function(){
        equality(nest(generator(), 1), nest(generator.alternate(), 1));
    });
    describe('when patching ' + readableName+" nested in object in object", function(){
        equality(nest(generator(), 2), nest(generator.alternate(), 2));
    });

    function equality(O, A)
    {
        let delta = jsod.diff(O, A);
        it("should make O deep equal to A", function(){
            let patched = jsod.patch(O, delta);
            expect(patched).to.satisfy(function deepEqual(){
                return _.isEqualWith(patched, A, function(objValue, othValue){
                    if (_.isFunction(objValue.sort) && _.isFunction(othValue.sort)) {
                        return _.isEqual(objValue.sort(), othValue.sort());
                    }
                });
            });
        });
    }
}

function describeOrderedListPatchSuite()
{
    describe("patching buffers as ordered list", function() {

        let testCompilation = [
            //These tests actually test that the structural patch also works correctly on ordered valuelists
            [shouldMakeOeqA, 'when empty list has been set',  undefined, new Buffer('')],
            [shouldMakeOeqA, 'when non-empty list has been set', undefined, new Buffer('a')],
            [shouldMakeOeqA, 'when empty list has been deleted', new Buffer(''), undefined],
            [shouldMakeOeqA, 'when non-empty list has been deleted', new Buffer('a'), undefined],
            //The next tests are specific for ordered list diffing
            [shouldMakeOeqA, 'when empty list was not changed', new Buffer(''), new Buffer('')],
            [shouldMakeOeqA, 'when non-empty list was not changed', new Buffer('a'), new Buffer('a')],
            [shouldMakeOeqA, 'when list contents were reordered', new Buffer('ab'), new Buffer('ab')],
            [shouldMakeOeqA, 'when list contents were added to empty list', new Buffer(''), new Buffer('a')],
            [shouldMakeOeqA, 'when list contents were added at the end', new Buffer('b'), new Buffer('ba')],
            [shouldMakeOeqA, 'when duplicates of list contents were added', new Buffer('a'), new Buffer('aa')],
            [shouldMakeOeqA, 'when list contents were deleted', new Buffer('a'), new Buffer('')],
            [shouldMakeOeqA, 'when list contents were deleted at the end', new Buffer('ba'), new Buffer('b')],
            [shouldMakeOeqA, 'when one of duplicate list contents were deleted at the end', new Buffer('aa'), new Buffer('a')],
            [shouldMakeOeqA, 'when one of duplicate list contents aside non-dupes were deleted at the end', new Buffer('baa'), new Buffer('ba')],
            [shouldMakeOeqA, 'when list contents were replaced', new Buffer('a'), new Buffer('b')],
            [shouldMakeOeqA, 'when list contents were added at the front', new Buffer('b'), new Buffer('ab')]
        ];
        describe("direct buffer", function() {
            _.forEach(testCompilation, function(test){
                test[0](test[1], test[2], test[3]);
            });
        });
        describe("buffer nested in object", function() {
            _.forEach(testCompilation, function(test){
                if(test[0] == shouldMakeOeqA)
                {
                    test[0](test[1], nest(test[2], 1), nest(test[3], 1), 1);
                }
            });
        });
        describe("buffer nested in object in object", function() {
            _.forEach(testCompilation, function(test){
                if(test[0] == shouldMakeOeqA)
                {
                    test[0](test[1], nest(test[2], 2), nest(test[3], 2), 2);
                }
            });
        });
    });
    describe("patching typedArrays as ordered list", function() {

        let testCompilation = [
            //These tests actually test that the structural patch also works correctly on ordered valuelists
            [shouldMakeOeqA, 'when empty list has been set',  undefined, new Uint8Array([])],
            [shouldMakeOeqA, 'when non-empty list has been set', undefined, new Uint8Array([65])],
            [shouldMakeOeqA, 'when empty list has been deleted', new Uint8Array([]), undefined],
            [shouldMakeOeqA, 'when non-empty list has been deleted', new Uint8Array([65]), undefined],
            //The next tests are specific for ordered list diffing
            [shouldMakeOeqA, 'when empty list was not changed', new Uint8Array([]), new Uint8Array([])],
            [shouldMakeOeqA, 'when non-empty list was not changed', new Uint8Array([65]), new Uint8Array([65])],
            [shouldMakeOeqA, 'when list contents were reordered', new Uint8Array([65, 66]), new Uint8Array([65, 66])],
            [shouldMakeOeqA, 'when list contents were added to empty list', new Uint8Array([]), new Uint8Array([65])],
            [shouldMakeOeqA, 'when list contents were added at the end', new Uint8Array([66]), new Uint8Array([66, 65])],
            [shouldMakeOeqA, 'when duplicates of list contents were added', new Uint8Array([65]), new Uint8Array([65, 65])],
            [shouldMakeOeqA, 'when list contents were deleted', new Uint8Array([65]), new Uint8Array([])],
            [shouldMakeOeqA, 'when list contents were deleted at the end', new Uint8Array([66, 65]), new Uint8Array([66])],
            [shouldMakeOeqA, 'when one of duplicate list contents were deleted at the end', new Uint8Array([65, 65]), new Uint8Array([65])],
            [shouldMakeOeqA, 'when one of duplicate list contents aside non-dupes were deleted at the end', new Uint8Array([66, 65, 65]), new Uint8Array([66, 65])],
            [shouldMakeOeqA, 'when list contents were replaced', new Uint8Array([65]), new Uint8Array([66])],
            [shouldMakeOeqA, 'when list contents were added at the front', new Uint8Array([66]), new Uint8Array([65, 66])]
        ];
        describe("direct typedArray", function() {
            _.forEach(testCompilation, function(test){
                test[0](test[1], test[2], test[3]);
            });
        });
        describe("typedArray nested in object", function() {
            _.forEach(testCompilation, function(test){
                if(test[0] == shouldMakeOeqA)
                {
                    test[0](test[1], nest(test[2], 1), nest(test[3], 1), 1);
                }
            });
        });
        describe("typedArray nested in object in object", function() {
            _.forEach(testCompilation, function(test){
                if(test[0] == shouldMakeOeqA)
                {
                    test[0](test[1], nest(test[2], 2), nest(test[3], 2), 2);
                }
            });
        });
    });


    function shouldMakeOeqA(contextDesc, O, A)
    {
        context(contextDesc, function () {
            it("should make O deep equal to A", function(){
                let diff = jsod.diff(O, A);
                let patched = jsod.patch(O, diff);
                expect(patched).to.deep.equal(A);
            });
        });
    }
}