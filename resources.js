/* global require, module */

var _ = require('lodash');
var utils = require('utils');

/**
 * Represents a bundle of scarce resources, to be managed or requested.
 * @constructor
 * @param {Collection of creeps} creeps
 * @param {Collection of sources} sources
 * @param {Collection of spawns} spawns
 * @param {Number} energy
 */
module.exports.ResourceBundle = function(creeps, sources, spawns, energy) {
    this.creeps = new Set(creeps);
    // TODO: only allows a bundle to specify a whole source or none of it.
    this.sources = new Set(sources);
    this.spawns = new Set(spawns);
    this.energy = energy;
};

/**
 * Constructor for a ResourceManager that will manage the resources in the
 * specified resourceBundle.
 * @param {ResourceBundle} resourceBundle
 */
var ResourceManager = module.exports.ResourceManager = function(resourceBundle) {
    this.availableResources = resourceBundle;
};

/**
 * Arbitrates among the given plans. Returns an object specifying which plans
 * were accepted and which were rejected.
 * @param  {Collection of plans} plans
 * @return {Object}
 */
ResourceManager.prototype.arbitrate = function(plans) {
    var candidatePlanSets = _.sortBy(utils.allSubsets(plans), computePlanSetImportance);
    var bestAcceptedPlanSet = _.find(candidatePlanSets, this.canSatisfyPlanSet);
    var rejectedPlans = _.difference(plans, bestAcceptedPlanSet);
    return {
        accepted: bestAcceptedPlanSet,
        rejected: rejectedPlans
    };
};

// TODO: Write a method to "accept" a planSet, which would mark its resources
// unavailable for future arbitration rounds.

/**
 * Returns whether this ResourceManager can provide all the resources requested
 * by the planSet.
 * @param  {Collection of plans} planSet
 * @return {Boolean}
 */
ResourceManager.prototype.canSatisfyPlanSet = function(planSet) {
    return this.canSatisfyCreeps(planSet) &&
           this.canSatisfySources(planSet) &&
           this.canSatisfySpawns(planSet) &&
           this.canSatisfyEnergy(planSet);
};

/**
 * Returns true iff this ResourceManager can provide all the creeps requested by
 * the planSet.
 * @param  {Collection of plans} planSet
 * @return {Boolean}
 */
ResourceManager.prototype.canSatisfyCreeps = function(planSet) {
    var creepRequests = requestedCreeps(planSet);
    return canSatisfySingleUseResource(this.availableResources.creeps, creepRequests);
};

/**
 * Returns true iff this ResourceManager can provide all the sources requested
 * by the planSet.
 * @param  {Collection of plans} planSet
 * @return {Boolean}
 */
ResourceManager.prototype.canSatisfySources = function(planSet) {
    var sourceRequests = requestedSources(planSet);
    return canSatisfySingleUseResource(this.availableResources.sources, sourceRequests);
};

/**
 * Returns true iff this ResourceManager can provide all the spawns requested by
 * the planSet.
 * @param  {Collection of plans} planSet
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
    var availableResources = _.clone(singleUseResources);
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
 * @param  {Collection of plans} planSet
 * @return {Boolean}
 */
ResourceManager.prototype.canSatisfyEnergy = function(planSet) {
    return requestedEnergy(planSet) <= this.availableResources.energy;
};

var computePlanSetImportance = function(planSet) {
    return _.reduce(planSet, function(valueSum, plan) {
        return valueSum + plan.importance;
    }, 0);
};

var requestedCreeps = function(planSet) {
    return _(planSet).map('resourceBundle.creeps').flatten();
};

var requestedSources = function(planSet) {
    return _(planSet).map('resourceBundle.sources').flatten();
};

var requestedSpawns = function(planSet) {
    return _(planSet).map('resourceBundle.spawns').flatten();
};

var requestedEnergy = function(planSet) {
    return _.reduce(planSet, function(energySum, plan) {
        return energySum + plan.resourceBundle.energy;
    }, 0);
}