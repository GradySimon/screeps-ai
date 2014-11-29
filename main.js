var _ = require('lodash');
var utils = require('utils');


var creeps = Game.creeps;
var spawns = Game.spawns;

var spawnCreateHarvesterBehavior = spawnCreateCreepBehaviorGen(utils.creepSpecs.Harvester);

_.forEach(creeps, workerHarvestBehavior);
_.forEach(spawns, spawnCreateHarvesterBehavior);
