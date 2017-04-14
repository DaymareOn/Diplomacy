"use strict";
this.name = "DayDiplomacy_010_Systems";
this.author = "David (Day) Pradier";
this.copyright = "(C) 2017 David Pradier";
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script creates systems.";

var initStart = new Date();
this._systemsByGalaxyAndSystemId = {};

// We set the observers. No need to use an initAction as there won't be any more system.
// Well... there are some oxps for this, aren't there?
this._setObservers = function (aGalaxyNb) {
    var api = this._api;
    var actorsByType = api.$getActorsIdByType("SYSTEM");
    var actors = api.$getActors();

    // FIXME order of initialization, maybe we could test by checking if the last actor is initialized?
    var knownObservers = api.$getObservers(actors[actorsByType[0]], "SYSTEM");
    if (knownObservers && knownObservers.length) {
        return; // Already initialized
    }

    var infoForSystem = System.infoForSystem, sys = this._systemsByGalaxyAndSystemId, z = actorsByType.length;
    while (z--) {
        var thisActor = actors[actorsByType[z]];
        var thisActorState = thisActor.State;
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

this._startUp = function () {
    var initStart = new Date();
    this._api = worldScripts.DayDiplomacy_002_EngineAPI;
    var api = this._api;

    // Not initializing if already done.
    if (api.$getActorTypes().indexOf("SYSTEM") != -1) {
        return;
    }
    api.$addActorType("SYSTEM", 0);

    // We initiate the systems
    var sys = this._systemsByGalaxyAndSystemId, i = 8;
    while (i--) {
        var j = 256;
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
    // this._setObservers(system.info.galaxyID);
    var initEnd = new Date();
    log("DiplomacySystems", "startUp in ms: " + (initEnd.getTime() - initStart.getTime()));
    delete this._startUp; // No need to startup twice
};
// This is necessary as we can't calculate distances in other galaxies.
this.playerEnteredNewGalaxy = function (galaxyNumber) {
    // this._setObservers(galaxyNumber);
};

this.startUp = function() {
    worldScripts.DayDiplomacy_000_Engine.$subscribe(this.name);
    delete this.startUp; // No need to startup twice
};

var initEnd = new Date();
log("DiplomacySystems", "Initialized in ms: " + (initEnd.getTime() - initStart.getTime()));