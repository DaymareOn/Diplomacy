"use strict";
this.name = "DayDiplomacy_045_Alliances";
this.author = "David (Day) Pradier";
this.copyright = "(C) 2017 David Pradier";
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script makes systems ally to each other, break their alliances, publish alliance news, draw the strategic map.";

/*************************** OXP private functions *******************************************************/
this._initSystemsScores = function (aGalaxyNb) {
    // Initializing static scores
    // For a given galaxy, for each system in the galaxy, for each system it observes,
    // it must assign a score to some properties, then recalculate the final score.
    // FIXME perfectstyle shouldn't this script be actorType-agnostic?
    var api = this._api;
    var actorsIdByType = api.$getActorsIdByType("SYSTEM");
    var actors = api.$getActors();
    var z = actorsIdByType.length;
    var aapi = this._aapi;
    while (z--) {
        var thisActor = actors[actorsIdByType[z]];
        if (thisActor.galaxyNb != aGalaxyNb) {
            continue;
        }
        var observersId = thisActor.observers["SYSTEM"];
        var y = observersId.length;
        while (y--) {
            aapi.$recalculateScores(actors[observersId[y]], thisActor);
        }
    }
};
this._drawStrategicMap = function () {
    var scores = this._aapi.$getScores();
    var actors = this._api.$getActors();
    var systemInfo = SystemInfo;
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
    var z = links.length;
    while (z--) {
        var link = links[z];
        systemInfo.setInterstellarProperty(link.galaxyNb, link.from, link.to, 2, "link_color", link.color);
    }
    this._links = links;
};
this._displayF4Interface = function () {
    player.ship.hudHidden || (player.ship.hudHidden = true);
    var opts = {
        screenID: "DiplomacyAlliancesScreenId",
        title: "Strategic map",
        backgroundSpecial: "LONG_RANGE_CHART_SHORTEST",
        allowInterrupt: true,
        exitScreen: "GUI_SCREEN_INTERFACES",
        message: "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n" // 17 lines: the map's height + 1
    };
    mission.runScreen(opts);
    this._drawStrategicMap();
    mission.addMessageText("Green:  systems like each other\nBlue:  one system likes the other while this one is neutral\nGray: both systems are neutral\nYellow:   one likes, one dislikes!\nOrange:   one is neutral, one dislikes\nRed:  systems dislike each other");
};
this._initF4Interface = function () {
    player.ship.dockedStation.setInterface("DiplomacyAlliances",
        {
            title: "Strategic map",
            category: "Diplomacy",
            summary: "You may see which systems (dis)like each other...",
            callback: this._displayF4Interface.bind(this)
        });
};
this._startUp = function () {
    this._storedNews = []; // No real need to save it
    var api = this._api = worldScripts.DayDiplomacy_002_EngineAPI;
    var aapi = this._aapi = worldScripts.DayDiplomacy_042_AlliancesEngineAPI;
    var asf = aapi.$getScoringFunctions();

    // Economy comparison
    if (asf.indexOf("EconomyComparison") === -1) {
        aapi.$addScoringFunction("EconomyComparison", function (observer, observed) {
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
    if (asf.indexOf("alliancesInfluence") === -1) {
        aapi.$addScoringFunction("alliancesInfluence", function alliancesInfluence(observer, observed) {

            var that = alliancesInfluence;
            var aaapi = that.aapi || (that.aapi = worldScripts.DayDiplomacy_042_AlliancesEngineAPI);
            var observedAllies = aaapi.$getAlliances()[observed.id];
            var allScores = aaapi.$getScores();
            var observerId = observer.id;

            var result = 0;
            for (var alliedId in observedAllies) {
                if (observedAllies.hasOwnProperty(alliedId)) {
                    var scores = allScores[alliedId][observerId];
                    scores && (result += scores.SCORE);
                }
            }
            return result > 0 ? .25 : result < 0 ? -.25 : 0;

        }, 1);
    }

    this._initSystemsScores(system.info.galaxyID);

    // We set the response to the ALLY event.
    var responseFunctionId = "diplomacyAlliancesOnSystemAllyFunction";
    if (!api.$getFunctions()[responseFunctionId]) {
        // We use a recurrent action to recalculate the scores,
        // as doing it on every event would generate LOTS of calculus.
        // Currently, we only generate the news.
        var diplomacyAlliancesOnSystemAllyFunction = function diplomacyAlliancesOnSystemAllyFunction(argsArray) {

            var respondingActor = argsArray[0], eventActor = argsArray[1], alliedActorId = argsArray[2];
            // On ALLY event, if the player is in a responder system, a news is generated.
            if (system.info.name === respondingActor.name) {
                // FIXME 0.perfectfunc make a special news so that when the player receives news from both allied systems,
                // they have interesting different content.
                var news = {
                    ID: "DayDiplomacy_045_Alliances", // Script name copied to avoid a closure.
                    Direct: true,
                    Agency: 1,
                    Message: "Travellers in the system of " + respondingActor.name
                    + " might be interested in knowing that " + eventActor.name + " just allied with "
                    + worldScripts.DayDiplomacy_002_EngineAPI.$getActors()[alliedActorId].name
                    + ".\n\nAs XXX said, 'the neatest definition of diplomacy I've seen is \"The art of saying 'nice doggy' while you reach behind you for a rock to throw.\"'.\n\nSo with that in mind, Who will gain? Who will lose?\n\nTruth is, we don't know!"
                };
                worldScripts.DayDiplomacy_045_Alliances._publishNews(news);
            }

        };
        api.$setFunction(responseFunctionId, diplomacyAlliancesOnSystemAllyFunction);
        api.$setResponse(api.$buildResponse(api.$buildNewResponseId(), "ALLY", "SYSTEM", responseFunctionId));
    }

    // We set the response to the BREAK event.
    var breakResponseFunctionId = "diplomacyAlliancesOnSystemBreakFunction";
    if (!api.$getFunctions()[breakResponseFunctionId]) {
        // We use a recurrent action to recalculate the scores,
        // as doing it on every event would generate LOTS of calculus.
        // Currently, we only generate the news.
        var diplomacyAlliancesOnSystemBreakFunction = function diplomacyAlliancesOnSystemBreakFunction(argsArray) {

            var respondingActor = argsArray[0], eventActor = argsArray[1], alliedActorId = argsArray[2];
            // On BREAK event, if the player is in a responder system, a news is generated.
            if (system.info.name === respondingActor.name) {
                // FIXME 0.perfectfunc make a special news so that when the player receives news from both allied systems,
                // they have interesting different content.
                var news = {
                    ID: "DayDiplomacy_045_Alliances", // Script name copied to avoid a closure.
                    Direct: true,
                    Agency: 1,
                    Message: "Travellers in the system of " + respondingActor.name
                    + " might be interested in knowing that " + eventActor.name + " just break their alliance with "
                    + worldScripts.DayDiplomacy_002_EngineAPI.$getActors()[alliedActorId].name
                    + ".\n\nAs XXX said, 'the neatest definition of diplomacy I've seen is \"The art of saying 'nice doggy' while you reach behind you for a rock to throw.\"'.\n\nSo with that in mind, Who will gain? Who will lose?\n\nTruth is, we don't know!"
                };
                worldScripts.DayDiplomacy_045_Alliances._publishNews(news);
            }

        };
        api.$setFunction(breakResponseFunctionId, diplomacyAlliancesOnSystemBreakFunction);
        api.$setResponse(api.$buildResponse(api.$buildNewResponseId(), "BREAK", "SYSTEM", breakResponseFunctionId));
    }

    // FIXME 0.perfectstyle hmff, this might have to be into its own function.
    // Nope, it would be contrary to perfectperf. Explain that in TechnicalPrinciples.txt,
    // and comment fully this code block.
    worldScripts.XenonUI && worldScripts.XenonUI.$addMissionScreenException("DiplomacyAlliancesScreenId");
    worldScripts.XenonReduxUI && worldScripts.XenonReduxUI.$addMissionScreenException("DiplomacyAlliancesScreenId");

    this._initF4Interface();

    delete this._startUp; // No need to startup twice
};
this._publishNews = function (news) {
    var returnCode = worldScripts.snoopers.insertNews(news);
    if (returnCode > 0 && returnCode !== 30) { // A prerequisite is wrong
        log("DiplomacyAlliances.diplomacyAlliancesOnSystemAllyFunction", "Snoopers ERROR: " + returnCode);
    } else if (returnCode < 0 || returnCode === 30) { // A buffer is full, we will resend the news later.
        worldScripts.DayDiplomacy_045_Alliances._storedNews.push(news);
    } // else: everything is okay.
};
/*************************** End OXP private functions ***************************************************/

/*************************** Snoopers events *************************************************************/
this.newsDisplayed = function (msg) {
    this._storedNews.length && this._publishNews(this._storedNews.shift());
};
/*************************** End Snoopers events *********************************************************/

/*************************** Oolite events ***************************************************************/
this.startUp = function () {
    this._s = worldScripts.DayDiplomacy_000_Engine;
    this._s.$subscribe(this.name);
    delete this.startUp; // No need to startup twice
};
this.shipDockedWithStation = function (station) {
    this._initF4Interface();
};
this.playerEnteredNewGalaxy = function (galaxyNumber) {
    this._initSystemsScores(galaxyNumber);
};
this.missionScreenOpportunity = function () {
    this._storedNews.length && this._publishNews(this._storedNews.shift());
};
this.missionScreenEnded = function () {
    player.ship.hudHidden = false;
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
/*************************** End Oolite events ***********************************************************/