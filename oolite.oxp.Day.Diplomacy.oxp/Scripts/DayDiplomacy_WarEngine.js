"use strict";
this.name = "DayDiplomacy_040_WarEngine";
this.author = "David (Day) Pradier";
// noinspection JSUnusedGlobalSymbols Used by Oolite itself
this.copyright = "(C) 2017 David Pradier";
// noinspection JSUnusedGlobalSymbols Used by Oolite itself
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script is the war engine of the Diplomacy OXP.";

/* ************************** OXP public functions ********************************************************/

/**
 * @return {Object.<string,FunctionId>}
 * @lends worldScripts.DayDiplomacy_040_WarEngine.$getScoringFunctions
 */
this.$getScoringFunctions = function () {
    return this._asf;
};

/**
 * @param {FunctionId}keyword FIXME is the keyword used as a FunctionId ??
 * @param {function}f
 * @param {int}position
 * @lends worldScripts.DayDiplomacy_040_WarEngine.$addScoringFunction
 */
this.$addScoringFunction = function (keyword, f, position) {
    this._s.$setFunction(keyword, f);
    this._asf.splice(position, 0, keyword);
};

/**
 * @param {Actor}observedActor
 * @param {Actor}observerActor
 * @lends worldScripts.DayDiplomacy_040_WarEngine.$recalculateScores
 */
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

/**
 *
 * @param {number}threshold
 * @lends worldScripts.DayDiplomacy_040_WarEngine.$setAllianceThreshold
 */
this.$setAllianceThreshold = function (threshold) {
    // warCouncilRecurrentAction is a function defined at the beginning of this WarEngine.
    this._F.warCouncilRecurrentAction.allianceThreshold = threshold;
    this._s._State.allianceThreshold = threshold;
};

/**
 *
 * @param {number}threshold
 * @lends worldScripts.DayDiplomacy_040_WarEngine.$setWarThreshold
 */
this.$setWarThreshold = function (threshold) {
    // warCouncilRecurrentAction is a function defined at the beginning of this WarEngine.
    this._F.warCouncilRecurrentAction.warThreshold = threshold;
    this._s._State.warThreshold = threshold;
};

/**
 *
 * @return {number}
 * @lends worldScripts.DayDiplomacy_040_WarEngine.$getAllianceThreshold
 */
this.$getAllianceThreshold = function () {
    return this._s._State.allianceThreshold;
};

/**
 *
 * @return {number}
 * @lends worldScripts.DayDiplomacy_040_WarEngine.$getWarThreshold
 */
this.$getWarThreshold = function () {
    return this._s._State.warThreshold;
};

/**
 * Returns a dictionary with an {@link ActorId} as key, and as value: a dictionary with another {@link ActorId} as key,
 * and as value: -1 is there's a war between those 2 actors, 1 if there's an alliance.
 * @return {Object.<ActorId,Object.<ActorId,number>>}
 * @lends worldScripts.DayDiplomacy_040_WarEngine.$getAlliancesAndWars
 */
this.$getAlliancesAndWars = function () {
    return this._a;
};

/**
 *
 * @return {Object.<ActorId,Object.<ActorId,Object.<string,number>>>}
 * @lends worldScripts.DayDiplomacy_040_WarEngine.$getScores
 */
this.$getScores = function () {
    return this._as;
};

/**
 *  true if those 2 actors are at war
 * @param {ActorId} actorIdA  an actorId
 * @param {ActorId} actorIdB  another actorId
 * @return {boolean}
 * @lends worldScripts.DayDiplomacy_040_WarEngine.$areActorsWarring
 */
this.$areActorsWarring = function (actorIdA, actorIdB) {
    // FIXME use hasOwnProperty ?
    var tmp = this._a[actorIdA];
    return tmp && tmp[actorIdB] === -1
};

/* ************************** OXP private functions *******************************************************/

/**
 *
 * @param {ActorId}aSystemId
 * @param {ActorId}anotherSystemId
 * @private
 */
this._ally = function (aSystemId, anotherSystemId) {
    var a = this._a; // alliances and wars
    a[aSystemId] = a[aSystemId] || {};
    a[aSystemId][anotherSystemId] = 1; // Alliance
    a[anotherSystemId] = a[anotherSystemId] || {};
    a[anotherSystemId][aSystemId] = 1; // Alliance
    this._s.$makeActorEventKnownToUniverse(aSystemId, "ALLY", [anotherSystemId]);
    this._s.$makeActorEventKnownToUniverse(anotherSystemId, "ALLY", [aSystemId]);
    // Commented out because closure
    // log("DiplomacyWarEngine", "Alliance between " + aSystemId + " and " + anotherSystemId);
};

/**
 *
 * @param {ActorId}aSystemId
 * @param {ActorId}anotherSystemId
 * @private
 */
this._breakAlliance = function (aSystemId, anotherSystemId) {
    var a = this._a; // Alliances and wars
    a[aSystemId] && a[aSystemId] === 1 && (delete a[aSystemId][anotherSystemId]); // Breaking alliance
    a[anotherSystemId] && a[anotherSystemId] === 1 && (delete a[anotherSystemId][aSystemId]); // Breaking alliance
    this._s.$makeActorEventKnownToUniverse(aSystemId, "BREAK", [anotherSystemId]);
    this._s.$makeActorEventKnownToUniverse(anotherSystemId, "BREAK", [aSystemId]);
    // Commented out because closure
    // log("DiplomacyWarEngine", "Alliance broken between " + aSystemId + " and " + anotherSystemId);
};

/**
 *
 * @param {ActorId}aSystemId
 * @param {ActorId}anotherSystemId
 * @private
 */
this._declareWar = function (aSystemId, anotherSystemId) {
    var a = this._a; // Alliances and wars
    a[aSystemId] = a[aSystemId] || {};
    a[aSystemId][anotherSystemId] = -1; // War
    a[anotherSystemId] = a[anotherSystemId] || {};
    a[anotherSystemId][aSystemId] = -1; // War
    this._s.$makeActorEventKnownToUniverse(aSystemId, "WAR", [anotherSystemId]);
    this._s.$makeActorEventKnownToUniverse(anotherSystemId, "WAR", [aSystemId]);
    // Commented out because closure
    // log("DiplomacyWarEngine", "War between " + aSystemId + " and " + anotherSystemId);
};

/**
 *
 * @param {ActorId} aSystemId
 * @param {ActorId} anotherSystemId
 * @private
 */
this._makePeace = function (aSystemId, anotherSystemId) {
    var a = this._a; // Alliances and wars
    a[aSystemId] && a[aSystemId] === -1 && (delete a[aSystemId][anotherSystemId]); // Making peace
    a[anotherSystemId] && a[anotherSystemId] === -1 && (delete a[anotherSystemId][aSystemId]); // Making peace
    this._s.$makeActorEventKnownToUniverse(aSystemId, "PEACE", [anotherSystemId]);
    this._s.$makeActorEventKnownToUniverse(anotherSystemId, "PEACE", [aSystemId]);
    // Commented out because closure
    // log("DiplomacyWarEngine", "Peace between " + aSystemId + " and " + anotherSystemId);
};

/**
 *
 * @private
 */
this._initAllyScore = function () {
    var engine = this._s;

    if (engine.$getEventTypes().indexOf("ALLYSCORE") === -1) {
        engine.$addEventType("ALLYSCORE", 1);
        // Function to calculate scores, here is the system for which scores are calculated
        var diplomacyAlliancesScoringRecurrentAction = function diplomacyAlliancesScoringRecurrentAction(aSystem) {
            // FIXME perfectfunc should be actor-agnostic
            var observersId = aSystem.observers["SYSTEM"];
            if (!observersId) {
                return; // There may be no observer yet.
            }
            var that = diplomacyAlliancesScoringRecurrentAction;
            var we = that.warEngine || (that.warEngine = worldScripts.DayDiplomacy_040_WarEngine);
            var engine = that._engine || (that._engine = worldScripts.DayDiplomacy_000_Engine);
            var actors = engine.$getActors();
            var y = observersId.length;
            while (y--) {
                we.$recalculateScores(actors[observersId[y]], aSystem);
            }
        };
        var fid = "diplomacyAlliancesScoringRecurrentAction";
        engine.$setFunction(fid, diplomacyAlliancesScoringRecurrentAction);
        engine.$setRecurrentAction(engine.$buildAction(engine.$getNewActionId(), "ALLYSCORE", "SYSTEM", fid));
    }
};

/**
 * @private
 */
this._init = function () {
    var engine = this._s;
    var history = worldScripts.DayDiplomacy_020_History;

    if (engine.$getEventTypes().indexOf("BREAK") !== -1) {
        return; // Already initialized
    }

    // Creating events
    engine.$addEventType("WARCOUNCIL", 2);
    engine.$addEventType("BREAK", 3);
    engine.$addEventType("ALLY", 4);
    engine.$addEventType("WAR", 5);
    engine.$addEventType("PEACE", 6);

    // Managing history sentences
    history.$setEventFormattingFunction("BREAK",
        /**
         * @param {DiplomacyEvent} breakEvent
         * @return {string} the formatted message
         */
        function breakEventFormattingFunction(breakEvent) {
            var f = breakEventFormattingFunction;
            var engine = f._engine || (f._engine = worldScripts.DayDiplomacy_000_Engine);
            var actors = engine.$getActors();
            return actors[breakEvent.actorId].name + " broke their alliance with " + actors[breakEvent.args[0]].name + ".";
        });
    history.$setEventFormattingFunction("ALLY",
        /**
         * FIXME create a type AllyEvent?
         * @param  {DiplomacyEvent} allyEvent
         * @return {string}
         */
        function allyEventFormattingFunction(allyEvent) {
            var f = allyEventFormattingFunction;
            var engine = f._engine || (f._engine = worldScripts.DayDiplomacy_000_Engine);
            var actors = engine.$getActors();
            return actors[allyEvent.actorId].name + " allied with " + actors[allyEvent.args[0]].name + ".";
    });
    history.$setEventFormattingFunction("WAR",
        /**
         * @param  {DiplomacyEvent} warEvent
         * @return {string}
         */
        function warEventFormattingFunction(warEvent) {
            var f = warEventFormattingFunction;
            var engine = f._engine || (f._engine = worldScripts.DayDiplomacy_000_Engine);
            var actors = engine.$getActors();
            return actors[warEvent.actorId].name + " declared war with " + actors[warEvent.args[0]].name + ".";
    });
    history.$setEventFormattingFunction("PEACE",
        /**
         * @param  {DiplomacyEvent} peaceEvent
         * @return {string}
         */
        function peaceEventFormattingFunction(peaceEvent) {
            var f = peaceEventFormattingFunction;
            var engine = f._engine || (f._engine = worldScripts.DayDiplomacy_000_Engine);
            var actors = engine.$getActors();
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
                    warEngine._ally(aSystemId, targetId);
                }

                // Break
                if ((a.hasOwnProperty(targetId) && a[targetId][aSystemId] === 1) // Allied
                    && (aSystemScores[targetId].SCORE < allianceThreshold
                        || alliancesScores[targetId][aSystemId].SCORE < allianceThreshold)) { // One is willing to break
                    warEngine._breakAlliance(aSystemId, targetId);
                }

                // War
                if ((!a.hasOwnProperty(targetId) || !a[targetId].hasOwnProperty(aSystemId) || a[targetId][aSystemId] !== -1) // Not yet warring
                    && (aSystemScores[targetId].SCORE <= warThreshold || alliancesScores[targetId][aSystemId].SCORE <= warThreshold)) { // One is willing
                    warEngine._declareWar(aSystemId, targetId);
                }

                // Peace
                if ((a.hasOwnProperty(targetId) && a[targetId][aSystemId] === -1) // Warring
                    && aSystemScores[targetId].SCORE > warThreshold && alliancesScores[targetId][aSystemId].SCORE > warThreshold) { // Both are willing
                    warEngine._makePeace(aSystemId, proposerId);
                }
            }
        }
    };
    var fid = "warCouncilRecurrentAction";
    engine.$setFunction(fid, warCouncilRecurrentAction);
    engine.$setRecurrentAction(engine.$buildAction(engine.$getNewActionId(), "WARCOUNCIL", "SYSTEM", fid));

    this.$setAllianceThreshold(1); // Default value for the very first initialization
    this.$setWarThreshold(-1); // Default value for the very first initialization
};

this._startUp = function () {
    var engine = this._s;
    this._F = engine.$getFunctions();

    // Alliances Scoring _Functions: { keyword => fid }
    this._asf = engine.$initAndReturnSavedData("alliancesScoringFunctions", []);
    // Alliances Scores: { observedId => { observerId => { keyword => score } } }
    this._as = engine.$initAndReturnSavedData("alliancesScores", {});
    this._a = engine.$initAndReturnSavedData("alliancesAndWars", {});

    this._initAllyScore();
    this._init(); // ALLY/BREAK/WAR/PEACE

    this.$setAllianceThreshold(this._s._State.allianceThreshold); // Startup init using saved value
    this.$setWarThreshold(this._s._State.warThreshold); // Startup init using saved value

    delete this._startUp; // No need to startup twice
};

/* ************************** Oolite events ***************************************************************/

this.startUp = function () {
    this._s = worldScripts.DayDiplomacy_000_Engine;
    this._s.$subscribe(this.name);
    delete this.startUp; // No need to startup twice
};