/**
 * Created by Patrick on 14.03.2016.
 */
"use strict";

var
    _ = require('lodash')
    ;

/**
 * A single delta record
 * @typedef {Array} DeltaRecord
 * @member {FieldPath} 0 - The path from the root of the object to the required operation
 * @member {definitions.deltaOperation} 0 - Indicates the operation that has to be made in patches
 * @member {*} [1] - The new value in add and modify operations
 */

/**
 * A single delta record
 * @typedef {Object} DeltaTree
 * @property {DeltaRecord} .
 * @property {Object.<DeltaTree>} /
 */

/**
 * A segmented path to the data field. Each entry is the name of a field/property that needs to be recursed into.
 * If a segment is not a string but a number, this is a list index and not a property name.
 * @typedef {Array.<string|number>} FieldPath
 */

/**
 * A callback handling the comparison between to fields at the same topological position.
 * @callback CompareHandler
 * @param {FieldPath} path - the segmented path that lead from the root of the inspected object to this field
 * @param {*} origin - the origin value of this field
 * @param {*} changed - the new/changed value of this field, guaranteed to be of the same type as origin
 * @param {DeltaTree} deltaTree - The array containing all delta records
 * @return {undefined|bool} - If false is returned, the next callback in the queue will be used to handle the comparison
 */

/**
 * A callback handling the comparison between to fields at the same topological position.
 * @callback DiffIterateHandler
 * @param {FieldPath} path - the segmented path that lead from the root of the inspected object to this field
 * @param {*} origin - the origin value of this field
 * @param {*} changed - the new/changed value of this field, guaranteed to be of the same type as origin
 * @param config
 * @param {DeltaTree} deltaTree - The array containing all delta records
 * @return {undefined|bool} - If false is returned, the next callback in the queue will be used to handle the comparison
 */

/**
 * @type {Object}
 */
let definitions = exports.definitions = {};
/**
 * @enum {string}
 * @readonly
 */
definitions.deltaOperation = {
    'add': '+',
    'modify': '~',
    'delete': '-'
};

/**
 * @type {Object}
 */
let defaults = exports.defaults = {};

/**
 * @type {Object.<CompareHandler>}
 */
defaults.compareHandlers = {
    valueCompare: function(path, origin, changed, deltaTree, config)
    {
        //The typical action, value fields were present on both sides and need to be compared
        if(!_.isEqual(origin, changed))
        {
            //Value change
            push_delta(deltaTree, path, '~', _.cloneDeep(changed));
        } else return false; //Return false to let the next comparer try
    },
    funcCompare: function(path, origin, changed, deltaTree, config)
    {
        if(_.isFunction(changed))
        {
            if(!_.isEqual(origin, changed))
            {
                //Value change
                push_delta(deltaTree, path, '~', changed);
            }

        } else return false; //Return false to let the next comparer try
    },
    unorderedValuelistCompare: function(path, origin, changed, deltaTree, config)
    {
        if(_.isArray(changed))
        {
            unordered_valuelist_diff(origin, changed, config, deltaTree, path);
        } else return false; //Return false to let the next comparer try
    },
    orderedListCompare: function(path, origin, changed, deltaTree, config)
    {
        if((_.isArrayLike(changed) || _.isTypedArray(changed) || _.isBuffer(changed))
            && !_.isString(changed))
        {
            ordered_list_diff(origin, changed, config, deltaTree, path);
        } else return false; //Return false to let the next comparer try
    },
    treeCompare: function(path, origin, changed, deltaTree, config)
    {
        if(_.isPlainObject(changed) && !_.isNull(changed) && !_.isNull(origin))
        {
            tree_diff(origin, changed, config, deltaTree, path);
        } else return false; //Return false to let the next comparer try
    }
};

/**
 * @type {Object.<DiffIterateHandler>}
 */
defaults.diffIterateHandlers = {
    onAdd: function(path, origin, changed, config, deltaTree){
        push_delta(deltaTree, path, definitions.deltaOperation.add, changed);
    },
    onTypeChange: function(path, origin, changed, config, deltaTree){
        push_delta(deltaTree, path, definitions.deltaOperation.modify, changed);
    },
    onCompare: function(path, origin, changed, config, deltaTree){
        compareUsing(config.comparers, path, origin, changed, deltaTree, config);
    },
    onDelete: function(path, origin, changed, config, deltaTree){
        push_delta(deltaTree, path, definitions.deltaOperation.delete);
    }
};
defaults.configs = {};
defaults.configs.diff = _.extend({}, defaults.diffIterateHandlers, {
    comparers: [
        defaults.compareHandlers.unorderedValuelistCompare,
        defaults.compareHandlers.orderedListCompare,
        defaults.compareHandlers.funcCompare,
        defaults.compareHandlers.treeCompare,
        defaults.compareHandlers.valueCompare
    ]
});
defaults.configs.tree_diff = _.extend({}, defaults.diffIterateHandlers, {
    comparers: [
        defaults.compareHandlers.treeCompare,
        defaults.compareHandlers.valueCompare
    ]
});
defaults.configs.unordered_valuelist_diff = _.extend({}, defaults.diffIterateHandlers, {
    comparers: [
        defaults.compareHandlers.unorderedValuelistCompare,
        defaults.compareHandlers.valueCompare
    ]
});
defaults.configs.ordered_list_diff = _.extend({}, defaults.diffIterateHandlers, {
    comparers: [
        defaults.compareHandlers.orderedListCompare,
        defaults.compareHandlers.valueCompare
    ]
});
defaults.configs.struct_diff = _.extend({}, defaults.diffIterateHandlers, {
    comparers: [
        defaults.compareHandlers.valueCompare
    ]
});


exports.diff = diff;
exports.patch = patch;
exports.patchClone = patchClone;
exports.mergeDeltas = mergeDeltas;

let advanced = exports.advanced = {};
advanced.struct_diff = struct_diff;
advanced.tree_diff = tree_diff;
advanced.unordered_valuelist_diff = unordered_valuelist_diff;
advanced.ordered_list_diff = ordered_list_diff;
advanced.sortDeltaRecordIterator = sortDeltaRecordIterator;



/**
 * Preconfigured diff function, starting with a structural comparison and all default comparers
 * @param {*} origin
 * @param {*} changed
 * @param config - For advanced configuration of the used comparers and handlers
 * @returns {DeltaTree} - The diff/delta
 */
function diff(origin, changed, config)
{
    let deltaTree = ensureDeltaTree();
    let parentPath = [];
    config = _.extend({},defaults.configs.diff,config);

    struct_diff(origin, changed, config, deltaTree, parentPath);

    return deltaTree;
}

/**
 * Patches an object using a delta returned from diff().
 * Modifies the object
 * @param {*} target
 * @param {DeltaTree} delta
 * @return {*}
 */
function patch(target, delta)
{
    return walkDeltaTreeRecursive(target, delta);

    function walkDeltaTreeRecursive(patchPivot, deltaTreeNode, parentPath, pivotParent)
    {
        parentPath = _.isArray(parentPath) ? parentPath : [];
        pivotParent = _.isUndefined(pivotParent) ? patchPivot : pivotParent;

        let records = deltaTreeNode['.'];
        let subTree = deltaTreeNode['/'];

        if(!_.isUndefined(subTree)) {
            _.forEach(subTree, function (subTreeNode, pathSegment) {
                let patched = walkDeltaTreeRecursive(patchPivot[pathSegment], subTreeNode, parentPath.concat([pathSegment]), patchPivot);
                patchPivot = patched;
            });
            if (parentPath.length > 0) {
                pivotParent[_.last(parentPath)] = patchPivot;
            }
        }

        if(!_.isUndefined(records))
        {
            records.sort(sortDeltaRecordIterator);
            _.forEach(records, function(record){
                if(_.isNumber(record[0]) && record[0].toString() != _.last(parentPath))
                {
                    //Indexed access (either unordered or ordered list)
                    // on unordered list (otherwise record[0] would be the last path segment)
                    pivotParent[_.last(parentPath)] = applyRecord(patchPivot, record);
                } else {
                    pivotParent = applyRecord(pivotParent, record);
                }
            });
        }

        return pivotParent;
    }

    //Intelligently assigns field or root/pivot replacement
    function assignField(pivot, pathTail, changeValue)
    {
        if(_.isUndefined(pathTail))
        {
            pivot = changeValue;
        } else {
            pivot[pathTail] = changeValue;
        }
        return pivot;
    }

    function deleteField(pivot, pathTail)
    {
        if(_.isUndefined(pathTail))
        {
            pivot = undefined;
        } else {
            delete pivot[pathTail];
        }
        return pivot;
    }

    function addOrSetOrderListField(list, pathTail, changeValue)
    {
        if(_.isBuffer(list))
        {
            //Apply add on buffer
            let newMinlength = pathTail+1;
            if(list.length < newMinlength)
            {
                let newList = new Buffer(newMinlength);
                list.copy(newList);
                list = newList;
            }
            list = assignField(list, pathTail, changeValue);
        } else if(_.isTypedArray(list) || _.isArrayBuffer(list))
        {
            //Apply add on typedarray / arraybuffer
            let newMinlength = pathTail+1;
            if(list.length < newMinlength)
            {
                let newList = new list.constructor(newMinlength);
                for (let i=0;i<newList.byteLength && i<list.byteLength;i++){
                    newList[i] = list[i];
                }
                list = newList;
            }
            list = assignField(list, pathTail, changeValue);
        }
        return list;
    }

    function deleteOrderListField(list, pathTail)
    {
        if(_.isBuffer(list))
        {
            let newMaxlength = pathTail;
            if(list.length > newMaxlength)
            {
                let newList = new Buffer(newMaxlength);
                list.copy(newList);
                list = newList;
            }
        } else if(_.isTypedArray(list) || _.isArrayBuffer(list))
        {
            let newMaxlength = pathTail;
            if(list.length < newMaxlength)
            {
                let newList = new list.constructor(newMaxlength);
                for (let i=0;i<newList.byteLength && i<list.byteLength;i++){
                    newList[i] = list[i];
                }
                list = newList;
            }
            list = assignField(list, pathTail);
        }

        return list;
    }

    function applyRecord(pivot, deltaRecord)
    {
        let pathTail = deltaRecord[0];
        let op = deltaRecord[1];
        let changeValue = deltaRecord[2];
        switch(op)
        {
            case definitions.deltaOperation.add:
                if(_.isNumber(pathTail))
                {
                    //Either unordered add or ordered add (both are the same anyway)
                    if(_.isArray(pivot))
                    {
                        //Apply add on array
                        pivot.push(changeValue);
                    } else {
                        pivot = addOrSetOrderListField(pivot, pathTail, changeValue);
                    }
                } else {
                    //Add property
                    pivot = assignField(pivot, pathTail, changeValue);
                }
                break;
            case definitions.deltaOperation.modify:
                if(_.isNumber(pathTail))
                {
                    //Only ordered lists have modify with number pathTails
                    pivot = addOrSetOrderListField(pivot, pathTail, changeValue);
                } else {
                    pivot = assignField(pivot, pathTail, changeValue);
                }
                break;
            case definitions.deltaOperation.delete:
                if(_.isNumber(pathTail))
                {
                    //Either unordered remove or ordered remove
                    if(!_.isUndefined(changeValue))
                    {
                        //Delete with changeValue? Obviously an unordered remove
                        if(_.isArray(pivot))
                        {
                            let remIdx = _.findIndex(pivot, function(storedValue){
                                return _.isEqual(storedValue, changeValue);
                            });
                            if(remIdx >= 0)
                            {
                                pivot.splice(remIdx, 1);
                            }
                        }
                    } else {
                        //Ordered remove
                        pivot = deleteOrderListField(pivot, pathTail);
                    }
                } else {
                    pivot = deleteField(pivot, pathTail);
                }
                break;
        }
        return pivot;
    }
}

/**
 * Patches an object using a delta returned from diff().
 * Clone the origin first and patches the clone
 * @param {*} origin
 * @param {DeltaTree} delta
 * @return {*}
 */
function patchClone(origin, delta)
{
    let target = _.cloneDeep(origin);
    return patch(target, delta);
}


/**
 * @param {Array} conflicts
 * @param conflictType
 * @param {DeltaRecord|DeltaTree} dataA
 * @param {DeltaRecord|DeltaTree} dataB
 * @param {*} [metaData]
 */
function reportConflict(conflicts, conflictType, dataA, dataB, metaData)
{
    let conflictReport = {
        conflictType: conflictType,
        A: dataA,
        B: dataB
    };
    if(!_.isUndefined(metaData))
    {
        conflictReport.metaData = metaData;
    }
    conflicts.push(conflictReport);
    return conflicts;
}

function _onMergeRecord(recordA, recordB, conflicts, deltaNodeA, deltaNodeB, parentPath)
{
    let keyA = recordA[0];
    let opA = recordA[1];
    let valA = recordA[2];
    let keyB = recordB[0];
    let opB = recordB[1];
    let valB = recordB[2];

    if(opA != opB)
    {
        reportConflict(conflicts, "diffOp", recordA, recordB);
    }
    else if(opA == opB && !_.isEqual(valA, valB))
    {
        reportConflict(conflicts, "sameOpDiffVal", recordA, recordB);
    } else {
        //Favours the one with the biggest index on "add" and the one with the smallest index on "remove"
        return ((opA < opB && keyA > keyB) || (opA > opB && keyA < keyB)) ? _.cloneDeep(recordA) : _.cloneDeep(recordB);
    }
}

function _findMatchingRecord(recordA, recordsB, parentPath, visitedRecordBs)
{
    visitedRecordBs = _.isArray(visitedRecordBs) ? visitedRecordBs : [];
    recordsB = _.isArray(recordsB) ? recordsB : [];

    let keyA = recordA[0];
    let unorderedValueList = _.isNumber(keyA) && keyA.toString() != _.last(parentPath);

    let recordB = undefined;
    for(let b = 0; b < recordsB.length; b++)
    {
        let l_recordB = recordsB[b];
        let keyB = l_recordB[0];

        if(unorderedValueList && _.isNumber(keyB))
        {
            //unorderedValueList match per value instead of per key
            let valueA = recordA[2];
            let valueB = l_recordB[2];
            if(_.isEqual(valueA, valueB))
            {
                recordB = l_recordB;
                visitedRecordBs.push(b);
            }

        } else if(keyA == keyB)
        {
            recordB = l_recordB;
            visitedRecordBs.push(b);
            break;
        }
    }

    return recordB;
}

function _onMergeRecords(recordsA, recordsB, conflicts, deltaNodeA, deltaNodeB, parentPath)
{
    let combinedRecords = [];

    if(_.isUndefined(recordsA) && _.isUndefined(recordsB))
    {
        return combinedRecords;
    } else if(_.isUndefined(recordsA))
    {
        return _.cloneDeep(recordsB);
    } else if(_.isUndefined(recordsB))
    {
        return _.cloneDeep(recordsA);
    }

    let visitedRecordBs = [];
    for(let a = 0; a < recordsA.length; a++)
    {
        let mergedRecord = undefined;
        let recordA = recordsA[a];
        let recordB = _findMatchingRecord(recordA, recordsB, parentPath, visitedRecordBs);
        if(!_.isUndefined(recordB))
        {
            //We definitely have an A and also have found a B:
            //Possible conflict
            mergedRecord = _onMergeRecord(recordA, recordB, conflicts, deltaNodeA, deltaNodeB, parentPath);
        } else {
            mergedRecord = _.cloneDeep(recordA);
        }

        if(_.isArray(mergedRecord))
        {
            combinedRecords.push(mergedRecord);
        }
    }

    //Now add missed recordB's
    _.forEach(recordsB, function(recordB, b){
        if(visitedRecordBs.indexOf(b) < 0)
        {
            //Unvisited recordB
            combinedRecords.push(_.cloneDeep(recordB));
        }
    });

    return combinedRecords;
}

function mergeDeltas(deltaA, deltaB, conflictNodes, parentPath)
{
    let mergedDelta = {};
    parentPath = _.isArray(parentPath) ? parentPath : [];
    conflictNodes = _.isArray(conflictNodes) ? conflictNodes : [];

    if(_.isUndefined(deltaA) && _.isUndefined(deltaB))
    {
        return mergedDelta;
    } else if(_.isUndefined(deltaA))
    {
        return _.cloneDeep(deltaB);
    } else if(_.isUndefined(deltaB))
    {
        return _.cloneDeep(deltaA);
    }

    let recordsA = deltaA['.'] || [];
    let recordsB = deltaB['.'] || [];
    let subTreesA = deltaA['/'] || {};
    let subTreesB = deltaB['/'] || {};


    let hasRecords = recordsA.length + recordsB.length > 0;
    let subTreeKeys = _.union(_.keys(subTreesA), _.keys(subTreesB));
    let hasSubtrees = subTreeKeys.length > 0;


    if(hasRecords && hasSubtrees)
    {
        console.warn("Conflict, records and subtrees at the same time");

    } else if(hasRecords)
    {
        //Merge records
        recordsA.sort(advanced.sortDeltaRecordIterator);
        recordsB.sort(advanced.sortDeltaRecordIterator);
        let localConflicts = [];
        let combinedRecords = _onMergeRecords(recordsA, recordsB, localConflicts, deltaA, deltaB, parentPath);

        if(localConflicts.length > 0)
        {
            mergedDelta['!'] = mergedDelta['!'] || [];

            _.forEach(localConflicts, function(localConflict){
                mergedDelta['!'].push(localConflict);
            });
            conflictNodes.push({
                path: parentPath,
                node: mergedDelta
            });
        }
        if(combinedRecords.length > 0)
        {
            mergedDelta['.'] = combinedRecords.sort(advanced.sortDeltaRecordIterator);
        }

    } else if(hasSubtrees)
    {
        //Merge subtrees

        let mergedSubTrees = {};
        _.forEach(subTreeKeys, function(subTreeKey) {
            let subPath = parentPath.concat([subTreeKey]);
            let subTreeA = subTreesA[subTreeKey];
            let subTreeB = subTreesB[subTreeKey];

            let mergedSubTree = mergeDeltas(subTreeA, subTreeB, conflictNodes, subPath);
            if(!_.isNil(mergedSubTree) && _.keys(mergedSubTree).length > 0)
            {
                mergedSubTrees[subTreeKey] = mergedSubTree;
            }
        });
        if(!_.isNil(mergedSubTrees) && _.keys(mergedSubTrees).length > 0)
        {
            mergedDelta['/'] = mergedSubTrees;
        }
    }

    return mergedDelta;
}




/**
 * Iterates over all members ob the tree/object and calls struct_diff for each.
 * On comparing objects, tree_diff is used recursively.
 * @param {Object} origin
 * @param {Object} changed
 * @param config
 * @param {Array} [deltaTree] - the recorded changes until now, only used in recursion
 * @param {[string]} [parentPath] - only used in recursion
 * @returns {Array} the recorded changes
 */
function tree_diff(origin, changed, config, deltaTree, parentPath)
{
    deltaTree = ensureDeltaTree(deltaTree);
    parentPath = _.isArray(parentPath) ? parentPath : [];
    config = _.extend({},defaults.configs.tree_diff,config);

    let visitedPaths = [];

    checkSubtree(changed);
    checkSubtree(origin);
    function checkSubtree(object)
    {

        for(let key in object)
        {
            //noinspection JSUnfilteredForInLoop
            let subPath = parentPath.concat([key]);
            if(!hasCheckedPath(subPath))
            {
                //noinspection JSUnfilteredForInLoop
                struct_diff(origin[key], changed[key], config, deltaTree, subPath);
                markPathVisited(subPath);
            }
        }
    }

    function hasCheckedPath(path)
    {
        return _.findIndex(visitedPaths, function(checkedPath){
                return _.isEqual(checkedPath, path);
            }) >= 0;
    }

    function markPathVisited(path)
    {
        visitedPaths.push(path);
    }

    return deltaTree;
}

/**
 * Diffs arrays and treats them like unordered lists of values - no tree_diffs will be called.
 * Meaning, for each value where a unique pair in origin and changed can be found, no changes will be recorded.
 * For every other adds/deletes will be recorded. Deltas never record a modify operation and should never
 * lead to conflicts.
 * The length parameter is implicited and not recorded as a change.
 * @param {*} origin
 * @param {*} changed
 * @param config
 * @param {DeltaTree} [deltaTree] - the recorded changes until now, only used in recursion
 * @param {FieldPath} [parentPath] - only used in recursion
 * @returns {DeltaTree} the recorded changes
 */
function unordered_valuelist_diff(origin, changed, config, deltaTree, parentPath)
{
    deltaTree = ensureDeltaTree(deltaTree);
    parentPath = _.isArray(parentPath) ? parentPath : [];
    config = _.extend({},defaults.configs.unordered_valuelist_diff,config);

    //index: index in origin, value: index in changed
    let matchesInChanged = [];
    for(let iO = 0; iO < origin.length; iO++)
    {
        let originValue = origin[iO];
        let matchedChangeIndex = undefined;
        for(let iC = 0; iC < changed.length; iC++)
        {
            let changedValue = changed[iC];
            //Only allow matches that have not been matched before
            if(_.isEqual(originValue, changedValue) && matchesInChanged.indexOf(iC) == -1)
            {
                matchesInChanged[iO] = iC;
                matchedChangeIndex = iC;
            }
        }
        if(_.isUndefined(matchedChangeIndex))
        {
            //A value hs been deleted that was in the origin list
            push_delta(deltaTree, parentPath.concat([undefined, iO]), definitions.deltaOperation.delete, originValue);
        }
    }

    //Find new values
    for(let iC = 0; iC < changed.length; iC++)
    {
        let changedValue = changed[iC];
        if(matchesInChanged.indexOf(iC) == -1)
        {
            //No match found previously, so obviously new
            push_delta(deltaTree, parentPath.concat([undefined, iC]), definitions.deltaOperation.add, changedValue);
        }
    }

    return deltaTree;
}

/**
 * Diffs array-like objects and treats them like ordered lists.
 * Meaning, pairs are identified by the same index.
 * The length parameter is implicited and not recorded as a change.
 * @param {*} origin
 * @param {*} changed
 * @param config
 * @param {DeltaTree} [deltaTree] - the recorded changes until now, only used in recursion
 * @param {FieldPath} [parentPath] - only used in recursion
 * @returns {DeltaTree} the recorded changes
 */
function ordered_list_diff(origin, changed, config, deltaTree, parentPath)
{
    deltaTree = ensureDeltaTree(deltaTree);
    parentPath = _.isArray(parentPath) ? parentPath : [];
    config = _.extend({},defaults.configs.ordered_list_diff,config);


    let visitedKeys = [];

    _.forEach(origin, function (originValue, key){
        let changedValue = changed[key];
        visitedKeys.push(key);
        if(_.isUndefined(changedValue))
        {
            //A value has been deleted that was present in origin
            config.onDelete(parentPath.concat(key), originValue, changedValue, config, deltaTree);
        } else {
            config.onCompare(parentPath.concat(key), originValue, changedValue, config, deltaTree);
        }
    });


    _.forEach(changed, function(changedValue, key){
        if(visitedKeys.indexOf(key) < 0)
        {
            //A value was added that was not present before
            config.onAdd(parentPath.concat(key), undefined, changedValue, config, deltaTree);
        }
    });


    return deltaTree;
}

/**
 * General diff iterator, calling callbacks for comparison and recording structural diffs.
 * Supposed to be used on value/field types, will not automatically iterate further (unless configured in onCompare)
 * @param {*} origin
 * @param {*} changed
 * @param config
 * @param {DeltaTree} [deltaTree] - the recorded changes until now, only used in recursion
 * @param {FieldPath} [parentPath] - only used in recursion
 * @returns {DeltaTree} the recorded changes
 */
function struct_diff(origin, changed, config, deltaTree, parentPath)
{
    deltaTree = ensureDeltaTree(deltaTree);
    parentPath = _.isArray(parentPath) ? parentPath : [];
    config = _.extend({},defaults.configs.unordered_valuelist_diff,config);

    let originPresent = !_.isUndefined(origin);
    let changedPresent = !_.isUndefined(changed);

    if(originPresent && changedPresent)
    {
        let typeChanged =
                (_.isArray(origin) && !_.isArray(changed))
                ||
                (_.isFunction(origin) && !_.isFunction(changed))
                ||
                (_.isObject(origin) && !_.isObject(changed))
                ||
                (_.isNumber(origin) && !_.isNumber(changed))
                ||
                (_.isString(origin) && !_.isString(changed))
            ;

        if(typeChanged)
        {
            //Structural change: Field has a type that was different in origin
            config.onTypeChange(parentPath, origin, changed, config, deltaTree);
        }
        else {
            config.onCompare(parentPath, origin, changed, config, deltaTree);
        }

    } else if(!originPresent && !changedPresent)
    {
        //Special case: both are unpresent
    } else if (!originPresent)
    {
        //Structural change: Field added that wasn't present in origin
        config.onAdd(parentPath, origin, changed, config, deltaTree);
    } else if (originPresent)
    {
        //Structural change: Field removed that was present in origin
        config.onDelete(parentPath, origin, changed, config, deltaTree);
    }

    return deltaTree;
}

//// Internal functions

/**
 * @private
 * @param {DeltaRecord}a
 * @param {DeltaRecord} b
 * @returns {number}
 */
function sortDeltaRecordIterator(a, b)
{
    //Compare by key
    let keyA = a[0];
    let keyB = b[0];
    let opA = a[1];
    let opB = b[1];
    let keyOrder = compare(keyA, keyB);
    let opOrder = compare(opA, opB);
    let bothNumeric = _.isNumber(keyA) && _.isNumber(keyB);
    let result = 0;

    if(bothNumeric)
    {
        //if keys are numeric (list deltas), intelligently order keys by op first then key
        // and to optimize, on "add" keys, revert the keyOrder so the biggest impact on list sizes comes first
        // (smallest index first on remove, biggest index first on add)
        result = (opOrder != 0) ? opOrder : ((opA == definitions.deltaOperation.add) ? -keyOrder : keyOrder);
    } else {
        result = (keyOrder != 0) ? keyOrder : opOrder;
    }
    return result;
}

function compare(a, b)
{
    return (a < b) ? -1 : ((a > b) ? 1 : 0);
}

/**
 * @private
 * @param {FieldPath}a
 * @param {FieldPath} b
 * @returns {number}
 */
function compareFieldPaths(a, b)
{
    for(let i = 0; i < a.length && i < b.length; i++)
    {
        if ( a[i] < b[i] )
            return -1;
        if ( a[i] > b[i] )
            return 1;
    }
    if ( a.length < b.length )
        return -1;
    if ( a.length > b.length )
        return 1;
}

/**
 * @private
 * @param {DeltaTree} deltaTree
 * @param {FieldPath} path
 * @param {definitions.deltaOperation} changeOperation
 * @param {*} [changeValue]
 * @return {DeltaRecord}
 */
function push_delta(deltaTree, path, changeOperation, changeValue)
{
    let pivot = deltaTree;
    _.forEach(path, function(pathSegment){
        if(_.isUndefined(pathSegment))
        {
            return false;
        }
        if(_.isUndefined(pivot['/']))
        {
            pivot['/'] = {};
        }
        pivot['/'][pathSegment] = ensureDeltaTree(pivot['/'][pathSegment]);
        pivot = pivot['/'][pathSegment];
    });
    /**
     * @type {DeltaRecord}
     */
    let record = [_.last(path), changeOperation]; //Store the key too to preserve its type, which is lost in the deltatree
    if(!_.isUndefined(changeValue))
    {
        record.push(changeValue);
    }
    if(_.isUndefined(pivot['.']))
    {
        pivot['.'] = [];
    }
    pivot['.'].push(record);
    return record;
}

/**
 * @private
 * @param {Array.<CompareHandler>} comparers
 * @param {FieldPath} path
 * @param {*} origin
 * @param {*} changed
 * @param {DeltaTree} deltaTree
 * @param config
 */
function compareUsing(comparers, path, origin, changed, deltaTree, config)
{
    comparers = _.isArray(comparers) ? comparers : [];
    for(let i = 0; i < comparers.length; i++)
    {
        let currentComparer = comparers[i];
        if(_.isFunction(currentComparer))
        {
            if(currentComparer(path, origin, changed, deltaTree, config) !== false)
                break;
        }
    }
}

/**
 * @param {DeltaTree} [deltaTree]
 * @returns {DeltaTree}
 */
function ensureDeltaTree(deltaTree)
{
    return _.isPlainObject(deltaTree) ? deltaTree : {};
}
