"use strict";
this.name = "DayDiplomacy_020_History";
this.author = "David (Day) Pradier";
// noinspection JSUnusedGlobalSymbols Used by Oolite itself
this.copyright = "(C) 2017 David Pradier";
// noinspection JSUnusedGlobalSymbols Used by Oolite itself
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script displays an Interface showing the F7 system history.";

this._displayF4Interface = function () {
    player.ship.hudHidden || (player.ship.hudHidden = true);
    // for each event in history for this system, we add a line
    var ourMessage = "", f = this._F, eff = this._eff,
        ourEventsIds = this._EngineAPI.$getActorEvents(this._selectedSystemActorId), events = this._EngineAPI.$getEvents(),
        y = ourEventsIds.length, _clock = clock;
    while (y--) {
        // Anti-chronological order
        var thatEvent = events[ourEventsIds[y]];
        ourMessage += _clock.clockStringForTime(thatEvent.date) + ": " + f[eff[thatEvent.eventType]](thatEvent)+"\n";
    }
    var opts = {
        screenID: "DiplomacyHistoryScreenId",
        title: "System history",
        allowInterrupt: true,
        exitScreen: "GUI_SCREEN_INTERFACES",
        message: ourMessage
    };
    mission.runScreen(opts);
};
this._initF4Interface = function () {
    player.ship.dockedStation.setInterface("DiplomacyHistory",
        {
            title: "System history",
            category: "Diplomacy",
            summary: "All the notable events in the system history",
            callback: this._displayF4Interface.bind(this)
        });
};

/* ************************** OXP public functions ********************************************************/

/**
 * @param {EventType} eventType
 * @param {function} func
 * @lends worldScripts.DayDiplomacy_020_History.$setEventFormattingFunction
 */
this.$setEventFormattingFunction = function(eventType, func) {
    var engine = this._EngineAPI;
    var fid = engine.$getNewFunctionId();
    engine.$setFunction(fid, func);
    this._eff[eventType] = fid;
};

/* ************************** Oolite events ***************************************************************/

this.infoSystemChanged = function (currentSystemId, previousSystemId) {
    this._selectedSystemActorId = this._Systems.$getCurrentGalaxySystemsActorIdsBySystemsId()[currentSystemId];
};
this.shipDockedWithStation = function (station) {
    this._initF4Interface();
};
this.missionScreenEnded = function () {
    player.ship.hudHidden = false;
};

this._startUp = function () {
    worldScripts.XenonUI && worldScripts.XenonUI.$addMissionScreenException("DiplomacyHistoryScreenId");
    worldScripts.XenonReduxUI && worldScripts.XenonReduxUI.$addMissionScreenException("DiplomacyHistoryScreenId");

    var engine = this._EngineAPI = worldScripts.DayDiplomacy_000_Engine;
    this._Systems = worldScripts.DayDiplomacy_010_Systems;
    this._F = engine.$getFunctions();
    this._selectedSystemActorId = this._Systems.$getCurrentGalaxySystemsActorIdsBySystemsId()[system.info.systemID]; // FIXME perfectperf?
    this._eff = engine.$initAndReturnSavedData("eventFormatingFunctionsIds", {}); // { eventType => functionId }

    this._initF4Interface();

    delete this._startUp; // No need to startup twice
};
this.startUp = function () {
    worldScripts.DayDiplomacy_000_Engine.$subscribe(this.name);
    delete this.startUp; // No need to startup twice
};