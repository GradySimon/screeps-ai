/* global Game, require, module */

var _ = require('lodash');
var utils = require('utils');

// TODO: deal with the fact that energy only exists in a particular spawn

/**
 * Represents a bundle of scarce resources, to be managed or requested.
 * @constructor
 * @param {Collection of creeps} creeps
 * @param {Collection of sources} sources
 * @param {Collection of spawns} spawns
 * @param {Number} energy
 */
var ResourceBundle = module.exports.ResourceBundle = function(creeps, sources, spawns, energy) {
    console.log("Creating ResourceBundle");
    this.creeps = creeps;
    // TODO: only allows a bundle to specify a whole source or none of it.
    this.sources = sources;
    this.spawns = spawns;
    this.energy = energy;
};

/**
 * Constructor for a ResourceManager that will manage the resources in the
 * specified resourceBundle.
 * @param {ResourceBundle} resourceBundle
 */
var ResourceManager = module.exports.ResourceManager = function(resourceBundle) {
    this.managedResources = resourceBundle;
    this.availableResources = _.clone(resourceBundle);
    console.log("Available resources: " + this.availableResources);
};

/**
 * Arbitrates among the given plans. Returns an object specifying which Plans
 * were accepted and which were rejected.
 * @param  {Collection of Plans} plans
 * @return {Object}
 */
ResourceManager.prototype.arbitrate = function(planSet) {
    var candidatePlanSets = _.sortBy(utils.allSubsets(planSet), function(planSet) {
        return -computePlanSetImportance(planSet);
    });
    console.log("candidatePlansSets = " + candidatePlanSets.length);
    var bestSatisfiablePlanSet = _.find(candidatePlanSets, this.canSatisfyPlanSet, this);
    console.log("bestSatisfiablePlanSet = " + bestSatisfiablePlanSet);
    var rejectedPlans = _.difference(planSet, bestSatisfiablePlanSet);
    console.log("rejectedPlans = " + rejectedPlans.length);
    return {
        accepted: bestSatisfiablePlanSet,
        rejected: rejectedPlans
    };
};

// TODO: Write a method to "accept" a planSet, which would mark its resources
// unavailable for future arbitration rounds.

/**
 * Commits a planSet. Removes the resources required by the planSet from set of available resources.
 * @param  {Collection of Plans} planSet
 */
ResourceManager.prototype.commit = function(planSet) {
    this.availableResources.creeps = _.difference(this.availableResources.creeps,
                                                  requestedCreeps(planSet));
    this.availableResources.sources = _.difference(this.availableResources.sources,
                                                   requestedSources(planSet));
    this.availableResources.spawns = _.difference(this.availableResources.spawns,
                                                  requestedSpawns(planSet));
    this.availableResources.energy = this.availableResources.energy -
                                     requestedEnergy(planSet);
};

/**
 * Returns whether this ResourceManager can provide all the resources requested
 * by the planSet.
 * @param  {Collection of Plans} planSet
 * @return {Boolean}
 */
ResourceManager.prototype.canSatisfyPlanSet = function(planSet) {
    console.log("--- Considering a planSet ---");
    var canSatisfyC = this.canSatisfyCreeps(planSet);
    console.log("canSatisfyCreeps: " + canSatisfyC);
    // console.log(this.canSatisfySources(planSet));
    // console.log(this.canSatisfySpawns(planSet));
    // console.log(this.canSatisfyEnergy(planSet));   
    return canSatisfyC &&
           this.canSatisfySources(planSet) &&
           this.canSatisfySpawns(planSet) &&
           this.canSatisfyEnergy(planSet);
};

/**
 * Returns true iff this ResourceManager can provide all the creeps requested by
 * the planSet.
 * @param  {Collection of Plans} planSet
 * @return {Boolean}
 */
ResourceManager.prototype.canSatisfyCreeps = function(planSet) {
    var creepRequests = requestedCreeps(planSet);
    console.log("Creeps requested = ", creepRequests.length);
    console.log("Creeps available = " + this.availableResources.creeps.length);
    return canSatisfySingleUseResource(this.availableResources.creeps, creepRequests);
};

/**
 * Returns true iff this ResourceManager can provide all the sources requested
 * by the planSet.
 * @param  {Collection of Plans} planSet
 * @return {Boolean}
 */
ResourceManager.prototype.canSatisfySources = function(planSet) {
    var sourceRequests = requestedSources(planSet);
    return canSatisfySingleUseResource(this.availableResources.sources, sourceRequests);
};

/**
 * Returns true iff this ResourceManager can provide all the spawns requested by
 * the planSet.
 * @param  {Collection of Plans} planSet
 * @return {Boolean}
 */
ResourceManager.prototype.canSatisfySpawns = function(planSet) {
    var spawnRequests = requestedSpawns(planSet);
    return canSatisfySingleUseResource(this.availableResources.spawns, spawnRequests);
};

/**
 * Returns true iff the set of singleUseResources can satisfy all of the requests.
 * @param  {Set} singleUseResources
 * @param  {Collection} requests
 * @return {Boolean}
 */
var canSatisfySingleUseResource = function(singleUseResources, requests) {
    var availableResources = new Set(singleUseResources);
    for (var request of requests) {
        if (availableResources.has(request)) {
            availableResources.delete(request);
        } else {
            return false;
        }
    }
    return true;
};

/**
 * Returns true iff this ResourceManager can provide all the energy requested by
 * the planSet.
 * @param  {Collection of Plans} planSet
 * @return {Boolean}
 */
ResourceManager.prototype.canSatisfyEnergy = function(planSet) {
    return requestedEnergy(planSet) <= this.availableResources.energy;
};

/**
 * Computes the total importance value of executing all the Plans in the planSet.
 * @param  {Collection of Plans} planSet
 * @return {Number}
 */
var computePlanSetImportance = function(planSet) {
    return _.reduce(planSet, function(importanceSum, plan) {
        return importanceSum + plan.importance;
    }, 0);
};

/**
 * Returns an array of the Creeps that the planSet requires.
 * @param  {Collection of Plans} planSet
 * @return {Array}
 */
var requestedCreeps = function(planSet) {
    var creeps = _(planSet).map(function(plan) {
        return plan.resourceBundle.creeps;
    }).flatten().valueOf();
    return creeps;
};

/**
 * Returns an array of the Sources that the planSet requires.
 * @param  {Collection of Plans} planSet
 * @return {Array}
 */
var requestedSources = function(planSet) {
    var sources = _(planSet).map(function(plan) {
        return plan.resourceBundle.sources;
    }).flatten().valueOf();
    return sources;
};

/**
 * Returns an array of the Spawns that the planSet requires.
 * @param  {Collection of Plans} planSet
 * @return {Array}
 */
var requestedSpawns = function(planSet) {
    return _(planSet).map(function (plan) {
        return plan.resourceBundle.spawns;
    }).flatten().valueOf();
};

/**
 * Returns the amount of energy the planSet requires.
 * @param  {Collection of Plans} planSet
 * @return {Number}
 */
var requestedEnergy = function(planSet) {
    return _.reduce(planSet, function(energySum, plan) {
        return energySum + plan.resourceBundle.energy;
    }, 0);
};

module.exports.resourcesInRoom = function(room) {
    var creeps = room.find(Game.MY_CREEPS);
    var sources = room.find(Game.SOURCES);
    var spawns = room.find(Game.MY_SPAWNS);
    var energy = _.reduce(spawns, function(energySum, spawn) {
        return energySum + spawn.energy;
    }, 0);
    return new ResourceBundle(creeps, sources, spawns, energy);
};
