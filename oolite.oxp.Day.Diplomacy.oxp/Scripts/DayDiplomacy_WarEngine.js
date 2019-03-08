"use strict";
this.name = "DayDiplomacy_040_WarEngine";
this.author = "David (Day) Pradier";
this.copyright = "(C) 2017 David Pradier";
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script is the war engine of the Diplomacy OXP.";

/*************************** OXP public functions ********************************************************/
this.$getScoringFunctions = function () {
    return this._asf;
};
this.$addScoringFunction = function (keyword, f, position) {
    this._api.$setFunction(keyword, f);
    this._asf.splice(position, 0, keyword);
};
this.$recalculateScores = function (observedActor, observerActor) {
    var asf = this._asf, funcs = this._F, as = this._as;
    var observedId = observedActor.id, observerId = observerActor.id;
    var observedAs = as[observedId] || (as[observedId] = {});
    var score = observedAs[observerId] || (observedAs[observerId] = {});
    var finalScore = 0, z = asf.length, z0 = z - 1;
    while (z--) {
        var keyword = asf[z0 - z];
        var thatScore = funcs[keyword](observerActor, observedActor);
        score[keyword] = thatScore;
        finalScore += thatScore;
    }
    score.SCORE = finalScore;
};
this.$setAllianceThreshold = function (threshold) {
    this._F.warCouncilRecurrentAction.allianceThreshold = threshold;
    this._s._State.allianceThreshold = threshold;
};
this.$setWarThreshold = function (threshold) {
    this._F.warCouncilRecurrentAction.warThreshold = threshold;
    this._s._State.warThreshold = threshold;
};
this.$getAllianceThreshold = function() {
    return this._s._State.allianceThreshold;
};
this.$getWarThreshold = function() {
    return this._s._State.warThreshold;
};
this.$getAlliancesAndWars = function() {
    return this._a;
};
this.$getScores = function() {
    return this._as;
};

/*************************** End OXP public functions ****************************************************/

/*************************** OXP private functions *******************************************************/
this._ally = function (aSystem, anotherSystemId) {
    var a = this._a; // alliances and wars
    var aSystemId = aSystem.id;
    a[aSystemId] = a[aSystemId] || {};
    a[aSystemId][anotherSystemId] = 1; // Alliance
    a[anotherSystemId] = a[anotherSystemId] || {};
    a[anotherSystemId][aSystemId] = 1; // Alliance
    this._api.$makeActorEventKnownToUniverse(aSystemId, "ALLY", [anotherSystemId]);
    this._api.$makeActorEventKnownToUniverse(anotherSystemId, "ALLY", [aSystemId]);
    log("DiplomacyWarEngine", "Alliance between " + aSystemId + " and " + anotherSystemId);
};
this._breakAlliance = function (aSystem, anotherSystemId) {
    var a = this._a; // Alliances and wars
    var aSystemId = aSystem.id;
    a[aSystemId] && a[aSystemId] === 1 && (delete a[aSystemId][anotherSystemId]); // Breaking alliance
    a[anotherSystemId] && a[anotherSystemId] === 1 && (delete a[anotherSystemId][aSystemId]); // Breaking alliance
    this._api.$makeActorEventKnownToUniverse(aSystemId, "BREAK", [anotherSystemId]);
    this._api.$makeActorEventKnownToUniverse(anotherSystemId, "BREAK", [aSystemId]);
    log("DiplomacyWarEngine", "Alliance broken between " + aSystemId + " and " + anotherSystemId);
};
this._declareWar = function (aSystem, anotherSystemId) {
    var a = this._a; // Alliances and wars
    var aSystemId = aSystem.id;
    a[aSystemId] = a[aSystemId] || {};
    a[aSystemId][anotherSystemId] = -1; // War
    a[anotherSystemId] = a[anotherSystemId] || {};
    a[anotherSystemId][aSystemId] = -1; // War
    this._api.$makeActorEventKnownToUniverse(aSystemId, "WAR", [anotherSystemId]);
    this._api.$makeActorEventKnownToUniverse(anotherSystemId, "WAR", [aSystemId]);
    log("DiplomacyWarEngine", "War between " + aSystemId + " and " + anotherSystemId);
};
this._makePeace = function (aSystem, anotherSystemId) {
    var a = this._a; // Alliances and wars
    var aSystemId = aSystem.id;
    a[aSystemId] && a[aSystemId] === -1 && (delete a[aSystemId][anotherSystemId]); // Making peace
    a[anotherSystemId] && a[anotherSystemId] === -1 && (delete a[anotherSystemId][aSystemId]); // Making peace
    this._api.$makeActorEventKnownToUniverse(aSystemId, "PEACE", [anotherSystemId]);
    this._api.$makeActorEventKnownToUniverse(anotherSystemId, "PEACE", [aSystemId]);
    log("DiplomacyWarEngine", "Peace between " + aSystemId + " and " + anotherSystemId);
};
this._initAllyScore = function (api) {
    if (api.$getEventTypes().indexOf("ALLYSCORE") === -1) {
        api.$addEventType("ALLYSCORE", 1);
        // Function to calculate scores, here is the system for which scores are calculated
        var diplomacyAlliancesScoringRecurrentAction = function diplomacyAlliancesScoringRecurrentAction(aSystem) {
            // FIXME perfectfunc should be actor-agnostic
            var observersId = aSystem.observers["SYSTEM"];
            if (!observersId) {
                return; // There may be no observer yet.
            }
            var that = diplomacyAlliancesScoringRecurrentAction;
            var we = that.warEngine || (that.warEngine = worldScripts.DayDiplomacy_040_WarEngine);
            var api = that.api || (that.api = worldScripts.DayDiplomacy_002_EngineAPI);
            var actors = api.$getActors();
            var y = observersId.length;
            while (y--) {
                we.$recalculateScores(actors[observersId[y]], aSystem);
            }
        };
        var fid = "diplomacyAlliancesScoringRecurrentAction";
        api.$setFunction(fid, diplomacyAlliancesScoringRecurrentAction);
        api.$setRecurrentAction(api.$buildAction(api.$buildNewActionId(), "ALLYSCORE", "SYSTEM", fid));
    }
};
this._init = function (api, hapi) {
    if (api.$getEventTypes().indexOf("BREAK") !== -1) {
        return; // Already initialized
    }

    // Creating events
    api.$addEventType("WARCOUNCIL", 2);
    api.$addEventType("BREAK", 3);
    api.$addEventType("ALLY", 4);
    api.$addEventType("WAR", 5);
    api.$addEventType("PEACE", 6);

    // Managing history sentences
    hapi.$setEventFormattingFunction("BREAK", function breakEventFormattingFunction(breakEvent) {
        var f = breakEventFormattingFunction, api = f._api || (f._api = worldScripts.DayDiplomacy_002_EngineAPI);
        var actors = api.$getActors();
        return actors[breakEvent.actorId].name + " broke their alliance with " + actors[breakEvent.args[0]].name + ".";
    });
    hapi.$setEventFormattingFunction("ALLY", function allyEventFormattingFunction(allyEvent) {
        var f = allyEventFormattingFunction, api = f._api || (f._api = worldScripts.DayDiplomacy_002_EngineAPI);
        var actors = api.$getActors();
        return actors[allyEvent.actorId].name + " allied with " + actors[allyEvent.args[0]].name + ".";
    });
    hapi.$setEventFormattingFunction("WAR", function warEventFormattingFunction(warEvent) {
        var f = warEventFormattingFunction, api = f._api || (f._api = worldScripts.DayDiplomacy_002_EngineAPI);
        var actors = api.$getActors();
        return actors[warEvent.actorId].name + " declared war with " + actors[warEvent.args[0]].name + ".";
    });
    hapi.$setEventFormattingFunction("PEACE", function peaceEventFormattingFunction(peaceEvent) {
        var f = peaceEventFormattingFunction, api = f._api || (f._api = worldScripts.DayDiplomacy_002_EngineAPI);
        var actors = api.$getActors();
        return actors[peaceEvent.actorId].name + " made peace with " + actors[peaceEvent.args[0]].name + ".";
    });

    // Function to ally, break alliance, declare war or peace: here, aSystem is the system to which the action might be directed.
    var warCouncilRecurrentAction = function warCouncilRecurrentAction(aSystem) {
        var that = warCouncilRecurrentAction;
        var alliancesScores = that.alliancesScores || (that.alliancesScores = worldScripts.DayDiplomacy_000_Engine._State.alliancesScores);
        var a = that.alliancesAndWars || (that.alliancesAndWars = worldScripts.DayDiplomacy_000_Engine._State.alliancesAndWars);
        var allianceThreshold = that.allianceThreshold || (that.allianceThreshold = worldScripts.DayDiplomacy_000_Engine._State.allianceThreshold);
        var warThreshold = that.warThreshold || (that.warThreshold = worldScripts.DayDiplomacy_000_Engine._State.warThreshold);
        var aSystemId = aSystem.id;
        var aSystemScores = alliancesScores[aSystemId];
        var warEngine = that.warEngine || (that.warEngine = worldScripts.DayDiplomacy_040_WarEngine);

        for (var targetId in aSystemScores) {
            if (aSystemScores.hasOwnProperty(targetId)) {
                // Alliance
                if ((!a.hasOwnProperty(targetId) || !a[targetId].hasOwnProperty(aSystemId) || a[targetId][aSystemId] !== 1) // Not yet allied
                    && aSystemScores[targetId].SCORE >= allianceThreshold
                    && alliancesScores[targetId][aSystemId].SCORE >= allianceThreshold) { // Both are willing
                    warEngine._ally(aSystem, targetId);
                }

                // Break
                if ((a.hasOwnProperty(targetId) && a[targetId][aSystemId] === 1) // Allied
                    && (aSystemScores[targetId].SCORE < allianceThreshold
                        || alliancesScores[targetId][aSystemId].SCORE < allianceThreshold)) { // One is willing to break
                    warEngine._breakAlliance(aSystem, targetId);
                }

                // War
                if ((!a.hasOwnProperty(targetId) || !a[targetId].hasOwnProperty(aSystemId) || a[targetId][aSystemId] !== -1) // Not yet warring
                    && (aSystemScores[targetId].SCORE <= warThreshold || alliancesScores[targetId][aSystemId].SCORE <= warThreshold)) { // One is willing
                    warEngine._declareWar(aSystem, targetId);
                }

                // Peace
                if ((a.hasOwnProperty(targetId) && a[targetId][aSystemId] === -1) // Warring
                    && aSystemScores[targetId].SCORE > warThreshold && alliancesScores[targetId][aSystemId].SCORE > warThreshold) { // Both are willing
                    warEngine._makePeace(aSystem, proposerId);
                }
            }
        }
    };
    var fid = "warCouncilRecurrentAction";
    api.$setFunction(fid, warCouncilRecurrentAction);
    api.$setRecurrentAction(api.$buildAction(api.$buildNewActionId(), "WARCOUNCIL", "SYSTEM", fid));

    this.$setAllianceThreshold(1); // Default value for the very first initialization
    this.$setWarThreshold(-1); // Default value for the very first initialization
};
this._startUp = function () {
    var api = this._api = worldScripts.DayDiplomacy_002_EngineAPI;
    this._F = api.$getFunctions();

    // Alliances Scoring _Functions: { keyword => fid }
    this._asf = api.$initAndReturnSavedData("alliancesScoringFunctions", []);
    // Alliances Scores: { observedId => { observerId => { keyword => score } } }
    this._as = api.$initAndReturnSavedData("alliancesScores", {});
    this._a = api.$initAndReturnSavedData("alliancesAndWars", {});

    this._initAllyScore(api);
    this._init(api, worldScripts.DayDiplomacy_020_History); // ALLY/BREAK/WAR/PEACE

    this.$setAllianceThreshold(this._s._State.allianceThreshold); // Startup init using saved value
    this.$setWarThreshold(this._s._State.warThreshold); // Startup init using saved value

    delete this._startUp; // No need to startup twice
};
/*************************** End OXP private functions ***************************************************/

/*************************** Oolite events ***************************************************************/
this.startUp = function () {
    this._s = worldScripts.DayDiplomacy_000_Engine;
    this._s.$subscribe(this.name);
    delete this.startUp; // No need to startup twice
};
/*************************** End Oolite events ***********************************************************/