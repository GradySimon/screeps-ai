/* global require */
var _ = require('lodash');
var utils = require('utils');
var objectives = require('objectives');
var resources = require('resources');
var myRooms = utils.allMyRooms();
// TODO: Refactor so that cross-room plans can work.
_.forEach(myRooms, function(room) {
    var allResourcesInRoom = resources.resourcesInRoom(room);
    var resourceManager = new resources.ResourceManager(allResourcesInRoom);

    var activeObjectives = [
        new objectives.GrowthObjective(room)
    ];
    var acceptedPlans = [];

    do {
        var candidatePlans = _.map(activeObjectives, function(objective) {
            return objective.generatePlan(100); // TODO: real importance value
        });
        var arbitrationResults = resourceManager.arbitrate(candidatePlans);
        acceptedPlans = _.union(acceptedPlans, arbitrationResults.accepted);
        resourceManager.commit(arbitrationResults.accepted);
        activeObjectives = _.map(arbitrationResults.rejected, 'objective');
    } while(activeObjectives > 0);

    _.forEach(acceptedPlans, function(acceptedPlan) { acceptedPlan.policy(); });
});
