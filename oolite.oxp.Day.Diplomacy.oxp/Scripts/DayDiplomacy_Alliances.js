"use strict";
this.name = "DayDiplomacy_030_Alliances";
this.author = "David (Day) Pradier";
this.copyright = "(C) 2017 David Pradier";
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script makes systems ally to each other.";

this._startUp = function () {
    delete this._startUp; // No need to startup twice
};

this.startUp = function() {
    worldScripts.DayDiplomacy_000_Engine.$subscribe(this.name);
    delete this.startUp; // No need to startup twice
};