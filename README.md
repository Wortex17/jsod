# jsod
Diff, diff3 and patch objects of any fundamental or derived type, natively in javascript

[![Build Status](https://travis-ci.org/Wortex17/jsod.svg?branch=master)](https://travis-ci.org/Wortex17/jsod)
[![Coverage Status](https://coveralls.io/repos/github/Wortex17/jsod/badge.svg?branch=feature%2Ftravis-ci)](https://coveralls.io/github/Wortex17/jsod?branch=feature%2Ftravis-ci)  
[![NPM Version](https://img.shields.io/npm/v/jsod.svg)](https://www.npmjs.com/package/jsod)
[![NPM Dependencies](https://david-dm.org/Wortex17/jsod.svg)](https://www.npmjs.com/package/jsod)
[![NPM Dev Dependencies](https://img.shields.io/david/dev/Wortex17/jsod.svg)](https://www.npmjs.com/package/jsod)

Jsod (**J**ava**S**cript **O**bject **D**iff) is a configurable and extendable
module that allows to create diffs (also known as deltas) of pure
javascript-native objects and primitives like object,
array, numbers or any derived types. It can also *patch* objects by applying generated
deltas. To conclude, it provides a *diff3* implementation which generates a delta from
a common origin object and two different altered versions,
allowing to merge distributed modifications of the same object,
including detection of conflicts.

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
  child nodes to the DeltaTree.
  * Arrays are treated as unordered value lists. Each entry is treated as pure value
  and matching pairs are searched in the origin and changed versions of the array.
  Entries in the origin without matching entries in the changed are treated as deleted
  while entries in the changed without matching entries in the origin are treated as
  added. The index at which entries are found is irrelevant, so the order of entries
  is not guaranteed to be preserved.
  Unordered lists will never produce conflicts when merging.
  * Buffers, TypedArrays and other array like objects are treated as ordered lists.
  These are similar to unordered value lists, but each entry is identified via its
  index in the list and thus can be inspected further. E.g. a Object type entry will
  be treated ans inspected as tree again.
  Because entries are matched with their index, ordered lists may produce conflicts
  when merging.
  * All other types are treated as pure values,
  being compared with a deepEqual compare.
  * When objects in origin and changed have different types, the always will be
  treated as different pure values (internally as different structural values).

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

## Why another diff tool?
Although there are many text-based diff modules available, creating diffs of javascript
objects (or any other language specific data) often requires specialized
algorithms that work in the languages' context.  
Because jsod works on pure data there is **no need to serialize** your data to text
before diffing, and **no need to parse text files** for diffing objects.  
This also means that jsod is agnostic to your chosen serialization form, not imposing
any specific form of text-based serialization on your data.

### Flexibility
Jsods methods are **configurable** to allow the injection of custom diff-
or merge-handlers specific object types or custom pre-solving merge conflicts.

### Serialization Agnostic
Jsod does not depend on any kind of serialization to create diffs.
This means that any native type of javascript object / primitive can be diffed,
be it objects, arrays, numbers or strings.
Some of them (most value-types) will be treated as atomic values, while others
(objects and arrays) will be treated as trees or lists respectively.
This also means that jsod will *not* take care for any of your serialization needs
and (as of now) does not support any extended e.g. line-based text merging.

## License
Jsod is copyright © 2016-present Patrick Michael Hopf and all
[contributors](https://github.com/Wortex17/jsod/graphs/contributors).  
Jsod is free, licensed under The MIT License (MIT).  
See the file LICENSE in this distribution for more details.