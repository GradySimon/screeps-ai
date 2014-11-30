var _ = require('lodash');
var utils = require('utils');
var behaviors = require('behaviors');

var MAX_HARVESTERS_PER_SOURCE = 4;


function ResourceSpec(creeps, sources, spawns, energy) {
    this.creeps = creeps;
    // TODO: only allows an Objective to take a whole source or none of it.
    this.sources = sources;
    this.spawns = spawns;
    this.energy = energy;
}

function Plan(resourceSpec, policy) {
    this.resourceSpec = resourceSpec;
    this.policy = policy;
}

// ---- The Growth Objective ----

module.exports.GrowthObjective = function(room) {
    this.room = room;
    this.harvesterSelector = {
        rooms: [room],
        creepSpecs: [utils.creepSpecs.Harvester]
    };
};

module.exports.GrowthObjective.prototype.generatePlan = function() {
    var harvesters = utils.selectCreeps(this.harvesterSelector);
    var sources = this.room.find(Game.SOURCES);
    var sourceToCreepAssignments = new Map(_.map(sources, function(source) { 
        return [source, []]; 
    }));
    _.forEach(harvesters, function(harvester) {
        var sortedSources = utils.sortByDistanceFrom(harvester, sources);
        _.forEach(sortedSources, function(source) {
            var currentAssignments = sourceToCreepAssignments.get(source);
            if (currentAssignments.length < MAX_HARVESTERS_PER_SOURCE) {
                currentAssignments.push(harvester);
                sourceToCreepAssignments.set(source, currentAssignments);
                return false;
            }
        });
    });
    var creepToSourceAssignments = new Map();
    for (var assignment of sourceToCreepAssignments.entries()) {
        var source = assignment[0];
        var assignedHarvesters = assignment[1];
        _.forEach(assignedHarvesters, function (harvester) {
            creepToSourceAssignments.set(harvester, source);
        });
    }
    var numCreepsRequested = creepToSourceAssignments.size;
    var creepsRequested = utils.keyArray(creepToSourceAssignments);
    var sourcesRequested = utils.keyArray(sourceToCreepAssignments);
    var harvesterDeficit = sources.length * MAX_HARVESTERS_PER_SOURCE
                           - numCreepsRequested;
    var spawnsRequested = [];
    if (harvesterDeficit > 0) {
        // TODO: request more spawns if harvesterDeficit > 1;
        spawnsRequested = [this.room.find(Game.MY_SPAWNS)[0]];
    }
    var resourceSpec = new ResourceSpec(creepsRequested, sourcesRequested, spawnsRequested);
    var policy = function() {
        _.forEach(creepsRequested, function(creep) {
            var assignedSource = creepToSourceAssignments.get(creep);
            behaviors.workerHarvestBehaviorGen(assignedSource)(creep);
        });
        _.forEach(spawnsRequested, function(spawn) {
            behaviors.spawnCreateCreepBehaviorGen(utils.creepSpecs.Harvester)(spawn);
        });
    };
    return new Plan(resourceSpec, policy);
};
