"use strict";
this.name = "DayDiplomacy_010_Systems";
this.author = "David (Day) Pradier";
this.copyright = "(C) 2017 David Pradier";
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script creates systems.";

var __DayDiplomacy_Systems_Script = this;
this.__DayDiplomacy_Systems_systemsByGalaxyAndSystem = {};

this.__DayDiplomacy_Systems_setObservers = function (aGalaxyNb) {
    var a = worldScripts["DayDiplomacy_000_Engine"].__DayDiplomacy_Engine_getDiplomacyEngine().getArbiter();

    // We set the observers. No need to use an initAction as there won't be any more system.
    var actors = a.State.actorsByType["SYSTEM"];

    if (a.State.actors[actors[0]].State.observers["SYSTEM"] && a.State.actors[actors[0]].State.observers["SYSTEM"].length > 0) {
        return; // Already initialized
    }

    var sys = __DayDiplomacy_Systems_Script.__DayDiplomacy_Systems_systemsByGalaxyAndSystem;
    for (var i = 0; i < actors.length; i++) {
        var thisActor = a.State.actors[actors[i]];
        var thisActorState = thisActor.State;
        if (thisActorState.galaxyNb === aGalaxyNb) {
            var observers = System.infoForSystem(thisActorState.galaxyNb, thisActorState.systemId).systemsInRange();
            for (var k = 0; k < observers.length; k++) {
                thisActor.addObserver(thisActor, "SYSTEM", sys[observers[k].galaxyID][observers[k].systemID]);
            }
        }
    }
};

this.startUp = function () {
    var ENGINE = worldScripts["DayDiplomacy_000_Engine"].__DayDiplomacy_Engine_getDiplomacyEngine();
    var a = ENGINE.getArbiter();

    // Not initializing if already done.
    if (a.State.actorTypes.indexOf("SYSTEM") != -1) {
        return;
    }

    a.addActorType(a, "SYSTEM", 0);


    // We initiate the systems: id = G(galaxy number).(system number). Ex : "G2.23"
    for (var i = 0; i < 8; i++) {
        for (var j = 0; j < 256; j++) {
            var aSystem = new ENGINE.Actor(ENGINE.DefaultActorState("SYSTEM", a.getNewActorId(a)));
            aSystem.State.galaxyNb = i;
            aSystem.State.systemId = j;
            aSystem.init(aSystem); // At the end of system construction
            a.addActor(a, aSystem);

            __DayDiplomacy_Systems_Script.__DayDiplomacy_Systems_systemsByGalaxyAndSystem[i] || (__DayDiplomacy_Systems_Script.__DayDiplomacy_Systems_systemsByGalaxyAndSystem[i] = {});
            __DayDiplomacy_Systems_Script.__DayDiplomacy_Systems_systemsByGalaxyAndSystem[i][j] = aSystem.State.id; // Needed for quick access in the next part.
            // FIXME 0.n: maybe we should init it every time? __DayDiplomacy_Systems_systemsByGalaxyAndSystem seems like a useful public map :) ?
        }
    }

    var currentGalaxy = system.info.galaxyID;
    __DayDiplomacy_Systems_Script.__DayDiplomacy_Systems_setObservers(currentGalaxy); // We init the observers for the current galaxy
};

// This is necessary as we can't calculate distances in other galaxies.
this.playerEnteredNewGalaxy = function (galaxyNumber) {
    // FIXME 0.n: __DayDiplomacy_Systems_systemsByGalaxyAndSystem must be reinit'ed
    __DayDiplomacy_Systems_Script.__DayDiplomacy_Systems_setObservers(galaxyNumber);
};