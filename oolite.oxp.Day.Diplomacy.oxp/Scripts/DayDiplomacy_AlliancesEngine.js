"use strict";
this.name = "DayDiplomacy_030_AlliancesEngine";
this.author = "David (Day) Pradier";
this.copyright = "(C) 2017 David Pradier";
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script makes systems ally to each other, or NOT.";

this.$getScoringFunctions = function () {
    return this._asf;
};
this.$addScoringFunction = function (keyword, f) {
    var api = this._api;
    var id = api.$buildNewFunctionId();
    api.$setFunction(id, f);
    this._asf[keyword] = id;
};
this.$recalculateScores = function (observedActor, observerActor) {
    var asf = this._asf;
    var funcs = this._F;
    var as = this._as;
    var observedId = observedActor.id;
    var observerId = observerActor.id;
    var observedAs = as[observedId] || (as[observedId] = {});
    var score = observedAs[observerId] || (observedAs[observerId] = {});
    var finalScore = 0;
    for (var keyword in asf) {
        if (asf.hasOwnProperty(keyword)) {
            var thatScore = funcs[asf[keyword]](observerActor, observedActor);
            score[keyword] = thatScore;
            finalScore += thatScore;
        }
    }
    score.SCORE = finalScore;
};
this._ally = function (aSystem, anotherSystemId) {
    var alliances = this._a;
    var aSystemId = aSystem.id;
    alliances[aSystemId] = alliances[aSystemId] || {};
    alliances[aSystemId][anotherSystemId] = 1;
    alliances[anotherSystemId] = alliances[anotherSystemId] || {};
    alliances[anotherSystemId][aSystemId] = 1;
    this._api.$makeActorEventKnownToUniverse(aSystemId, "JOIN", [anotherSystemId]);
    this._api.$makeActorEventKnownToUniverse(anotherSystemId, "JOIN", [aSystemId]);
};
this._startUp = function () {
    this._api = worldScripts.DayDiplomacy_002_EngineAPI;
    var api = this._api;
    this._F = this._s.Functions;

    // Creating our state variables.
    // { keyword => fid }
    this._asf = this._s.State.alliancesScoringFunctions || (this._s.State.alliancesScoringFunctions = {});
    // { observedId => { observerId => { keyword => score } } }
    this._as = this._s.State.alliancesScores || (this._s.State.alliancesScores = {});
    this._a = this._s.State.alliances || (this._s.State.alliances = {});

    if (api.$getEventTypes().indexOf("JOIN") === -1) {
        api.$addEventType("JOIN");
    }

    // FIXME ally to alliance if avg(systemsScores) > threshold
    // Here, aSystem is the system to which the alliance might be proposed.
    var diplomacyAlliancesRecurrentAction = function diplomacyAlliancesRecurrentAction(aSystem) {
        var that = diplomacyAlliancesRecurrentAction;
        var alliancesScores = that.alliancesScores || (that.alliancesScores = worldScripts.DayDiplomacy_000_Engine.State.alliancesScores);
        var alliances = that.alliances || (that.alliances = worldScripts.DayDiplomacy_000_Engine.State.alliances);
        var aSystemId = aSystem.id;
        var aSystemScores = alliancesScores[aSystemId];
        for (var proposerId in aSystemScores) {
            if (aSystemScores.hasOwnProperty(proposerId)) {
                if (alliances.hasOwnProperty(proposerId) && alliances[proposerId].hasOwnProperty(aSystemId)) {
                    continue; // Already allied
                }

                // FIXME 0.9 threshold should be set through api
                // FIXME 0.9 alliance API should be given
                if (aSystemScores[proposerId].SCORE > 0 && alliancesScores[proposerId][aSystemId].SCORE > 0) { // Both are willing
                    var alliancesEngine = alliancesEngine || (worldScripts.DayDiplomacy_030_AlliancesEngine);
                    alliancesEngine._ally(aSystem, proposerId);
                }
            }
        }
    };
    var fid = api.$buildNewFunctionId();
    api.$setFunction(fid, diplomacyAlliancesRecurrentAction);
    api.$setRecurrentAction(api.$buildAction(api.$buildNewActionId(), "JOIN", "SYSTEM", fid));

    delete this._startUp; // No need to startup twice
};
this.startUp = function () {
    this._s = worldScripts.DayDiplomacy_000_Engine;
    this._s.$subscribe(this.name);
    delete this.startUp; // No need to startup twice
};