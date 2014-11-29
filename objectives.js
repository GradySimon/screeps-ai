var _ = require('lodash');
var utils = require('utils');


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

function GrowthObjective(room) {
    this.room = room;
    this.harvesterSelector = {
        rooms: [room],
        creepSpecs: [utils.creepSpecs.Harvester]
    };
}

GrowthObjective.prototype.generatePlan = function() {
    var harvesters = utils.selectCreeps(this.harvesterSelector);
    var sources = room.find(Game.SOURCES);
    var sourceToCreepAssignments = new Map(_.forEach(source, function(source) { 
        return [source, []]; 
    }));
    _.forEach(harvesters, function(harvester) {
        var sortedSources = utils.sortByDistanceFrom(harvester, sources);
        _.forEach(sortedSources, function() {
            var currentAssignments = sourceToCreepAssignments.get(source);
            if (currentAssignments.length < MAX_HARVESTERS_PER_SOURCE) {
                currentAssignments.push(harvester);
                return false;
            }
        });
    });
    var creepToSourceAssignments = new Map();
    _.forEach(sourceToCreepAssignments, function(kvPair) {
        var source = kvPair[0];
        var harvesters = kvPain[1];
        _.forEach(harvesters, function (harvester) {
            creepToSourceAssignments.set(harvester, source);
        });
    });
    var creepsRequested = creepToSourceAssignments.keys();
    var sourcesRequested = sourceToCreepAssignments.keys();
    var harvesterDeficit = sourcesRequested * MAX_HARVESTERS_PER_SOURCE
                           - creepsRequested;
    var spawnsRequested = [];
    if (harvesterDeficit > 0) {
        spawnsRequested = [room.find(Game.MY_SPAWNS)[0]];
    }
    var resourceSpec = new ResourceSpec(creepsRequested, sourcesRequested, spawnsRequested);
    var policy = function() {
        _.forEach(creepsRequested, function(creep) {
            assignedSource = creepToSourceAssignments.get(creep);
            behaviors.workerHarvestBehaviorGen(assignedSource)(creep);
        });
        _.forEach(spawnsRequested, function(spawn) {
            behaviors.spawnCreateCreepBehaviorGen(utils.creepSpecs.Harvester)(spawn);
        });
    };
    return new Plan(resourceSpec, policy);
};



