"use strict";
this.name = "DayDiplomacy_065_Citizenships";
this.author = "Loic Coissard";
this.copyright = "(C) 2019 Loic Coissard";
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script displays the citizenship.";

/*************************** OXP public functions ********************************************************/
this.$playerCitizenshipsUpdated = function (citizenships) {
    log("DayDiplomacy_062_CitizenshipsEngineAPI.$playerCitizenshipsUpdated", "new citizenships: "
        + this._capi.$buildCitizenshipsString(citizenships));
};
/*************************** End OXP public functions ****************************************************/

/*************************** Oolite events ***************************************************************/
this._startUp = function () {
    var capi = this._capi = worldScripts.DayDiplomacy_062_CitizenshipsEngineAPI;
    capi.$subscribeToPlayerCitizenshipsUpdates(this.name);
    delete this._startUp; // No need to startup twice
};

this.startUp = function () {
    worldScripts.DayDiplomacy_000_Engine.$subscribe(this.name);

    delete this.startUp; // No need to startup twice
};

this.startUpComplete=function(){
    var capi = this._capi = worldScripts.DayDiplomacy_062_CitizenshipsEngineAPI;
    var ships = system.allShips;
    var j = ships.length;
    while(j--){
        var shipCitizenships=capi.$retrieveNameFromSystem(system.info.galaxyID,ships[j].homeSystem);
        log("DayDiplomacyCitizenships.startupComplete","ship Citizenships"+shipCitizenships);
    }
    delete this.startUpComplete;
};
/*************************** End Oolite events ***********************************************************/