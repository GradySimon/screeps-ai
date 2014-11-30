/* global require */
var _ = require('lodash');
var utils = require('utils');
var objectives = require('objectives');
var resources = require('resources');

var myRooms = utils.allMyRooms();

var objectiveList = _.flatten([
    _.map(myRooms, function(room) { return new objectives.GrowthObjective(room); }),
]);

var plans = _.map(objectiveList, function(objective) { return objective.generatePlan(); });

var evaluatedPlans = resources.arbitrate(plans);

var acceptedPlans = evaluatedPlans.accepted;
var rejectedPlans = evaluatedPlans.rejected;

_.forEach(acceptedPlans, function(plan) { plan.policy(); });
