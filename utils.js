var _ = require('lodash');

var creepSpecs = {
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

/* Computes the energy cost of the creep specification specified by creepSpec */    
function computeCreepCost(creepSpec) {
    return _.reduce(creepSpec, function(sum, bodyPart) {
        return sum + bodyPartCosts.get(bodyPart);
    }, 0);
}

function SelectionSpec(rooms, creepSpecs) {
    this.rooms = rooms;
    this.creepSpecs = creepSpecs;
}

function selectCreeps(selectionSpec) {
    return _.filter(Game.creeps, function (creep) {
        if (selectionSpec.rooms)
            if (!_.contains(selectionSpec.rooms, creep.room)
                return false;
        if (selectionSpec.creepSpec)
            if (!_.contains(selectionSpec.creepSpecs, creep.spec))
                return false; 
        return true;
    };
} 

/* In a given room, returns the length of the shortest path between the from and 
 * to positions. opts is an optional param object that will be passed to Room.findPath,
 * which finds the shortest path. */
function distance(room, from, to, opts) {
    var path = room.findPath(from, to, opts);
    return path.length;
}

/* returns the nearest target of type targetType to the specified creep. */
function nearestTarget(creep, targetType) {
    var room = creep.room;
    var targets = room.find(targetType);
    return _.min(targets, function(target) {
        return distance(room, creep.pos, target.pos);
    });
}

function sortByDistanceFrom(source, targets) {
    return _.sortBy(targets, function(target) {
        return distance(room, source.pos, target.pos);
    })
}