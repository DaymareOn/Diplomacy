"use strict";
this.name = "DayDiplomacy_032_EconomyEngineAPI";
this.author = "David (Day) Pradier";
this.copyright = "(C) 2017 David Pradier";
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script is the economy engine API for external scripts.";

/* Credit monetary policy is such that the total number of credits in the Ooniverse is always the same.
   This is needed to avoid game imbalances leading to exploding monetary mass, or monetary mass converging to zero.
   This implies that the money cannot be produced, destroyed or counterfeited, which is a mystery in itself. */

this.$moveProductivityInPercentage = function(fromSystemActor, percentage) {
    // FIXME 0.13 TODO
};
this.$moveProductivityInCredits = function(fromSystemActor, creditsNb) {
    // FIXME 0.13 TODO
};
this.$moveProductivityToNeighborsInPercentage = function(fromSystemActor, percentage) {
    // FIXME 0.13 TODO
};
this.$moveProductivityToNeighborsInCredits = function(fromSystemActor, creditsNb) {
    // FIXME 0.13 TODO
};
this.$moveProductivityToNeighborsDependingOnDistanceInPercentage = function(fromSystemActor, percentage) {
    // FIXME 0.13 TODO
};
this.$moveProductivityToNeighborsDependingOnDistanceInCredits = function(fromSystemActor, creditsNb) {
    // FIXME 0.13 TODO
};

/*************************** Oolite events ***************************************************************/
this._startUp = function () {
    var api = worldScripts.DayDiplomacy_002_EngineAPI;
    delete this._startUp; // No need to startup twice
};
this.startUp = function() {
    worldScripts.DayDiplomacy_000_Engine.$subscribe(this.name);
    delete this.startUp; // No need to startup twice
};
/*************************** End Oolite events ***********************************************************/