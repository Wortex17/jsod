# jsod
Diff, diff3 and patch objects of any fundamental or derived type, natively in javascript

[![Build Status](https://travis-ci.org/Wortex17/jsod.svg?branch=master)](https://travis-ci.org/Wortex17/jsod)
[![Coverage Status](https://coveralls.io/repos/github/Wortex17/jsod/badge.svg?branch=master)](https://coveralls.io/github/Wortex17/jsod?branch=master)  
[![NPM Version](https://img.shields.io/npm/v/jsod.svg)](https://www.npmjs.com/package/jsod)
[![NPM Dependencies](https://img.shields.io/david/Wortex17/jsod.svg)](https://david-dm.org/wortex17/jsod)
[![NPM Dev Dependencies](https://img.shields.io/david/dev/Wortex17/jsod.svg)](https://david-dm.org/wortex17/jsod?type=dev)

Jsod (**J**ava**S**cript **O**bject **D**iff) is a configurable and extendable
module that allows to create diffs (also known as deltas) of pure
javascript-native objects and primitives like object,
array, numbers or any derived types. It can also *patch* objects by applying generated
deltas. To conclude, it provides a *diff3* implementation which generates a delta from
a common origin object and two different altered versions,
allowing to merge distributed modifications of the same object,
including detection of conflicts.

* [API](#api)
* [The DeltaTree Format](#the-deltatree-format)
* [Latest changes](#changelog)
* [FAQ](#faq)

## Installation
To install the latest version available on npm:
```
npm install jsod
```
To install the latest development (bleeding-edge) version:
```
npm install git+https://github.com/Wortex17/jsod.git
```

## Usage

Include jsod like any other module. No further setup is required as the methods
do not store any internal states.
```javascript
var jsod = require('jsod');
```

### API

There are nearly no purely internal methods.
All methods and callbacks can be accessed under respective namespaces.
The most common methods are available under the root (`jsod`) namespace,
e.g.:
```javascript
var jsod = require('jsod');
var a = 41;
var b = 42;
var delta = jsod.diff(a, b);
```

#### `diff(origin, changed, [config])`
Returns a DeltaTree, containing all changes that have to be made to the
origin object to result in the changed object.
Using the default generation, the origin and changed object are
recursively iterated, treating encountered objects either as
pure value, as tree, as an unordered list of values or as an
ordered list.  
**By default:**
  * Objects are treated as trees. All their properties are inspected further, adding
  child nodes to the DeltaTree. [See how tree deltas look like](#tree-delta).
  * Arrays are treated as [unordered value-lists](#unordered-value-list-delta).
  Each entry is treated as pure-value only. Entries are matched and identified via their value.
  The index at which entries are found is irrelevant, so the order of entries
  is not guaranteed to be preserved but because of this, no conflicts are possible.
  * Buffers, TypedArrays and other array like objects are treated as [ordered lists](#ordered-list-delta).
  Each entry is identified via its index, very similar to trees. Because of this, ordered lists may produce conflicts
  when merging (just like trees).
  * All other types are treated as pure values, being compared with a deepEqual compare. Generated deltas
  are the same as [tree deltas](#tree-delta).
  * When objects in origin and changed have different types, the always will be
  treated as different pure values.

#### `patch(target, delta)`
Applies a DeltaTree received from `diff(target, changed)` to the target object,
mutating it.
Returns the patched target.
```javascript
var delta = jsod.diff(a, b);
a = jsod.patch(a, delta); //a now resembles b
```

#### `patchClone(target, delta)`
Clones target before applying a DeltaTree received from `diff(target, changed)`
to the clone, not mutating the target.
Returns the patched target clone.
```javascript
var delta = jsod.diff(a, b);
var a2 = jsod.patchClone(a, delta); //ab resembles b while a did not change
```

#### `mergeDeltas(deltaA, deltaB [, config [, conflictNodes [, parentPath]]])`
Creates a new DeltaTree that contains the combined deltas from
deltaA and deltaB. Conflicts will be stored in a DeltaTreeNode under the `!` property.
To quickly iterate all the conflicts, you may give an array for `conflictNodes`, which will
be filled with objects pointing to the nodes and the path of the merged node itself.
```javascript
var deltaA = jsod.diff(o, a);
var deltaB = jsod.diff(o, b);
var conflicts = [];
let combined = jsod.mergeDeltas(deltaA, deltaB, null, conflicts);
console.log(conflicts);
/*
[ {
    path: [ 'sub', 'subsub' ],
    node: { '!': [ { conflictType: 'sameOpDiffVal', A: [ 'subsub', '~', 43 ], B: [ 'subsub', '~', 41 ] } ] } 
    } ]
*/
```
You may want to merge a subtree, e.g. when resolving conflicts. For this purpose,
you can pass the `parentPath` parameter, to which all found paths in given deltas
will be seen as relative to. Otherwise, the conflicts array might be filled
with the wrong paths.  
Conflicts stored in the nodes' `!` property are ignored when patching,
so you can simply ignore conflicts if you wish to.

#### `diff3(changedA, origin, changedB, [, diffConfig [, mergeConfig [, conflictNodes]]])`
Creates a new DeltaTree that contains the combined deltas from origin to changedA and changedB.
Conflicts will be stored in a DeltaTreeNode under the `!` property.
To quickly iterate all the conflicts, you may give an array for `conflictNodes`, which will
be filled with objects pointing to the nodes and the path of the merged node itself.
```javascript
let conflicts = [];
let deltaAB = jsod.diff3(a, o, b, null, null, conflicts);
```
See `mergeDeltas` for more details about merge configuration

## The DeltaTree Format
Internally, jsod reflects object states and deltas in data structure complying with the following rules.
Usually you will not have to cope with these, but if you use `diff3` or `mergeDeltas` it will help you
understand how everything is built up.

`diff` returns a delta tree. A delta tree is a structured set of nodes, containing operations
that have to be performed to get from `origin` to `changed`. Each node itself is again a delta tree, possibly
containing multiple subtrees/nodes. A node does not save the subtree index at which it is stored in its parent,
so bookkeeping of nested trees and paths has to be done manually.

When diffing `origin` and any other object, `origin` is called the *reference object*.
Each node describes the state at a specific position in the reference object by storing delta **records**.
Each record describes what happened at its storing node (not the parent nor the child nodes).

```
<A>     //The root node, here called A
        //It does not contain any records or subtrees, so nothing was done
```

Lets assume the reference object is a *integer* `42`.
Now we change it to contain a different value `43`.
To depict this, the delta tree will have to record the modification.

```
<A>
 ↳ [[undefined, ~, 43]]    //The node now contains a record to MODIFY the node to value 43
```

### DeltaRecord
Before we continue, lets look at *delta records* first. A single delta record looks like this:
```
[index, operation, payload]
```
* The `index` tells us at which index of the **parent** node this operation was performed.
  Most of the time, this index will be identical to the subtree index of the node containing the record.
* The `operation` tells us what to do. If can either be ADD `+` , MODIFY `~` or DELETE `-`.
* The `payload` is the value with which to perform the operation. ADD and MODIFY
  operations require a payload, while DELETE omits it in most cases.

In the upper example, the index was `undefined` because there was no parent node.
The operation was MODIFY to show the change from the old value to the new value stored in the payload, which was `42`.
The type of the payload value is the same as the type the changed value should have. As such,
if we `diff(42, "42")`, we get
```
<A>
 ↳ [[undefined, ~, "42"]]    //Again a MODIFY, because the value has changed (its type).
```
So even though javascript would be able to parse the string version of 42 as number, jsod ignores that and thinks
you wanted to change the reference objects type. Patching this delta tree would also change the type of the 
patching target from *integer* to *string*.

### Tree delta
Almost everytime you generate a delta between objects, you will generate tree deltas.
Tree deltas handle all three base operations on plain value types such as integers, decimals and strings
as well as nested object types such as your typical *javascript objects*.  
The examples you have seen until now have been tree deltas.

Lets look a the following examples.

We *changed* the value of the reference object from `42` to `{}`.
```
<A>
 ↳ [[undefined, ~, {}]]     //The node now contains a record to MODIFY the node to value {}
                            //No new nodes/subtrees were inserted as no properties were modified
```

We *added* a property to the reference object `{}` → `{B: '2'}`.
```
<A>
 ↳ <B>                      //A subtree was added for the property B
    ↳ [['B', +, 2]]         //The new node contains a record that shows that it was added and with what value
```
So, we see that node A now contains a subtree for its property `B` (node B). To let patchers know
what exactly happened with B, an ADD record was created. This tells the patcher that node B needs to be added
at its index `'B'` and with value `2`.

We *changed* a value of property of the reference object `{B: '2'}` → `{B: '4'}`.
```
<A>
 ↳ <B>                      //A subtree was added for the property B, since there have been changes
    ↳ [['B', ~, 4]]         //The new node contains a record that shows that it was modified and with what value
```

We *removed* a property of the reference object `{B: '4'}` → `{}`.
```
<A>
 ↳ <B>                      //A subtree was added for the property B, since there have been changes
    ↳ [['B', -]]            //The node show us that it is to be removed. No payload needed.
```
Here we see that although the property is gone, the subtree and node for B still exists, to record the
deletion. Otherwise, the patcher would not know anything happened.

### List deltas
Tree deltas are pretty simple. For some, it might even look like it is more complicated that it needs to be
and if we would have to diff only tree structures, I would agree.
The reason why tree deltas are not compressed more are lists. List and tree deltas are hard to combine in a structural
way that does not result in completely different structures for each special case.  
When diffing list-like structure, jsod does not care what the underlying data types is (it only may look like it 
because default configurations already denote specific types as specific lists). Any objects that jsod should diff as
list are abstracted to two distinct cases of lists: **Unordered Value-Lists** and **Ordered Lists**.

However _jsod does not convert your objects to any other type_. These abstract list types are just different formats
how list deltas can be recorded in the delta tree, influencing their behaviour during merging and patching.

#### Ordered List delta
Ordered list diffs are very similar to tree diffs. The first difference is that the index of a record for an
ordered list is always numeric, while the index on tree delta records is a string (because javascript converts property
names to strings). Ordered lists can contain complex objects, each of which can be diffed itself.
This means that if you change a single entry in the list, a custom subtree for that entry will be generated.
Entries are identified with their index just like object properties in tree deltas.

* Record index is numeric
* Ordered list deltas contain subtrees / further nodes
* Ordered lists can produce conflicts on merge, just like trees

For the following examples, we will treat the reference object as ordered list, even though it is an array
which, by default, would be treated as unordered value-list.

We *added* an entry to the list `[]` → `[17]`.
```
<A>
 ↳ <0>               //A subtree was added for the list index 0
    ↳ [[0, +, 17]]   //The new node contains an ADD record with numeric index, showing us
                     //that the number 17 was added to the list index 0
```
The patcher know that he has to treat the target object like an ordered list, because the index
in the record is numeric. It will now try to increase the list size (since it was an ADD operation)
so the required index is available and write the payload to it.

We *changed* an entry in the list `[17]` → `[16]`.
```
<A>
 ↳ <0>               //A subtree was added for the list index 0, since there have been changes
    ↳ [[0, ~, 16]]   //The node has a record to modify the value to 16
```
This looks just like a tree delta. The record still has an numeric index,
but the patcher does not have to be bother by that as modifying a list entry does not require changing
anything else on the list. This means the patcher could do the same as it does for trees.

We *removed* an entry from the list `[16]` → `[]`.
```
<A>
 ↳ <0>               //A subtree was added for the list index 0, since there have been changes
    ↳ [[0, -]]       //The node show us that it is to be removed. No payload needed.
```
Again very similar to deletions in tree deltas. The only difference is that the patcher might have to
reduce the list size below the given numeric record index,
as there could not possibly be any list entries left beyond that.

#### Unordered Value-List delta
This type of list copes with list types that are very volatile and change often.
The reduce the number of conflicts resulting from merging such data, unordered value lists
treat each entry as pure value. The entries are matched and identified by that value, instead of their index.
This inherently means that such lists will never record MODIFY operations, but only ADD and DELETE operations.

Matching value pairs are searched for in the origin and changed version of the list. If a match is found,
no action is required. If a value in the origin list does not have an unique match in the changed list,
it will be recorded as deleted.
If a value in the changed list does not have an unique match in the origin list, it will be recorded as added.
The index at which entries are found is irrelevant, so the order of entries
is not guaranteed to be preserved.

The positive side of this approach is, that such lists will never raise any merge conflicts.
The negative side is that entries themselves cannot be diffed for more atomic deltas. This also means
that these lists will never have subtrees in their deltas, recording entry changes on their own node
(in contrast to any other delta until now).

To summarize;
* Record index is numeric
* Unordered value-list deltas never contain subtrees / further nodes
* Unordered value-list deltas contain ADD/DELETE records for their own node
* Unordered value-lists to not preserve entry order of the list
* Unordered value-lists never produce conflicts on merge

We *created* the list ` ` → `[]`.
```
<A>
 ↳ [[undefined, +, []]]     //Nothing special, the node is create with a payload as usual.
```

We *added* an entry to the list `[]` → `[88]`.
```
<A>                 //No subtree was added
 ↳ [[0, +, 88]]     //The node has an ADD record, even though it was not added itself.
```
The record to ADD `88` is placed directly on the list node. This conflicts with
the description of tree deltas, where an ADD record is played on the added node.
So how do patchers know the later was not intended?  
There are **two** clues that this is an *unsorted list add*:
* The index is numeric, which tells us this cannot be a tree
  but only an ordered list or an unordered value-list
* The index is not identical with the property name of node A (which would be `undefined`, as it is the root).
  This tells us it cannot be an ordered list, as then the record index (converted to a string) 
  would match the nodes property name.
This way, the patcher detects that this is an ADD to an unordered value-list, and simply pushes
the payload anywhere into the list.

We *changed* an entry in the list `[88]` → `[99]`.
```
<A>
 ↳ [[0, -, 88]]     //The node has a DELETE record, removing the old integer 88¹
 ↳ [[0, +, 99]]     //The node has an ADD record, adding the new integer 99
```
This also differs greatly from most other deltas in that no modifcation is recorded,
but instead the entry is recorded as removed and added with new value.
This is actually very similar to the way xdiff (git) works.  
¹There is a DELETE record that does not actually delete the node. *See the next example for that*.

We *removed* an entry from the list `[99]` → `[]`.
```
<A>
 ↳ [[0, -, 99]]     //The node has a valued DELETE record, removing the old integer 99
```
There are two main differences from DELETE records in tree or ordered list deltas.
* This record does not delete the node. This is determined the same way as it is for
  ADD records: the index is numeric and does not match with the nodes property name `undefined`.
* This DELETE record contains a payload. This is called a *valued delete* and is required
  so the patcher know which value to actually delete (as it is not allowed to use the index).
The patcher detects that this is a *valued DELETE* in an unordered value-list, and simply removes and antry
matching the payload anywhere in the list.

We *deleted* the list `[]` → ` `.
```
<A>
 ↳ [[undefined, -]]     //Nothing special, the node is to be removed
```

## FAQ

### Why another diff tool?
Although there are many text-based diff modules available, creating diffs of javascript
objects (or any other language specific data) often requires specialized
algorithms that work in the languages' context.  
Because jsod works on pure data there is **no need to serialize** your data to text
before diffing, and **no need to parse text files** for diffing objects.  
This also means that jsod is agnostic to your chosen serialization form, not imposing
any specific form of text-based serialization on your data.

#### Flexibility
Jsods methods are **configurable** to allow the injection of custom diff-
or merge-handlers specific object types or custom pre-solving merge conflicts.

#### Serialization Agnostic
Jsod does not depend on any kind of serialization to create diffs.
This means that any native type of javascript object / primitive can be diffed,
be it objects, arrays, numbers or strings.
Some of them (most value-types) will be treated as atomic values, while others
(objects and arrays) will be treated as trees or lists respectively.
This also means that jsod will *not* take care for any of your serialization needs
and (as of now) does not support any extended e.g. line-based text merging.

### Can jsod be used to merge deltas of any two objects?
No, jsod is designed to create and merges deltas of objects derived from the same base object - which 
is the intended target for patching.
If you try patching any other object with that delta, anything might happen!

### Can I contribute to jsod?
Of course you can, and i would be glad to. The only requirements on pull requests are
clean feature, bugfix or refactor commits. Also, you would save me a lot of time
if you would run tests yourself before opening the pull request to see if any fail.
New or corrected tests are also always appreciated.

### It seems like jsod cannot handle data type X correctly.
That might happen. Since jsod is only a pet project and new ES versions and data types arrive
faster than I can keep up with in all my projects, something might have slipped past me.
In any case you should create an issue. Then you can either extend jsod yourself,
send me a pull request with that feature or just wait until I or someone else gets to it.

## Changelog
### 0.2.0-1
- Added specs for the full common API
- Fix bug when patching deletes on some ordered lists
- Fix bug when patching reference types at root level
- Fix all configs besides Default, which were heavily broken
- Fix bug where records were not deep cloned for merge

## License
Jsod is copyright © 2016-present Patrick Michael Hopf and all
[contributors](https://github.com/Wortex17/jsod/graphs/contributors).  
Jsod is free, licensed under The MIT License (MIT).  
See the file LICENSE in this distribution for more details.
