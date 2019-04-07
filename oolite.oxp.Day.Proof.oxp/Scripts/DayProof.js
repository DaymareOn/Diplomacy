"use strict";

this.name = "DayProof";
this.author = "David Pradier";
// noinspection JSUnusedGlobalSymbols Used by Oolite itself
this.copyright = "(C) 2019 David Pradier";
// noinspection JSUnusedGlobalSymbols Used by Oolite itself
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script is a bug check.";

this._setStationsVisaRequirements = function () {
    var checker = function (ship) {
        if (!(ship instanceof PlayerShip)) { // Only for the player ship
            return true;
        }
        this.commsMessage("WARNING - This station is accessible only to citizens and visa holders, Commander.", player.ship);
        return false;
    };
    var ss = system.stations, z = ss.length;
    while (z--) {
        var station = ss[z];
        var ses = station.subEntities, y = ses.length;
        while (y--) {
            var se = ses[y];
            if (se.isDock) {
                se.script.acceptDockingRequestFrom = checker.bind(station);
                break;
            }
        }
    }
};

// noinspection JSUnusedGlobalSymbols Called by Oolite itself
this.shipExitedWitchspace = function () {
    this._setStationsVisaRequirements();
};

this.startUp = function () {
    this._setStationsVisaRequirements();
    delete this.startUp; // No need to startup twice
};