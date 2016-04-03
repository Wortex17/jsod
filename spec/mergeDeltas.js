"use strict";

let
    _ = require('lodash')
    ,chai = require('chai')
    ,expect = chai.expect
    ;

let jsod = require('../');


/**
 * Most tests try to test all cases in the following grid
 *
 *  x  |    +     |    ~     |    -     |
 *  +  | eq | !eq |    **    |    *     |
 *  ~  |    **    | eq | !eq |          |
 *  -  |    *     |          | eq | !eq*|
 *
 *   * can only occur on unordered valuelists
 *   ** not possible
 */


describe('jsod#mergeDeltas()', function() {

    describe("merging on direct value type primitive", function(){

        let dataForms = {
            "_": "", //empty (not missing! missing will be undefined anyway)
            'o': "o",
            'a': "a",
            'b': "b",
            'ab': "ab"
        };

        describe("merging one ADD with one unchanged", function() {
            let origin = undefined;
            let changedA = dataForms.a;
            let changedB = undefined;

            let deltaA = jsod.diff(origin, changedA);
            let deltaB = jsod.diff(origin, changedB);
            let mergedDelta = jsod.mergeDeltas(deltaA, deltaB);

            it('should contain no subtrees', function(){
                expect(mergedDelta['/']).to.equal(undefined);
            });
            it('should contain no conflicts', function(){
                expect(mergedDelta['!']).to.equal(undefined);
                _.forEach(mergedDelta['/'], function(subtree){
                    expect(subtree['!']).to.equal(undefined);
                });
            });
            it('should contain one record', function(){
                expect(mergedDelta['.']).to.be.a('array');
                expect(mergedDelta['.']).to.have.length(1);
            });
            it('should contain a copy of the record from the ADD', function(){
                let record0 = mergedDelta['.'][0];
                expect(record0).to.be.deep.equal(deltaA['.'][0]);
                expect(record0).to.be.not.equal(deltaA['.'][0]);
            });
        });
        describe("merging one MODIFY with one unchanged", function() {
            let origin = dataForms.o;
            let changedA = dataForms.a;
            let changedB = dataForms.o;

            let deltaA = jsod.diff(origin, changedA);
            let deltaB = jsod.diff(origin, changedB);
            let mergedDelta = jsod.mergeDeltas(deltaA, deltaB);

            it('should contain no subtrees', function(){
                expect(mergedDelta['/']).to.equal(undefined);
            });
            it('should contain no conflicts', function(){
                expect(mergedDelta['!']).to.equal(undefined);
                _.forEach(mergedDelta['/'], function(subtree){
                    expect(subtree['!']).to.equal(undefined);
                });
            });
            it('should contain one record', function(){
                expect(mergedDelta['.']).to.be.a('array');
                expect(mergedDelta['.']).to.have.length(1);
            });
            it('should contain a copy of the record from the MODIFY', function(){
                let record0 = mergedDelta['.'][0];
                expect(record0).to.be.deep.equal(deltaA['.'][0]);
                expect(record0).to.be.not.equal(deltaA['.'][0]);
            });
        });
        describe("merging one DELETE with one unchanged", function() {
            let origin = dataForms.o;
            let changedA = undefined;
            let changedB = dataForms.o;

            let deltaA = jsod.diff(origin, changedA);
            let deltaB = jsod.diff(origin, changedB);
            let mergedDelta = jsod.mergeDeltas(deltaA, deltaB);

            it('should contain no subtrees', function(){
                expect(mergedDelta['/']).to.equal(undefined);
            });
            it('should contain no conflicts', function(){
                expect(mergedDelta['!']).to.equal(undefined);
                _.forEach(mergedDelta['/'], function(subtree){
                    expect(subtree['!']).to.equal(undefined);
                });
            });
            it('should contain one record', function(){
                expect(mergedDelta['.']).to.be.a('array');
                expect(mergedDelta['.']).to.have.length(1);
            });
            it('should contain a copy of the record from the DELETE', function(){
                let record0 = mergedDelta['.'][0];
                expect(record0).to.be.deep.equal(deltaA['.'][0]);
                expect(record0).to.be.not.equal(deltaA['.'][0]);
            });
        });

        describe("merging two equal ADD", function() {
            let origin = undefined;
            let changedA = dataForms.a;
            let changedB = dataForms.a;

            let deltaA = jsod.diff(origin, changedA);
            let deltaB = jsod.diff(origin, changedB);
            let mergedDelta = jsod.mergeDeltas(deltaA, deltaB);

            it('should contain no subtrees', function(){
                expect(mergedDelta['/']).to.equal(undefined);
            });
            it('should contain no conflicts', function(){
                expect(mergedDelta['!']).to.equal(undefined);
                _.forEach(mergedDelta['/'], function(subtree){
                    expect(subtree['!']).to.equal(undefined);
                });
            });
            it('should contain one record', function(){
                expect(mergedDelta['.']).to.be.a('array');
                expect(mergedDelta['.']).to.have.length(1);
            });
            it('should contain a copy of the record from both ADD', function(){
                let record0 = mergedDelta['.'][0];
                expect(record0).to.be.deep.equal(deltaA['.'][0]);
                expect(record0).to.be.deep.equal(deltaB['.'][0]);
                expect(record0).to.be.not.equal(deltaA['.'][0]);
                expect(record0).to.be.not.equal(deltaB['.'][0]);
            });
        });
        describe("merging two equal MODIFY", function() {
            let origin = dataForms.o;
            let changedA = dataForms.ab;
            let changedB = dataForms.ab;

            let deltaA = jsod.diff(origin, changedA);
            let deltaB = jsod.diff(origin, changedB);
            let mergedDelta = jsod.mergeDeltas(deltaA, deltaB);

            it('should contain no subtrees', function(){
                expect(mergedDelta['/']).to.equal(undefined);
            });
            it('should contain no conflicts', function(){
                expect(mergedDelta['!']).to.equal(undefined);
                _.forEach(mergedDelta['/'], function(subtree){
                    expect(subtree['!']).to.equal(undefined);
                });
            });
            it('should contain one record', function(){
                expect(mergedDelta['.']).to.be.a('array');
                expect(mergedDelta['.']).to.have.length(1);
            });
            it('should contain a copy of the record from both MODIFY', function(){
                let record0 = mergedDelta['.'][0];
                expect(record0).to.be.deep.equal(deltaA['.'][0]);
                expect(record0).to.be.deep.equal(deltaB['.'][0]);
                expect(record0).to.be.not.equal(deltaA['.'][0]);
                expect(record0).to.be.not.equal(deltaB['.'][0]);
            });
        });
        describe("merging two equal DELETE", function() {
            let origin = dataForms.o;
            let changedA = undefined;
            let changedB = undefined;

            let deltaA = jsod.diff(origin, changedA);
            let deltaB = jsod.diff(origin, changedB);
            let mergedDelta = jsod.mergeDeltas(deltaA, deltaB);

            it('should contain no subtrees', function(){
                expect(mergedDelta['/']).to.equal(undefined);
            });
            it('should contain no conflicts', function(){
                expect(mergedDelta['!']).to.equal(undefined);
                _.forEach(mergedDelta['/'], function(subtree){
                    expect(subtree['!']).to.equal(undefined);
                });
            });
            it('should contain one record', function(){
                expect(mergedDelta['.']).to.be.a('array');
                expect(mergedDelta['.']).to.have.length(1);
            });
            it('should contain a copy of the record from both DELETE', function(){
                let record0 = mergedDelta['.'][0];
                expect(record0).to.be.deep.equal(deltaA['.'][0]);
                expect(record0).to.be.deep.equal(deltaB['.'][0]);
                expect(record0).to.be.not.equal(deltaA['.'][0]);
                expect(record0).to.be.not.equal(deltaB['.'][0]);
            });
        });

        describe("merging two different ADD", function() {
            let origin = undefined;
            let changedA = dataForms.a;
            let changedB = dataForms.b;

            let deltaA = jsod.diff(origin, changedA);
            let deltaB = jsod.diff(origin, changedB);
            let mergedDelta = jsod.mergeDeltas(deltaA, deltaB);

            it('should not contain subtrees', function(){
                expect(mergedDelta['/']).to.equal(undefined);
            });
            it('should not contain records', function(){
                expect(mergedDelta['/']).to.equal(undefined);
            });
            it('should return one conflict of type RECORD_DIFF_VALUE containing copies of both DeltaRecords', function(){
                expect(mergedDelta['!']).to.be.a('array');
                expect(mergedDelta['!']).to.have.length(1);

                let record0 = mergedDelta['!'][0];
                expect(record0).to.be.a('object');
                expect(record0.conflictType).to.equal(jsod.Attributes.ConflictType.RECORD_DIFF_VALUE);
                expect(record0.A).to.deep.equal(deltaA['.'][0]);
                expect(record0.B).to.deep.equal(deltaB['.'][0]);
                expect(record0.A).to.not.equal(deltaA['.'][0]); //Or it is not a clone
                expect(record0.B).to.not.equal(deltaB['.'][0]); //Or it is not a clone
            });
        });
        describe("merging two different MODIFY", function() {
            let origin = dataForms._;
            let changedA = dataForms.a;
            let changedB = dataForms.b;

            let deltaA = jsod.diff(origin, changedA);
            let deltaB = jsod.diff(origin, changedB);
            let mergedDelta = jsod.mergeDeltas(deltaA, deltaB);

            it('should not contain subtrees', function(){
                expect(mergedDelta['/']).to.equal(undefined);
            });
            it('should not contain records', function(){
                expect(mergedDelta['/']).to.equal(undefined);
            });
            it('should return one conflict of type RECORD_DIFF_VALUE containing copies of both DeltaRecords', function(){
                expect(mergedDelta['!']).to.be.a('array');
                expect(mergedDelta['!']).to.have.length(1);

                let record0 = mergedDelta['!'][0];
                expect(record0).to.be.a('object');
                expect(record0.conflictType).to.equal(jsod.Attributes.ConflictType.RECORD_DIFF_VALUE);
                expect(record0.A).to.deep.equal(deltaA['.'][0]);
                expect(record0.B).to.deep.equal(deltaB['.'][0]);
                expect(record0.A).to.not.equal(deltaA['.'][0]); //Or it is not a clone
                expect(record0.B).to.not.equal(deltaB['.'][0]); //Or it is not a clone
            });
        });
        //merging two different DELETE only possible on unordered valuelists

        describe("merging one DELETE with one MODIFY", function() {
            let origin = dataForms._;
            let changedA = undefined;
            let changedB = dataForms.b;

            let deltaA = jsod.diff(origin, changedA);
            let deltaB = jsod.diff(origin, changedB);
            let mergedDelta = jsod.mergeDeltas(deltaA, deltaB);

            it('should not contain subtrees', function(){
                expect(mergedDelta['/']).to.equal(undefined);
            });
            it('should not contain records', function(){
                expect(mergedDelta['/']).to.equal(undefined);
            });
            it('should return one conflict of type RECORD_DIFF_OPERATION containing copies of both DeltaRecords', function(){
                expect(mergedDelta['!']).to.be.a('array');
                expect(mergedDelta['!']).to.have.length(1);

                let record0 = mergedDelta['!'][0];
                expect(record0).to.be.a('object');
                expect(record0.conflictType).to.equal(jsod.Attributes.ConflictType.RECORD_DIFF_OPERATION);
                expect(record0.A).to.deep.equal(deltaA['.'][0]);
                expect(record0.B).to.deep.equal(deltaB['.'][0]);
                expect(record0.A).to.not.equal(deltaA['.'][0]); //Or it is not a clone
                expect(record0.B).to.not.equal(deltaB['.'][0]); //Or it is not a clone
            });
        });
    });

    describe("merging on object(/tree) with different properties of value type", function(){

        let dataForms = {
            "_": {}, //empty (not missing! missing will be undefined anyway)
            'a': {a: "a"},
            'aa': {a: {a: "a"}},
            'aaa': {a: {a: {a: "a"}}},
            'aa2': {a: {a: "a2"}},
            'a2': {a: "a2"},
            'a3': {a: "a3"},
            'b': {b: "b"},
            'b2': {b: "b2"},
            'ab': {ab: "ab"},
            'a_b': {a: "a", b: "b"},
            'a2_b2': {a: "a2", b: "b2"},
            'a2_b': {a: "a2", b: "b"},
            'a_b2': {a: "a", b: "b2"}
        };


        describe("merging deltaA with missing deltaB", function() {
            let origin = dataForms._;
            let changed = dataForms.a;

            let deltaA = jsod.diff(origin, changed);
            let deltaB = undefined;
            let mergedDelta = jsod.mergeDeltas(deltaA, deltaB);

            it('should return a copy of deltaA', function(){
                expect(mergedDelta).to.deep.equal(deltaA);
                expect(mergedDelta).to.not.equal(deltaA);
                expect(mergedDelta).to.not.equal(deltaB);
            });
        });
        describe("merging missing deltaA with deltaB", function() {
            let origin = dataForms._;
            let changed = dataForms.a;

            let deltaA = undefined;
            let deltaB = jsod.diff(origin, changed);
            let mergedDelta = jsod.mergeDeltas(deltaA, deltaB);

            it('should return a copy of deltaB', function(){
                expect(mergedDelta).to.deep.equal(deltaB);
                expect(mergedDelta).to.not.equal(deltaA);
                expect(mergedDelta).to.not.equal(deltaB);
            });
        });
        describe("merging missing deltaA with missing deltaB", function() {
            let origin = dataForms._;
            let changed = dataForms.a;

            let deltaA = undefined;
            let deltaB = undefined;
            let mergedDelta = jsod.mergeDeltas(deltaA, deltaB);

            it('should return an empty object', function(){
                expect(mergedDelta).to.deep.equal({});
                expect(mergedDelta).to.not.equal(deltaA);
                expect(mergedDelta).to.not.equal(deltaB);
            });
        });

        describe("merging one ADD with one unchanged", function() {
            let origin = dataForms._;
            let changedA = dataForms.a;
            let changedB = dataForms._;

            let deltaA = jsod.diff(origin, changedA);
            let deltaB = jsod.diff(origin, changedB);
            let mergedDelta = jsod.mergeDeltas(deltaA, deltaB);

            it('should contain no conflicts', function(){
                expect(mergedDelta['!']).to.equal(undefined);
                _.forEach(mergedDelta['/'], function(subtree){
                    expect(subtree['!']).to.equal(undefined);
                });
            });
            it('should contain no records at root', function(){
                expect(mergedDelta['.']).to.equal(undefined);
            });
            it('should contain one subtree', function(){
                expect(mergedDelta['/']).to.be.a('object');
                expect(_.keys(mergedDelta['/'])).to.have.length(1);
            });
            it('should contain one record in subtree that is a copy of the record from the ADD', function(){
                expect(mergedDelta['/']['a']['.']).to.be.a('array');
                expect(mergedDelta['/']['a']['.']).to.have.length(1);
                let record0 = mergedDelta['/']['a']['.'][0];
                expect(record0).to.be.deep.equal(deltaA['/']['a']['.'][0]);
                expect(record0).to.be.not.equal(deltaA['/']['a']['.'][0]);
            });
        });
        describe("merging one MODIFY with one unchanged", function() {
            let origin = dataForms.a;
            let changedA = dataForms.a2;
            let changedB = dataForms.a;

            let deltaA = jsod.diff(origin, changedA);
            let deltaB = jsod.diff(origin, changedB);
            let mergedDelta = jsod.mergeDeltas(deltaA, deltaB);

            it('should contain no conflicts', function(){
                expect(mergedDelta['!']).to.equal(undefined);
                _.forEach(mergedDelta['/'], function(subtree){
                    expect(subtree['!']).to.equal(undefined);
                });
            });
            it('should contain no records at root', function(){
                expect(mergedDelta['.']).to.equal(undefined);
            });
            it('should contain one subtree', function(){
                expect(mergedDelta['/']).to.be.a('object');
                expect(_.keys(mergedDelta['/'])).to.have.length(1);
            });
            it('should contain one record in subtree that is a copy of the record from the MODIFY', function(){
                expect(mergedDelta['/']['a']['.']).to.be.a('array');
                expect(mergedDelta['/']['a']['.']).to.have.length(1);
                let record0 = mergedDelta['/']['a']['.'][0];
                expect(record0).to.be.deep.equal(deltaA['/']['a']['.'][0]);
                expect(record0).to.be.not.equal(deltaA['/']['a']['.'][0]);
            });
        });
        describe("merging one DELETE with one unchanged", function() {
            let origin = dataForms.a;
            let changedA = dataForms._;
            let changedB = dataForms.a;

            let deltaA = jsod.diff(origin, changedA);
            let deltaB = jsod.diff(origin, changedB);
            let mergedDelta = jsod.mergeDeltas(deltaA, deltaB);

            it('should contain no conflicts', function(){
                expect(mergedDelta['!']).to.equal(undefined);
                _.forEach(mergedDelta['/'], function(subtree){
                    expect(subtree['!']).to.equal(undefined);
                });
            });
            it('should contain no records at root', function(){
                expect(mergedDelta['.']).to.equal(undefined);
            });
            it('should contain one subtree', function(){
                expect(mergedDelta['/']).to.be.a('object');
                expect(_.keys(mergedDelta['/'])).to.have.length(1);
            });
            it('should contain one record in subtree that is a copy of the record from the DELETE', function(){
                expect(mergedDelta['/']['a']['.']).to.be.a('array');
                expect(mergedDelta['/']['a']['.']).to.have.length(1);
                let record0 = mergedDelta['/']['a']['.'][0];
                expect(record0).to.be.deep.equal(deltaA['/']['a']['.'][0]);
                expect(record0).to.be.not.equal(deltaA['/']['a']['.'][0]);
            });
        });

        describe("merging two equal ADD", function() {
            let origin = dataForms._;
            let changedA = dataForms.a;
            let changedB = dataForms.a;

            let deltaA = jsod.diff(origin, changedA);
            let deltaB = jsod.diff(origin, changedB);
            let mergedDelta = jsod.mergeDeltas(deltaA, deltaB);

            it('should contain no conflicts', function(){
                expect(mergedDelta['!']).to.equal(undefined);
                _.forEach(mergedDelta['/'], function(subtree){
                    expect(subtree['!']).to.equal(undefined);
                });
            });
            it('should contain no records at root', function(){
                expect(mergedDelta['.']).to.equal(undefined);
            });
            it('should contain one subtree', function(){
                expect(mergedDelta['/']).to.be.a('object');
                expect(_.keys(mergedDelta['/'])).to.have.length(1);
            });
            it('should contain one record in subtree that is a copy of the record from the ADD', function(){
                expect(mergedDelta['/']['a']['.']).to.be.a('array');
                expect(mergedDelta['/']['a']['.']).to.have.length(1);
                let record0 = mergedDelta['/']['a']['.'][0];
                expect(record0).to.be.deep.equal(deltaA['/']['a']['.'][0]);
                expect(record0).to.be.not.equal(deltaA['/']['a']['.'][0]);
            });
        });
        describe("merging two equal MODIFY", function() {
            let origin = dataForms.a;
            let changedA = dataForms.a2;
            let changedB = dataForms.a2;

            let deltaA = jsod.diff(origin, changedA);
            let deltaB = jsod.diff(origin, changedB);
            let mergedDelta = jsod.mergeDeltas(deltaA, deltaB);

            it('should contain no conflicts', function(){
                expect(mergedDelta['!']).to.equal(undefined);
                _.forEach(mergedDelta['/'], function(subtree){
                    expect(subtree['!']).to.equal(undefined);
                });
            });
            it('should contain no records at root', function(){
                expect(mergedDelta['.']).to.equal(undefined);
            });
            it('should contain one subtree', function(){
                expect(mergedDelta['/']).to.be.a('object');
                expect(_.keys(mergedDelta['/'])).to.have.length(1);
            });
            it('should contain one record in subtree that is a copy of the record from the MODIFY', function(){
                expect(mergedDelta['/']['a']['.']).to.be.a('array');
                expect(mergedDelta['/']['a']['.']).to.have.length(1);
                let record0 = mergedDelta['/']['a']['.'][0];
                expect(record0).to.be.deep.equal(deltaA['/']['a']['.'][0]);
                expect(record0).to.be.not.equal(deltaA['/']['a']['.'][0]);
            });
        });
        describe("merging two equal DELETE", function() {
            let origin = dataForms.a;
            let changedA = dataForms._;
            let changedB = dataForms._;

            let deltaA = jsod.diff(origin, changedA);
            let deltaB = jsod.diff(origin, changedB);
            let mergedDelta = jsod.mergeDeltas(deltaA, deltaB);
            it('should contain no conflicts', function(){
                expect(mergedDelta['!']).to.equal(undefined);
                _.forEach(mergedDelta['/'], function(subtree){
                    expect(subtree['!']).to.equal(undefined);
                });
            });
            it('should contain no records at root', function(){
                expect(mergedDelta['.']).to.equal(undefined);
            });
            it('should contain one subtree', function(){
                expect(mergedDelta['/']).to.be.a('object');
                expect(_.keys(mergedDelta['/'])).to.have.length(1);
            });
            it('should contain one record in subtree that is a copy of the record from the DELETE', function(){
                expect(mergedDelta['/']['a']['.']).to.be.a('array');
                expect(mergedDelta['/']['a']['.']).to.have.length(1);
                let record0 = mergedDelta['/']['a']['.'][0];
                expect(record0).to.be.deep.equal(deltaA['/']['a']['.'][0]);
                expect(record0).to.be.not.equal(deltaA['/']['a']['.'][0]);
            });
        });


        describe("merging two different ADD at different locations", function() {
            let origin = dataForms._;
            let changedA = dataForms.a;
            let changedB = dataForms.b;

            let deltaA = jsod.diff(origin, changedA);
            let deltaB = jsod.diff(origin, changedB);
            let mergedDelta = jsod.mergeDeltas(deltaA, deltaB);

            it('should contain no conflicts', function(){
                expect(mergedDelta['!']).to.equal(undefined);
                _.forEach(mergedDelta['/'], function(subtree){
                    expect(subtree['!']).to.equal(undefined);
                });
            });
            it('should contain no records at root', function(){
                expect(mergedDelta['.']).to.equal(undefined);
            });
            it('should contain two subtrees', function(){
                expect(mergedDelta['/']).to.be.a('object');
                expect(_.keys(mergedDelta['/'])).to.have.length(2);
            });
            it('should contain one record in each subtree that is a copy of the record from the respective ADD', function(){
                _.forEach(mergedDelta['/'], function(subtree, key){
                    expect(subtree['.']).to.be.a('array');
                    expect(subtree['.']).to.have.length(1);
                    let record0 = subtree['.'][0];
                    if(key == 'a')
                    {
                        expect(record0).to.be.deep.equal(deltaA['/'][key]['.'][0]);
                        expect(record0).to.be.not.equal(deltaA['/'][key]['.'][0]);
                    } else if(key == 'b')
                    {
                        expect(record0).to.be.deep.equal(deltaB['/'][key]['.'][0]);
                        expect(record0).to.be.not.equal(deltaB['/'][key]['.'][0]);
                    }
                });
            });
        });
        describe("merging two different MODIFY at different locations", function() {
            let origin = dataForms.a_b;
            let changedA = dataForms.a2_b;
            let changedB = dataForms.a_b2;

            let deltaA = jsod.diff(origin, changedA);
            let deltaB = jsod.diff(origin, changedB);
            let mergedDelta = jsod.mergeDeltas(deltaA, deltaB);

            it('should contain no conflicts', function(){
                expect(mergedDelta['!']).to.equal(undefined);
                _.forEach(mergedDelta['/'], function(subtree){
                    expect(subtree['!']).to.equal(undefined);
                });
            });
            it('should contain no records at root', function(){
                expect(mergedDelta['.']).to.equal(undefined);
            });
            it('should contain two subtrees', function(){
                expect(mergedDelta['/']).to.be.a('object');
                expect(_.keys(mergedDelta['/'])).to.have.length(2);
            });
            it('should contain one record in each subtree that is a copy of the record from the respective MODIFY', function(){
                _.forEach(mergedDelta['/'], function(subtree, key){
                    expect(subtree['.']).to.be.a('array');
                    expect(subtree['.']).to.have.length(1);
                    let record0 = subtree['.'][0];
                    if(key == 'a')
                    {
                        expect(record0).to.be.deep.equal(deltaA['/'][key]['.'][0]);
                        expect(record0).to.be.not.equal(deltaA['/'][key]['.'][0]);
                    } else if(key == 'b')
                    {
                        expect(record0).to.be.deep.equal(deltaB['/'][key]['.'][0]);
                        expect(record0).to.be.not.equal(deltaB['/'][key]['.'][0]);
                    }
                });
            });
        });
        describe("merging two DELETE at different locations", function() {
            let origin = dataForms.a_b;
            let changedA = dataForms.b;
            let changedB = dataForms.a;

            let deltaA = jsod.diff(origin, changedA);
            let deltaB = jsod.diff(origin, changedB);
            let mergedDelta = jsod.mergeDeltas(deltaA, deltaB);

            it('should contain no conflicts', function(){
                expect(mergedDelta['!']).to.equal(undefined);
                _.forEach(mergedDelta['/'], function(subtree){
                    expect(subtree['!']).to.equal(undefined);
                });
            });
            it('should contain no records at root', function(){
                expect(mergedDelta['.']).to.equal(undefined);
            });
            it('should contain two subtrees', function(){
                expect(mergedDelta['/']).to.be.a('object');
                expect(_.keys(mergedDelta['/'])).to.have.length(2);
            });
            it('should contain one record in each subtree that is a copy of the record from the respective DELETE', function(){
                _.forEach(mergedDelta['/'], function(subtree, key){
                    expect(subtree['.']).to.be.a('array');
                    expect(subtree['.']).to.have.length(1);
                    let record0 = subtree['.'][0];
                    if(key == 'a')
                    {
                        expect(record0).to.be.deep.equal(deltaA['/'][key]['.'][0]);
                        expect(record0).to.be.not.equal(deltaA['/'][key]['.'][0]);
                    } else if(key == 'b')
                    {
                        expect(record0).to.be.deep.equal(deltaB['/'][key]['.'][0]);
                        expect(record0).to.be.not.equal(deltaB['/'][key]['.'][0]);
                    }
                });
            });
        });

        describe("merging one MODIFY with a MODIFY at a location nested under the prior", function() {
            let origin = dataForms.aa;
            let changedA = dataForms.a;
            let changedB = dataForms.aa2;

            let deltaA = jsod.diff(origin, changedA);
            let deltaB = jsod.diff(origin, changedB);
            let mergedDelta = jsod.mergeDeltas(deltaA, deltaB);

            it('should contain no conflicts at root', function(){
                expect(mergedDelta['!']).to.equal(undefined);
            });
            it('should contain no records at root', function(){
                expect(mergedDelta['.']).to.equal(undefined);
            });
            it('should contain one subtree', function(){
                expect(mergedDelta['/']).to.be.a('object');
                expect(_.keys(mergedDelta['/'])).to.have.length(1);
            });
            it('should contain no deeper subtree', function(){
                expect(mergedDelta['/']['a']['/']).to.equal(undefined);
            });
            it('should return one conflict of type TREE_DIFF_STRUCTURE containing copies of both DeltaTrees', function(){
                let subtree = mergedDelta['/']['a'];
                expect(subtree['!']).to.be.a('array');
                expect(subtree['!']).to.have.length(1);

                let record0 = subtree['!'][0];
                expect(record0).to.be.a('object');
                expect(record0.conflictType).to.equal(jsod.Attributes.ConflictType.TREE_DIFF_STRUCTURE);
                expect(record0.A).to.be.a('object');
                expect(record0.B).to.be.a('object');
                expect(record0.A).to.deep.equal(deltaA['/']['a']);
                expect(record0.B).to.deep.equal(deltaB['/']['a']);
                expect(record0.A).to.not.equal(deltaA['/']['a']); //Or it is not a clone
                expect(record0.B).to.not.equal(deltaB['/']['a']); //Or it is not a clone
            });
        });
        describe("merging one DELETE with a MODIFY at a location nested under the prior", function() {
            let origin = dataForms.aa;
            let changedA = dataForms._;
            let changedB = dataForms.aa2;

            let deltaA = jsod.diff(origin, changedA);
            let deltaB = jsod.diff(origin, changedB);
            let mergedDelta = jsod.mergeDeltas(deltaA, deltaB);

            it('should contain no conflicts at root', function(){
                expect(mergedDelta['!']).to.equal(undefined);
            });
            it('should contain no records at root', function(){
                expect(mergedDelta['.']).to.equal(undefined);
            });
            it('should contain one subtree', function(){
                expect(mergedDelta['/']).to.be.a('object');
                expect(_.keys(mergedDelta['/'])).to.have.length(1);
            });
            it('should contain no deeper subtree', function(){
                expect(mergedDelta['/']['a']['/']).to.equal(undefined);
            });
            it('should return one conflict of type TREE_DIFF_STRUCTURE containing copies of both DeltaTrees', function(){
                let subtree = mergedDelta['/']['a'];
                expect(subtree['!']).to.be.a('array');
                expect(subtree['!']).to.have.length(1);

                let record0 = subtree['!'][0];
                expect(record0).to.be.a('object');
                expect(record0.conflictType).to.equal(jsod.Attributes.ConflictType.TREE_DIFF_STRUCTURE);
                expect(record0.A).to.be.a('object');
                expect(record0.B).to.be.a('object');
                expect(record0.A).to.deep.equal(deltaA['/']['a']);
                expect(record0.B).to.deep.equal(deltaB['/']['a']);
                expect(record0.A).to.not.equal(deltaA['/']['a']); //Or it is not a clone
                expect(record0.B).to.not.equal(deltaB['/']['a']); //Or it is not a clone
            });
        });

        describe("merging two different ADD at the same location", function() {
            let origin = dataForms._;
            let changedA = dataForms.a;
            let changedB = dataForms.a2;

            let deltaA = jsod.diff(origin, changedA);
            let deltaB = jsod.diff(origin, changedB);
            let mergedDelta = jsod.mergeDeltas(deltaA, deltaB);

            it('should contain no conflicts at root', function(){
                expect(mergedDelta['!']).to.equal(undefined);
            });
            it('should contain no records at root', function(){
                expect(mergedDelta['.']).to.equal(undefined);
            });
            it('should contain one subtree', function(){
                expect(mergedDelta['/']).to.be.a('object');
                expect(_.keys(mergedDelta['/'])).to.have.length(1);
            });
            it('should return one conflict of type RECORD_DIFF_VALUE containing copies of both DeltaRecords', function(){
                let subtree = mergedDelta['/']['a'];
                expect(subtree['!']).to.be.a('array');
                expect(subtree['!']).to.have.length(1);

                let record0 = subtree['!'][0];
                expect(record0).to.be.a('object');
                expect(record0.conflictType).to.equal(jsod.Attributes.ConflictType.RECORD_DIFF_VALUE);
                expect(record0.A).to.deep.equal(deltaA['/']['a']['.'][0]);
                expect(record0.B).to.deep.equal(deltaB['/']['a']['.'][0]);
                expect(record0.A).to.not.equal(deltaA['/']['a']['.'][0]); //Or it is not a clone
                expect(record0.B).to.not.equal(deltaB['/']['a']['.'][0]); //Or it is not a clone
            });
        });
        describe("merging two different MODIFY at the same location", function() {
            let origin = dataForms.a;
            let changedA = dataForms.a2;
            let changedB = dataForms.a3;

            let deltaA = jsod.diff(origin, changedA);
            let deltaB = jsod.diff(origin, changedB);
            let mergedDelta = jsod.mergeDeltas(deltaA, deltaB);

            it('should contain no conflicts at root', function(){
                expect(mergedDelta['!']).to.equal(undefined);
            });
            it('should contain no records at root', function(){
                expect(mergedDelta['.']).to.equal(undefined);
            });
            it('should contain one subtree', function(){
                expect(mergedDelta['/']).to.be.a('object');
                expect(_.keys(mergedDelta['/'])).to.have.length(1);
            });
            it('should return one conflict of type RECORD_DIFF_VALUE containing copies of both DeltaRecords', function(){
                let subtree = mergedDelta['/']['a'];
                expect(subtree['!']).to.be.a('array');
                expect(subtree['!']).to.have.length(1);

                let record0 = subtree['!'][0];
                expect(record0).to.be.a('object');
                expect(record0.conflictType).to.equal(jsod.Attributes.ConflictType.RECORD_DIFF_VALUE);
                expect(record0.A).to.deep.equal(deltaA['/']['a']['.'][0]);
                expect(record0.B).to.deep.equal(deltaB['/']['a']['.'][0]);
                expect(record0.A).to.not.equal(deltaA['/']['a']['.'][0]); //Or it is not a clone
                expect(record0.B).to.not.equal(deltaB['/']['a']['.'][0]); //Or it is not a clone
            });
        });

        describe("merging one DELETE with one MODIFY at the same location", function() {
            let origin = dataForms.a;
            let changedA = dataForms._;
            let changedB = dataForms.a2;

            let deltaA = jsod.diff(origin, changedA);
            let deltaB = jsod.diff(origin, changedB);
            let mergedDelta = jsod.mergeDeltas(deltaA, deltaB);

            it('should contain no conflicts at root', function(){
                expect(mergedDelta['!']).to.equal(undefined);
            });
            it('should contain no records at root', function(){
                expect(mergedDelta['.']).to.equal(undefined);
            });
            it('should contain one subtree', function(){
                expect(mergedDelta['/']).to.be.a('object');
                expect(_.keys(mergedDelta['/'])).to.have.length(1);
            });
            it('should return one conflict of type RECORD_DIFF_OPERATION containing copies of both DeltaRecords', function(){
                let subtree = mergedDelta['/']['a'];
                expect(subtree['!']).to.be.a('array');
                expect(subtree['!']).to.have.length(1);

                let record0 = subtree['!'][0];
                expect(record0).to.be.a('object');
                expect(record0.conflictType).to.equal(jsod.Attributes.ConflictType.RECORD_DIFF_OPERATION);
                expect(record0.A).to.deep.equal(deltaA['/']['a']['.'][0]);
                expect(record0.B).to.deep.equal(deltaB['/']['a']['.'][0]);
                expect(record0.A).to.not.equal(deltaA['/']['a']['.'][0]); //Or it is not a clone
                expect(record0.B).to.not.equal(deltaB['/']['a']['.'][0]); //Or it is not a clone
            });
        });

    });
});

