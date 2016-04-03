"use strict";

let
    _ = require('lodash')
    ,chai = require('chai')
    ,spies = require('chai-spies')
    ,expect = chai.expect
    ;
chai.use(spies);

let jsod = require('../');

describe('jsod#diff3()', function() {

    let diff_spy = chai.spy.on(jsod, 'diff');
    let mergeDeltas_spy = chai.spy.on(jsod, 'mergeDeltas');

    it('should call jsod#diff twice', function(){
        diff_spy.reset();
        jsod.diff3('changedA', 'origin', 'changedB');
        expect(diff_spy).to.have.been.called.twice();
    });
    it('should call jsod#mergeDeltas once', function(){
        mergeDeltas_spy.reset();
        jsod.diff3('changedA', 'origin', 'changedB');
        expect(mergeDeltas_spy).to.have.been.called.once();
    });
    it('should call jsod#diff with origin and changedA as arguments', function(){
        diff_spy.reset();
        jsod.diff3('changedA', 'origin', 'changedB');
        expect(diff_spy).to.have.been.called.with('origin', 'changedA');
    });
    it('should call jsod#diff with origin and changedB as arguments', function(){
        diff_spy.reset();
        callSimple();
        expect(diff_spy).to.have.been.called.with('origin', 'changedB');
    });
    it('should pass config parameter to json#diff', function(){
        diff_spy.reset();
        let params = callWithAllParams();
        expect(diff_spy).to.have.been.called.with('origin', 'changedA', params.diff);
        expect(diff_spy).to.have.been.called.with('origin', 'changedB', params.diff);
    });
    it('should call jsod#mergeDeltas with diff(o,a) and diff(o, b)', function(){
        mergeDeltas_spy.reset();
        let params = callSimple();
        let diffA = jsod.diff('origin', 'changedA');
        let diffB = jsod.diff('origin', 'changedB');
        expect(mergeDeltas_spy).to.have.been.called.with(diffA, diffB);
    });
    it('should pass config parameter and conflictNodes container to json#mergeDeltas', function(){
        mergeDeltas_spy.reset();
        let params = callWithAllParams();
        let diffA = jsod.diff('origin', 'changedA');
        let diffB = jsod.diff('origin', 'changedB');
        expect(mergeDeltas_spy).to.have.been.called.with(diffA, diffB, params.merge, params.conflictNodes);
    });




    ///Common actions
    function callSimple()
    {
        jsod.diff3('changedA', 'origin', 'changedB');
    }
    function callWithAllParams()
    {
        let configParams = {
            diff: {
                $spyFlag: 'diffConfig'
            },
            merge: {
                $spyFlag: 'mergeConfig'
            },
            conflictNodes: []
        };
        jsod.diff3('changedA', 'origin', 'changedB', configParams.diff, configParams.merge, configParams.conflictNodes);
        return configParams;
    }
});
