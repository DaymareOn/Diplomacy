"use strict";
this.name = "DayDiplomacy_010_Systems";
this.author = "David (Day) Pradier";
this.copyright = "(C) 2017 David Pradier";
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script creates systems.";

/**
 * An object identifying a planetary system
 * @typedef {Object} planetarySystem
 * @property {int} galaxyID - the galaxyID of the system
 * @property {int} systemID - the systemID of the system
 * @property {string} name - the name of the system
 */

/* ************************** OXP public functions *******************************************************/

/**
 * @name $retrieveNameFromSystem
 * @param {int} galaxyID - Identifies the galaxy of the wanted system
 * @param {int} systemID - Identifies the wanted system in the given galaxy
 * @returns {String} - Returns the system name of the system defined by the given galaxyId and systemId
 * @lends worldScripts.DayDiplomacy_010_Systems.$retrieveNameFromSystem
 */
this.$retrieveNameFromSystem = function (galaxyID, systemID) {
    return this._Engine.$getActors()[this._systemsByGalaxyAndSystemId[galaxyID][systemID]].name;
};

/**
 * @name $getSystemsActorIdsByGalaxyAndSystemId
 * @returns {Object} a dictionary with {int} galaxyId key and as value: a dictionary with {int} systemId key and as value: the corresponding {string} ActorId
 * @lends worldScripts.DayDiplomacy_010_Systems.$getSystemsActorIdsByGalaxyAndSystemId
 */
this.$getSystemsActorIdsByGalaxyAndSystemId = function() {
    return this._systemsByGalaxyAndSystemId;
};
/**
 *
 * @returns {*}
 * @lends worldScripts.DayDiplomacy_010_Systems.$getCurrentGalaxySystemsActorIdsBySystemsId
 */
this.$getCurrentGalaxySystemsActorIdsBySystemsId = function() {
    return this._systemsByGalaxyAndSystemId[system.info.galaxyID];
};
/* ************************** End OXP public functions ****************************************************/

/* ************************** OXP private functions *******************************************************/
/**
 * @param {int} aGalaxyNb
 * @private
 */
this._setObservers = function (aGalaxyNb) {
    // We set the observers. No need to use an initAction as there won't be any more system.
    var api = this._Engine;
    var actorsIdByType = api.$getActorsIdByType("SYSTEM");
    var actors = api.$getActors();

    var galaxyFirstSystem = actors[actorsIdByType[255 + 256 * (7 - aGalaxyNb)]];
    var galaxyLastSystem = actors[actorsIdByType[256 * (7 - aGalaxyNb)]];
    var firstSystemKnownObservers = api.$getObservers(galaxyFirstSystem, "SYSTEM");
    var lastSystemKnownObservers = api.$getObservers(galaxyLastSystem, "SYSTEM");
    if (firstSystemKnownObservers && firstSystemKnownObservers.length && lastSystemKnownObservers.length) {
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
    var api = this._Engine = worldScripts.DayDiplomacy_002_EngineAPI,
        sys = this._systemsByGalaxyAndSystemId = api.$initAndReturnSavedData("systemsByGalaxyAndSystemId", {});

    // Not initializing if already done.
    if (api.$getActorTypes().indexOf("SYSTEM") !== -1) {
        return;
    }
    api.$addActorType("SYSTEM", 0);

    // We initiate the systems
    var i = 8;
    while (i--) {
        var j = 256;
        while (j--) {
            var id = api.$buildNewActorId();
            var aSystem = api.$buildActor("SYSTEM", id);
            // FIXME why do I use setField here rather than directly 'aSystem.galaxyNb = '?
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
/* ************************** End OXP private functions ***************************************************/

/* ************************** Oolite events ***************************************************************/

// noinspection JSUnusedGlobalSymbols - Called by Oolite itself
this.playerEnteredNewGalaxy = function (galaxyNumber) {
    // This function is necessary as we can't calculate distances in other galaxies.
    this._setObservers(galaxyNumber);
};
this.startUp = function () {
    worldScripts.DayDiplomacy_000_Engine.$subscribe(this.name);
    delete this.startUp; // No need to startup twice
};
/* ************************** End Oolite events ***********************************************************/