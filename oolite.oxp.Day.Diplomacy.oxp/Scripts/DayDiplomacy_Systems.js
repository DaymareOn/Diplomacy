"use strict";
this.name = "DayDiplomacy_010_Systems";
this.author = "David (Day) Pradier";
this.copyright = "(C) 2017 David Pradier";
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script creates systems.";

var __DayDiplomacy_Systems_Script = this;
this.__DayDiplomacy_Systems_systemsByGalaxyAndSystem = {};

// We set the observers. No need to use an initAction as there won't be any more system.
this.__DayDiplomacy_Systems_setObservers = function (aGalaxyNb) {
    var api = worldScripts.DayDiplomacy_002_EngineAPI.__DayDiplomacy_EngineAPI_methods;

    var actorsByType = api.getActorsIdByType("SYSTEM");
    var actors = api.getActors();

    var knownObservers = api.getObservers(actors[actorsByType[0]], "SYSTEM");
    if (knownObservers && knownObservers.length > 0) {
        return; // Already initialized
    }

    var sys = __DayDiplomacy_Systems_Script.__DayDiplomacy_Systems_systemsByGalaxyAndSystem;
    for (var i = 0, z=actorsByType.length; i < z; i++) {
        var thisActor = actors[actorsByType[i]];
        if (thisActor.State.galaxyNb === aGalaxyNb) {
            var observers = System.infoForSystem(thisActor.State.galaxyNb, thisActor.State.systemId).systemsInRange();
            for (var k = 0, y=observers.length; k < y; k++) {
                api.addObserverToActor(sys[observers[k].galaxyID][observers[k].systemID], "SYSTEM", thisActor);
            }
        }
    }
};

this.startUp = function () {
    var api = worldScripts.DayDiplomacy_002_EngineAPI.__DayDiplomacy_EngineAPI_methods;

    // Not initializing if already done.
    if (api.getActorTypes().indexOf("SYSTEM") != -1) {
        return;
    }
    api.addActorType("SYSTEM", 0);

    // We initiate the systems: id = G(galaxy number).(system number). Ex : "G2.23"
    var sys = __DayDiplomacy_Systems_Script.__DayDiplomacy_Systems_systemsByGalaxyAndSystem;
    for (var i = 0; i < 8; i++) {
        for (var j = 0; j < 256; j++) {
            var aSystem = api.buildActor("SYSTEM", api.buildNewActorId());
            api.setField(aSystem, "galaxyNb", i);
            api.setField(aSystem, "systemId", j);
            api.addActor(aSystem);

            sys[i] || (sys[i] = {});
            sys[i][j] = aSystem.State.id; // Needed for quick access in the next part.
        }
    }

    // We init the observers for the current galaxy
    __DayDiplomacy_Systems_Script.__DayDiplomacy_Systems_setObservers(system.info.galaxyID);
};

// This is necessary as we can't calculate distances in other galaxies.
this.playerEnteredNewGalaxy = function (galaxyNumber) {
    __DayDiplomacy_Systems_Script.__DayDiplomacy_Systems_setObservers(galaxyNumber);
};