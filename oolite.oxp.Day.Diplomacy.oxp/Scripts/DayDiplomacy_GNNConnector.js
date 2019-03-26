"use strict";
this.name = "DayDiplomacy_015_GNN";
this.author = "David (Day) Pradier";
// noinspection JSUnusedGlobalSymbols Used by Oolite itself
this.copyright = "(C) 2017 David Pradier";
// noinspection JSUnusedGlobalSymbols Used by Oolite itself
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script connects to the GNN OXP.";

/**
 *
 * @param message
 * @lends worldScripts.DayDiplomacy_015_GNN.$publishNews
 */
this.$publishNews = function (message) {
    var news = {ID:this.name, Message:message};
    var returnCode = worldScripts.GNN._insertNews(news);
    if (returnCode > 0) { // A prerequisite is wrong
        log("DayDiplomacy_015_GNN.$publishNews", "GNN ERROR: " + returnCode);
    } // else: everything is okay.
};

/**
 *
 * @param message
 * @lends worldScripts.DayDiplomacy_015_GNN.$publishNewsNow
 */
this.$publishNewsNow = function (message) {
    var news = {ID:this.name, Message:message};
    var returnBoolean = worldScripts.GNN._showScreen(news);
    if (!returnBoolean) { // A prerequisite is wrong
        log("DayDiplomacy_015_GNN.$publishNewsNow", "GNN ERROR");
    } // else: everything is okay.
};

/* ************************** Oolite events ***************************************************************/

this._startUp = function () {
    delete this._startUp; // No need to startup twice
};
this.startUp = function () {
    worldScripts.DayDiplomacy_000_Engine.$subscribe(this.name);
    delete this.startUp; // No need to startup twice
};