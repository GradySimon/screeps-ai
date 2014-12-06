/* global Game, require, module */

/* TODO: Make it possible for Objectives to generate multiple plans 
 * This way plans can be atomic units of work that it makes sense to do
 * regardless of whether any other plan executes. This way the ResourceManager
 * can do a better job of maximizing importance over the possible planSets.
 */

/*
 * TODO: Add a method to objectives that allow them to broadcast messages that other
 * objectives can read to help them make decisions.
 */

/*
 * TODO: Make objectives use a recursive "planner" structure. Planners also
 * implement generatePlan. As you move down the planning hierarchy, plans get
 * less strategic and more tactical.
 */

var _ = require('lodash');
var utils = require('utils');
var behaviors = require('behaviors');
var resources = require('resources');

var MAX_HARVESTERS_PER_SOURCE = 4;


function Plan(objective, importance, resourceBundle, policy) {
    this.objective = objective;
    this.importance = importance;
    this.resourceBundle = resourceBundle;
    this.policy = policy;
}

//////////////////////////
// The Growth Objective //
//////////////////////////

/**
 * Represents the objective of growth. Generates plans that will emphasize
 * harvesting energy and creating more harvester creeps.
 * @constructor
 * @param {Room} The room that this GrowthObjective should operate in.
 */
var GrowthObjective = module.exports.GrowthObjective = function(room) {
    this.room = room;
    this.harvesterSelector = {
        rooms: [room],
        creepSpecs: [utils.creepSpecs.Harvester]
    };
};

/**
 * Generates a plan that will assign creeps to harvest from all available
 * sources and will create new creeps if necessary to harvest best.
 * @return {Plan}
 */
GrowthObjective.prototype.generatePlan = function(importance) {
    var harvesters = utils.selectCreeps(this.harvesterSelector);
    var sources = this.room.find(Game.SOURCES);
    var assignments = this.getAssignments(harvesters, sources);
    var creepsRequested = assignments.creepsUsed;
    var sourcesRequested = assignments.sourcesUsed;
    var spawnsRequested = this.getSpawnsRequested(sources, harvesters);
    var resourcesRequired = new resources.ResourceBundle(creepsRequested, sourcesRequested, spawnsRequested, 0);
    var policy = function() {
        _.forEach(creepsRequested, function(creep) {
            var assignedSource = assignments.creepToSource.get(creep);
            behaviors.workerHarvestBehaviorGen(assignedSource)(creep);
        });
        _.forEach(spawnsRequested, function(spawn) {
            behaviors.spawnCreateCreepBehaviorGen(utils.creepSpecs.Harvester)(spawn);
        });
    };
    return new Plan(this, importance, resourcesRequired, policy);
};

/**
 * Returns a Map of the form (source -> list of creeps) representing a proposal
 * for how to assign harvesters to sources.
 * @param  {Collection of creeps} harvesters Available harvesters
 * @param  {Collection of sources} sources Available sources
 * @return {Object} An object of the form {sourcesUsed: Array, creepsUsed:
 * Array, sourcesToCreeps: Map, creepToSource: Map}
 */
GrowthObjective.prototype.getAssignments = function(harvesters, sources) {
    var sourceToCreepsMap = new Map(_.map(sources, function(source) { 
        return [source, []]; 
    }));
    var creepToSourceMap = new Map();
    _.forEach(harvesters, function(harvester) {
        var sortedSources = utils.sortByDistanceFrom(harvester, sources);
        _.forEach(sortedSources, function(source) {
            var roster = sourceToCreepsMap.get(source);
            // TODO: use smarter maxHarvesters logic that takes into account
            // the terrain at the source.
            if (roster.length < MAX_HARVESTERS_PER_SOURCE) {
                roster.push(harvester);
                sourceToCreepsMap.set(source, roster);
                creepToSourceMap.set(harvester, source);
                return false; // break the _.forEach loop
            }
        });
    });
    return {
        sourcesUsed: utils.keyArray(sourceToCreepsMap),
        creepsUsed: utils.keyArray(creepToSourceMap),
        sourceToCreeps: sourceToCreepsMap,
        creepToSource: creepToSourceMap
    };
};

/**
 * Chooses spawns to create new harvesters from, if necessary
 * @param  {Collection of sources} accessibleSources
 * @param  {Collection of creeps} accessibleHarvesters
 * @return {Array of spawns} An array of spawns that should create harvesters
 */
GrowthObjective.prototype.getSpawnsRequested = function(accessibleSources, accessibleHarvesters) {
    var spawnsRequested = [];
    if (harvesterDeficit(accessibleSources.length, accessibleHarvesters.length) > 0) {
        // TODO: request more spawns if harvesterDeficit > 1;
        spawnsRequested = [this.room.find(Game.MY_SPAWNS)[0]];
    }
    return spawnsRequested;
};

/**
 * Calculates how many additional harvesters the room needs to harvest
 * most effectively.
 * @param  {number} numSources
 * @param  {number} numHarvesters
 * @return {number}
 */
function harvesterDeficit(numSources, numHarvesters) {
    return numSources * MAX_HARVESTERS_PER_SOURCE - numHarvesters;
}
