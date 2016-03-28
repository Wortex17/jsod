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
                context('when patching ' + generator.methodName+"s", function(){
                    let O = generator();
                    let A = generator.alternate();
                    let delta = jsod.diff(O, A);
                    it("should make O deep equal to A", function(){
                        let patched = jsod.patch(O, delta);
                        if(_.isArray(patched) && _.isArray(A))
                        {
                            patched.sort();
                            A.sort();
                        }

                        expect(patched).to.satisfy(function deepEqual(){
                            return _.isEqual(patched, A);
                        });
                    });
                });
            }
        })
    });

    describe("Cross-type patch", function(){
        let O = gen.int();
        let A = gen.string();
        let delta = jsod.diff(O, A);

        it("should make O deep equal to A", function(){
            let patched = jsod.patch(O, delta);
            if(_.isArray(patched) && _.isArray(A))
            {
                patched.sort();
                A.sort();
            }

            expect(patched).to.satisfy(function deepEqual(){
                return _.isEqual(patched, A);
            });
        });
    });
});