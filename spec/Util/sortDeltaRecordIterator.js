"use strict";

let
    _ = require('lodash')
    ,chai = require('chai')
    ,expect = chai.expect
    ;

let jsod = require('../../');
describe('jsod.Util#sortDeltaRecordIterator()', function() {

    context("when comparing ADD and ADD, both same non-numeric keys", function(){
        let recordA = ['0', jsod.Attributes.DeltaOperation.ADD];
        let recordB = ['0', jsod.Attributes.DeltaOperation.ADD];
        itShouldPrioritize("none", expectNoOrder, recordA, recordB);
    });
    context("when comparing DELETE and DELETE, both same non-numeric keys", function(){
        let recordA = ['0', jsod.Attributes.DeltaOperation.DELETE];
        let recordB = ['0', jsod.Attributes.DeltaOperation.DELETE];
        itShouldPrioritize("none", expectNoOrder, recordA, recordB);
    });
    context("when comparing MODIFY and MODIFY, both same non-numeric keys", function(){
        let recordA = ['0', jsod.Attributes.DeltaOperation.MODIFY];
        let recordB = ['0', jsod.Attributes.DeltaOperation.MODIFY];
        itShouldPrioritize("none", expectNoOrder, recordA, recordB);
    });
    context("when comparing ADD and MODIFY, both same non-numeric keys", function(){
        let recordA = ['0', jsod.Attributes.DeltaOperation.ADD];
        let recordB = ['0', jsod.Attributes.DeltaOperation.MODIFY];
        itShouldPrioritize("ADD", expectPreOrder, recordA, recordB);
    });
    context("when comparing MODIFY and ADD, both same non-numeric keys", function(){
        let recordA = ['0', jsod.Attributes.DeltaOperation.MODIFY];
        let recordB = ['0', jsod.Attributes.DeltaOperation.ADD];
        itShouldPrioritize("ADD", expectPostOrder, recordA, recordB);
    });
    context("when comparing ADD and DELETE, both same non-numeric keys", function(){
        let recordA = ['0', jsod.Attributes.DeltaOperation.ADD];
        let recordB = ['0', jsod.Attributes.DeltaOperation.DELETE];
        itShouldPrioritize("ADD", expectPreOrder, recordA, recordB);
    });
    context("when comparing DELETE and ADD, both same non-numeric keys", function(){
        let recordA = ['0', jsod.Attributes.DeltaOperation.DELETE];
        let recordB = ['0', jsod.Attributes.DeltaOperation.ADD];
        itShouldPrioritize("ADD", expectPostOrder, recordA, recordB);
    });
    context("when comparing DELETE and MODIFY, both same non-numeric keys", function(){
        let recordA = ['0', jsod.Attributes.DeltaOperation.DELETE];
        let recordB = ['0', jsod.Attributes.DeltaOperation.MODIFY];
        itShouldPrioritize("DELETE", expectPreOrder, recordA, recordB);
    });
    context("when comparing MODIFY and DELETE, both same non-numeric keys", function(){
        let recordA = ['0', jsod.Attributes.DeltaOperation.MODIFY];
        let recordB = ['0', jsod.Attributes.DeltaOperation.DELETE];
        itShouldPrioritize("DELETE", expectPostOrder, recordA, recordB);
    });

    context("when comparing ADD and ADD, increasing non-numeric keys", function(){
        let recordA = ['0', jsod.Attributes.DeltaOperation.ADD];
        let recordB = ['1', jsod.Attributes.DeltaOperation.ADD];
        itShouldPrioritize("first", expectPreOrder, recordA, recordB);
    });
    context("when comparing DELETE and DELETE, increasing non-numeric keys", function(){
        let recordA = ['0', jsod.Attributes.DeltaOperation.DELETE];
        let recordB = ['1', jsod.Attributes.DeltaOperation.DELETE];
        itShouldPrioritize("first", expectPreOrder, recordA, recordB);
    });
    context("when comparing MODIFY and MODIFY, increasing non-numeric keys", function(){
        let recordA = ['0', jsod.Attributes.DeltaOperation.MODIFY];
        let recordB = ['1', jsod.Attributes.DeltaOperation.MODIFY];
        itShouldPrioritize("first", expectPreOrder, recordA, recordB);
    });
    context("when comparing ADD and MODIFY, increasing non-numeric keys", function(){
        let recordA = ['0', jsod.Attributes.DeltaOperation.ADD];
        let recordB = ['1', jsod.Attributes.DeltaOperation.MODIFY];
        itShouldPrioritize("first", expectPreOrder, recordA, recordB);
    });
    context("when comparing MODIFY and ADD, increasing non-numeric keys", function(){
        let recordA = ['0', jsod.Attributes.DeltaOperation.MODIFY];
        let recordB = ['1', jsod.Attributes.DeltaOperation.ADD];
        itShouldPrioritize("first", expectPreOrder, recordA, recordB);
    });
    context("when comparing ADD and DELETE, increasing non-numeric keys", function(){
        let recordA = ['0', jsod.Attributes.DeltaOperation.ADD];
        let recordB = ['1', jsod.Attributes.DeltaOperation.DELETE];
        itShouldPrioritize("first", expectPreOrder, recordA, recordB);
    });
    context("when comparing DELETE and ADD, increasing non-numeric keys", function(){
        let recordA = ['0', jsod.Attributes.DeltaOperation.DELETE];
        let recordB = ['1', jsod.Attributes.DeltaOperation.ADD];
        itShouldPrioritize("first", expectPreOrder, recordA, recordB);
    });
    context("when comparing DELETE and MODIFY, increasing non-numeric keys", function(){
        let recordA = ['0', jsod.Attributes.DeltaOperation.DELETE];
        let recordB = ['1', jsod.Attributes.DeltaOperation.MODIFY];
        itShouldPrioritize("first", expectPreOrder, recordA, recordB);
    });
    context("when comparing MODIFY and DELETE, increasing non-numeric keys", function(){
        let recordA = ['0', jsod.Attributes.DeltaOperation.MODIFY];
        let recordB = ['1', jsod.Attributes.DeltaOperation.DELETE];
        itShouldPrioritize("first", expectPreOrder, recordA, recordB);
    });

    context("when comparing ADD and ADD, decreasing non-numeric keys", function(){
        let recordA = ['1', jsod.Attributes.DeltaOperation.ADD];
        let recordB = ['0', jsod.Attributes.DeltaOperation.ADD];
        itShouldPrioritize("second", expectPostOrder, recordA, recordB);
    });
    context("when comparing DELETE and DELETE, decreasing non-numeric keys", function(){
        let recordA = ['1', jsod.Attributes.DeltaOperation.DELETE];
        let recordB = ['0', jsod.Attributes.DeltaOperation.DELETE];
        itShouldPrioritize("second", expectPostOrder, recordA, recordB);
    });
    context("when comparing MODIFY and MODIFY, decreasing non-numeric keys", function(){
        let recordA = ['1', jsod.Attributes.DeltaOperation.MODIFY];
        let recordB = ['0', jsod.Attributes.DeltaOperation.MODIFY];
        itShouldPrioritize("second", expectPostOrder, recordA, recordB);
    });
    context("when comparing ADD and MODIFY, decreasing non-numeric keys", function(){
        let recordA = ['1', jsod.Attributes.DeltaOperation.ADD];
        let recordB = ['0', jsod.Attributes.DeltaOperation.MODIFY];
        itShouldPrioritize("second", expectPostOrder, recordA, recordB);
    });
    context("when comparing MODIFY and ADD, decreasing non-numeric keys", function(){
        let recordA = ['1', jsod.Attributes.DeltaOperation.MODIFY];
        let recordB = ['0', jsod.Attributes.DeltaOperation.ADD];
        itShouldPrioritize("second", expectPostOrder, recordA, recordB);
    });
    context("when comparing ADD and DELETE, decreasing non-numeric keys", function(){
        let recordA = ['1', jsod.Attributes.DeltaOperation.ADD];
        let recordB = ['0', jsod.Attributes.DeltaOperation.DELETE];
        itShouldPrioritize("second", expectPostOrder, recordA, recordB);
    });
    context("when comparing DELETE and ADD, decreasing non-numeric keys", function(){
        let recordA = ['1', jsod.Attributes.DeltaOperation.DELETE];
        let recordB = ['0', jsod.Attributes.DeltaOperation.ADD];
        itShouldPrioritize("second", expectPostOrder, recordA, recordB);
    });
    context("when comparing DELETE and MODIFY, decreasing non-numeric keys", function(){
        let recordA = ['1', jsod.Attributes.DeltaOperation.DELETE];
        let recordB = ['0', jsod.Attributes.DeltaOperation.MODIFY];
        itShouldPrioritize("second", expectPostOrder, recordA, recordB);
    });
    context("when comparing MODIFY and DELETE, decreasing non-numeric keys", function(){
        let recordA = ['1', jsod.Attributes.DeltaOperation.MODIFY];
        let recordB = ['0', jsod.Attributes.DeltaOperation.DELETE];
        itShouldPrioritize("second", expectPostOrder, recordA, recordB);
    });

    describe("intelligent ordering on numeric keys for optimizing list operations", function(){

        context("when comparing ADD and ADD, both same numeric keys", function(){
            let recordA = [0, jsod.Attributes.DeltaOperation.ADD];
            let recordB = [0, jsod.Attributes.DeltaOperation.ADD];
            itShouldPrioritize("none", expectNoOrder, recordA, recordB);
        });
        context("when comparing DELETE and DELETE, both same numeric keys", function(){
            let recordA = [0, jsod.Attributes.DeltaOperation.DELETE];
            let recordB = [0, jsod.Attributes.DeltaOperation.DELETE];
            itShouldPrioritize("none", expectNoOrder, recordA, recordB);
        });
        context("when comparing MODIFY and MODIFY, both same numeric keys", function(){
            let recordA = [0, jsod.Attributes.DeltaOperation.MODIFY];
            let recordB = [0, jsod.Attributes.DeltaOperation.MODIFY];
            itShouldPrioritize("none", expectNoOrder, recordA, recordB);
        });
        context("when comparing ADD and MODIFY, both same numeric keys", function(){
            let recordA = [0, jsod.Attributes.DeltaOperation.ADD];
            let recordB = [0, jsod.Attributes.DeltaOperation.MODIFY];
            itShouldPrioritize("ADD", expectPreOrder, recordA, recordB);
        });
        context("when comparing MODIFY and ADD, both same numeric keys", function(){
            let recordA = [0, jsod.Attributes.DeltaOperation.MODIFY];
            let recordB = [0, jsod.Attributes.DeltaOperation.ADD];
            itShouldPrioritize("ADD", expectPostOrder, recordA, recordB);
        });
        context("when comparing ADD and DELETE, both same numeric keys", function(){
            let recordA = [0, jsod.Attributes.DeltaOperation.ADD];
            let recordB = [0, jsod.Attributes.DeltaOperation.DELETE];
            itShouldPrioritize("ADD", expectPreOrder, recordA, recordB);
        });
        context("when comparing DELETE and ADD, both same numeric keys", function(){
            let recordA = [0, jsod.Attributes.DeltaOperation.DELETE];
            let recordB = [0, jsod.Attributes.DeltaOperation.ADD];
            itShouldPrioritize("ADD", expectPostOrder, recordA, recordB);
        });
        context("when comparing DELETE and MODIFY, both same numeric keys", function(){
            let recordA = [0, jsod.Attributes.DeltaOperation.DELETE];
            let recordB = [0, jsod.Attributes.DeltaOperation.MODIFY];
            itShouldPrioritize("DELETE", expectPreOrder, recordA, recordB);
        });
        context("when comparing MODIFY and DELETE, both same numeric keys", function(){
            let recordA = [0, jsod.Attributes.DeltaOperation.MODIFY];
            let recordB = [0, jsod.Attributes.DeltaOperation.DELETE];
            itShouldPrioritize("DELETE", expectPostOrder, recordA, recordB);
        });

        context("when comparing ADD and ADD, increasing numeric keys", function(){
            let recordA = [0, jsod.Attributes.DeltaOperation.ADD];
            let recordB = [1, jsod.Attributes.DeltaOperation.ADD];
            itShouldPrioritize("second", expectPostOrder, recordA, recordB);
        });
        context("when comparing DELETE and DELETE, increasing numeric keys", function(){
            let recordA = [0, jsod.Attributes.DeltaOperation.DELETE];
            let recordB = [1, jsod.Attributes.DeltaOperation.DELETE];
            itShouldPrioritize("first", expectPreOrder, recordA, recordB);
        });
        context("when comparing MODIFY and MODIFY, increasing numeric keys", function(){
            let recordA = [0, jsod.Attributes.DeltaOperation.MODIFY];
            let recordB = [1, jsod.Attributes.DeltaOperation.MODIFY];
            itShouldPrioritize("first", expectPreOrder, recordA, recordB);
        });
        context("when comparing ADD and MODIFY, increasing numeric keys", function(){
            let recordA = [0, jsod.Attributes.DeltaOperation.ADD];
            let recordB = [1, jsod.Attributes.DeltaOperation.MODIFY];
            itShouldPrioritize("first", expectPreOrder, recordA, recordB);
        });
        context("when comparing MODIFY and ADD, increasing numeric keys", function(){
            let recordA = [0, jsod.Attributes.DeltaOperation.MODIFY];
            let recordB = [1, jsod.Attributes.DeltaOperation.ADD];
            itShouldPrioritize("second", expectPostOrder, recordA, recordB);
        });
        context("when comparing ADD and DELETE, increasing numeric keys", function(){
            let recordA = [0, jsod.Attributes.DeltaOperation.ADD];
            let recordB = [1, jsod.Attributes.DeltaOperation.DELETE];
            itShouldPrioritize("first", expectPreOrder, recordA, recordB);
        });
        context("when comparing DELETE and ADD, increasing numeric keys", function(){
            let recordA = [0, jsod.Attributes.DeltaOperation.DELETE];
            let recordB = [1, jsod.Attributes.DeltaOperation.ADD];
            itShouldPrioritize("second", expectPostOrder, recordA, recordB);
        });
        context("when comparing DELETE and MODIFY, increasing numeric keys", function(){
            let recordA = [0, jsod.Attributes.DeltaOperation.DELETE];
            let recordB = [1, jsod.Attributes.DeltaOperation.MODIFY];
            itShouldPrioritize("first", expectPreOrder, recordA, recordB);
        });
        context("when comparing MODIFY and DELETE, increasing numeric keys", function(){
            let recordA = [0, jsod.Attributes.DeltaOperation.MODIFY];
            let recordB = [1, jsod.Attributes.DeltaOperation.DELETE];
            itShouldPrioritize("second", expectPostOrder, recordA, recordB);
        });

        context("when comparing ADD and ADD, decreasing numeric keys", function(){
            let recordA = [1, jsod.Attributes.DeltaOperation.ADD];
            let recordB = [0, jsod.Attributes.DeltaOperation.ADD];
            itShouldPrioritize("first", expectPreOrder, recordA, recordB);
        });
        context("when comparing DELETE and DELETE, decreasing numeric keys", function(){
            let recordA = [1, jsod.Attributes.DeltaOperation.DELETE];
            let recordB = [0, jsod.Attributes.DeltaOperation.DELETE];
            itShouldPrioritize("second", expectPostOrder, recordA, recordB);
        });
        context("when comparing MODIFY and MODIFY, decreasing numeric keys", function(){
            let recordA = [1, jsod.Attributes.DeltaOperation.MODIFY];
            let recordB = [0, jsod.Attributes.DeltaOperation.MODIFY];
            itShouldPrioritize("second", expectPostOrder, recordA, recordB);
        });
        context("when comparing ADD and MODIFY, decreasing numeric keys", function(){
            let recordA = [1, jsod.Attributes.DeltaOperation.ADD];
            let recordB = [0, jsod.Attributes.DeltaOperation.MODIFY];
            itShouldPrioritize("first", expectPreOrder, recordA, recordB);
        });
        context("when comparing MODIFY and ADD, decreasing numeric keys", function(){
            let recordA = [1, jsod.Attributes.DeltaOperation.MODIFY];
            let recordB = [0, jsod.Attributes.DeltaOperation.ADD];
            itShouldPrioritize("second", expectPostOrder, recordA, recordB);
        });
        context("when comparing ADD and DELETE, decreasing numeric keys", function(){
            let recordA = [1, jsod.Attributes.DeltaOperation.ADD];
            let recordB = [0, jsod.Attributes.DeltaOperation.DELETE];
            itShouldPrioritize("first", expectPreOrder, recordA, recordB);
        });
        context("when comparing DELETE and ADD, decreasing numeric keys", function(){
            let recordA = [1, jsod.Attributes.DeltaOperation.DELETE];
            let recordB = [0, jsod.Attributes.DeltaOperation.ADD];
            itShouldPrioritize("second", expectPostOrder, recordA, recordB);
        });
        context("when comparing DELETE and MODIFY, decreasing numeric keys", function(){
            let recordA = [1, jsod.Attributes.DeltaOperation.DELETE];
            let recordB = [0, jsod.Attributes.DeltaOperation.MODIFY];
            itShouldPrioritize("first", expectPreOrder, recordA, recordB);
        });
        context("when comparing MODIFY and DELETE, decreasing numeric keys", function(){
            let recordA = [1, jsod.Attributes.DeltaOperation.MODIFY];
            let recordB = [0, jsod.Attributes.DeltaOperation.DELETE];
            itShouldPrioritize("second", expectPostOrder, recordA, recordB);
        });

    });

    function expectPreOrder(sortResult){
        expect(sortResult).to.equal(-1);
    }
    function expectPostOrder(sortResult){
        expect(sortResult).to.equal(1);
    }
    function expectNoOrder(sortResult){
        expect(sortResult).to.equal(0);
    }
    function itShouldPrioritize(readableName, expectedOrder, recordA, recordB)
    {
        it("should prioritize "+readableName, function(){
            expectedOrder(jsod.Util.sortDeltaRecordIterator(recordA, recordB));
        });
    }
});