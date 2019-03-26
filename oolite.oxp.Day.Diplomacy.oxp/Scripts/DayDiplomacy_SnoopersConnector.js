"use strict";
this.name = "DayDiplomacy_015_Snoopers";
this.author = "David (Day) Pradier";
// noinspection JSUnusedGlobalSymbols Used by Oolite itself
this.copyright = "(C) 2017 David Pradier";
// noinspection JSUnusedGlobalSymbols Used by Oolite itself
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script connects to the Snoopers OXP.";

/**
 *
 * @param news
 * @lends worldScripts.DayDiplomacy_015_Snoopers.$publishNews
 */
this.$publishNews = function (news) {
    var returnCode = worldScripts.snoopers.insertNews(news);
    if (returnCode > 0 && returnCode !== 30) { // A prerequisite is wrong
        log("DayDiplomacy_015_Snoopers.$publishNews", "Snoopers ERROR: " + returnCode);
    } else if (returnCode < 0 || returnCode === 30) { // A buffer is full, we will resend the news later.
        worldScripts.DayDiplomacy_045_War._storedNews.push(news);
    } // else: everything is okay.
};

/* ************************** Snoopers events *************************************************************/

this.newsDisplayed = function (msg) {
    this._storedNews.length && this.$publishNews(this._storedNews.shift());
};

/* ************************** Oolite events ***************************************************************/

this.missionScreenOpportunity = function () {
    this._storedNews.length && this.$publishNews(this._storedNews.shift());
};

this._startUp = function () {
    this._storedNews = []; // No real need to save it // FIXME really??
    delete this._startUp; // No need to startup twice
};
this.startUp = function () {
    worldScripts.DayDiplomacy_000_Engine.$subscribe(this.name);
    delete this.startUp; // No need to startup twice
};