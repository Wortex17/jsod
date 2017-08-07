/*!
 * jsod
 * https://github.com/wortex17/jsod
 * Created 14.03.2016 by Patrick Michael Hopf
 *
 * Released under The MIT License
 */
"use strict";

var
    _ = require('lodash')
    ;

/**
 * Jsod root namespace
 * @namespace jsod
 */
let jsod = {};
(function(jsod){

    //Public basic API

    /**
     * Creates a DeltaTree, recording all changes that have been made to the
     * origin object to result in the changed object.
     * This method starts with a structural diff (DiffHandlers.diffAsStructure).
     * @memberOf jsod
     * @param {*} origin - The object/primitive in its original state
     * @param {*} changed - The object/primitive after some changes
     * @param {DiffConfiguration} [config] - Configures how to handle diff events and which ComparisonHandlers should be used.
     * @returns {DeltaTree} - The diff/delta
     */
    jsod.diff = function(origin, changed, config)
    {
        let deltaTree = ensureDeltaTree();
        let parentPath = [];
        config = _.extend({},Presets.Configs.Default,config);

        DiffHandlers.diffAsStructure(origin, changed, config, deltaTree, parentPath);

        return deltaTree;
    };

    /**
     * Patches an object using a delta returned from diff().
     * Modifies the target!
     * @memberOf jsod
     * @param {*} target
     * @param {DeltaTree} delta
     * @return {*}
     */
    jsod.patch = function(target, delta)
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
                } else {
                    pivotParent = patchPivot;
                }
            }

            if(!_.isUndefined(records))
            {
                Util.sortDeltaRecords(records);
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
                //Apply ADD on buffer
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
                //Apply ADD on typedarray / arraybuffer
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
            } else if(_.isArrayLike(list))
            {
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
                if(list.length > newMaxlength)
                {
                    let newList = new list.constructor(newMaxlength);
                    for (let i=0;i<newList.byteLength && i<list.byteLength;i++){
                        newList[i] = list[i];
                    }
                    list = newList;
                }
                list = assignField(list, pathTail);
            } else if(_.isArrayLike(list))
            {
                list = deleteField(list, pathTail);
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
                case Attributes.DeltaOperation.ADD:
                    if(_.isNumber(pathTail))
                    {
                        //Either unordered ADD or ordered ADD (both are the same anyway)
                        if(_.isArray(pivot))
                        {
                            //Apply ADD on array
                            pivot.push(changeValue);
                        } else {
                            pivot = addOrSetOrderListField(pivot, pathTail, changeValue);
                        }
                    } else {
                        //Add property
                        pivot = assignField(pivot, pathTail, changeValue);
                    }
                    break;
                case Attributes.DeltaOperation.MODIFY:
                    if(_.isNumber(pathTail))
                    {
                        //Only ordered lists have modify with number pathTails
                        pivot = addOrSetOrderListField(pivot, pathTail, changeValue);
                    } else {
                        pivot = assignField(pivot, pathTail, changeValue);
                    }
                    break;
                case Attributes.DeltaOperation.DELETE:
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
    };

    /**
     * Patches an object using a delta returned from diff().
     * Clones the origin first and patches the clone.
     * @memberOf jsod
     * @param {*} target
     * @param {DeltaTree} delta
     * @return {*}
     */
    jsod.patchClone = function(target, delta)
    {
        target = _.cloneDeep(target);
        return jsod.patch(target, delta);
    };

    /**
     * Merges two DeltaTrees. Core of the diff3 method.
     * Generates a DeltaTree that incorporates all changes from deltaA and deltaB,
     * generating conflict entries.
     * @param {DeltaTree} deltaA - The DeltaTree to be merged
     * @param {DeltaTree} deltaB - The other DeltaTree to be merged
     * @param {MergeConfiguration|null|undefined} [config] - The configuration of the merge
     * @param {Array.<{path:PropertyPath,node:DeltaTree}>} [conflictNodes] - If present, writes all nodes containing conflicts to this array for quick lookup.
     * @param {PropertyPath} [parentPath] - The parent path that lead to deltaA and deltaB. Used in recursion.
     * @return {DeltaTree}
     */
    jsod.mergeDeltas = function(deltaA, deltaB, config, conflictNodes, parentPath)
    {
        config = _.extend(Presets.Configs.DefaultMerge, config);
        parentPath = _.isArray(parentPath) ? parentPath : [];
        conflictNodes = _.isArray(conflictNodes) ? conflictNodes : [];

        return config.onMergeDeltaTreeNodes(deltaA, deltaB, config, conflictNodes, parentPath);
    };

    /**
     * @param {*} changedA - The object/primitive in its changed version
     * @param {*} origin - The object/primitive in its original state
     * @param {*} changedB - The object/primitive in its other changed version
     * @param {DiffConfiguration} [diffConfig] - Configures how to handle diff events and which ComparisonHandlers should be used.
     * @param {MergeConfiguration} [mergeConfig] - The configuration of the merge
     * @param {Array.<{path:PropertyPath,node:DeltaTree}>} [conflictNodes] - If present, writes all nodes containing conflicts to this array for quick lookup.
     * @return {DeltaTree}
     */
    jsod.diff3 = function(changedA, origin, changedB, diffConfig, mergeConfig, conflictNodes)
    {
        let deltaA = jsod.diff(origin, changedA, diffConfig);
        let deltaB = jsod.diff(origin, changedB, diffConfig);
        return jsod.mergeDeltas(deltaA, deltaB, mergeConfig, conflictNodes);
    };


    //Namespaces and nested functions

    /**
     * A segmented path that leads to a target nested property.
     * Each entry is the name of a property that needs to be recursed into.
     * If a segment type is not a string but a number, it is a list index (not a property name).
     * @typedef {Array.<string|number>} PropertyPath
     * @memberOf jsod
     */

    /**
     * A single delta record, defining a single atomic change
     * @typedef {Array.<string|Attributes.DeltaOperation|*>} DeltaRecord
     * @memberOf jsod
     * @property {string} 0 - The path tail, the key at which the record is to be applied
     * @property {Attributes.DeltaOperation} 1 - Indicates the operation that has to be made in patches
     * @property {*} [2] - The new value in add and modify operations
     */

    /**
     * A delta tree is a container for structural representation and delta records.
     * Each instance of a DeltaTree can be seen as a tree node.
     * Each node may carry delta records and/or links to subtrees and/or conflicts.
     * The path from the root DeltaTree node over the subtree link names to the target node is also the
     * property path that has to be resolved on the target object for patching and reflecting.
     * @typedef {Object} DeltaTree
     * @memberOf jsod
     * @property {Array.<DeltaRecord>} . - The records that are to be applied at this tree node.
     * @property {Object.<DeltaTree>} / - An object containing the subtrees, where each key reflects the property name on the target object.
     * @property {Array.<Conflict>} [!] - An array containing all conflicts at this node. Generated by merging deltas and ignored when patching.
     */

    /**
     * Configures how to handle diff events and which ComparisonHandlers should be used by customizing the callbacks
     * and the ComparisonHandler queue
     * @typedef {Object} DiffConfiguration
     * @memberOf jsod
     * @property {DiffEventHandler} onCompare - Called when two properties are to be compared
     * @property {DiffEventHandler} onAdd - Called when a property is deemed as added
     * @property {DiffEventHandler} onChange - Called when a property is deemed as changed
     * @property {DiffEventHandler} onDelete - Called when a property is deemed as removed
     * @property {DiffEventHandler} onTypeChange - Called when a property changed its type since origin
     * @property {Array.<ComparisonHandler>} compareHandlers
     */

    /**
     * Callback called every time the diff iteration wants to do something and actually configures its behaviour
     * @callback DiffEventHandler
     * @memberOf jsod
     * @param {PropertyPath} parentPath - The property path that led from the root of the object to the given property.
     * @param {*} origin - The origin value of the property.
     * @param {*} changed - The changed value of the property.
     * @param {DiffConfiguration} config
     * @param {DeltaTree} deltaTree
     */

    /**
     * A single delta conflict generated by merging two deltas with conflicting structure or records.
     * If one side has a subtree container and the other a record, changes in children are conflicting with
     * structural changes in the node.
     * If both sides have a record, these records are conflicting.
     * @typedef {Object} Conflict
     * @memberOf jsod
     * @property {DeltaRecord|DeltaTree|Object.<DeltaTree>} A - The record or subtree container conflicting on As side.
     * @property {DeltaRecord|DeltaTree|Object.<DeltaTree>} B - The record or subtree container conflicting on Bs side.
     * @property {jsod.Attributes.ConflictType} conflictType - The type of error that led to this conflict.
     * @property {*} [meta] - Optional meta object appended by the merger
     */

    /**
     * A ComparisonHandler is called for every property that is being compared.
     * It can act as a closed system, having full authority over the comparison and resulting actions.
     * Usually, it acts as responsibility gate:
     *   It checks if the properties are of a specific type and then calls a diff handler.
     *   If not, it returns false and signals the handler loop to try the next ComparisonHandler
     * ComparisonHandlers are often called by another Diff- or ComparisonHandler.
     * The given properties are always at the same topological position (otherwise a structural diff would already run).
     *
     * @callback ComparisonHandler
     * @memberOf jsod
     * @param {PropertyPath} path - The property path tha led from the root of the object to the given property.
     * @param {*} origin - The origin value of the property.
     * @param {*} changed - The possibly changed value of the property, guaranteed to be of the same type as origin.
     * @param {DeltaTree} deltaTree - The current DeltaTree, containing all records until now.
     * @return {undefined|bool} - If false is returned, the next ComparisonHandler in the queue will be triggered.
     */

    /**
     * A callback handling the comparison between to fields at the same topological position.
     * @callback DiffHandler
     * @memberOf jsod
     * @param {PropertyPath} path - the segmented path that lead from the root of the inspected object to this field
     * @param {*} origin - the origin value of this field
     * @param {*} changed - the new/changed value of this field, guaranteed to be of the same type as origin
     * @param {DiffConfiguration} config
     * @param {DeltaTree} deltaTree - The array containing all delta records
     * @return {undefined|bool} - If false is returned, the next callback in the queue will be used to handle the comparison
     */

    /**
     * Namespace for enums and flags
     * @namespace Attributes
     * @memberOf jsod
     */
    let Attributes = jsod.Attributes = {};
    /**
     * @enum {string} DeltaOperation
     * @memberOf jsod.Attributes
     * @readonly
     */
    jsod.Attributes.DeltaOperation = {
        "ADD": '+',
        "MODIFY": '~',
        "DELETE": '-'
    };
    /**
     * @enum {string} ConflictType
     * @memberOf jsod.Attributes
     * @readonly
     */
    jsod.Attributes.ConflictType = {
        /**
         * Conflict when two records perform the same operation at the same location/target,
         * but with different values.
         * (Found on DeltaOperation.ADD and DeltaOperation.MODIFY)
         */
        "RECORD_DIFF_VALUE": 'CONFLICT_RECORD_DIFF_VALUE',
        /**
         * Conflict when two records perform different operations at the same location/target.
         */
        "RECORD_DIFF_OPERATION": 'CONFLICT_RECORD_DIFF_OPERATION',
        /**
         * Conflict when one delta tree has subtree deltas,
         * while the other performs operations at root level (possibly overriding any subtrees).
         *
         * Be aware that this conflict type stores two DeltaTrees in A and B instead of two records
         *
         * This can occur on nested objects and merges of objects with very diverging changes.
         * Commonly seen when one delta changes properties of an object while the other delta deletes the object.
         */
        "TREE_DIFF_STRUCTURE": 'CONFLICT_TREE_DIFF_STRUCTURE'
    };

    /**
     * Default Comparison Handlers
     * @namespace {Object.<ComparisonHandler>} ComparisonHandlers
     * @memberOf jsod
     */
    let ComparisonHandlers = jsod.ComparisonHandlers = {};
    ComparisonHandlers.compareAsValue = function(path, origin, changed, deltaTree, config)
    {
        //The typical action, value fields were present on both sides and need to be compared
        if(!_.isEqual(origin, changed))
        {
            //Value change
            config.onChange(path, origin, _.cloneDeep(changed), config, deltaTree);
        } else return false; //Return false to let the next comparer try
    };
    ComparisonHandlers.compareAsFunction = function(path, origin, changed, deltaTree, config)
    {
        if(_.isFunction(changed))
        {
            if(!_.isEqual(origin, changed))
            {
                //Value change
                config.onChange(path, origin, _.cloneDeep(changed), config, deltaTree);
            }

        } else return false; //Return false to let the next comparer try
    };
    ComparisonHandlers.compareAsUnorderedValuelist = function(path, origin, changed, deltaTree, config)
    {
        if(_.isArray(changed))
        {
            DiffHandlers.diffAsUnorderedValuelist(origin, changed, config, deltaTree, path);
        } else return false; //Return false to let the next comparer try
    };
    ComparisonHandlers.compareAsOrderedList = function(path, origin, changed, deltaTree, config)
    {
        if((_.isArrayLike(changed) || _.isTypedArray(changed) || _.isBuffer(changed))
            && !_.isString(changed))
        {
            DiffHandlers.diffAsOrderedList(origin, changed, config, deltaTree, path);
        } else return false; //Return false to let the next comparer try
    };
    ComparisonHandlers.compareAsTree = function(path, origin, changed, deltaTree, config)
    {
        if(_.isPlainObject(changed) && !_.isNull(changed) && !_.isNull(origin))
        {
            DiffHandlers.diffAsTree(origin, changed, config, deltaTree, path);
        } else return false; //Return false to let the next comparer try
    };



    /**
     * @namespace Merge
     * @memberOf jsod
     */
    let Merge = jsod.Merge = {};

    /**
     * Configures how to handle merges of DeltaTrees
     * @typedef {Object} MergeConfiguration
     * @memberOf jsod.Merge
     * @property {MergedDeltaTreeNodeHandler} onMergeDeltaTreeNodes - Called when two DeltaTree nodes have to be merged
     * @property {MergeAllNodeRecordsHandler} onMergeAllNodeRecords - Called when the records of to nodes have to merged
     * @property {MergeRecordsHandler} onMergeRecords - Called when two DeltaRecords have to be merged
     */

    /**
     * Generates a DeltaTree that incorporates all changes from deltaA and deltaB,
     * generating conflict entries. Core part of the delta merge and therefore diff3 logic.
     * @callback MergedDeltaTreeNodeHandler
     * @memberOf jsod.Merge
     * @param {DeltaTree} deltaA - The DeltaTree to be merged
     * @param {DeltaTree} deltaB - The other DeltaTree to be merged
     * @param {MergeConfiguration} config - The configuration of the merge
     * @param {Array.<{path:PropertyPath,node:DeltaTree}>} [conflictNodes] - If present, writes all nodes containing conflicts to this array for quick lookup.
     * @param {PropertyPath} [parentPath] - The parent path that lead to deltaA and deltaB. Used in recursion.
     */

    /**
     * Generates a Record that represents the combined changes of all records of nodeA and nodeB
     * generating conflict entries.
     * Should somehow call a MergeRecordsHandler
     * @callback MergeAllNodeRecordsHandler
     * @memberOf jsod.Merge
     * @param {Array.<DeltaRecord>} recordsA - The DeltaRecords to be merged
     * @param {Array.<DeltaRecord>} recordsB - The other DeltaRecords to be merged
     * @param {DeltaTree} deltaNodeA - The DeltaTree node containing recordA
     * @param {DeltaTree} deltaNodeB - The DeltaTree node containing recordB
     * @param {MergeConfiguration} config - The configuration of the merge
     * @param {Array.<Conflict>} [localConflicts] - Outgoing array to store conflicts in
     * @param {PropertyPath} [parentPath] - The parent path that lead to deltaA and deltaB. Used in recursion.
     */

    /**
     * Generates a Record that represents the combined changes recordA and recordB,
     * generating conflict entries.
     * @callback MergeRecordsHandler
     * @memberOf jsod.Merge
     * @param {DeltaRecord} recordA - The DeltaRecord to be merged
     * @param {DeltaRecord} recordB - The other DeltaRecord to be merged
     * @param {DeltaTree} deltaNodeA - The DeltaTree node containing recordA
     * @param {DeltaTree} deltaNodeB - The DeltaTree node containing recordB
     * @param {MergeConfiguration} config - The configuration of the merge
     * @param {Array.<Conflict>} [localConflicts] - Outgoing array to store conflicts in
     * @param {PropertyPath} [parentPath] - The parent path that lead to deltaA and deltaB. Used in recursion.
     */

    /**
     * Generates a DeltaTree that incorporates all changes from deltaA and deltaB,
     * generating conflict entries. Uses the config to decide how to merge subtrees or records
     * @param {DeltaTree} deltaA - The DeltaTree to be merged
     * @param {DeltaTree} deltaB - The other DeltaTree to be merged
     * @param {MergeConfiguration} config - The configuration of the merge
     * @param {Array.<{path:PropertyPath,node:DeltaTree}>} [conflictNodes] - If present, writes all nodes containing conflicts to this array for quick lookup.
     * @param {PropertyPath} [parentPath] - The parent path that lead to deltaA and deltaB. Used in recursion.
     * @return {DeltaTree}
     */
    Merge.mergeDeltaTreeNode = function(deltaA, deltaB, config, conflictNodes, parentPath)
    {
        let mergedDelta = ensureDeltaTree();
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
            let structureConflict = Util.createConflict(
                jsod.Attributes.ConflictType.TREE_DIFF_STRUCTURE,
                _.cloneDeep(deltaA),
                _.cloneDeep(deltaB)
            );
            if(!_.isArray(mergedDelta['!']))
            {
                mergedDelta['!'] = [structureConflict];
            }
            conflictNodes.push({
                path: parentPath,
                node: mergedDelta
            });

        } else if(hasRecords)
        {
            //Merge records
            Util.sortDeltaRecords(recordsA);
            Util.sortDeltaRecords(recordsB);
            let localConflicts = [];
            let combinedRecords = config.onMergeAllNodeRecords(
                recordsA, recordsB, deltaA, deltaB, config, localConflicts, parentPath
            );

            if(localConflicts.length > 0)
            {
                if(!_.isArray(mergedDelta['!']))
                {
                    mergedDelta['!'] = [];
                }

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
                mergedDelta['.'] = Util.sortDeltaRecords(combinedRecords);
            }

        } else if(hasSubtrees)
        {
            //Merge subtrees

            let mergedSubTrees = {};
            _.forEach(subTreeKeys, function(subTreeKey) {
                let subPath = parentPath.concat([subTreeKey]);
                let subTreeA = subTreesA[subTreeKey];
                let subTreeB = subTreesB[subTreeKey];

                let mergedSubTree = config.onMergeDeltaTreeNodes(subTreeA, subTreeB, config, conflictNodes, subPath);
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
    };
    Merge.mergeAllNodeRecords = function(recordsA, recordsB, deltaNodeA, deltaNodeB, config, localConflicts, parentPath)
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
            let recordB = findMatchingRecord(recordA, recordsB, parentPath, visitedRecordBs);
            if(!_.isUndefined(recordB))
            {
                //We definitely have an A and also have found a B:
                //Possible conflict
                mergedRecord = config.onMergeRecords(recordA, recordB, deltaNodeA, deltaNodeB, config, localConflicts, parentPath);
            } else {
                mergedRecord = _.cloneDeep(recordA);
            }

            if(_.isArray(mergedRecord))
            {
                combinedRecords.push(mergedRecord);
            }
        }

        //Now ADD missed recordB's
        _.forEach(recordsB, function(recordB, b){
            if(visitedRecordBs.indexOf(b) < 0)
            {
                //Unvisited recordB
                combinedRecords.push(_.cloneDeep(recordB));
            }
        });

        return combinedRecords;
    };
    Merge.mergeRecords = function(recordA, recordB, deltaNodeA, deltaNodeB, config, localConflicts, parentPath)
    {
        let keyA = recordA[0];
        let opA = recordA[1];
        let valA = recordA[2];
        let keyB = recordB[0];
        let opB = recordB[1];
        let valB = recordB[2];

        if(opA != opB)
        {
            Util.reportLocalConflict(localConflicts, jsod.Attributes.ConflictType.RECORD_DIFF_OPERATION, _.cloneDeep(recordA), _.cloneDeep(recordB));
        }
        else if(opA == opB && !_.isEqual(valA, valB))
        {
            Util.reportLocalConflict(localConflicts, jsod.Attributes.ConflictType.RECORD_DIFF_VALUE, _.cloneDeep(recordA), _.cloneDeep(recordB));
        } else {
            //Favours the one with the biggest index on "ADD" and the one with the smallest index on "remove"
            return ((opA < opB && keyA > keyB) || (opA > opB && keyA < keyB)) ? _.cloneDeep(recordA) : _.cloneDeep(recordB);
        }
    };

    /**
     * Default Diffing Algorithms
     * @namespace {Object.<DiffHandler>} DiffHandlers
     * @memberOf jsod
     */
    let DiffHandlers = jsod.DiffHandlers = {};

    /**
     * General diff iterator.
     * Usually falls back to calling ComparisonHandlers or recording structural diffs.
     * First checks if the type of origin and changed are the same - if not, this is recorded as structural change,
     *   calling config.onTypeChange
     * If one of the two is undefined, the according config.onAdd or config.onDelete will be called.
     * Otherwise calls config.onCompare.
     * @param {*} origin
     * @param {*} changed
     * @param {DiffConfiguration} [config]
     * @param {DeltaTree} [deltaTree] - The recorded changes until now, only used in recursion
     * @param {PropertyPath} [parentPath] - The path from the root to this node. Used in recursion.
     * @returns {DeltaTree} The recorded changes
     */
    DiffHandlers.diffAsStructure = function(origin, changed, config, deltaTree, parentPath)
    {
        deltaTree = ensureDeltaTree(deltaTree);
        parentPath = _.isArray(parentPath) ? parentPath : [];
        config = _.extend({},Presets.Configs.ValueDiffPure,config);

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
    };

    /**
     * Treats an object as tree and iterates over all child links (properties),
     * diffing each child as structure.
     * @param {Object} origin - The current object to diff, which may be a child of the actual diffing root.
     * @param {Object} changed - The changed version of the current object to diff.
     * @param {DiffConfiguration} [config]
     * @param {DeltaTree} [deltaTree] - The recorded changes until now, only used in recursion
     * @param {PropertyPath} [parentPath] - The path from the root to this node. Used in recursion.
     * @returns {DeltaTree} The recorded changes
     */
    DiffHandlers.diffAsTree = function(origin, changed, config, deltaTree, parentPath)
    {
        deltaTree = ensureDeltaTree(deltaTree);
        parentPath = _.isArray(parentPath) ? parentPath : [];
        config = _.extend({},Presets.Configs.TreeDiffPure,config);

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
                    DiffHandlers.diffAsStructure(origin[key], changed[key], config, deltaTree, subPath);
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
    };


    /**
     * Diffs arrays and treats them like unordered lists of values - no tree_diffs will be called.
     * Meaning, for each value where a unique pair in origin and changed can be found, no changes will be recorded.
     * For every other adds/deletes will be recorded. Deltas never record a modify operation and should never
     * lead to conflicts.
     * The length parameter is implicited and not recorded as a change.
     * @param {*} origin
     * @param {*} changed
     * @param {DiffConfiguration} [config]
     * @param {DeltaTree} [deltaTree] - The recorded changes until now, only used in recursion
     * @param {PropertyPath} [parentPath] - The path from the root to this node. Used in recursion.
     * @returns {DeltaTree} The recorded changes
     */
    DiffHandlers.diffAsUnorderedValuelist = function(origin, changed, config, deltaTree, parentPath)
    {
        deltaTree = ensureDeltaTree(deltaTree);
        parentPath = _.isArray(parentPath) ? parentPath : [];
        config = _.extend({},Presets.Configs.UnorderedValuelistDiffPure,config);

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
                Util.recordDelta(deltaTree, parentPath.concat([undefined, iO]), Attributes.DeltaOperation.DELETE, originValue);
            }
        }

        //Find new values
        for(let iC = 0; iC < changed.length; iC++)
        {
            let changedValue = changed[iC];
            if(matchesInChanged.indexOf(iC) == -1)
            {
                //No match found previously, so obviously new
                Util.recordDelta(deltaTree, parentPath.concat([undefined, iC]), Attributes.DeltaOperation.ADD, changedValue);
            }
        }

        return deltaTree;
    };

    /**
     * Diffs array-like objects and treats them like ordered lists.
     * Meaning, pairs are identified by the same index.
     * The length parameter is implicited and not recorded as a change.
     * @param {*} origin
     * @param {*} changed
     * @param {DiffConfiguration} [config]
     * @param {DeltaTree} [deltaTree] - the recorded changes until now, only used in recursion
     * @param {PropertyPath} [parentPath] - only used in recursion
     * @returns {DeltaTree} the recorded changes
     */
    DiffHandlers.diffAsOrderedList = function(origin, changed, config, deltaTree, parentPath)
    {
        deltaTree = ensureDeltaTree(deltaTree);
        parentPath = _.isArray(parentPath) ? parentPath : [];
        config = _.extend({},Presets.Configs.OrderedListDiffPure,config);


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
    };



    /**
     * Utility functions
     * @namespace DiffHandlers
     * @memberOf jsod
     */
    let Util = jsod.Util = {};

    /**
     * @param {Array.<DeltaRecord>} deltaRecords
     * @returns {Array.<DeltaRecord>}
     */
    Util.sortDeltaRecords = function(deltaRecords){
        return deltaRecords.sort(Util.sortDeltaRecordIterator);
    };
    /**
     * Returns -1, 0, or 1 to sort delta records via Array.sort
     * @param {DeltaRecord}a
     * @param {DeltaRecord} b
     * @returns {number}
     */
    Util.sortDeltaRecordIterator = function(a, b)
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
            // and to optimize, on "ADD" keys, revert the keyOrder so the biggest impact on list sizes comes first
            // (smallest index first on remove, biggest index first on ADD)
            result = (opOrder != 0) ? opOrder : ((opA == Attributes.DeltaOperation.ADD) ? -keyOrder : keyOrder);
        } else {
            result = (keyOrder != 0) ? keyOrder : opOrder;
        }
        return result;
    };
    function compare(a, b)
    {
        return (a < b) ? -1 : ((a > b) ? 1 : 0);
    }

    /**
     * Adds a delta to the deltaTree
     * @param {DeltaTree} deltaTree
     * @param {PropertyPath} path
     * @param {jsod.Attributes.DeltaOperation} changeOperation
     * @param {*} [changeValue]
     * @return {DeltaRecord}
     */
    Util.recordDelta = function(deltaTree, path, changeOperation, changeValue)
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
    };

    /**
     * Compares origin and changed by iterating the compareHandlers queue
     * @param {Array.<ComparisonHandler>} comparisonHandlers
     * @param {PropertyPath} path
     * @param {*} origin
     * @param {*} changed
     * @param {DeltaTree} deltaTree
     * @param {DiffConfiguration} config
     */
    Util.compareUsing = function(comparisonHandlers, path, origin, changed, deltaTree, config)
    {
        comparisonHandlers = _.isArray(comparisonHandlers) ? comparisonHandlers : [];
        for(let i = 0; i < comparisonHandlers.length; i++)
        {
            let currentComparer = comparisonHandlers[i];
            if(_.isFunction(currentComparer))
            {
                if(currentComparer(path, origin, changed, deltaTree, config) !== false)
                    break;
            }
        }
    };

    /**
     * Creates a conflict report and stores it in the localConflictNodes array.
     * This array will then be resolved to correct the paths and store the reports
     * in the nodes itself.
     * @param {Array} conflicts
     * @param {jsod.Attributes.ConflictType} conflictType
     * @param {DeltaRecord|DeltaTree} dataA
     * @param {DeltaRecord|DeltaTree} dataB
     * @param {*} [metaData]
     * @return {Conflict}
     */
    Util.createConflict = function(conflictType, dataA, dataB, metaData)
    {
        /**
         * @type {Conflict}
         */
        let conflictReport = {
            conflictType: conflictType,
            A: dataA,
            B: dataB
        };
        if(!_.isUndefined(metaData))
        {
            conflictReport.meta = metaData;
        }
        return conflictReport;
    };

    /**
     * Creates a conflict report and stores it in the localConflictNodes array.
     * This array will then be resolved to correct the paths and store the reports
     * in the nodes itself.
     * @param {Array} conflicts
     * @param {jsod.Attributes.ConflictType} conflictType
     * @param {DeltaRecord|DeltaTree} dataA
     * @param {DeltaRecord|DeltaTree} dataB
     * @param {*} [metaData]
     */
    Util.reportLocalConflict = function(conflicts, conflictType, dataA, dataB, metaData)
    {
        let conflictReport = Util.createConflict(conflictType, dataA, dataB, metaData);
        conflicts.push(conflictReport);
        return conflicts;
    };

    /**
     * Collection of presets and default configurations
     * @namespace Presets
     * @memberOf jsod
     */
    let Presets = jsod.Presets = {};

    /**
     * @memberOf jsod.Presets
     */
    Presets.Configs = {};
    /**
     * @type {DiffConfiguration}
     */
    Presets.Configs.Default = {
        onAdd: function(path, origin, changed, config, deltaTree){
            Util.recordDelta(deltaTree, path, Attributes.DeltaOperation.ADD, changed);
        },
        onTypeChange: function(path, origin, changed, config, deltaTree){
            Util.recordDelta(deltaTree, path, Attributes.DeltaOperation.MODIFY, changed);
        },
        onCompare: function(path, origin, changed, config, deltaTree){
            Util.compareUsing(config.compareHandlers, path, origin, changed, deltaTree, config);
        },
        onChange: function(path, origin, changed, config, deltaTree){
            Util.recordDelta(deltaTree, path, Attributes.DeltaOperation.MODIFY, changed);
        },
        onDelete: function(path, origin, changed, config, deltaTree){
            Util.recordDelta(deltaTree, path, Attributes.DeltaOperation.DELETE, changed);
        },
        compareHandlers: [
            ComparisonHandlers.compareAsUnorderedValuelist,
            ComparisonHandlers.compareAsOrderedList,
            ComparisonHandlers.compareAsFunction,
            ComparisonHandlers.compareAsTree,
            ComparisonHandlers.compareAsValue
        ]
    };
    /**
     * @type {DiffConfiguration}
     */
    Presets.Configs.TreeDiffPure = _.extend({}, Presets.Configs.Default, {
        compareHandlers: [
            ComparisonHandlers.compareAsTree,
            ComparisonHandlers.compareAsValue
        ]
    });
    /**
     * @type {DiffConfiguration}
     */
    Presets.Configs.UnorderedValuelistDiffPure = _.extend({}, Presets.Configs.Default, {
        compareHandlers: [
            ComparisonHandlers.compareAsUnorderedValuelist,
            ComparisonHandlers.compareAsValue
        ]
    });
    /**
     * @type {DiffConfiguration}
     */
    Presets.Configs.OrderedListDiffPure = _.extend({}, Presets.Configs.Default, {
        compareHandlers: [
            ComparisonHandlers.compareAsOrderedList,
            ComparisonHandlers.compareAsValue
        ]
    });
    /**
     * @type {DiffConfiguration}
     */
    Presets.Configs.ValueDiffPure = _.extend({}, Presets.Configs.Default, {
        compareHandlers: [
            ComparisonHandlers.compareAsValue
        ]
    });
    /**
     * @type {DiffConfiguration}
     */
    Presets.Configs.NoUnorderedDiff = _.extend({}, Presets.Configs.Default, {
        compareHandlers: [
            ComparisonHandlers.compareAsOrderedList,
            ComparisonHandlers.compareAsFunction,
            ComparisonHandlers.compareAsTree,
            ComparisonHandlers.compareAsValue
        ]
    });
    /**
     * @type {MergeConfiguration}
     */
    Presets.Configs.DefaultMerge = {
        onMergeDeltaTreeNodes: Merge.mergeDeltaTreeNode,
        onMergeAllNodeRecords: Merge.mergeAllNodeRecords,
        onMergeRecords: Merge.mergeRecords
    };

    /**
     * @param {DeltaTree} [deltaTree]
     * @returns {DeltaTree}
     */
    function ensureDeltaTree(deltaTree)
    {
        return _.isPlainObject(deltaTree) ? deltaTree : {};
    }

    function findMatchingRecord(recordA, recordsB, parentPath, visitedRecordBs)
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

})(jsod);

/**
 * @type {jsod}
 */
module.exports = exports = jsod;

