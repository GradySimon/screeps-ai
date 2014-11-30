/* global Game, require, module */

var utils = require('utils');

/*
 * Terminology:
 * - "behavior": a function that takes only an actor (a creep, spawn, or something else 
 *               that can "do stuff") and when applied to that actor each tick, will
 *               direct that actor to do something continuously. Behavior function names
 *               end with "Behavior".
 * 
 * - "behavior generator": a function that takes some parameters and returns a behavior. 
 *                         Behavior generator functions end with "BehaviorGen".
 */


/**
 * A function that will order the specified creep to continuously
 * harvest energy from the nearest source and return it to the nearest spawn.
 * @param  {Creep} creep The creep to apply the behavior to
 */
module.exports.workerHarvestNearestBehavior = function(creep) {
    if (creep.energy < creep.energyCapacity) {
        var nearestSource = utils.nearestTarget(creep, Game.SOURCES);
        creep.moveTo(nearestSource);
        creep.harvest(nearestSource);
    } else {
        var nearestSpawn = utils.nearestTarget(creep, Game.MY_SPAWNS);
        creep.moveTo(nearestSpawn);
        creep.transferEnergy(nearestSpawn);
    }
};

/**
 * Returns a behavior that orders the given creep to harvest from the specified source
 * and bring the gathered energy to the nearest spawn. 
 * @param  {Source} source The source to harvest from.
 * @return {Function} The behavior
 */
module.exports.workerHarvestBehaviorGen = function(source) {
    return function(creep) {
        if (creep.energy < creep.energyCapacity) {
            creep.moveTo(source);
            creep.harvest(source);
        } else {
            var nearestSpawn = utils.nearestTarget(creep, Game.MY_SPAWNS);
            creep.moveTo(nearestSpawn);
            creep.transferEnergy(nearestSpawn);
        }
    };
};

/**
 * Returns a behavior that orders the given spawn to create a creep according to the given creepSpec.
 * @param  {Array of body parts} creepSpec
 * @return {Function} The behavior
 */
module.exports.spawnCreateCreepBehaviorGen = function(creepSpec) {
    return function(spawn) {
        var cost = utils.computeCreepCost(creepSpec);
        if (spawn.energy >= cost) {
            spawn.createCreep(creepSpec);
        }
    };
};
