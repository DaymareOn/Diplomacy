"use strict";
this.name = "DayDiplomacy_010_Systems";
this.author = "David (Day) Pradier";
this.copyright = "(C) 2017 David Pradier";
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script creates systems.";

this._systemsByGalaxyAndSystemId = {};

// We set the observers. No need to use an initAction as there won't be any more system.
// Well... there are some oxps for this, aren't there?
this._setObservers = function (aGalaxyNb) {
    var api = this._api;
    var actorsIdByType = api.$getActorsIdByType("SYSTEM");
    var actors = api.$getActors();

    var galaxyFirstSystem = actors[actorsIdByType[255 + 256 * (7 - aGalaxyNb)]];
    var galaxyLastSystem = actors[actorsIdByType[256 * (7 - aGalaxyNb)]];
    var firstSystemknownObservers = api.$getObservers(galaxyFirstSystem, "SYSTEM");
    var lastSystemknownObservers = api.$getObservers(galaxyLastSystem, "SYSTEM");
    if (firstSystemknownObservers && firstSystemknownObservers.length && lastSystemknownObservers.length) {
        return; // Already initialized
    }

    var infoForSystem = System.infoForSystem, sys = this._systemsByGalaxyAndSystemId, z = actorsIdByType.length;
    while (z--) {
        var thisActor = actors[actorsIdByType[z]];
        if (thisActor.galaxyNb === aGalaxyNb && !thisActor.observers.length) {
            var observers = infoForSystem(aGalaxyNb, thisActor.systemId).systemsInRange();
            var y = observers.length;
            while (y--) {
                var observer = observers[y];
                api.$addObserverToActor(sys[observer.galaxyID][observer.systemID], "SYSTEM", thisActor);
            }
        }
    }
};
this._startUp = function () {
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
    this._setObservers(system.info.galaxyID);
    delete this._startUp; // No need to startup twice
};
// This is necessary as we can't calculate distances in other galaxies.
this.playerEnteredNewGalaxy = function (galaxyNumber) {
    this._setObservers(galaxyNumber);
};
this.startUp = function() {
    worldScripts.DayDiplomacy_000_Engine.$subscribe(this.name);
    delete this.startUp; // No need to startup twice
};