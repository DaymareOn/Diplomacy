"use strict";
this.name = "DayDiplomacy_010_Systems";
this.author = "David (Day) Pradier";
// noinspection JSUnusedGlobalSymbols Used by Oolite itself
this.copyright = "(C) 2017 David Pradier";
// noinspection JSUnusedGlobalSymbols Used by Oolite itself
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script creates systems.";

/**
 * An object identifying a planetary system
 * @typedef {Object} PlanetarySystem
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
 * @returns {Object} a dictionary with {int} galaxyId key and as value: a dictionary with {int} systemId key and as value: the corresponding {@link ActorId}
 * @lends worldScripts.DayDiplomacy_010_Systems.$getSystemsActorIdsByGalaxyAndSystemId
 */
this.$getSystemsActorIdsByGalaxyAndSystemId = function() {
    return this._systemsByGalaxyAndSystemId;
};
/**
 * For the current galaxy only
 * @returns {Object} a dictionary with {int} systemId key and as value: the corresponding {@link ActorId}
 * @lends worldScripts.DayDiplomacy_010_Systems.$getCurrentGalaxySystemsActorIdsBySystemsId
 */
this.$getCurrentGalaxySystemsActorIdsBySystemsId = function() {
    return this._systemsByGalaxyAndSystemId[system.info.galaxyID];
};

/* ************************** OXP private functions *******************************************************/

/**
 * @param {int} aGalaxyNb
 * @private
 */
this._setObservers = function (aGalaxyNb) {
    // We set the observers. No need to use an initAction as there won't be any more system.
    var engine = this._Engine;
    var actorsIdByType = engine.$getActorsIdByType("SYSTEM");
    var actors = engine.$getActors();

    var galaxyFirstSystem = actors[actorsIdByType[255 + 256 * (7 - aGalaxyNb)]];
    var galaxyLastSystem = actors[actorsIdByType[256 * (7 - aGalaxyNb)]];
    var firstSystemKnownObservers = engine.$getObservers(galaxyFirstSystem, "SYSTEM");
    var lastSystemKnownObservers = engine.$getObservers(galaxyLastSystem, "SYSTEM");
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
                engine.$addObserverToActor(thisActor, "SYSTEM", sys[observer.galaxyID][observer.systemID]);
            }
        }
    }
};

this._startUp = function () {
    var engine = this._Engine = worldScripts.DayDiplomacy_000_Engine;
    var sys = this._systemsByGalaxyAndSystemId = engine.$initAndReturnSavedData("systemsByGalaxyAndSystemId", {});

    // Not initializing if already done.
    if (engine.$getActorTypes().indexOf("SYSTEM") !== -1) {
        return;
    }
    engine.$addActorType("SYSTEM", 0);

    // We initiate the systems
    var i = 8;
    while (i--) {
        var j = 256;
        while (j--) {
            var id = engine.$getNewActorId();
            var aSystem = engine.$buildActor("SYSTEM", id);
            // FIXME why do I use setField here rather than directly 'aSystem.galaxyNb = '?
            engine.$setField(aSystem, "galaxyNb", i);
            engine.$setField(aSystem, "systemId", j);
            engine.$addActor(aSystem);
            (sys[i] || (sys[i] = {}))[j] = id; // Needed for quick access in the next part.
        }
    }

    // We init the observers for the current galaxy
    this._setObservers(system.info.galaxyID);
    delete this._startUp; // No need to startup twice
};

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