"use strict";
this.name = "DayDiplomacy_080_Happener";
this.author = "David (Day) Pradier";
this.copyright = "(C) 2017 David Pradier";
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script scripts the Happener equipment, which lets the player advance History as if it had jumped. It is designed for debug.";

this.activated = function() {
    worldScripts.DayDiplomacy_000_Engine.shipExitedWitchspace();
};