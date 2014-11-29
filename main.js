var _ = require('lodash');
var utils = require('utils');
var objectives = require('objectives');
var resources = require('resources')

var myRooms = utils.allMyRooms();

var objectives = _.flatten([
    _(myRooms).map(function(room) { return new GrowthObjective(room); }),
]);

var plans = _(objectives).map(function(objective) { return objective.generatePlan() });

var evaluatedPlans = resources.evaluate(plans);

var acceptedPlans = evaluatedPlans['accepted'];
var rejectedPlans = evaluatedPlans['rejected'];

_.forEach(acceptedPlans, function(plan) { plan.policy(); };
