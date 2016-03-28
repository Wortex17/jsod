"use strict";

let
    _ = require('lodash')
    ,chai = require('chai')
    ,expect = chai.expect
    ;

let gen = require('../spec-tools/object-generator');

let jsod = require('../');

function simpleDiffSuite(generator)
{
    function testsForOisA(generator)
    {
        context('when O === A', function () {
            let O = generator();
            let A = generator();
            let diff = jsod.diff(O, A);

            it('should return an object', function() {
                expect(diff).to.be.a('object');
            });

            it('should return a DiffTree with no records at root level', function() {
                expect(diff['.']).to.satisfy(_.isUndefined);
            });
            it('should return a DiffTree with no subtree links at root level', function() {
                expect(diff['/']).to.satisfy(_.isUndefined);
            });

        });
    }
    function testsForOGetsDeleted(generator)
    {
        context('when A === undefined', function () {
            let O = generator();
            let diff = jsod.diff(O, undefined);

            it('should return an object', function() {
                expect(diff).to.be.a('object');
            });


            it('should return a DiffTree with records at root level', function() {
                expect(diff['/']).to.satisfy(_.isUndefined);
                expect(diff['!']).to.satisfy(_.isUndefined);
                let rootRecords = diff['.'];
                expect(rootRecords).to.be.a('array');
                expect(rootRecords).to.have.length(1);
            });
            it('should return a DiffTree with a single root DELETE record', function() {
                let rootRecords = diff['.'];
                let record = rootRecords[0];
                expect(record).to.be.a('array');
                expect(record).to.have.length(2);
                expect(record[0]).to.equal(undefined);
                expect(record[1]).to.equal(jsod.Attributes.DeltaOperation.DELETE);
            });
        });
    }
    function testsForAIsNew(generator)
    {
        context('when O === undefined', function () {
            let A = generator();
            let diff = jsod.diff(undefined, A);

            it('should return an object', function() {
                expect(diff).to.be.a('object');
            });


            it('should return a DiffTree with records at root level', function() {
                expect(diff['/']).to.satisfy(_.isUndefined);
                expect(diff['!']).to.satisfy(_.isUndefined);
                let rootRecords = diff['.'];
                expect(rootRecords).to.be.a('array');
                expect(rootRecords).to.have.length(1);
            });
            it('should return a DiffTree with a single root ADD record', function() {
                let rootRecords = diff['.'];
                let record = rootRecords[0];
                expect(record).to.be.a('array');
                expect(record).to.have.length(3);
                expect(record[0]).to.equal(undefined);
                expect(record[1]).to.equal(jsod.Attributes.DeltaOperation.ADD);
                expect(record[2]).to.deep.equal(A);
            });
        });
    }
    function testsForOisNotA(generator)
    {
        context('when O !== A', function () {
            let O = generator();
            let A = generator.alternate();
            let diff = jsod.diff(O, A);

            it('should return an object', function() {
                expect(diff).to.be.a('object');
            });

            if(generator.isPrimitiveGen)
            {
                it('should return a DiffTree with records at root level', function() {
                    expect(diff['/']).to.satisfy(_.isUndefined);
                    expect(diff['!']).to.satisfy(_.isUndefined);
                    let rootRecords = diff['.'];
                    expect(rootRecords).to.be.a('array');
                    expect(rootRecords).to.have.length(1);
                });
                it('should return a DiffTree with a single root MODIFY record', function() {
                    let rootRecords = diff['.'];
                    let record = rootRecords[0];
                    expect(record).to.be.a('array');
                    expect(record).to.have.length(3);
                    expect(record[0]).to.equal(undefined);
                    expect(record[1]).to.equal(jsod.Attributes.DeltaOperation.MODIFY);
                    expect(record[2]).to.deep.equal(A);
                });
            } else {

                it('should return a DiffTree with no records at root level', function() {
                    expect(diff['.']).to.satisfy(_.isUndefined);
                    expect(diff['!']).to.satisfy(_.isUndefined);
                });
                it('should return a DiffTree with subtree links', function() {
                    let subtreeLinks = diff['/'];
                    expect(subtreeLinks).to.be.a('object');
                    expect(Object.keys(subtreeLinks)).to.have.length(_.size(A));
                });
            }
        });
    }
    context('when diffing ' + generator.methodName+"s", function() {
        testsForOisA(generator);
        if (_.isFunction(generator.alternate)) {
            testsForOisNotA(generator);
        }
        testsForOGetsDeleted(generator);
        testsForAIsNew(generator);

    });
}

function unorderedListDiffSuite(generator)
{
    context('when diffing ' + generator.methodName+"s", function() {

        let O = generator();

        context("list.push(X)", function(){
            let A = generator();
            A.push('X');
            let diff = jsod.diff(O, A);

            it('should return an object', function() {
                expect(diff).to.be.a('object');
            });
            it('should return a DiffTree with no subtree links at root level', function() {
                expect(diff['/']).to.satisfy(_.isUndefined);
            });

            it('should return a DiffTree with one record at root level', function() {
                expect(diff['/']).to.satisfy(_.isUndefined);
                expect(diff['!']).to.satisfy(_.isUndefined);
                let rootRecords = diff['.'];
                expect(rootRecords).to.be.a('array');
                expect(rootRecords).to.have.length(1);
            });
            it('should return a DiffTree with a root, number-indexed ADD record', function() {
                let rootRecords = diff['.'];
                let record = rootRecords[0];
                expect(record).to.be.a('array');
                expect(record).to.have.length(3);
                expect(record[0]).to.be.a('number');
                expect(record[0]).to.equal(_.size(O));
                expect(record[1]).to.equal(jsod.Attributes.DeltaOperation.ADD);
                expect(record[2]).to.deep.equal('X');
            });
        });
        context("list.pop()", function(){
            let A = generator();
            A.pop();
            let diff = jsod.diff(O, A);

            it('should return an object', function() {
                expect(diff).to.be.a('object');
            });
            it('should return a DiffTree with no subtree links at root level', function() {
                expect(diff['/']).to.satisfy(_.isUndefined);
            });

            it('should return a DiffTree with one record at root level', function() {
                expect(diff['/']).to.satisfy(_.isUndefined);
                expect(diff['!']).to.satisfy(_.isUndefined);
                let rootRecords = diff['.'];
                expect(rootRecords).to.be.a('array');
                expect(rootRecords).to.have.length(1);
            });
            it('should return a DiffTree with a root, number-indexed ADD record', function() {
                let rootRecords = diff['.'];
                let record = rootRecords[0];
                expect(record).to.be.a('array');
                expect(record).to.have.length(3);
                expect(record[0]).to.be.a('number');
                expect(record[0]).to.equal(_.size(O)-1);
                expect(record[1]).to.equal(jsod.Attributes.DeltaOperation.DELETE);
                expect(record[2]).to.deep.equal(_.last(O));
            });
        });

        context("list[0] = X", function(){
            let A = generator();
            A[0] = 'X';
            let diff = jsod.diff(O, A);

            it('should return an object', function() {
                expect(diff).to.be.a('object');
            });
            it('should return a DiffTree with no subtree links at root level', function() {
                expect(diff['/']).to.satisfy(_.isUndefined);
            });

            it('should return a DiffTree with 2 records at root level', function() {
                expect(diff['/']).to.satisfy(_.isUndefined);
                expect(diff['!']).to.satisfy(_.isUndefined);
                let rootRecords = diff['.'];
                expect(rootRecords).to.be.a('array');
                expect(rootRecords).to.have.length(2);
            });
            it('should return a DiffTree with a root, number-indexed & valued DELETE record', function() {
                let rootRecords = diff['.'];
                let record = rootRecords[0];
                expect(record).to.be.a('array');
                expect(record).to.have.length(3);
                expect(record[0]).to.be.a('number');
                expect(record[1]).to.equal(jsod.Attributes.DeltaOperation.DELETE);
                expect(record[2]).to.deep.equal(O[0]);
            });
            it('should return a DiffTree with a root, number-indexed ADD record', function() {
                let rootRecords = diff['.'];
                let record = rootRecords[1];
                expect(record).to.be.a('array');
                expect(record).to.have.length(3);
                expect(record[0]).to.be.a('number');
                expect(record[1]).to.equal(jsod.Attributes.DeltaOperation.ADD);
                expect(record[2]).to.deep.equal('X');
            });
        });

    });
}

describe('jsod#diff()', function() {
    describe("Simple primitive diffs", function(){

        _.forEach(gen, function(generator){
            if(generator.isSimpleGen && !generator.isAlternate && !generator.isValuelist)
            {
                simpleDiffSuite(generator);
            }
        })
    });
    describe("Unordered Valuelist diffs", function(){
        unorderedListDiffSuite(gen.abcArray);
        //unorderedListDiffSuite(gen.arrayBuffer);
        //unorderedListDiffSuite(gen.typedArray);
    });
});