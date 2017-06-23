"use strict";
this.name = "DayDiplomacy_042_AlliancesEngineAPI";
this.author = "David (Day) Pradier";
this.copyright = "(C) 2017 David Pradier";
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script is the Diplomacy Alliances engine API for external scripts.";

/*************************** OXP public functions ********************************************************/
this.$getScoringFunctions = function () {
    return this._ae.$getScoringFunctions();
};
this.$addScoringFunction = function (keyword, f, position) {
    this._ae.$addScoringFunction(keyword, f, position);
};
this.$recalculateScores = function (observedActor, observerActor) {
    this._ae.$recalculateScores(observedActor, observerActor);
};
this.$getAlliances = function() {
    return this._ae._a;
};
this.$getScores = function() {
    return this._ae._as;
};
this.$setAllianceThreshold = function(threshold) {
    this._ae.$setAllianceThreshold(threshold);
};
this.$getAllianceThreshold = function() {
    return this._s.State.allianceThreshold;
};
/*************************** End OXP public functions ****************************************************/

/*************************** Oolite events ***************************************************************/
this._startUp = function () {
    this._ae = worldScripts.DayDiplomacy_040_AlliancesEngine;
    delete this._startUp; // No need to startup twice
};
this.startUp = function () {
    this._s = worldScripts.DayDiplomacy_000_Engine;
    this._s.$subscribe(this.name);
    delete this.startUp; // No need to startup twice
};
/*************************** End Oolite events ***********************************************************/