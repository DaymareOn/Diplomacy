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
this._startUp = function () {
    this._api = worldScripts.DayDiplomacy_002_EngineAPI;
    // { keyword => fid }
    this._asf = this._s.State.alliancesScoringFunctions || (this._s.State.alliancesScoringFunctions = {});
    // { observedId => { observerId => { keyword => score } } }
    this._as = this._s.State.alliancesScores || (this._s.State.alliancesScores = {});
    this._F = this._s.Functions;
    delete this._startUp; // No need to startup twice
};
this.startUp = function () {
    this._s = worldScripts.DayDiplomacy_000_Engine;
    this._s.$subscribe(this.name);
    delete this.startUp; // No need to startup twice
};