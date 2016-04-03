"use strict";

let
    _ = require('lodash')
    ,chai = require('chai')
    ,expect = chai.expect
    ;

let jsod = require('../../');
describe('jsod.Merge#mergeAllNodeRecords()', function() {
    context("when recordsA is empty", function(){
        let recordsA = [];
        let recordsB = [['foobar', jsod.Attributes.DeltaOperation.DELETE]];
        let combinedRecords = jsod.Merge.mergeAllNodeRecords(recordsA, recordsB);
        it("should return a clone of recordsB", function(){
            expect(combinedRecords).to.be.a('array');
            expect(combinedRecords).to.be.deep.equal(recordsB);
            expect(combinedRecords).to.not.be.equal(recordsA);
            expect(combinedRecords).to.not.be.equal(recordsB);
        });
    });
    context("when recordsB is empty", function(){
        let recordsA = [['foobar', jsod.Attributes.DeltaOperation.DELETE]];
        let recordsB = [];
        let combinedRecords = jsod.Merge.mergeAllNodeRecords(recordsA, recordsB);
        it("should return a clone of recordsA", function(){
            expect(combinedRecords).to.be.a('array');
            expect(combinedRecords).to.be.deep.equal(recordsA);
            expect(combinedRecords).to.not.be.equal(recordsA);
            expect(combinedRecords).to.not.be.equal(recordsB);
        });
    });
    context("when recordsA and recordsB are empty", function(){
        let recordsA = [];
        let recordsB = [];
        let combinedRecords = jsod.Merge.mergeAllNodeRecords(recordsA, recordsB);
        it("should return empty combined records", function(){
            expect(combinedRecords).to.be.a('array');
            expect(combinedRecords).to.have.length(0);
            expect(combinedRecords).to.not.be.equal(recordsA);
            expect(combinedRecords).to.not.be.equal(recordsB);
        });
    });
    context("when recordsA is missing", function(){
        let recordsA = undefined;
        let recordsB = [['foobar', jsod.Attributes.DeltaOperation.DELETE]];
        let combinedRecords = jsod.Merge.mergeAllNodeRecords(recordsA, recordsB);
        it("should return a clone of recordsB", function(){
            expect(combinedRecords).to.be.a('array');
            expect(combinedRecords).to.be.deep.equal(recordsB);
            expect(combinedRecords).to.not.be.equal(recordsA);
            expect(combinedRecords).to.not.be.equal(recordsB);
        });
    });
    context("when recordsB is missing", function(){
        let recordsA = [['foobar', jsod.Attributes.DeltaOperation.DELETE]];
        let recordsB = undefined;
        let combinedRecords = jsod.Merge.mergeAllNodeRecords(recordsA, recordsB);
        it("should return a clone of recordsA", function(){
            expect(combinedRecords).to.be.a('array');
            expect(combinedRecords).to.be.deep.equal(recordsA);
            expect(combinedRecords).to.not.be.equal(recordsA);
            expect(combinedRecords).to.not.be.equal(recordsB);
        });
    });
    context("when recordsA and recordsB are missing", function(){
        let recordsA = undefined;
        let recordsB = undefined;
        let combinedRecords = jsod.Merge.mergeAllNodeRecords(recordsA, recordsB);
        it("should return empty combined records", function(){
            expect(combinedRecords).to.be.a('array');
            expect(combinedRecords).to.have.length(0);
            expect(combinedRecords).to.not.be.equal(recordsA);
            expect(combinedRecords).to.not.be.equal(recordsB);
        });
    });
});