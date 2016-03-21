# jsod
Diff, diff3 and patch objects of any fundamental or derived type, natively in javascript

`This is still a playground version and under heavy cleanup and development`

Jsod (**J**ava**S**cript **O**bject **D**iff) is a configurable and extendable
module that allows to create diffs (also known as deltas) of pure
javascript-native objects and primitives like object,
array, numbers or any derived types. It can also *patch* objects by applying generated
deltas. To conclude, it provides a *diff3* implementation which generates a delta from
a common origin object and two different altered versions,
allowing to merge distributed modifications of the same object,
including detection of conflicts.

## Why another diff tool?
Although there are many text-based diff modules available, creating diffs of javascript
objects (or any other language specific data) often requires specialized
algorithms that work in the languages' context.
Because jsod work on pure data there is **no need to serialize** your data to text
before diffing, and **no need to parse text files** for diffing objects.
This also means that jsod is agnostic to your chosen serialization form, not imposing
any specific form of text-based serialization on your data.

## Flexibility
Jsods methods are **configurable** to allow the injection of custom diff-
or merge-handlers specific object types or custom pre-solving merge conflicts.


