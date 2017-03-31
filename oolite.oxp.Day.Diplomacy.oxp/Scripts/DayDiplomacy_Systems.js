"use strict";
this.name = "DayDiplomacy_010_Systems";
this.author = "David (Day) Pradier";
this.copyright = "(C) 2017 David Pradier";
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script creates systems.";

this._systemsByGalaxyAndSystemId = {};

// We set the observers. No need to use an initAction as there won't be any more system.
// FIXME doing it through initAction would allow to disperse the load?
this._setObservers = function (aGalaxyNb) {
    var api = this.api;
    var actorsByType = api.$getActorsIdByType("SYSTEM");
    var actors = api.$getActors();

    // FIXME order of initialization, maybe we could test by checking if the last actor is initialized?
    var knownObservers = api.$getObservers(actors[actorsByType[0]], "SYSTEM");
    if (knownObservers && knownObservers.length) {
        return; // Already initialized
    }

    var infoForSystem = System.infoForSystem, sys = this._systemsByGalaxyAndSystemId, z = actorsByType.length;
    while (z--) {
        var thisActorState = actors[actorsByType[z]].State;
        if (thisActorState.galaxyNb == aGalaxyNb) {
            var observers = infoForSystem(aGalaxyNb, thisActorState.systemId).systemsInRange();
            var y = observers.length;
            while (y--) {
                var observer = observers[y];
                api.$addObserverToActor(sys[observer.galaxyID][observer.systemID], "SYSTEM", thisActor);
            }
        }
    }
};

this.startUp = function () {
    this.api = worldScripts.DayDiplomacy_002_EngineAPI;

    // Not initializing if already done.
    if (api.$getActorTypes().indexOf("SYSTEM") != -1) {
        return;
    }
    api.$addActorType("SYSTEM", 0);

    // We initiate the systems
    var sys = this._systemsByGalaxyAndSystemId, i = 8, j = 256;
    while (i--) {
        while (j--) {
            var id = api.$buildNewActorId();
            var aSystem = api.$buildActor("SYSTEM", id);
            api.$setField(aSystem, "galaxyNb", i);
            api.$setField(aSystem, "systemId", j);
            api.$addActor(aSystem);
            (sys[i] || (sys[i] = {}))[j] = id; // Needed for quick access in the next part.
        }
    }

    // We init the observers for the current galaxy
    this._setObservers(system.info.galaxyID);
};
// This is necessary as we can't calculate distances in other galaxies.
this.playerEnteredNewGalaxy = function (galaxyNumber) {
    this._setObservers(galaxyNumber);
};