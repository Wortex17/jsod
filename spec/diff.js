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
    describeValueTypeDiffSuite("functions", gen.func, gen.funcAlt);

});

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
                it('should record a ADD operation', function() {
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
                it('should record a ADD operation', function() {
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
                it('should record a ADD operation', function() {
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