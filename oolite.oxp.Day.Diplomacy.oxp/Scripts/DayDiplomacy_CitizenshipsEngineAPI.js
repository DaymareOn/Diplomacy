"use strict";
this.name = "DayDiplomacy_062_CitizenshipsEngineAPI";
this.author = "Loic Coissard";
this.copyright = "(C) 2019 Loic Coissard";
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script is the citizenships API.";

/*************************** OXP public functions ********************************************************/
/*
	@param galaxyID: int ; Identifies the galaxy of the wanted system
	@param systemID: int ; Identifies the wanted system in the given galaxy
	@return: String ; Return the system name of the system defined by the give galaxyId and systemId
*/
this.$retrieveNameFromSystem = function(galaxyID, systemID){
    return this._capi._retrieveNameFromSystem(galaxyID, systemID);
};

/*
    @param: citizenships: citizenships; an object which the galaxyID and systemID are identify with the system name
    @return: String; display containing citizenships
 */
this.$buildCitizenshipsString = function (citizenships) {
    return this._capi.$buildCitizenshipsString(citizenships);
};

/*
    @Description: subscribes the script which name is given as argument to be called when the player citizenships are updated
    the script must implement the function this.$playerCitizenshipsUpdated = function(citizenships) {}
    citizenships is a list of citizenship: [{systemName:{'galaxyID':int, 'systemID':int}}, ...]
    @param scriptname: String ; the script name property
*/
this.$subscribeToPlayerCitizenshipsUpdates = function (scriptname) {
    this._capi.$subscribeToPlayerCitizenshipsUpdates(scriptname);
};
/*************************** End OXP public functions ****************************************************/

/*************************** Oolite events ***************************************************************/
this._startUp = function () {
    this._capi = worldScripts.DayDiplomacy_060_CitizenshipsEngine;
    delete this._startUp;
};

this.startUp = function () {
    worldScripts.DayDiplomacy_000_Engine.$subscribe(this.name);
    delete this.startUp; // No need to startup twice
};
/*************************** End Oolite events ***********************************************************/