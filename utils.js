/* global Game, require, module */

var _ = require('lodash');


var keyArray = module.exports.keyArray = function(map) {
    var keys = [];
    for (var key of map.keys()) {
        keys.push(key);
    }
    return keys;
};

/**
 * Given an array, returns an array of all unique subsets of the elements in that array.
 * @param  {Array} array
 * @return {Array} An Array of Arrays
 */
module.exports.allSubsets = function(array){
    var subsets = [];
    var result, mask, total = Math.pow(2, array.length);
    for(mask = 0; mask < total; mask++){ //O(2^n)
        result = [];
        var i = array.length - 1; //O(n)
        do{
            if((mask & (1 << i)) !== 0){
                result.push(array[i]);
            }
        }while(i--);
        subsets.push(result);
    }
    return subsets;
};

var allMyRooms = module.exports.allMyRooms = function() {
    return _.union(creepRooms(), spawnRooms());
};

var creepRooms = module.exports.creepRooms = function() {
    return _(Game.creeps).map('room').uniq().valueOf();
};

var spawnRooms = module.exports.spawnRooms = function() {
    return _(Game.spawns).map('room').uniq().valueOf();
};



module.exports.creepSpecs = {
    Harvester: [Game.MOVE, Game.WORK, Game.MOVE, Game.WORK, Game.CARRY]
};

var bodyPartCosts = new Map([
        [Game.MOVE, 50],
        [Game.WORK, 20],
        [Game.CARRY, 50],
        [Game.ATTACK, 100],
        [Game.RANGED_ATTACK, 150],
        [Game.HEAL, 200],
        [Game.TOUGH, 5]
    ]);

/**
 * Computes the energy cost of the creep specification specified by creepSpec.
 * @param  {[type]} creepSpec
 * @return {[type]}
 */
module.exports.computeCreepCost = function(creepSpec) {
    return _.reduce(creepSpec, function(sum, bodyPart) {
        return sum + bodyPartCosts.get(bodyPart);
    }, 0);
};

/**
 * Specifies a selection of creeps. `rooms` specifies the rooms in which to
 * select creeps. Additionally the creeps specification must be found in
 * `creepSpecs`.
 * @param {Array of Creeps} rooms
 * @param {Array of Arrays} creepSpecs
 */
module.exports.SelectionSpec = function(rooms, creepSpecs) {
    this.rooms = rooms;
    this.creepSpecs = creepSpecs;
};


/**
 * Returns all the creeps that meet the criteria specified by the selectionSpec.
 * This function will return creeps only if they are in one of the specified
 * rooms and only if they have one of the specified body part specs.
 * @param  {selectionSpec} selectionSpec 
 * @return {Array of Creeps}    The found creeps
 */
module.exports.selectCreeps = function(selectionSpec) {
    return _(selectionSpec.rooms).map(function(room) {
        return room.find(Game.MY_CREEPS);
    })
    .toArray()
    .flatten(true) // isShallow = true
    .filter(function (creep) {
        return _.some(selectionSpec.creepSpecs, function(creepSpec) {
            return _.isEqual(creepSpec, creep.memory.spec);
        });
    }).valueOf();
};

/**
 * Returns the distance between two points if there were no obstacles in the way.
 * @param  {RoomPosition} from One of the two points
 * @param  {RoomPosition} to   The other of the two points
 * @return {Number}      The distance between the two points
 */
var noObstacleDistance = module.exports.noObstacleDistance = function(from, to) {
    var xDelta = Math.abs(from.x - to.x);
    var yDelta = Math.abs(from.y - to.y);
    // You can move diagonally, but it's a grid
    return Math.max(xDelta, yDelta);
};

/**
 * In a given room, returns the length of the shortest path between the from and
 * to positions. opts is an optional param object that will be passed to
 * RoomPosition.findPathTo, which finds the shortest path.
 * @param  {RoomPosition} from
 * @param  {RoomPosition} to
 * @param  {Object} opts
 * @return {Number}
 */
var pathDistance = module.exports.pathDistance = function(from, to, opts) {
    var path = findPath(from, to, opts);
    if (path) {
        return path.length;
    }
    return undefined;
};

/**
 * Returns the nearest target of type targetType to the specified creep. Returns
 * undefined if no path to any target can be found.
 * @param  {[type]} creep
 * @param  {[type]} targetType
 * @return {[type]}
 */
module.exports.nearestTarget = function(creep, targetType) {
    var targets = creep.room.find(targetType);
    if (targets.length) {
        var closestTarget = _.min(targets, function(target) {
            return pathDistance(creep.pos, target.pos);
        });
        // If _.min gets only a list of undefined, it returns infinity
        if (closestTarget !== Infinity) {
            return closestTarget;
        }
    } else {
        return undefined;
    }
};

/**
 * Sorts the given array of toTargets (Spawns, Sources, structures, etc) by their
 * pathDistance from the fromTarget.
 * @param  {target} fromTarget
 * @param  {Array of targets} toTargets 
 * @return {Array of targets}
 */
module.exports.sortByDistanceFrom = function(fromTarget, toTargets) {
    return _.sortBy(toTargets, function(toTarget) {
        return pathDistance(fromTarget.pos, toTarget.pos);
    });
};

/**
 * Returns a complete path if one exists or undefined.
 * @param  {RoomPosition} from
 * @param  {RoomPosition} to
 * @param {Object} opts The option object that will be passed to
 * RoomPosition.findPathTo
 * @return {Array}      
 */
var findPath = module.exports.findPath = function(from, to, opts) {
    var screepsPath = from.findPathTo(to, opts);
    if (isCompletePath(from, to, screepsPath)) {
        return screepsPath;
    }
    return undefined;
};

/**
 * Returns true iff the path could be followed all the way from the from
 * position to the to position.
 * @param  {RoomPosition}  from
 * @param  {RoomPosition}  to
 * @param  {Array}  path The path to evaluate
 * @return {Boolean}
 */
var isCompletePath = function(from, to, path) {
    var pathSegmentMatches = function(pathSegment, pos) {
        return pathSegment.x === pos.x && pathSegment.y === pos.y;
    };
    if (path.length) {
        return pathSegmentMatches(path[path.length - 1], to);
    } else {
        return from.x === to.x && from.y === to.y;
    }
};

/**
 * Returns a stringified version of the given path
 * @param  {Array} path
 * @return {String}
 */
var pathToString = module.exports.pathToString = function(path) {
    return _(path).map(JSON.stringify).join(", ").valueOf();
};
