"use strict";

let
    _ = require('lodash')
    ,chai = require('chai')
    ,expect = chai.expect
    ;

let gen = require('../spec-tools/object-generator');

let jsod = require('../');


describe('jsod#diff()', function() {

    describeValueTypeDiffSuite("booleans", gen.bool, gen.boolAlt);
    describeValueTypeDiffSuite("integers", gen.int, gen.intAlt);
    describeValueTypeDiffSuite("decimals", gen.float, gen.floatAlt);
    describeValueTypeDiffSuite("infinity", gen.inf, gen.ninf);
    describeValueTypeDiffSuite("integers", gen.int, gen.intAlt);
    describeValueTypeDiffSuite("strings", gen.string, gen.stringAlt);
    describeValueTypeDiffSuite("dates", gen.date, gen.dateAlt);
    describeValueTypeDiffSuite("regex", gen.regex, gen.regexAlt);
    //describeValueTypeDiffSuite("functions", gen.func, gen.funcAlt);

    describeUnorderedValuelistDiffSuite();
    describeOrderedListDiffSuite();

});

function nest(object, nestDepth)
{
    let pivot = object;
    for(let i = 0; i < nestDepth; i++)
    {
        pivot = {['lvl'+(nestDepth-i)]: pivot};
    }
    return pivot;
}

function describeOrderedListDiffSuite()
{
    describe("diffing arrays as ordered list", function() {

        let testCompilation = [
            //These tests actually test that the structural diff also works correctly on unordered valuelists
            [whenListHasBeenSet, 'when empty list has been set',  undefined, []],
            [whenListHasBeenSet, 'when non-empty list has been set', undefined, ['a']],
            [whenListHasBeenDeleted, 'when empty list has been deleted', [], undefined],
            [whenListHasBeenDeleted, 'when non-empty list has been deleted', ['a'], undefined],
            //The next tests are specific for ordered list diffing
            [whenListWasNotChanged, 'when empty list was not changed', [], []],
            [whenListWasNotChanged, 'when non-empty list was not changed', ['a'], ['a']],
            [whenListWasReordered, 'when list contents were reordered', ['a', 'b'], ['b', 'a']],
            [whenListContentWasAdded, 'when list contents were added to empty list', [], ['a']],
            [whenListContentWasAdded, 'when list contents were added at the end', ['b'], ['b', 'a']],
            [whenListContentWasAdded, 'when duplicates of list contents were added', ['a'], ['a', 'a']],
            [whenListContentWasDeleted, 'when list contents were deleted', ['a'], []],
            [whenListContentWasDeleted, 'when list contents were deleted at the end', ['b', 'a'], ['b']],
            [whenListContentWasDeleted, 'when one of duplicate list contents were deleted at the end', ['a', 'a'], ['a']],
            [whenListContentWasDeleted, 'when one of duplicate list contents aside non-dupes were deleted at the end', ['b', 'a', 'a'], ['b', 'a']],
            [whenListContentWasReplaced, 'when list contents were replaced', ['a'], ['b']],
            [whenListContentWasModifiedAndAdded, 'when list contents were added at the front', ['b'], ['a', 'b']]
        ];
        describe("direct array", function() {
            _.forEach(testCompilation, function(test){
                test[0](test[1], test[2], test[3]);
            });
        });
        describe("array nested in object", function() {
            _.forEach(testCompilation, function(test){
                if(test[0] == whenListHasBeenSet || test[0] == whenListHasBeenDeleted)
                {
                    test[0](test[1], nest(test[2], 1), nest(test[3], 1), 1);
                }
            });
        });
        describe("array nested in object in object", function() {
            _.forEach(testCompilation, function(test){
                if(test[0] == whenListHasBeenSet || test[0] == whenListHasBeenDeleted)
                {
                    test[0](test[1], nest(test[2], 2), nest(test[3], 2), 2);
                }
            });
        });
    });


    function whenListHasBeenSet(contextDesc, O, A, depth)
    {
        depth = _.isUndefined(depth) ? 0 : depth;
        context(contextDesc, function () {
            let diff = jsod.diff(O, A);
            let levelname = 'level ??';

            for(let d = 0; d <= depth; d++)
            {
                levelname = (d > 0) ? 'level ' + d : 'root level';

                it('should return a DiffTree object at ' + levelname, function() {
                    expect(diff).to.be.a('object');
                });
                it('should return no conflicts at ' + levelname, function() {
                    expect(diff['!']).to.satisfy(_.isUndefined);
                });
                if(d == depth)
                {
                    it('should return no subtrees at ' + levelname, function () {
                        expect(diff['/']).to.satisfy(_.isUndefined);
                    });
                } else {
                    it('should return no records at ' + levelname, function() {
                        expect(diff['.']).to.satisfy(_.isUndefined);
                    });
                    it('should return one subtree at ' + levelname, function() {
                        expect(diff['/']).to.be.a('object');
                        expect(Object.keys(diff['/'])).to.have.length(1);
                        let keyname = Object.keys(diff['/'])[0];
                        diff = diff['/'][keyname]; // Jump down
                        A = A[keyname];
                        O = O[keyname];
                    });
                }
            }

            it('should return one record at '+levelname, function () {
                expect(diff['.']).to.be.a('array');
                expect(diff['.']).to.have.length(1);
                expect(diff['.'][0]).to.be.a('array');
            });
            if(depth == 0)
            {
                it('should record with undefined key name', function () {
                    expect(diff['.'][0][0]).to.satisfy(_.isUndefined);
                });
            } else {
                it('should record with property name as key name', function () {
                    expect(diff['.'][0][0]).to.equal('lvl'+(depth));
                });
            }
            it('should record an ADD operation', function () {
                expect(diff['.'][0]).to.have.length(3);
                expect(diff['.'][0][1]).to.equal(jsod.Attributes.DeltaOperation.ADD);
            });
            it('should record the new value', function () {
                expect(diff['.'][0][2]).to.satisfy(function deepEqual(x){
                    return _.isEqual(x, A);
                });
            });
        });
    }
    function whenListHasBeenDeleted(contextDesc, O, A, depth)
    {
        depth = _.isUndefined(depth) ? 0 : depth;
        context(contextDesc, function () {
            let diff = jsod.diff(O, A);
            let levelname = 'level ??';

            for(let d = 0; d <= depth; d++)
            {
                levelname = (d > 0) ? 'level ' + d : 'root level';

                it('should return a DiffTree object at ' + levelname, function() {
                    expect(diff).to.be.a('object');
                });
                it('should return no conflicts at ' + levelname, function() {
                    expect(diff['!']).to.satisfy(_.isUndefined);
                });
                if(d == depth)
                {
                    it('should return no subtrees at ' + levelname, function () {
                        expect(diff['/']).to.satisfy(_.isUndefined);
                    });
                } else {
                    it('should return no records at ' + levelname, function() {
                        expect(diff['.']).to.satisfy(_.isUndefined);
                    });
                    it('should return one subtree at ' + levelname, function() {
                        expect(diff['/']).to.be.a('object');
                        expect(Object.keys(diff['/'])).to.have.length(1);
                        let keyname = Object.keys(diff['/'])[0];
                        diff = diff['/'][keyname]; // Jump down
                        A = A[keyname];
                        O = O[keyname];
                    });
                }
            }


            it('should return one record at '+levelname, function () {
                expect(diff['.']).to.be.a('array');
                expect(diff['.']).to.have.length(1);
                expect(diff['.'][0]).to.be.a('array');
            });
            if(depth == 0)
            {
                it('should record with undefined key name', function () {
                    expect(diff['.'][0][0]).to.satisfy(_.isUndefined);
                });
            } else {
                it('should record with property name as key name', function () {
                    expect(diff['.'][0][0]).to.equal('lvl'+(depth));
                });
            }
            it('should record a DELETE operation', function() {
                expect(diff['.'][0][1]).to.equal(jsod.Attributes.DeltaOperation.DELETE);
            });
            it('should not record the changed value', function() {
                expect(diff['.'][0]).to.have.length(2);
                expect(diff['.'][0][2]).to.satisfy(_.isUndefined);
            });
        });
    }
    function whenListWasNotChanged(contextDesc, O, A)
    {
        context(contextDesc, function () {
            let diff = jsod.DiffHandlers.diffAsOrderedList(O, A);

            it('should return a DiffTree object', function() {
                expect(diff).to.be.a('object');
            });
            it('should return no records at root level', function() {
                expect(diff['.']).to.satisfy(_.isUndefined);
            });
            it('should return no subtrees at root level', function() {
                expect(diff['/']).to.satisfy(_.isUndefined);
            });
            it('should return no conflicts at root level', function() {
                expect(diff['!']).to.satisfy(_.isUndefined);
            });
        });
    }
    function whenListWasReordered(contextDesc, O, A)
    {
        context(contextDesc, function () {
            let diff = jsod.DiffHandlers.diffAsOrderedList(O, A);

            it('should return a DiffTree object', function() {
                expect(diff).to.be.a('object');
            });
            it('should return no records at root level', function() {
                expect(diff['.']).to.satisfy(_.isUndefined);
            });
            it('should return no conflicts at root level', function() {
                expect(diff['!']).to.satisfy(_.isUndefined);
            });
            it('should return as many subtrees as there are list entries', function() {
                expect(diff['/']).to.be.a('object');
                expect(Object.keys(diff['/'])).to.have.length(_.size(O));
            });

            describe("for subtree #1", function(){
                let sub = diff['/'][0];

                it('should return a DiffTree object', function() {
                    expect(sub).to.be.a('object');
                });
                it('should return no subtrees', function() {
                    expect(sub['/']).to.satisfy(_.isUndefined);
                });
                it('should return no conflicts', function() {
                    expect(sub['!']).to.satisfy(_.isUndefined);
                });
                it('should return one record at root level', function() {
                    expect(sub['.']).to.be.a('array');
                    expect(sub['.']).to.have.length(1);
                    expect(sub['.'][0]).to.be.a('array');
                });
                it('should record with numeric key name', function() {
                    expect(sub['.'][0][0]).to.satisfy(_.isInteger);
                });
                it('should record a MODIFY operation', function() {
                    expect(sub['.'][0]).to.have.length(3);
                    expect(sub['.'][0][1]).to.equal(jsod.Attributes.DeltaOperation.MODIFY);
                });
                it('should record the new value', function() {
                    expect(sub['.'][0][2]).to.equal('b');
                });
            });
            describe("for subtree #2", function(){
                let sub = diff['/'][1];

                it('should return a DiffTree object', function() {
                    expect(sub).to.be.a('object');
                });
                it('should return no subtrees', function() {
                    expect(sub['/']).to.satisfy(_.isUndefined);
                });
                it('should return no conflicts', function() {
                    expect(sub['!']).to.satisfy(_.isUndefined);
                });
                it('should return one record at root level', function() {
                    expect(sub['.']).to.be.a('array');
                    expect(sub['.']).to.have.length(1);
                    expect(sub['.'][0]).to.be.a('array');
                });
                it('should record with numeric key name', function() {
                    expect(sub['.'][0][0]).to.satisfy(_.isInteger);
                });
                it('should record a MODIFY operation', function() {
                    expect(sub['.'][0]).to.have.length(3);
                    expect(sub['.'][0][1]).to.equal(jsod.Attributes.DeltaOperation.MODIFY);
                });
                it('should record the new value', function() {
                    expect(sub['.'][0][2]).to.equal('a');
                });
            });
        });
    }
    function whenListContentWasAdded(contextDesc, O, A)
    {
        context(contextDesc, function () {
            let diff = jsod.DiffHandlers.diffAsOrderedList(O, A);

            it('should return a DiffTree object', function() {
                expect(diff).to.be.a('object');
            });
            it('should return no records at root level', function() {
                expect(diff['.']).to.satisfy(_.isUndefined);
            });
            it('should return no conflicts at root level', function() {
                expect(diff['!']).to.satisfy(_.isUndefined);
            });
            it('should return as many subtrees as there are new list entries', function() {
                expect(diff['/']).to.be.a('object');
                expect(Object.keys(diff['/'])).to.have.length(_.size(A) - _.size(O));
            });

            describe("subtree #1", function(){
                let key = _.keys(diff['/'])[0];
                let sub = diff['/'][key];

                it('should have a key name that shows an index beyond the size of the original list', function() {
                    expect(key).to.be.at.least(_.size(O));
                });
                it('should return a DiffTree object', function() {
                    expect(sub).to.be.a('object');
                });
                it('should return no subtrees', function() {
                    expect(sub['/']).to.satisfy(_.isUndefined);
                });
                it('should return no conflicts', function() {
                    expect(sub['!']).to.satisfy(_.isUndefined);
                });
                it('should return one record at root level', function() {
                    expect(sub['.']).to.be.a('array');
                    expect(sub['.']).to.have.length(1);
                    expect(sub['.'][0]).to.be.a('array');
                });
                it('should record with numeric key name', function() {
                    expect(sub['.'][0][0]).to.satisfy(_.isInteger);
                });
                it('should record an ADD operation', function() {
                    expect(sub['.'][0]).to.have.length(3);
                    expect(sub['.'][0][1]).to.equal(jsod.Attributes.DeltaOperation.ADD);
                });
                it('should record the new value', function() {
                    expect(sub['.'][0][2]).to.equal('a');
                });
            });
        });
    }
    function whenListContentWasModifiedAndAdded(contextDesc, O, A)
    {
        context(contextDesc, function () {
            let diff = jsod.DiffHandlers.diffAsOrderedList(O, A);

            it('should return a DiffTree object', function() {
                expect(diff).to.be.a('object');
            });
            it('should return no records at root level', function() {
                expect(diff['.']).to.satisfy(_.isUndefined);
            });
            it('should return no conflicts at root level', function() {
                expect(diff['!']).to.satisfy(_.isUndefined);
            });

            describe("subtree #1", function(){
                let key = _.keys(diff['/'])[0];
                let sub = diff['/'][key];

                it('should have a key name that shows an index in bounds of the original list', function() {
                    expect(key).to.be.below(_.size(O));
                });
                it('should return a DiffTree object', function() {
                    expect(sub).to.be.a('object');
                });
                it('should return no subtrees', function() {
                    expect(sub['/']).to.satisfy(_.isUndefined);
                });
                it('should return no conflicts', function() {
                    expect(sub['!']).to.satisfy(_.isUndefined);
                });
                it('should return one record at root level', function() {
                    expect(sub['.']).to.be.a('array');
                    expect(sub['.']).to.have.length(1);
                    expect(sub['.'][0]).to.be.a('array');
                });
                it('should record with numeric key name', function() {
                    expect(sub['.'][0][0]).to.satisfy(_.isInteger);
                });
                it('should record a MODIFY operation', function() {
                    expect(sub['.'][0]).to.have.length(3);
                    expect(sub['.'][0][1]).to.equal(jsod.Attributes.DeltaOperation.MODIFY);
                });
                it('should record the new value', function() {
                    expect(sub['.'][0][2]).to.equal('a');
                });
            });
            describe("subtree #2", function(){
                let key = _.keys(diff['/'])[1];
                let sub = diff['/'][key];

                it('should have a key name that shows an index beyond the size of the original list', function() {
                    expect(key).to.be.at.least(_.size(O));
                });
                it('should return a DiffTree object', function() {
                    expect(sub).to.be.a('object');
                });
                it('should return no subtrees', function() {
                    expect(sub['/']).to.satisfy(_.isUndefined);
                });
                it('should return no conflicts', function() {
                    expect(sub['!']).to.satisfy(_.isUndefined);
                });
                it('should return one record at root level', function() {
                    expect(sub['.']).to.be.a('array');
                    expect(sub['.']).to.have.length(1);
                    expect(sub['.'][0]).to.be.a('array');
                });
                it('should record with numeric key name', function() {
                    expect(sub['.'][0][0]).to.satisfy(_.isInteger);
                });
                it('should record an ADD operation', function() {
                    expect(sub['.'][0]).to.have.length(3);
                    expect(sub['.'][0][1]).to.equal(jsod.Attributes.DeltaOperation.ADD);
                });
                it('should record the new (old but shifted) value', function() {
                    expect(sub['.'][0][2]).to.equal('b');
                });
            });
        });
    }
    function whenListContentWasDeleted(contextDesc, O, A)
    {
        context(contextDesc, function () {
            let diff = jsod.DiffHandlers.diffAsOrderedList(O, A);

            it('should return a DiffTree object', function() {
                expect(diff).to.be.a('object');
            });
            it('should return no records at root level', function() {
                expect(diff['.']).to.satisfy(_.isUndefined);
            });
            it('should return no conflicts at root level', function() {
                expect(diff['!']).to.satisfy(_.isUndefined);
            });
            it('should return as many subtrees as there are missing list entries', function() {
                expect(diff['/']).to.be.a('object');
                expect(Object.keys(diff['/'])).to.have.length(_.size(O) - _.size(A));
            });

            describe("subtree #1", function(){
                let key = _.keys(diff['/'])[0];
                let sub = diff['/'][key];

                it('should have a key name that shows an index beyond the size of the new list', function() {
                    expect(key).to.be.at.least(_.size(A));
                });
                it('should return a DiffTree object', function() {
                    expect(sub).to.be.a('object');
                });
                it('should return no subtrees', function() {
                    expect(sub['/']).to.satisfy(_.isUndefined);
                });
                it('should return no conflicts', function() {
                    expect(sub['!']).to.satisfy(_.isUndefined);
                });
                it('should return one record at root level', function() {
                    expect(sub['.']).to.be.a('array');
                    expect(sub['.']).to.have.length(1);
                    expect(sub['.'][0]).to.be.a('array');
                });
                it('should record with numeric key name', function() {
                    expect(sub['.'][0][0]).to.satisfy(_.isInteger);
                });
                it('should record a (unvalued) DELETE operation', function() {
                    expect(sub['.'][0]).to.have.length(2);
                    expect(sub['.'][0][1]).to.equal(jsod.Attributes.DeltaOperation.DELETE);
                });
            });
        });
    }
    function whenListContentWasReplaced(contextDesc, O, A)
    {
        context(contextDesc, function () {
            let diff = jsod.DiffHandlers.diffAsOrderedList(O, A);

            it('should return a DiffTree object', function() {
                expect(diff).to.be.a('object');
            });
            it('should return no records at root level', function() {
                expect(diff['.']).to.satisfy(_.isUndefined);
            });
            it('should return no conflicts at root level', function() {
                expect(diff['!']).to.satisfy(_.isUndefined);
            });
            it('should return as many subtrees as there are list entries', function() {
                expect(diff['/']).to.be.a('object');
                expect(Object.keys(diff['/'])).to.have.length(_.size(O));
            });

            describe("for subtree #1", function(){
                let sub = diff['/'][0];

                it('should return a DiffTree object', function() {
                    expect(sub).to.be.a('object');
                });
                it('should return no subtrees', function() {
                    expect(sub['/']).to.satisfy(_.isUndefined);
                });
                it('should return no conflicts', function() {
                    expect(sub['!']).to.satisfy(_.isUndefined);
                });
                it('should return one record at root level', function() {
                    expect(sub['.']).to.be.a('array');
                    expect(sub['.']).to.have.length(1);
                    expect(sub['.'][0]).to.be.a('array');
                });
                it('should record with numeric key name', function() {
                    expect(sub['.'][0][0]).to.satisfy(_.isInteger);
                });
                it('should record a MODIFY operation', function() {
                    expect(sub['.'][0]).to.have.length(3);
                    expect(sub['.'][0][1]).to.equal(jsod.Attributes.DeltaOperation.MODIFY);
                });
                it('should record the new value', function() {
                    expect(sub['.'][0][2]).to.equal('b');
                });
            });
        });
    }
}

function describeUnorderedValuelistDiffSuite()
{
    describe("diffing arrays as unordered valuelist", function() {

        let testCompilation = [
            //These tests actually test that the structural diff also works correctly on unordered valuelists
            [whenListHasBeenSet, 'when empty list has been set',  undefined, []],
            [whenListHasBeenSet, 'when non-empty list has been set', undefined, ['a']],
            [whenListHasBeenDeleted, 'when empty list has been deleted', [], undefined],
            [whenListHasBeenDeleted, 'when non-empty list has been deleted', ['a'], undefined],
            //The next tests are specific for unoredered valuelist diffing
            [whenListWasNotChanged, 'when empty list was not changed', [], []],
            [whenListWasNotChanged, 'when non-empty list was not changed', ['a'], ['a']],
            [whenListWasNotChanged, 'when list contents were reordered', ['a', 'b'], ['b', 'a']],
            [whenListContentWasAdded, 'when list contents were added to empty list', [], ['a']],
            [whenListContentWasAdded, 'when list contents were added at the end', ['b'], ['b', 'a']],
            [whenListContentWasAdded, 'when list contents were added at the front', ['b'], ['a', 'b']],
            [whenListContentWasAdded, 'when duplicates of list contents were added', ['a'], ['a', 'a']],
            [whenListContentWasDeleted, 'when list contents were deleted', ['a'], []],
            [whenListContentWasDeleted, 'when one of many list contents were deleted', ['a', 'b'], ['b']],
            [whenListContentWasDeleted, 'when one of duplicate list contents were deleted', ['a', 'a'], ['a']],
            [whenListContentWasDeleted, 'when one of duplicate list contents aside non-dupes were deleted', ['a', 'a', 'b'], ['a', 'b']],
            [whenListContentWasReplaced, 'when list contents were replaced', ['a'], ['b']]
        ];
        describe("direct array", function() {
            _.forEach(testCompilation, function(test){
                test[0](test[1], test[2], test[3]);
            });
        });
        describe("array nested in object", function() {
            _.forEach(testCompilation, function(test){
                if(test[0] == whenListHasBeenSet || test[0] == whenListHasBeenDeleted)
                {
                    test[0](test[1], nest(test[2], 1), nest(test[3], 1), 1);
                }
            });
        });
        describe("array nested in object in object", function() {
            _.forEach(testCompilation, function(test){
                if(test[0] == whenListHasBeenSet || test[0] == whenListHasBeenDeleted)
                {
                    test[0](test[1], nest(test[2], 2), nest(test[3], 2), 2);
                }
            });
        });
    });

    function whenListHasBeenSet(contextDesc, O, A, depth)
    {
        depth = _.isUndefined(depth) ? 0 : depth;
        context(contextDesc, function () {
            let diff = jsod.diff(O, A);
            let levelname = 'level ??';

            for(let d = 0; d <= depth; d++)
            {
                levelname = (d > 0) ? 'level ' + d : 'root level';

                it('should return a DiffTree object at ' + levelname, function() {
                    expect(diff).to.be.a('object');
                });
                it('should return no conflicts at ' + levelname, function() {
                    expect(diff['!']).to.satisfy(_.isUndefined);
                });
                if(d == depth)
                {
                    it('should return no subtrees at ' + levelname, function () {
                        expect(diff['/']).to.satisfy(_.isUndefined);
                    });
                } else {
                    it('should return no records at ' + levelname, function() {
                        expect(diff['.']).to.satisfy(_.isUndefined);
                    });
                    it('should return one subtree at ' + levelname, function() {
                        expect(diff['/']).to.be.a('object');
                        expect(Object.keys(diff['/'])).to.have.length(1);
                        let keyname = Object.keys(diff['/'])[0];
                        diff = diff['/'][keyname]; // Jump down
                        A = A[keyname];
                        O = O[keyname];
                    });
                }
            }

            it('should return one record at '+levelname, function () {
                expect(diff['.']).to.be.a('array');
                expect(diff['.']).to.have.length(1);
                expect(diff['.'][0]).to.be.a('array');
            });
            if(depth == 0)
            {
                it('should record with undefined key name', function () {
                    expect(diff['.'][0][0]).to.satisfy(_.isUndefined);
                });
            } else {
                it('should record with property name as key name', function () {
                    expect(diff['.'][0][0]).to.equal('lvl'+(depth));
                });
            }
            it('should record an ADD operation', function () {
                expect(diff['.'][0]).to.have.length(3);
                expect(diff['.'][0][1]).to.equal(jsod.Attributes.DeltaOperation.ADD);
            });
            it('should record the new value', function () {
                expect(diff['.'][0][2]).to.satisfy(function deepEqual(x){
                    return _.isEqual(x, A);
                });
            });
        });
    }
    function whenListHasBeenDeleted(contextDesc, O, A, depth)
    {
        depth = _.isUndefined(depth) ? 0 : depth;
        context(contextDesc, function () {
            let diff = jsod.diff(O, A);
            let levelname = 'level ??';

            for(let d = 0; d <= depth; d++)
            {
                levelname = (d > 0) ? 'level ' + d : 'root level';

                it('should return a DiffTree object at ' + levelname, function() {
                    expect(diff).to.be.a('object');
                });
                it('should return no conflicts at ' + levelname, function() {
                    expect(diff['!']).to.satisfy(_.isUndefined);
                });
                if(d == depth)
                {
                    it('should return no subtrees at ' + levelname, function () {
                        expect(diff['/']).to.satisfy(_.isUndefined);
                    });
                } else {
                    it('should return no records at ' + levelname, function() {
                        expect(diff['.']).to.satisfy(_.isUndefined);
                    });
                    it('should return one subtree at ' + levelname, function() {
                        expect(diff['/']).to.be.a('object');
                        expect(Object.keys(diff['/'])).to.have.length(1);
                        let keyname = Object.keys(diff['/'])[0];
                        diff = diff['/'][keyname]; // Jump down
                        A = A[keyname];
                        O = O[keyname];
                    });
                }
            }


            it('should return one record at '+levelname, function () {
                expect(diff['.']).to.be.a('array');
                expect(diff['.']).to.have.length(1);
                expect(diff['.'][0]).to.be.a('array');
            });
            if(depth == 0)
            {
                it('should record with undefined key name', function () {
                    expect(diff['.'][0][0]).to.satisfy(_.isUndefined);
                });
            } else {
                it('should record with property name as key name', function () {
                    expect(diff['.'][0][0]).to.equal('lvl'+(depth));
                });
            }
            it('should record a DELETE operation', function() {
                expect(diff['.'][0][1]).to.equal(jsod.Attributes.DeltaOperation.DELETE);
            });
            it('should not record the changed value', function() {
                expect(diff['.'][0]).to.have.length(2);
                expect(diff['.'][0][2]).to.satisfy(_.isUndefined);
            });
        });
    }
    function whenListWasNotChanged(contextDesc, O, A)
    {
        context(contextDesc, function () {
            let diff = jsod.DiffHandlers.diffAsUnorderedValuelist(O, A);

            it('should return a DiffTree object', function() {
                expect(diff).to.be.a('object');
            });
            it('should return no records at root level', function() {
                expect(diff['.']).to.satisfy(_.isUndefined);
            });
            it('should return no subtrees at root level', function() {
                expect(diff['/']).to.satisfy(_.isUndefined);
            });
            it('should return no conflicts at root level', function() {
                expect(diff['!']).to.satisfy(_.isUndefined);
            });
        });
    }
    function whenListContentWasAdded(contextDesc, O, A)
    {
        context(contextDesc, function () {
            let diff = jsod.DiffHandlers.diffAsUnorderedValuelist(O, A);

            it('should return a DiffTree object', function() {
                expect(diff).to.be.a('object');
            });
            it('should return no subtrees at root level', function() {
                expect(diff['/']).to.satisfy(_.isUndefined);
            });
            it('should return no conflicts at root level', function() {
                expect(diff['!']).to.satisfy(_.isUndefined);
            });
            it('should return one record at root level', function() {
                expect(diff['.']).to.be.a('array');
                expect(diff['.']).to.have.length(1);
                expect(diff['.'][0]).to.be.a('array');
            });

            it('should record with numeric key name', function() {
                expect(diff['.'][0][0]).to.satisfy(_.isInteger);
            });
            it('should record an ADD operation', function() {
                expect(diff['.'][0]).to.have.length(3);
                expect(diff['.'][0][1]).to.equal(jsod.Attributes.DeltaOperation.ADD);
            });
            it('should record the new value', function() {
                expect(diff['.'][0][2]).to.equal('a');
            });
        });
    }
    function whenListContentWasDeleted(contextDesc, O, A)
    {
        context(contextDesc, function () {
            let diff = jsod.DiffHandlers.diffAsUnorderedValuelist(O, A);

            it('should return a DiffTree object', function() {
                expect(diff).to.be.a('object');
            });
            it('should return no subtrees at root level', function() {
                expect(diff['/']).to.satisfy(_.isUndefined);
            });
            it('should return no conflicts at root level', function() {
                expect(diff['!']).to.satisfy(_.isUndefined);
            });
            it('should return one record at root level', function() {
                expect(diff['.']).to.be.a('array');
                expect(diff['.']).to.have.length(1);
                expect(diff['.'][0]).to.be.a('array');
            });

            it('should record with numeric key name', function() {
                expect(diff['.'][0][0]).to.satisfy(_.isInteger);
            });
            it('should record a valued DELETE operation', function() {
                expect(diff['.'][0]).to.have.length(3);
                expect(diff['.'][0][1]).to.equal(jsod.Attributes.DeltaOperation.DELETE);
            });
            it('should record the old value', function() {
                expect(diff['.'][0][2]).to.equal('a');
            });
        });
    }
    function whenListContentWasReplaced(contextDesc, O, A)
    {
        context(contextDesc, function () {
            let diff = jsod.DiffHandlers.diffAsUnorderedValuelist(O, A);

            it('should return a DiffTree object', function() {
                expect(diff).to.be.a('object');
            });
            it('should return no subtrees at root level', function() {
                expect(diff['/']).to.satisfy(_.isUndefined);
            });
            it('should return no conflicts at root level', function() {
                expect(diff['!']).to.satisfy(_.isUndefined);
            });
            it('should return two records at root level', function() {
                expect(diff['.']).to.be.a('array');
                expect(diff['.']).to.have.length(2);
                expect(diff['.'][0]).to.be.a('array');
            });

            it('should record with numeric key name', function() {
                expect(diff['.'][0][0]).to.satisfy(_.isInteger);
            });
            it('should record a valued DELETE operation', function() {
                expect(diff['.'][0]).to.have.length(3);
                expect(diff['.'][0][1]).to.equal(jsod.Attributes.DeltaOperation.DELETE);
            });
            it('should record the old value', function() {
                expect(diff['.'][0][2]).to.equal('a');
            });

            it('should record with numeric key name', function() {
                expect(diff['.'][1][0]).to.satisfy(_.isInteger);
            });
            it('should record an ADD operation', function() {
                expect(diff['.'][1]).to.have.length(3);
                expect(diff['.'][1][1]).to.equal(jsod.Attributes.DeltaOperation.ADD);
            });
            it('should record the new value', function() {
                expect(diff['.'][1][2]).to.equal('b');
            });
        });
    }
}

function describeValueTypeDiffSuite(readableName, generateValue, generateAltValue)
{
    describe("diffing " + readableName, function(){
        describe("direct " + readableName, function(){

            context('when value has been set', function () {
                let O = undefined;
                let A = generateAltValue();
                let diff = jsod.diff(O, A);

                it('should return a DiffTree object', function() {
                    expect(diff).to.be.a('object');
                });
                it('should return one record at root level', function() {
                    expect(diff['.']).to.be.a('array');
                    expect(diff['.']).to.have.length(1);
                    expect(diff['.'][0]).to.be.a('array');
                });
                it('should return no subtrees at root level', function() {
                    expect(diff['/']).to.satisfy(_.isUndefined);
                });
                it('should return no conflicts at root level', function() {
                    expect(diff['!']).to.satisfy(_.isUndefined);
                });

                it('should record with undefined key name', function() {
                    expect(diff['.'][0][0]).to.satisfy(_.isUndefined);
                });
                it('should record an ADD operation', function() {
                    expect(diff['.'][0]).to.have.length(3);
                    expect(diff['.'][0][1]).to.equal(jsod.Attributes.DeltaOperation.ADD);
                });
                it('should record the new value', function() {
                    expect(diff['.'][0][2]).to.equal(A);
                });
            });

            context('when value has not changed', function () {
                let O = generateValue();
                let A = generateValue();
                let diff = jsod.diff(O, A);

                it('should return a DiffTree object', function() {
                    expect(diff).to.be.a('object');
                });
                it('should return no records at root level', function() {
                    expect(diff['.']).to.satisfy(_.isUndefined);
                });
                it('should return no subtrees at root level', function() {
                    expect(diff['/']).to.satisfy(_.isUndefined);
                });
                it('should return no conflicts at root level', function() {
                    expect(diff['!']).to.satisfy(_.isUndefined);
                });
            });

            context('when value has changed', function () {
                let O = generateValue();
                let A = generateAltValue();
                let diff = jsod.diff(O, A);

                it('should return a DiffTree object', function() {
                    expect(diff).to.be.a('object');
                });
                it('should return one record at root level', function() {
                    expect(diff['.']).to.be.a('array');
                    expect(diff['.']).to.have.length(1);
                    expect(diff['.'][0]).to.be.a('array');
                });
                it('should return no subtrees at root level', function() {
                    expect(diff['/']).to.satisfy(_.isUndefined);
                });
                it('should return no conflicts at root level', function() {
                    expect(diff['!']).to.satisfy(_.isUndefined);
                });

                it('should record with undefined key name', function() {
                    expect(diff['.'][0][0]).to.satisfy(_.isUndefined);
                });
                it('should record a MODIFY operation', function() {
                    expect(diff['.'][0]).to.have.length(3);
                    expect(diff['.'][0][1]).to.equal(jsod.Attributes.DeltaOperation.MODIFY);
                });
                it('should record the new value', function() {
                    expect(diff['.'][0][2]).to.satisfy(function deepEqual(x){
                        return _.isEqual(x, A);
                    });
                });
            });

            context('when value has been deleted', function () {
                let O = generateValue();
                let A = undefined;
                let diff = jsod.diff(O, A);

                it('should return a DiffTree object', function() {
                    expect(diff).to.be.a('object');
                });
                it('should return one record at root level', function() {
                    expect(diff['.']).to.be.a('array');
                    expect(diff['.']).to.have.length(1);
                    expect(diff['.'][0]).to.be.a('array');
                });
                it('should return no subtrees at root level', function() {
                    expect(diff['/']).to.satisfy(_.isUndefined);
                });
                it('should return no conflicts at root level', function() {
                    expect(diff['!']).to.satisfy(_.isUndefined);
                });

                it('should record with undefined key name', function() {
                    expect(diff['.'][0][0]).to.satisfy(_.isUndefined);
                });
                it('should record a DELETE operation', function() {
                    expect(diff['.'][0][1]).to.equal(jsod.Attributes.DeltaOperation.DELETE);
                });
                it('should not record the changed value', function() {
                    expect(diff['.'][0]).to.have.length(2);
                    expect(diff['.'][0][2]).to.satisfy(_.isUndefined);
                });
            });

        });
        describe(readableName + " nested in object", function(){

            let level1Key = 'level1';

            context('when value has been set', function () {
                let O = undefined;
                let A = generateAltValue();
                let diff = jsod.diff({}, {[level1Key]: A});

                it('should return a DiffTree object', function() {
                    expect(diff).to.be.a('object');
                });
                it('should return no records at root level', function() {
                    expect(diff['.']).to.satisfy(_.isUndefined);
                });
                it('should return one subtree at root level', function() {
                    expect(diff['/']).to.be.a('object');
                    expect(Object.keys(diff['/'])).to.have.length(1);
                });
                it('should return no conflicts at root level', function() {
                    expect(diff['!']).to.satisfy(_.isUndefined);
                });
                it('should return no subtrees at the subtree with the property name', function() {
                    let subtree = diff['/'][level1Key];
                    expect(subtree['/']).to.satisfy(_.isUndefined);
                });
                it('should return no conflicts at the subtree with the property name', function() {
                    let subtree = diff['/'][level1Key];
                    expect(subtree['!']).to.satisfy(_.isUndefined);
                });
                it('should return one record at the subtree with the property name', function() {
                    let subtree = diff['/'][level1Key];
                    expect(subtree['.']).to.be.a('array');
                    expect(subtree['.']).to.have.length(1);
                    expect(subtree['.'][0]).to.be.a('array');
                });
                it('should record with property name as key name', function() {
                    let subtree = diff['/'][level1Key];
                    expect(subtree['.'][0][0]).to.equal(level1Key);
                });
                it('should record an ADD operation', function() {
                    let subtree = diff['/'][level1Key];
                    expect(subtree['.'][0]).to.have.length(3);
                    expect(subtree['.'][0][1]).to.equal(jsod.Attributes.DeltaOperation.ADD);
                });
                it('should record the new value', function() {
                    let subtree = diff['/'][level1Key];
                    expect(subtree['.'][0][2]).to.equal(A);
                });
            });

            context('when value has not changed', function () {
                let O = generateValue();
                let A = generateValue();
                let diff = jsod.diff({[level1Key]: O}, {[level1Key]: A});

                it('should return a DiffTree object', function() {
                    expect(diff).to.be.a('object');
                });
                it('should return no records at root level', function() {
                    expect(diff['.']).to.satisfy(_.isUndefined);
                });
                it('should return no subtrees at root level', function() {
                    expect(diff['/']).to.satisfy(_.isUndefined);
                });
                it('should return no conflicts at root level', function() {
                    expect(diff['/']).to.satisfy(_.isUndefined);
                });
            });

            context('when value has changed', function () {
                let O = generateValue();
                let A = generateAltValue();
                let diff = jsod.diff({[level1Key]: O}, {[level1Key]: A});

                it('should return a DiffTree object', function() {
                    expect(diff).to.be.a('object');
                });
                it('should return no records at root level', function() {
                    expect(diff['.']).to.satisfy(_.isUndefined);
                });
                it('should return one subtree at root level', function() {
                    expect(diff['/']).to.be.a('object');
                    expect(Object.keys(diff['/'])).to.have.length(1);
                });
                it('should return no conflicts at root level', function() {
                    expect(diff['!']).to.satisfy(_.isUndefined);
                });
                it('should return no subtrees at the subtree with the property name', function() {
                    let subtree = diff['/'][level1Key];
                    expect(subtree['/']).to.satisfy(_.isUndefined);
                });
                it('should return no conflicts at the subtree with the property name', function() {
                    let subtree = diff['/'][level1Key];
                    expect(subtree['!']).to.satisfy(_.isUndefined);
                });
                it('should return one record at the subtree with the property name', function() {
                    let subtree = diff['/'][level1Key];
                    expect(subtree['.']).to.be.a('array');
                    expect(subtree['.']).to.have.length(1);
                    expect(subtree['.'][0]).to.be.a('array');
                });
                it('should record with property name as key name', function() {
                    let subtree = diff['/'][level1Key];
                    expect(subtree['.'][0][0]).to.equal(level1Key);
                });
                it('should record a MODIFY operation', function() {
                    let subtree = diff['/'][level1Key];
                    expect(subtree['.'][0]).to.have.length(3);
                    expect(subtree['.'][0][1]).to.equal(jsod.Attributes.DeltaOperation.MODIFY);
                });
                it('should record the new value', function() {
                    let subtree = diff['/'][level1Key];
                    expect(subtree['.'][0][2]).to.satisfy(function deepEqual(x){
                        return _.isEqual(x, A);
                    });
                });
            });

            context('when value has been deleted', function () {
                let O = generateValue();
                let A = generateAltValue();
                let diff = jsod.diff({[level1Key]: O}, {});

                it('should return a DiffTree object', function() {
                    expect(diff).to.be.a('object');
                });
                it('should return no records at root level', function() {
                    expect(diff['.']).to.satisfy(_.isUndefined);
                });
                it('should return one subtree at root level', function() {
                    expect(diff['/']).to.be.a('object');
                    expect(Object.keys(diff['/'])).to.have.length(1);
                });
                it('should return no conflicts at root level', function() {
                    expect(diff['!']).to.satisfy(_.isUndefined);
                });
                it('should return no subtrees at the subtree with the property name', function() {
                    let subtree = diff['/'][level1Key];
                    expect(subtree['/']).to.satisfy(_.isUndefined);
                });
                it('should return no conflicts at the subtree with the property name', function() {
                    let subtree = diff['/'][level1Key];
                    expect(subtree['!']).to.satisfy(_.isUndefined);
                });
                it('should return one record at the subtree with the property name', function() {
                    let subtree = diff['/'][level1Key];
                    expect(subtree['.']).to.be.a('array');
                    expect(subtree['.']).to.have.length(1);
                    expect(subtree['.'][0]).to.be.a('array');
                });
                it('should record with property name as key name', function() {
                    let subtree = diff['/'][level1Key];
                    expect(subtree['.'][0][0]).to.equal(level1Key);
                });
                it('should record a DELETE operation', function() {
                    let subtree = diff['/'][level1Key];
                    expect(subtree['.'][0]).to.have.length(2);
                    expect(subtree['.'][0][1]).to.equal(jsod.Attributes.DeltaOperation.DELETE);
                });
                it('should not record the new value', function() {
                    let subtree = diff['/'][level1Key];
                    expect(subtree['.'][0]).to.have.length(2);
                    expect(subtree['.'][0][2]).to.satisfy(_.isUndefined);
                });
            });

        });
        describe(readableName + " nested in object in object", function(){

            let level1Key = 'level1';
            let level2Key = 'level2';

            context('when value has been set', function () {
                let O = undefined;
                let A = generateAltValue();
                let diff = jsod.diff({[level1Key]: {}}, {[level1Key]: {[level2Key]: A}});

                it('should return a DiffTree object', function() {
                    expect(diff).to.be.a('object');
                });
                it('should return no records at root level', function() {
                    expect(diff['.']).to.satisfy(_.isUndefined);
                });
                it('should return one subtree at root level', function() {
                    expect(diff['/']).to.be.a('object');
                    expect(Object.keys(diff['/'])).to.have.length(1);
                });
                it('should return no conflicts at root level', function() {
                    expect(diff['!']).to.satisfy(_.isUndefined);
                });

                it('should return no records at the subtree with the 1st property name', function() {
                    let subtree = diff['/'][level1Key];
                    expect(subtree['.']).to.satisfy(_.isUndefined);
                });
                it('should return one subtree at the subtree with the 1st property name', function() {
                    let subtree = diff['/'][level1Key];
                    expect(subtree['/']).to.be.a('object');
                    expect(Object.keys(subtree['/'])).to.have.length(1);
                });
                it('should return no conflicts at the subtree with the 1st property name', function() {
                    let subtree = diff['/'][level1Key];
                    expect(subtree['!']).to.satisfy(_.isUndefined);
                });

                it('should return no subtrees at the subtree with the 2nd property name', function() {
                    let subtree = diff['/'][level1Key]['/'][level2Key];
                    expect(subtree['/']).to.satisfy(_.isUndefined);
                });
                it('should return no conflicts at the subtree with the 2nd property name', function() {
                    let subtree = diff['/'][level1Key]['/'][level2Key];
                    expect(subtree['!']).to.satisfy(_.isUndefined);
                });

                it('should return one record at the subtree with the 2nd property name', function() {
                    let subtree = diff['/'][level1Key]['/'][level2Key];
                    expect(subtree['.']).to.be.a('array');
                    expect(subtree['.']).to.have.length(1);
                    expect(subtree['.'][0]).to.be.a('array');
                });
                it('should record with property name as key name', function() {
                    let subtree = diff['/'][level1Key]['/'][level2Key];
                    expect(subtree['.'][0][0]).to.equal(level2Key);
                });
                it('should record an ADD operation', function() {
                    let subtree = diff['/'][level1Key]['/'][level2Key];
                    expect(subtree['.'][0]).to.have.length(3);
                    expect(subtree['.'][0][1]).to.equal(jsod.Attributes.DeltaOperation.ADD);
                });
                it('should record the new value', function() {
                    let subtree = diff['/'][level1Key]['/'][level2Key];
                    expect(subtree['.'][0][2]).to.equal(A);
                });
            });

            context('when value has not changed', function () {
                let O = generateValue();
                let A = generateValue();
                let diff = jsod.diff({[level1Key]: {[level2Key]: O}}, {[level1Key]: {[level2Key]: A}});

                it('should return a DiffTree object', function() {
                    expect(diff).to.be.a('object');
                });
                it('should return no records at root level', function() {
                    expect(diff['.']).to.satisfy(_.isUndefined);
                });
                it('should return no subtrees at root level', function() {
                    expect(diff['/']).to.satisfy(_.isUndefined);
                });
                it('should return no conflicts at root level', function() {
                    expect(diff['/']).to.satisfy(_.isUndefined);
                });
            });

            context('when value has changed', function () {
                let O = generateValue();
                let A = generateAltValue();
                let diff = jsod.diff({[level1Key]: {[level2Key]: O}}, {[level1Key]: {[level2Key]: A}});

                it('should return a DiffTree object', function() {
                    expect(diff).to.be.a('object');
                });
                it('should return no records at root level', function() {
                    expect(diff['.']).to.satisfy(_.isUndefined);
                });
                it('should return one subtree at root level', function() {
                    expect(diff['/']).to.be.a('object');
                    expect(Object.keys(diff['/'])).to.have.length(1);
                });
                it('should return no conflicts at root level', function() {
                    expect(diff['!']).to.satisfy(_.isUndefined);
                });



                it('should return no records at the subtree with the 1st property name', function() {
                    let subtree = diff['/'][level1Key];
                    expect(subtree['.']).to.satisfy(_.isUndefined);
                });
                it('should return one subtree at the subtree with the 1st property name', function() {
                    let subtree = diff['/'][level1Key];
                    expect(subtree['/']).to.be.a('object');
                    expect(Object.keys(subtree['/'])).to.have.length(1);
                });
                it('should return no conflicts at the subtree with the 1st property name', function() {
                    let subtree = diff['/'][level1Key];
                    expect(subtree['!']).to.satisfy(_.isUndefined);
                });

                it('should return no subtrees at the subtree with the 2nd property name', function() {
                    let subtree = diff['/'][level1Key]['/'][level2Key];
                    expect(subtree['/']).to.satisfy(_.isUndefined);
                });
                it('should return no conflicts at the subtree with the 2nd property name', function() {
                    let subtree = diff['/'][level1Key]['/'][level2Key];
                    expect(subtree['!']).to.satisfy(_.isUndefined);
                });

                it('should return one record at the subtree with the 2nd property name', function() {
                    let subtree = diff['/'][level1Key]['/'][level2Key];
                    expect(subtree['.']).to.be.a('array');
                    expect(subtree['.']).to.have.length(1);
                    expect(subtree['.'][0]).to.be.a('array');
                });
                it('should record with property name as key name', function() {
                    let subtree = diff['/'][level1Key]['/'][level2Key];
                    expect(subtree['.'][0][0]).to.equal(level2Key);
                });
                it('should record a MODIFY operation', function() {
                    let subtree = diff['/'][level1Key]['/'][level2Key];
                    expect(subtree['.'][0]).to.have.length(3);
                    expect(subtree['.'][0][1]).to.equal(jsod.Attributes.DeltaOperation.MODIFY);
                });
                it('should record the new value', function() {
                    let subtree = diff['/'][level1Key]['/'][level2Key];
                    expect(subtree['.'][0][2]).to.satisfy(function deepEqual(x){
                        return _.isEqual(x, A);
                    });
                });
            });

            context('when value has been deleted', function () {
                let O = generateValue();
                let A = generateAltValue();
                let diff = jsod.diff({[level1Key]: {[level2Key]: O}}, {[level1Key]: {}});

                it('should return a DiffTree object', function() {
                    expect(diff).to.be.a('object');
                });
                it('should return no records at root level', function() {
                    expect(diff['.']).to.satisfy(_.isUndefined);
                });
                it('should return one subtree at root level', function() {
                    expect(diff['/']).to.be.a('object');
                    expect(Object.keys(diff['/'])).to.have.length(1);
                });
                it('should return no conflicts at root level', function() {
                    expect(diff['!']).to.satisfy(_.isUndefined);
                });


                it('should return no records at the subtree with the 1st property name', function() {
                    let subtree = diff['/'][level1Key];
                    expect(subtree['.']).to.satisfy(_.isUndefined);
                });
                it('should return one subtree at the subtree with the 1st property name', function() {
                    let subtree = diff['/'][level1Key];
                    expect(subtree['/']).to.be.a('object');
                    expect(Object.keys(subtree['/'])).to.have.length(1);
                });
                it('should return no conflicts at the subtree with the 1st property name', function() {
                    let subtree = diff['/'][level1Key];
                    expect(subtree['!']).to.satisfy(_.isUndefined);
                });

                it('should return no subtrees at the subtree with the 2nd property name', function() {
                    let subtree = diff['/'][level1Key]['/'][level2Key];
                    expect(subtree['/']).to.satisfy(_.isUndefined);
                });
                it('should return no conflicts at the subtree with the 2nd property name', function() {
                    let subtree = diff['/'][level1Key]['/'][level2Key];
                    expect(subtree['!']).to.satisfy(_.isUndefined);
                });

                it('should return one record at the subtree with the 2nd property name', function() {
                    let subtree = diff['/'][level1Key]['/'][level2Key];
                    expect(subtree['.']).to.be.a('array');
                    expect(subtree['.']).to.have.length(1);
                    expect(subtree['.'][0]).to.be.a('array');
                });
                it('should record with property name as key name', function() {
                    let subtree = diff['/'][level1Key]['/'][level2Key];
                    expect(subtree['.'][0][0]).to.equal(level2Key);
                });
                it('should record a DELETE operation', function() {
                    let subtree = diff['/'][level1Key]['/'][level2Key];
                    expect(subtree['.'][0]).to.have.length(2);
                    expect(subtree['.'][0][1]).to.equal(jsod.Attributes.DeltaOperation.DELETE);
                });
                it('should not record the new value', function() {
                    let subtree = diff['/'][level1Key]['/'][level2Key];
                    expect(subtree['.'][0]).to.have.length(2);
                    expect(subtree['.'][0][2]).to.satisfy(_.isUndefined);
                });
            });

        });
    });
}