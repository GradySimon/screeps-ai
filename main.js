var _ = require('lodash');

/*
 * Terminology:
 * - "behavior": a function that takes only an actor (a creep, spawn, or something else 
 *               that can "do stuff") and when applied to that actor each tick, will
 *               direct that actor to do something continuously. Behavior function names
 *               end with "Behavior".
 * 
 * - "behavior generator": a function that takes some parameters and returns a behavior. 
 *                         Behavior generator functions end with "BehaviorGen".


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
function workerHarvestBehavior(creep) {
    if (creep.energy < creep.energyCapacity) {
        var nearestSource = nearestTarget(creep, Game.SOURCES);
        creep.moveTo(nearestSource);
        creep.harvest(nearestSource);
    } else {
        var nearestSpawn = nearestTarget(creep, Game.MY_SPAWNS);
        creep.moveTo(nearestSpawn);
        creep.transferEnergy(nearestSpawn);
    }
}

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

/* Returns a task that orders the given spawn to create a creep according to the given creepSpec */
function spawnCreateCreepBehaviorGen(creepSpec) {
    return function(spawn) {
        var cost = computeCreepCost(creepSpec);
        if (spawn.energy >= cost) {
            spawn.createCreep(creepSpec);
        }
    };
} 

var creeps = Game.creeps;
var spawns = Game.spawns;

var spawnCreateHarvesterBehavior = spawnCreateCreepBehaviorGen(creepSpecs.Harvester);

_.forEach(creeps, workerHarvestBehavior);
_.forEach(spawns, spawnCreateHarvesterBehavior);
