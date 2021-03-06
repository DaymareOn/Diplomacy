"use strict";
this.name = "DayDiplomacy_045_War";
this.author = "David (Day) Pradier";
// noinspection JSUnusedGlobalSymbols Used by Oolite itself
this.copyright = "(C) 2017 David Pradier";
// noinspection JSUnusedGlobalSymbols Used by Oolite itself
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script makes systems ally to each other," +
    " break their alliances," +
    " make peace and war," +
    " publish the related news," +
    " draw the war and the diplomatic maps.";

/* ************************** OXP private functions *******************************************************/

// FIXME 0.14 make that as long as we are not in 1.0, the diplomacy save data is erased when there is a new version?
this._initSystemsScores = function (aGalaxyNb) {
    // Initializing static scores
    // For a given galaxy, for each system in the galaxy, for each system it observes,
    // it must assign a score to some properties, then recalculate the final score.
    // FIXME perfectstyle shouldn't this script be actorType-agnostic?
    var engine = this._s;
    var actorsIdByType = engine.$getActorsIdByType("SYSTEM");
    var actors = engine.$getActors();
    var z = actorsIdByType.length;
    var we = this._we;
    while (z--) {
        var thisActor = actors[actorsIdByType[z]];
        if (thisActor.galaxyNb != aGalaxyNb) {
            continue;
        }
        var observersId = thisActor.observers["SYSTEM"];
        var y = observersId.length;
        while (y--) {
            we.$recalculateScores(actors[observersId[y]], thisActor);
        }
    }
};
this._drawDiplomaticMap = function () {
    var scores = this._we.$getScores();
    var actors = this._s.$getActors();
    var links = [];

    for (var observedId in scores) {
        if (scores.hasOwnProperty(observedId)) {
            var observed = actors[observedId];
            var observedNb = observed.systemId;
            var galaxyNb = observed.galaxyNb;
            var observedScores = scores[observedId];
            for (var observerId in observedScores) {
                if (observedScores.hasOwnProperty(observerId)) {
                    var observerNb = actors[observerId].systemId;
                    // Doc: "When setting link_color, the lower system ID must be placed first,
                    // because of how the chart is drawn."
                    if (observerNb < observedNb) {
                        var scoreFromTo = observedScores[observerId].SCORE;
                        var scoreToFrom = scores[observerId][observedId].SCORE;
                        if (scoreFromTo || scoreToFrom) {
                            var color = null;
                            if (scoreFromTo > 0 && scoreToFrom > 0) {
                                color = "greenColor";
                            } else if (scoreFromTo < 0 && scoreToFrom < 0) {
                                color = "redColor";
                            } else if (scoreFromTo * scoreToFrom < 0) {
                                color = "yellowColor";
                            } else if (scoreFromTo + scoreToFrom > 0) {
                                color = "blueColor";
                            } else {
                                color = "orangeColor";
                            }
                            links.push({galaxyNb: galaxyNb, from: observerNb, to: observedNb, color: color});
                        }
                    }
                }
            }
        }
    }

    this._drawMap(links);
};
this._drawWarMap = function () {
    var alliancesAndWars = this._we.$getAlliancesAndWars();
    var actors = this._s.$getActors();
    var links = [];

    for (var actorId in alliancesAndWars) {
        if (alliancesAndWars.hasOwnProperty(actorId)) {
            var actorAlliancesAndWars = alliancesAndWars[actorId];
            var actor = actors[actorId];
            var systemNb = actor.systemId;
            var galaxyNb = actor.galaxyNb;
            for (var targetId in actorAlliancesAndWars) {
                if (actorAlliancesAndWars.hasOwnProperty(targetId)) {
                    var targetSystemNb = actors[targetId].systemId;
                    // Doc: "When setting link_color, the lower system ID must be placed first,
                    // because of how the chart is drawn."
                    if (systemNb < targetSystemNb) {
                        links.push({
                            galaxyNb: galaxyNb,
                            from: systemNb,
                            to: targetSystemNb,
                            color: actorAlliancesAndWars[targetId] === 1 ? "greenColor" : "redColor"
                        });
                    }
                }
            }
        }
    }

    this._drawMap(links);
};
this._drawWarringMap = function () {
    var alliancesAndWars = this._we.$getAlliancesAndWars();
    var actors = this._s.$getActors();
    var warringSystems = [];
    var m = mission;

    mainloop:
        for (var actorId in alliancesAndWars) {
            if (alliancesAndWars.hasOwnProperty(actorId)) {
                var actorAlliancesAndWars = alliancesAndWars[actorId];
                var systemNb = actors[actorId].systemId;
                for (var targetId in actorAlliancesAndWars) {
                    if (actorAlliancesAndWars.hasOwnProperty(targetId)) {
                        if (actorAlliancesAndWars[targetId] === -1) {
                            m.markSystem({system: systemNb, name: "DayDiplomacyWarringMap"});
                            continue mainloop;
                        }
                    }
                }
            }
        }
};
this._drawMap = function (links) {
    var systemInfo = SystemInfo;
    var z = links.length;
    while (z--) {
        var link = links[z];
        // Hmm... We calculate and then set the links for all the galaxies...
        // This is useless, but at the same time simpler and maybe useful for the future.
        systemInfo.setInterstellarProperty(link.galaxyNb, link.from, link.to, 2, "link_color", link.color);
    }
    this._links = links;
};
this._resetLinks = function () {
    var m = mission;
    var i = 256;
    while(i--) {
        m.unmarkSystem({system:i, name:"DayDiplomacyWarringMap"});
    }

    var links = this._links;
    if (!links) return;
    var systemInfo = SystemInfo;
    var z = links.length;
    while (z--) {
        var link = links[z];
        systemInfo.setInterstellarProperty(link.galaxyNb, link.from, link.to, 2, "link_color", null);
    }
    this._links = null;
};

/**
 * If 2 vectors are given, center is the center of the vectors, and zoom the customChartCentreInLY value
 * necessary to display the 2 vectors and 20% more space around.
 * If only one vector is given, the center is that vector, and the zoom is 1.5.
 * @param {Vector3D} v1
 * @param {Vector3D} v2
 * @return {{center: Vector3D, zoom: number}}
 * @private
 */
this._getCustomZoom = function (v1, v2) {
    var z = 1.5;
    if (v2) {
        var v = v1.subtract(v2).multiply(1.2);
        z = Math.min(4, Math.max(1, Math.abs(v.x) / 100 * 4, Math.abs(v.y) / 50 * 4));
    }
    return {
        center: v2 ? v1.add(v2).multiply(.5) : v1,
        zoom: z
    };
};

/**
 * Save the target system and make as if there was no target system, so that no trajectory appears.
 * @private
 */
this._saveTarget = function () {
    if (!this._savedTarget) {
        this._savedTarget = player.ship.targetSystem;
        player.ship.targetSystem = system.info.systemID;
    }
};
/**
 * Reloads the target system.
 * @private
 */
this._loadTarget = function () {
    if (this._savedTarget) {
        player.ship.targetSystem = this._savedTarget;
        this._savedTarget = undefined;
    }
};

this._F4InterfaceCallback = function (choice) {
    this._loadTarget();

    // Exit
    if (choice === "5_EXIT") {
        return;
    }

    // Default choice
    choice = choice === "DiplomacyWars" ? "0_WARRING_NO_TRAVEL" : choice;

    // Choice
    var choices = choice.split("_");
    var no = choices[0], wd = choices[1], qs = choices[2], td = choices[3];

    // Options
    var wdp = ["WARRING", "WARS", "DIPLOMACY"];
    var qsp = ["QUICK", "SHORT", "NO"];
    var tdp = ["TARGET", "TRAVEL"];

    // Next proposed options
    var nextwd = wdp[(wdp.indexOf(wd) + 1) % wdp.length];
    var nextqs = qsp[(qsp.indexOf(qs) + 1) % qsp.length];
    var nexttd = tdp[(tdp.indexOf(td) + 1) % tdp.length];

    var bgs = {QUICK: "CUSTOM_CHART_QUICKEST", SHORT: "CUSTOM_CHART_SHORTEST", NO: "CUSTOM_CHART"};

    var texts = {
        WARRING: "Display warring systems",
        WARS: "Display wars map",
        DIPLOMACY: "Display diplomacy map",
        QUICK: "Display quickest travel",
        SHORT: "Display shortest travel",
        NO: "Display no travel",
        TARGET: "Display the target surroundings",
        TRAVEL: "Display the travel surroundings"
    };

    // Init
    this._resetLinks();
    var playerShip = player.ship;
    playerShip.hudHidden || (playerShip.hudHidden = true);

    var opts = {
        screenID: "DiplomacyWarScreenId",
        title: "Star wars",
        allowInterrupt: true,
        exitScreen: "GUI_SCREEN_INTERFACES",
        choices: {"5_EXIT": "Exit"}
    };

    if (no === '4'/*Help*/) {
        opts.message = "Warring systems map: red crosses\n\nDiplomacy map:\nGreen: Love\nBlue: Love+Neutrality\nGray: Neutrality\nYellow: Love+Hate\nOrange: Neutrality+Hate\nRed: Hate\n"
            + "\n\nWars map:\nRed: war\nGreen: alliance";
    } else {
        // Screen
        var info = system.info;

        var currentSystemCoordinates = info.coordinates;
        var targetCoordinates = System.infoForSystem(info.galaxyID, playerShip.targetSystem).coordinates;
        var customZoom = td === "TARGET"
            ? this._getCustomZoom(targetCoordinates, undefined)
            : this._getCustomZoom(currentSystemCoordinates, targetCoordinates);

        if (qs === "NO") this._saveTarget();

        opts.backgroundSpecial = bgs[qs];

        opts.customChartZoom = customZoom.zoom;
        opts.customChartCentreInLY = customZoom.center;

        switch (wd) {
            case 'DIPLOMACY':
                this._drawDiplomaticMap();
                break;
            case 'WARS':
                this._drawWarMap();
                break;
            case 'WARRING':
                this._drawWarringMap();
                break;
        }
    }

    opts.choices[[1, nextwd, qs, td].join('_')] = texts[nextwd];
    opts.choices[[2, wd, nextqs, td].join('_')] = texts[nextqs];
    opts.choices[[3, wd, qs, nexttd].join('_')] = texts[nexttd];
    opts.choices[[4, wd, qs, td].join('_')] = "Help";

    mission.runScreen(opts, this._F4InterfaceCallback.bind(this));
};

this._initF4Interface = function () {
    if (player.ship.hasEquipmentProviding("EQ_ADVANCED_NAVIGATIONAL_ARRAY")) {
        player.ship.dockedStation.setInterface("DiplomacyWars",
            {
                title: "Star wars",
                category: "Diplomacy",
                summary: "Wars and diplomacy",
                callback: this._F4InterfaceCallback.bind(this)
            });
    }
};
this._startUp = function () {
    // FIXME 0.perfectstyle hmff, this might have to be into its own function.
    // Nope, it would be contrary to perfectperf. Explain that in TechnicalPrinciples.txt.
    // XenonUI would overlay over our mission screens without these exception.
    // FIXME 0.perfectstyle i should have a list of screens, rather than copying here their names, to avoid forgetting
    // to update here when I add or change a screen.
    worldScripts.XenonUI && worldScripts.XenonUI.$addMissionScreenException("DiplomacyWarScreenId");
    worldScripts.XenonReduxUI && worldScripts.XenonReduxUI.$addMissionScreenException("DiplomacyWarScreenId");

    this._storedNews = []; // No real need to save it
    var engine = this._s;
    var we = this._we = worldScripts.DayDiplomacy_040_WarEngine;
    var sf = we.$getScoringFunctions();

    // Economy comparison
    if (sf.indexOf("EconomyComparison") === -1) {
        we.$addScoringFunction("EconomyComparison", function (observer, observed) {
            var map = {
                0: {0: +0.5, 1: -1.0, 2: -0.5, 3: -1.0, 4: -1.0, 5: -0.5, 6: -0.5, 7: -0.5}, // Anarchy
                1: {0: +0.0, 1: +0.5, 2: -0.5, 3: -0.5, 4: -1.0, 5: -0.5, 6: -1.0, 7: -0.5}, // Feudal
                2: {0: +0.0, 1: +0.0, 2: +0.5, 3: -0.5, 4: -0.5, 5: +0.5, 6: +0.0, 7: +0.0}, // Multi-government
                3: {0: +0.0, 1: +0.0, 2: +0.0, 3: +0.5, 4: +0.0, 5: +0.0, 6: -0.5, 7: +0.0}, // Dictator
                4: {0: -0.5, 1: -0.5, 2: +0.0, 3: +0.0, 4: +0.5, 5: +0.0, 6: -0.5, 7: -0.5}, // Communist
                5: {0: +0.0, 1: +0.0, 2: +0.5, 3: -0.5, 4: +0.0, 5: +0.5, 6: +0.0, 7: +0.0}, // Confederacy
                6: {0: +0.0, 1: -0.5, 2: +0.0, 3: -0.5, 4: -0.5, 5: +0.0, 6: +0.5, 7: +0.0}, // Democracy
                7: {0: +0.0, 1: +0.0, 2: +0.0, 3: +0.0, 4: -1.0, 5: +0.0, 6: +0.0, 7: +0.5}  // Corporate
            };
            return map[observer.government][observed.government];
        }, 0);
    }

    // Alliances influence on score, this function is and should be last executed.
    if (sf.indexOf("alliancesAndWarsInfluence") === -1) {
        we.$addScoringFunction("alliancesAndWarsInfluence", function alliancesAndWarsInfluence(observer, observed) {

            /* This function calculates the relation bonus given by observer to observed, depending on observed allies and foes.
             * If their allies are considered nice by observer, they get a bonus.
             * If their foes are considered baddies by observer, they get a bonus.
             * And vice-versa. */
            var that = alliancesAndWarsInfluence;
            var we = that.we || (that.we = worldScripts.DayDiplomacy_040_WarEngine);
            var observedAlliesAndFoes = we.$getAlliancesAndWars()[observed.id];
            var allScores = we.$getScores();
            var observerId = observer.id;

            var result = 0;
            for (var alliedId in observedAlliesAndFoes) {
                if (observedAlliesAndFoes.hasOwnProperty(alliedId)) {
                    var scores = allScores[alliedId][observerId];
                    scores && (result += observedAlliesAndFoes[alliedId] * scores.SCORE);
                }
            }
            return result > 0 ? .25 : result < 0 ? -.25 : 0;

        }, 1);
    }

    this._initSystemsScores(system.info.galaxyID);

    // We set the response to the ALLY event.
    var allyResponseFunctionId = "diplomacyAlliancesOnSystemAllyFunction";
    if (!engine.$getFunctions()[allyResponseFunctionId]) {
        // We use a recurrent action to recalculate the scores,
        // as doing it on every event would generate LOTS of calculus.
        // Currently, we only generate the news.
        var diplomacyAlliancesOnSystemAllyFunction = function diplomacyAlliancesOnSystemAllyFunction(argsArray) {

            /** @type {Actor} */
            var respondingActor = argsArray[0];

            /** @type {Actor} */
            var eventActor = argsArray[1];

            /** @type {ActorId} */
            var alliedActorId = argsArray[2];

            // On ALLY event, if the player is in a responder system, a news is generated.
            // This could be optimized, but the role of this function should be to manage all responses.
            if (system.info.name === respondingActor.name) {
                var allyName = worldScripts.DayDiplomacy_000_Engine.$getActors()[alliedActorId].name;
                if (respondingActor.name === allyName) {
                    worldScripts.DayDiplomacy_015_GNN.$publishNews("YOU might be interested in knowing that " + eventActor.name + " just allied with " + allyName
                        + ".\n\nAs Commander Diziet Sma, currently aboard the \"Blackwidow\" Pitviper S.E., famously said, 'the neatest definition of diplomacy I've seen is \"The art of saying 'nice doggy' while you reach behind you for a rock to throw.\"'.\n\nSo with that in mind, Who will gain? Who will lose?\n\nTruth is, we don't know!");
                }
            }

        };
        engine.$setFunction(allyResponseFunctionId, diplomacyAlliancesOnSystemAllyFunction);
        engine.$setResponse(engine.$buildResponse(engine.$getNewResponseId(), "ALLY", "SYSTEM", allyResponseFunctionId));
    }

    // We set the response to the BREAK event.
    var breakResponseFunctionId = "diplomacyAlliancesOnSystemBreakFunction";
    if (!engine.$getFunctions()[breakResponseFunctionId]) {
        // We use a recurrent action to recalculate the scores,
        // as doing it on every event would generate LOTS of calculus.
        // Currently, we only generate the news.
        var diplomacyAlliancesOnSystemBreakFunction = function diplomacyAlliancesOnSystemBreakFunction(argsArray) {

            /** @type {Actor} */
            var respondingActor = argsArray[0];

            /** @type {Actor} */
            var eventActor = argsArray[1];

            /** @type {ActorId} */
            var alliedActorId = argsArray[2];

            // On BREAK event, if the player is in a responder system, a news is generated.
            if (system.info.name === respondingActor.name) {
                var allyName = worldScripts.DayDiplomacy_000_Engine.$getActors()[alliedActorId].name;
                if (respondingActor.name === allyName) {
                    worldScripts.DayDiplomacy_015_GNN.$publishNews("YOU might be interested in knowing that " + eventActor.name + " just broke their alliance with " + allyName
                        + ".\n\nAs Commander Diziet Sma, currently aboard the \"Blackwidow\" Pitviper S.E., famously said, 'the neatest definition of diplomacy I've seen is \"The art of saying 'nice doggy' while you reach behind you for a rock to throw.\"'.\n\nSo with that in mind, Who will gain? Who will lose?\n\nTruth is, we don't know!");
                }
            }

        };
        engine.$setFunction(breakResponseFunctionId, diplomacyAlliancesOnSystemBreakFunction);
        engine.$setResponse(engine.$buildResponse(engine.$getNewResponseId(), "BREAK", "SYSTEM", breakResponseFunctionId));
    }

    // We set the response to the WAR event.
    var warResponseFunctionId = "diplomacyAlliancesOnSystemWarFunction";
    if (!engine.$getFunctions()[warResponseFunctionId]) {
        // We use a recurrent action to recalculate the scores,
        // as doing it on every event would generate LOTS of calculus.
        // Currently, we only generate the news.
        var diplomacyAlliancesOnSystemWarFunction = function diplomacyAlliancesOnSystemWarFunction(argsArray) {

            /** @type {Actor} */
            var respondingActor = argsArray[0];

            /** @type {Actor} */
            var eventActor = argsArray[1];

            /** @type {ActorId} */
            var foeActorId = argsArray[2];

            // On WAR event, if the player is in a responder system, a news is generated.
            if (system.info.name === respondingActor.name) {
                var foeName = worldScripts.DayDiplomacy_000_Engine.$getActors()[foeActorId].name;
                if (respondingActor.name === foeName) {
                    // FIXME 0.14 make different citation for war and peace
                    worldScripts.DayDiplomacy_015_GNN.$publishNews("YOU might be interested in knowing that " + eventActor.name + " just declared war with " + foeName
                        + ".\n\nAs Commander Diziet Sma, currently aboard the \"Blackwidow\" Pitviper S.E., famously said, 'the neatest definition of diplomacy I've seen is \"The art of saying 'nice doggy' while you reach behind you for a rock to throw.\"'.\n\nSo with that in mind, Who will gain? Who will lose?\n\nTruth is, we don't know!");
                }
            }

        };
        engine.$setFunction(warResponseFunctionId, diplomacyAlliancesOnSystemWarFunction);
        engine.$setResponse(engine.$buildResponse(engine.$getNewResponseId(), "WAR", "SYSTEM", warResponseFunctionId));
    }

    // We set the response to the PEACE event.
    var peaceResponseFunctionId = "diplomacyAlliancesOnSystemPeaceFunction";
    if (!engine.$getFunctions()[peaceResponseFunctionId]) {
        // We use a recurrent action to recalculate the scores,
        // as doing it on every event would generate LOTS of calculus.
        // Currently, we only generate the news.
        var diplomacyAlliancesOnSystemPeaceFunction = function diplomacyAlliancesOnSystemPeaceFunction(argsArray) {

            /** @type {Actor} */
            var respondingActor = argsArray[0];

            /** @type {Actor} */
            var eventActor = argsArray[1];

            /** @type {ActorId} */
            var foeActorId = argsArray[2];

            // On PEACE event, if the player is in a responder system, a news is generated.
            if (system.info.name === respondingActor.name) {
                var foeName = worldScripts.DayDiplomacy_000_Engine.$getActors()[foeActorId].name;
                if (respondingActor.name === foeName) {
                    // FIXME 0.14 make different citation for war and peace
                    worldScripts.DayDiplomacy_015_GNN.$publishNews("YOU might be interested in knowing that " + eventActor.name + " just made peace with " + foeName
                        + ".\n\nAs Commander Diziet Sma, currently aboard the \"Blackwidow\" Pitviper S.E., famously said, 'the neatest definition of diplomacy I've seen is \"The art of saying 'nice doggy' while you reach behind you for a rock to throw.\"'.\n\nSo with that in mind, Who will gain? Who will lose?\n\nTruth is, we don't know!");
                }
            }

        };
        engine.$setFunction(peaceResponseFunctionId, diplomacyAlliancesOnSystemPeaceFunction);
        engine.$setResponse(engine.$buildResponse(engine.$getNewResponseId(), "PEACE", "SYSTEM", peaceResponseFunctionId));
    }

    this._initF4Interface();

    delete this._startUp; // No need to startup twice
};

/* ************************** Oolite events ***************************************************************/

this.startUp = function () {
    this._s = worldScripts.DayDiplomacy_000_Engine;
    this._s.$subscribe(this.name);
    delete this.startUp; // No need to startup twice
};
this.shipDockedWithStation = function (station) {
    this._initF4Interface();
};
this.equipmentAdded = function (equipmentKey) {
    if (equipmentKey === "EQ_ADVANCED_NAVIGATIONAL_ARRAY") {
        this._initF4Interface();
    }
};
this.playerEnteredNewGalaxy = function (galaxyNumber) {
    this._initSystemsScores(galaxyNumber);
};
this.missionScreenEnded = function () {
    player.ship.hudHidden = false;
    this._resetLinks();
    this._loadTarget();
};