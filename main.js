var _ = require('lodash');
/* In a given room, returns the shortest distance between the from and to positions.
 * opts is an optional object that will be passed to Room.findPath, which finds the shortest path.*/
function distance(room, from, to, opts) {
    var path = room.findPath(from, to, opts);
    return path.length;
}

function nearestTarget(creep, targetType) {
    var room = creep.room;
    var targets = room.find(targetType);
    return _.min(targets, function(target) {
        return distance(room, creep.pos, target.pos);
    })};

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
        
function computeCost(creepSpec) {
    return _.reduce(creepSpec, function(sum, bodyPart) {
        return sum + bodyPartCosts.get(bodyPart);
    });
}

function spawnCreateCreepTask(spawn, creepSpec) {
    var cost = computeCost(creepSpec);
    if (spawn.energy >= cost) {
       spawn.createCreep(creepSpec);
    }
} 

var creeps = Game.creeps
var spawns = Game.spawns

_.forEach(creeps, workerHarvestTask);
_.forEach(spawns, spawnCreateCreepTask);
