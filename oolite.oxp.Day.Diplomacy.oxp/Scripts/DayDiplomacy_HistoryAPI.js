"use strict";
this.name = "DayDiplomacy_022_HistoryAPI";
this.author = "David (Day) Pradier";
this.copyright = "(C) 2017 David Pradier";
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script is the Diplomacy History engine API for external scripts.";

/*************************** OXP public functions ********************************************************/
this.$setEventFormattingFunction = function(eventType, func){
    this._he.$setEventFormattingFunction(eventType, func);
};
/*************************** End OXP public functions ****************************************************/

/*************************** Oolite events ***************************************************************/
this._startUp = function () {
    this._he = worldScripts.DayDiplomacy_020_History;

    delete this._startUp; // No need to startup twice
};
this.startUp = function () {
    worldScripts.DayDiplomacy_000_Engine.$subscribe(this.name);
    delete this.startUp; // No need to startup twice
};
/*************************** End Oolite events ***********************************************************/