var _ = require('lodash');

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

/* A function that will order the specified creep to continuously
 * harvest energy from the nearest source and return it to the nearest spawn. */
function workerHarvestTask(creep) {
    if (creep.energy < creep.energyCapacity) {
        var nearestSource = nearestTarget(creep, Game.SOURCE);
        creep.harvest(nearestSource);
    } else {
        var nearestSpawn = nearestTarget(creep, Game.MY_SPAWNS);
        creep.moveTo(spawn);
        creep.transferEnergy(spawn);
    }
} 

var bodyPartCosts = new Map(
        [Game.MOVE, 50],
        [Game.WORK, 20],
        [Game.CARRY, 50],
        [Game.ATTACK, 100],
        [Game.RANGED_ATTACK, 150],
        [Game.HEAL, 200],
        [Game.TOUGH, 5]
    );

/* Computes the energy cost of the creep specification specified by creepSpec */    
function computeCreepCost(creepSpec) {
    return _.reduce(creepSpec, function(sum, bodyPart) {
        return sum + bodyPartCosts.get(bodyPart);
    });
}

/* Orders the given spawn to create a creep according to the given creepSpec */
function spawnCreateCreepTask(spawn, creepSpec) {
    var cost = computeCreepCost(creepSpec);
    if (spawn.energy >= cost) {
       spawn.createCreep(creepSpec);
    }
} 

var creeps = Game.creeps
var spawns = Game.spawns

_.forEach(creeps, workerHarvestTask);
_.forEach(spawns, spawnCreateCreepTask);
