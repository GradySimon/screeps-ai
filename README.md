# Screeps-AI

This repository contains my [Screeps](http://screeps.com/) code.

## How it works

At the top level, every tick, each `Objective` generates a `Plan`, specifying what it would like to do and what resources it needs to use. One `Objective` is the `GrowthObjective`, which generates plans that result in more energy being amassed and more harvesters created.

All of the `Plan`s that the objectives generate are then passed to the `ResourceManager`, which chooses sets of plans that will actually be executed by taking into account the resource requirements and relative importance of each plan.

Objectives can set the policy of a `Plan`, which is just a function that will be executed if the plan is accepted by the resource manager. Policy functions can do anything functions can do, but they tend to be comprised of calling `Behavior`s on creeps and spawns. A `Behavior` is a function that directs the behavior of individual resources.