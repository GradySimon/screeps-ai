/* global Game, require, module */

var _ = require('lodash');


var keyArray = module.exports.keyArray = function(map) {
    var keys = [];
    for (var key of map.keys()) {
        keys.push(key);
    }
    return keys;
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

module.exports.SelectionSpec = function(rooms, creepSpecs) {
    this.rooms = rooms;
    this.creepSpecs = creepSpecs;
};

module.exports.selectCreeps = function(selectionSpec) {
    return _.filter(Game.creeps, function (creep) {
        if (selectionSpec.rooms) {
            if (!_.contains(selectionSpec.rooms, creep.room)) {
                return false;
            }
        }
        if (selectionSpec.creepSpec) {
            if (!_.contains(selectionSpec.creepSpecs, creep.spec)) {
                return false; 
            }
        }
        return true;
    });
};

/**
 * In a given room, returns the length of the shortest path between the from and 
 * to positions. opts is an optional param object that will be passed to Room.findPath,
 * which finds the shortest path.
 * @param  {[type]} room
 * @param  {[type]} from
 * @param  {[type]} to
 * @param  {[type]} opts
 * @return {[type]}
 */
var distance = module.exports.distance = function(room, from, to, opts) {
    var path = room.findPath(from, to, opts);
    return path.length;
};

/**
 * Returns the nearest target of type targetType to the specified creep.
 * @param  {[type]} creep
 * @param  {[type]} targetType
 * @return {[type]}
 */
module.exports.nearestTarget = function(creep, targetType) {
    var room = creep.room;
    var targets = room.find(targetType);
    return _.min(targets, function(target) {
        return distance(room, creep.pos, target.pos);
    });
};

module.exports.sortByDistanceFrom = function(source, targets) {
    return _.sortBy(targets, function(target) {
        return distance(source.room, source.pos, target.pos);
    });
};
