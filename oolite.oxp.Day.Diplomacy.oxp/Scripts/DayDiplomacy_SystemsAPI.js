"use strict";
this.name = "DayDiplomacy_012_SystemsAPI";
this.author = "David (Day) Pradier";
this.copyright = "(C) 2017 David Pradier";
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script creates systems.";

/*************************** OXP public functions ********************************************************/
this.$getSystemsActorIdsByGalaxyAndSystemId = function() {
    return this._systemsByGalaxyAndSystemId;
};
this.$getCurrentGalaxySystemsActorIdsBySystemsId = function() {
    // FIXME perfectperf have the current galaxy saved somewhere?
    return this._systemsByGalaxyAndSystemId[system.info.galaxyID];
};
/*************************** End OXP public functions ****************************************************/

/*************************** Oolite events ***************************************************************/
this._startUp = function () {
    var api = this._api = worldScripts.DayDiplomacy_002_EngineAPI;
    this._systemsByGalaxyAndSystemId = api.$initAndReturnSavedData("systemsByGalaxyAndSystemId", {});

    delete this._startUp; // No need to startup twice
};
this.startUp = function() {
    worldScripts.DayDiplomacy_000_Engine.$subscribe(this.name);
    delete this.startUp; // No need to startup twice
};
/*************************** End Oolite events ***********************************************************/