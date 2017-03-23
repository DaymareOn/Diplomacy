"use strict";
this.name = "DayDiplomacy_000_Engine";
this.author = "David (Day) Pradier";
this.copyright = "(C) 2017 David Pradier";
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script is the engine of the Diplomacy OXP.";

// FIXME 0.n have an indicator "Ongoing war" per system
// FIXME 0.n have a notion of "war zone"
// FIXME 0.n have a notion of galaxy, station, traveller
// FIXME 0.n tax evasion
// FIXME 0.n identifying oneself as from some system
// FIXME 0.n factions?
// FIXME 0.n news
// FIXME 0.n blockades
// FIXME 0.n each turn, a system has an event card: a sun explodes, or a native singer becomes famous, which changes taxes, or alliances, or fights, or...
// FIXME 0.n what about the story of a war writing itself?
// FIXME 0.n war cargoes

var __DayDiplomacy_Engine_Script = this;

/*************************** Methods to save/restore *****************************************************/

this.__DayDiplomacy_Engine_checkForReviver = function (keyString, content) {
    if ((content.indexOf(keyString) === 1) && (content.indexOf(")/") === content.length - 3)) {
        return unescape(content.substring(keyString.length + 1, content.length - 3)).replace(/\\"/g, "\""); // why oh why ?
    }
    return -1;
};

this.__DayDiplomacy_Engine_reviver = function (key, value) {

    // All our special cases are strings
    if (typeof value !== "string") {
        return value;
    }

    if ((value.indexOf("/Function(") == 0) && (value.indexOf(")/", value.length - ")/".length) !== -1)) {
        return eval("(" + value.substring(10, value.length - 2) + ")");
    }

    var myclasses = ["Actor", "Action", "Event", "Response"]; // Could be factorized with the replacer
    var check = __DayDiplomacy_Engine_Script.__DayDiplomacy_Engine_checkForReviver;
    for (var i = 0; i < myclasses.length; i++) {
        var c = myclasses[i];
        var result = check("/" + c + "(", value);
        if (result !== -1) {
            var constructr = __DayDiplomacy_Engine_Script.__DayDiplomacy_Engine_getDiplomacyEngine()[c];
            var obj = new constructr(JSON.parse(result, this));
            if (obj.hasOwnProperty("init")) {
                obj.init(obj);
            }
            return obj;
        }
    }

    return value;
};

this.__DayDiplomacy_Engine_replacer = function (key, value) {
    var t = typeof value;

    if (t === "function") {
        return "/Function(" + value.toString() + ")/";
    }

    if (t === "object" && value.hasOwnProperty("stringifyString")) {
        return value.stringifyString;
    }

    return value;
};

this.__DayDiplomacy_Engine_updater = function (key, value) {
    var t = typeof value;

    if (t === "function") {
        return "/Function(" + value.toString() + ")/";
    }

    if (t === "object" && value.hasOwnProperty("stringifyType")) {
        var result = {};
        for (var id in value) {
            // False map + avoiding fatal recursion + we don't want objects methods
            if (value.hasOwnProperty(id) && id !== "stringifyType" && id !== "stringifyString" && (typeof value[id] !== "function")) {
                result[id] = value[id];
            }
        }
        return "/" + value.stringifyType + "(" + JSON.stringify(result, this) + ")/";
    }

    return value;
};

/*************************** End of methods to save/restore **********************************************/
/*************************** Oolite events ***************************************************************/

this.startUp = function () {
    __DayDiplomacy_Engine_Script.__DayDiplomacy_Engine_getDiplomacyEngine();
};

this.playerWillSaveGame = function (message) {
    var s = __DayDiplomacy_Engine_Script;
    var e = s.__DayDiplomacy_Engine_getDiplomacyEngine();
    var h = e.HISTORIAN;

    h.removeFrameCallback(h);

    var sa = JSON.stringify(e.ARBITER.State, s.__DayDiplomacy_Engine_replacer);
    missionVariables.DayDiplomacyEngine_ArbiterState = sa;

    var sh = JSON.stringify(h.State, s.__DayDiplomacy_Engine_replacer);
    missionVariables.DayDiplomacyEngine_HistorianState = sh;

    h.addFrameCallback(h);
};

this.shipExitedWitchspace = function () {
    var h = __DayDiplomacy_Engine_Script.__DayDiplomacy_Engine_getDiplomacyEngine().getHistorian();
    h.State.jumpTokenNb || (h.State.jumpTokenNb = 0);
    h.State.jumpTokenNb++;
};

this.shipDockedWithStation = function (station) {
    var h = __DayDiplomacy_Engine_Script.__DayDiplomacy_Engine_getDiplomacyEngine().getHistorian();
    h.addFrameCallback(h);
};

this.shipWillLaunchFromStation = function (station) {
    var h = __DayDiplomacy_Engine_Script.__DayDiplomacy_Engine_getDiplomacyEngine().getHistorian();
    h.removeFrameCallback(h);
};

/*************************** End of oolite events ********************************************************/
/*************************** Engine **********************************************************************/

this.__DayDiplomacy_Engine_getDiplomacyEngine = function () {
    // No need to init twice.
    if (__DayDiplomacy_Engine_Script.__DayDiplomacy_Engine_DIPLOMACY_ENGINE) {
        return __DayDiplomacy_Engine_Script.__DayDiplomacy_Engine_DIPLOMACY_ENGINE;
    }

    // Init of the engine and the singletons.
    __DayDiplomacy_Engine_Script.__DayDiplomacy_Engine_DIPLOMACY_ENGINE = __DayDiplomacy_Engine_Script.__DayDiplomacy_Engine_buildEngine();
    var a = __DayDiplomacy_Engine_Script.__DayDiplomacy_Engine_DIPLOMACY_ENGINE.getArbiter(); // At the same time, we init the singleton.
    var h = __DayDiplomacy_Engine_Script.__DayDiplomacy_Engine_DIPLOMACY_ENGINE.getHistorian(); // Idem

    // Loading if necessary.
    var sa = missionVariables.DayDiplomacyEngine_ArbiterState;
    var sh = missionVariables.DayDiplomacyEngine_HistorianState;
    if (sa && sa.length > 0) {
        a.loadState(a, JSON.parse(sa, __DayDiplomacy_Engine_Script.__DayDiplomacy_Engine_reviver));
        h.loadState(h, JSON.parse(sh, __DayDiplomacy_Engine_Script.__DayDiplomacy_Engine_reviver));
    }

    // Returning.
    return __DayDiplomacy_Engine_Script.__DayDiplomacy_Engine_DIPLOMACY_ENGINE;
};

this.__DayDiplomacy_Engine_buildEngine = function () {
    return {

        Action: function (anActionState) {
            this.stringifyType = "Action";
            this.id = anActionState.id;
            this.eventType = anActionState.eventType;
            this.actorType = anActionState.actorType;
            this.actionFunction = anActionState.actionFunction;
        },

        Event: function (anEventState) {
            this.stringifyType = "Event";
            this.eventType = anEventState.eventType;
            this.actorId = anEventState.actorId;
            this.args = anEventState.args;
        },

        Response: function (aResponseState) {
            this.stringifyType = "Response";
            this.id = aResponseState.id;
            this.eventType = aResponseState.eventType;
            this.actorType = aResponseState.actorType; // The type of the responder actor
            // This function must take as first argument the responder actor, 2nd argument the eventActor, and may take as many additional arguments as you wish.
            this.responseFunction = aResponseState.responseFunction;
        },

        DefaultArbiterState: function () {
            return {
                actorsByType: {}, // { actorType => [ actorId ]} // FIXME 0.n: this could be rebuilt rather than saved. Quicker? More consistent?
                actors: {}, // {actorId => actor}
                responses: {}, // { eventType => { actorType => { responseId => response } } }
                initActions: {}, // { actorType => { actionId => action } }
                recurrentActions: {}, // { eventType => { actorType => { actionId => action } } }
                actorMaxId: 1,
                responseMaxId: 1,
                actionMaxId: 1, // Useful to remove recurrentActions and initActions.
                // The base events (or actions) in our history. Some may be added. These events are ordered.
                eventTypes: [
                    // FIXME 0.n: implement all of that :)
                    // "ATTACK", //(System, System)
                    // "LOSS", //(System, System)
                    // "VICTORY", //(System, System)
                    // "BANKRUPTCY", //(System)
                    // "LEAVE", //(System, Alliance)
                    // "JOIN", //(System, Alliance)
                    // "SPLIT", //(Alliance, Alliance...)
                    // "COMBINE", //(Alliance, Alliance)
                    // "TAX", //(Alliance, System)
                    // "SUBSIDIZE", //(Alliance, System)
                    // "DEFENSE_PREPARATION", //(System)
                    // "ATTACK_PREPARATION" //(System)
                ],
                actorTypes: []
            };
        },

        /**
         * Class. Our arbiter, ie responses manager.
         */
        Arbiter: function (anArbiterState) {
            this.State = anArbiterState;

            this.loadState = function (thatArbiter, aState) {
                for (var id in aState) {
                    if (aState.hasOwnProperty(id)) { // False map
                        thatArbiter.State[id] = aState[id];
                    }
                }
            };

            this.getNewActorId = function (thatArbiter) {
                return "DiplomacyActor_" + thatArbiter.State["actorMaxId"]++;
            };

            this.getNewResponseId = function (thatArbiter) {
                return "DiplomacyResponse_" + thatArbiter.State["responseMaxId"]++;
            };

            this.getNewActionId = function (thatArbiter) {
                return "DiplomacyAction_" + thatArbiter.State["actionMaxId"]++;
            };

            this.addActor = function (thatArbiter, anActor) {
                var responses = thatArbiter.State["responses"];
                var initActions = thatArbiter.State["initActions"];
                var eventTypes = thatArbiter.State["eventTypes"];

                // We add the actor to the actors maps.
                thatArbiter.State.actorsByType[anActor.State.actorType].push(anActor.State.id);
                thatArbiter.State.actors[anActor.State.id] = anActor;

                // We complete the existing actor responses with the arbiter responses in an ordered fashion.
                for (var i = 0; i < eventTypes.length; i++) {
                    var eventType = eventTypes[i];
                    responses[eventType] || (responses[eventType] = {});
                    var responsesToAdd = responses[eventType][anActor.State.actorType] || (responses[eventType][anActor.State.actorType] = {});
                    for (var responseId in responsesToAdd) {
                        if (responsesToAdd.hasOwnProperty(responseId)) { // False map
                            anActor.addResponse(anActor, responses[eventType][anActor.State.actorType][responseId]);
                        }
                    }
                }

                // We execute the initActions on the actor
                var initActionsToExecute = initActions[anActor.State.actorType];
                for (var initActionId in initActionsToExecute) {
                    if (initActionsToExecute.hasOwnProperty(initActionId)) { // False map
                        anActor.executeAction(anActor, initActionsToExecute[initActionId]);
                    }
                }
            };

            /**
             * Consistent with history usage.
             */
            this.disableActor = function (thatArbiter, anActor) {
                delete thatArbiter.State.actors[anActor.State.id];

                var arr = thatArbiter.State.actorsByType[anActor.State.actorType];
                arr.splice(arr.indexOf(anActor.State.id), 1);
            };

            this.setInitAction = function (thatArbiter, anInitAction) {
                var initActions = thatArbiter.State["initActions"];
                // We add the initAction to initActions
                initActions[anInitAction.actorType] || (initActions[anInitAction.actorType] = {});
                initActions[anInitAction.actorType][anInitAction.id] = anInitAction;

                // We execute the action on the existing actors in an ordered fashion.
                thatArbiter.executeAction(thatArbiter, anInitAction);
            };

            this.setRecurrentAction = function (thatArbiter, anAction) {
                var recurrentActions = thatArbiter.State.recurrentActions;
                // We add the action to recurrentActions
                recurrentActions[anAction.eventType] || (recurrentActions[anAction.eventType] = {});
                recurrentActions[anAction.eventType][anAction.actorType] || (recurrentActions[anAction.eventType][anAction.actorType] = {});
                recurrentActions[anAction.eventType][anAction.actorType][anAction.id] = anAction;
            };

            this.executeAction = function (thatArbiter, anAction) {
                var ourActorIds = thatArbiter.State.actorsByType[anAction.actorType];
                for (var i = 0; i < ourActorIds.length; i++) {
                    var actor = thatArbiter.State.actors[ourActorIds[i]];
                    actor.executeAction(actor, anAction);
                }
            };

            this.setResponse = function (thatArbiter, aResponse) {
                // We add the response to responses
                thatArbiter.State.responses[aResponse.eventType][aResponse.actorType][aResponse.id] = aResponse;

                // We add the response to the existing actors in an ordered fashion.
                var ourActorIds = thatArbiter.State.actorsByType[aResponse.actorType];
                for (var i = 0; i < ourActorIds.length; i++) {
                    var actor = thatArbiter.State.actors[ourActorIds[i]];
                    actor.addResponse(actor, aResponse);
                }
            };

            this.unsetInitAction = function (thatArbiter, anInitAction) { // This doesn't impact History.
                var initActions = thatArbiter.State["initActions"];
                delete initActions[anInitAction.actorType][anInitAction.id];
            };

            this.unsetRecurrentAction = function (thatArbiter, anAction) { // This doesn't impact History.
                var recurrentActions = thatArbiter.State["recurrentActions"];
                delete recurrentActions[anAction.actorType][anAction.id];
            };

            this.unsetResponse = function (thatArbiter, aResponse) { // This doesn't impact History.
                var responses = thatArbiter.State.responses;
                var actors = thatArbiter.State.actors;

                delete responses[aResponse.eventType][aResponse.actorType][aResponse.id];

                var ourActorIds = thatArbiter.State.actorsByType[aResponse.actorType];
                for (var i = 0; i < ourActorIds.length; i++) {
                    var actor = thatArbiter.State.actors[ourActorIds[i]];
                    actor.removeResponse(actor, aResponse);
                }
            };

            /**
             * name must be different from already existing names.
             * We don't allow to remove eventTypes as it would make the history inconsistent.
             */
            this.addEventType = function (thatArbiter, name, position) {
                thatArbiter.State.eventTypes.splice(position, 0, name);

                thatArbiter.State.responses[name] = {};
                thatArbiter.State.recurrentActions[name] = {};
                for (var i = 0; i < thatArbiter.State.actorTypes.length; i++) {
                    thatArbiter.State.responses[name][thatArbiter.State.actorTypes[i]] = {};
                    thatArbiter.State.recurrentActions[name][thatArbiter.State.actorTypes[i]] = {};
                }

                var h = __DayDiplomacy_Engine_DIPLOMACY_ENGINE.getHistorian();
                h.__addEventType(h, name);
            };

            this.addActorType = function (thatArbiter, name, position) {
                thatArbiter.State.actorTypes.splice(position, 0, name);

                thatArbiter.State.actorsByType[name] = [];
                thatArbiter.State.initActions[name] = {};

                for (var i = 0; i < thatArbiter.State.eventTypes.length; i++) {
                    thatArbiter.State.responses[thatArbiter.State.eventTypes[i]][name] = {};
                    thatArbiter.State.recurrentActions[thatArbiter.State.eventTypes[i]][name] = {};
                }
            };

            /**
             * Gives the next state. Returns empty string if array is finished.
             * @param thatArbiter
             * @param type: "eventTypes" or "actorTypes"
             * @param currentState
             */
            this.nextState = function (thatArbiter, type, currentState) {
                var arr = thatArbiter.State[type];
                var newIndex = arr.indexOf(currentState) + 1;
                return newIndex === arr.length ? "" : arr[newIndex];
            };
        },

        /**
         * Our arbiter singleton.
         */
        getArbiter: function () {
            return __DayDiplomacy_Engine_Script.__DayDiplomacy_Engine_DIPLOMACY_ENGINE.ARBITER = __DayDiplomacy_Engine_Script.__DayDiplomacy_Engine_DIPLOMACY_ENGINE.ARBITER || new __DayDiplomacy_Engine_Script.__DayDiplomacy_Engine_DIPLOMACY_ENGINE.Arbiter(__DayDiplomacy_Engine_Script.__DayDiplomacy_Engine_DIPLOMACY_ENGINE.DefaultArbiterState());
        },

        DefaultHistorianState: function () {
            return {
                eventsHistory: {}, // { date => [ events ] }
                eventsToPublish: {}, // { eventType => [ events ] }
                eventsToPublishNextTurn: {}, // { eventType => [ events ] }
                currentEventType: "",
                currentActorType: "",
                shortStack: []
            };
        },

        /**
         * Class. The historian records the history and informs the systems and alliances.
         */
        Historian: function (aHistorianState) {
            this.State = aHistorianState;

            this.__addEventType = function (thatHistorian, eventTypeName) {
                thatHistorian.State.eventsToPublish[eventTypeName] = [];
                thatHistorian.State.eventsToPublishNextTurn[eventTypeName] = [];
            };

            // TODO 0.n: factorize with previous one?
            this.loadState = function (thatHistorian, aState) {
                for (var id in aState) {
                    if (aState.hasOwnProperty(id)) { // False map
                        thatHistorian.State[id] = aState[id];
                    }
                }
            };

            this.record = function (thatHistorian, anEvent) {
                var eventsToPublish = thatHistorian.State.eventsToPublish;
                var eventType = anEvent.eventType;
                eventsToPublish[eventType] || (eventsToPublish[eventType] = []);
                eventsToPublish[eventType].push(anEvent);
            };

            this.recordForNextTurn = function (thatHistorian, anEvent) {
                var eventsToPublishNextTurn = thatHistorian.State["eventsToPublishNextTurn"];
                var eventType = anEvent.eventType;
                eventsToPublishNextTurn[eventType] || (eventsToPublishNextTurn[eventType] = []);
                eventsToPublishNextTurn[eventType].push(anEvent);
            };

            this.gatherEventsToPublish = function (thatHistorian) {
                var currentEventType = thatHistorian.State.currentEventType;

                // We move the events from eventsToPublishNextTurn to eventsToPublish.
                var eventsToPublishNextTurn = thatHistorian.State.eventsToPublishNextTurn;
                eventsToPublishNextTurn[currentEventType] || (eventsToPublishNextTurn[currentEventType] = []);
                while (eventsToPublishNextTurn[currentEventType].length > 0) { // FIXME 0.n: 'while' could be cut into frames
                    thatHistorian.record(thatHistorian, eventsToPublishNextTurn[currentEventType].shift());
                }

                // We go to next eventType
                var thatArbiter = __DayDiplomacy_Engine_Script.__DayDiplomacy_Engine_DIPLOMACY_ENGINE.getArbiter();
                var newEventType = thatArbiter.nextState(thatArbiter, "eventTypes", currentEventType);
                var finished = newEventType === "";
                thatHistorian.State.currentEventType = finished ? thatArbiter.State.eventTypes[0] : newEventType;
                return finished;
            };

            /**
             * Returns true when everything is finished, else false.
             * @param thatHistorian
             */
            this.populateStack = function (thatHistorian) {
                var currentEventType = thatHistorian.State.currentEventType;
                var currentActorType = thatHistorian.State.currentActorType;
                var thatArbiter = __DayDiplomacy_Engine_Script.__DayDiplomacy_Engine_DIPLOMACY_ENGINE.getArbiter();

                if (!thatHistorian.State.recurrentActionsIsDoneForCurrentEventType) {
                    thatHistorian.putRecurrentActionsOntoStack(thatHistorian, thatArbiter, currentEventType, currentActorType);

                    // We go to next actorType
                    var newActorType = thatArbiter.nextState(thatArbiter, "actorTypes", currentActorType);
                    if (newActorType === "") {
                        thatHistorian.State.currentActorType = thatArbiter.State.actorTypes[0];
                        thatHistorian.State.recurrentActionsIsDoneForCurrentEventType = true;
                    } else {
                        thatHistorian.State.currentActorType = newActorType;
                    }
                    return false; // No need to use too much time.
                }

                // FIXME 0.n: when event is done through stack, put it into history?
                if (thatHistorian.State.eventsToPublish[currentEventType].length > 0) {
                    var thatEvent = thatHistorian.State.eventsToPublish[currentEventType][0];

                    thatHistorian.putEventOntoStack(thatHistorian, thatArbiter, thatEvent, currentActorType);

                    // We go to next actorType
                    var newActorType2 = thatArbiter.nextState(thatArbiter, "actorTypes", currentActorType);
                    if (newActorType2 === "") {
                        thatHistorian.State.currentActorType = thatArbiter.State.actorTypes[0];
                        // The event is processed, we remove it from the array.
                        thatHistorian.State.eventsToPublish[currentEventType].shift();
                    } else {
                        thatHistorian.State.currentActorType = newActorType2;
                    }
                    return false; // No need to use too much time.
                }

                // We go to next eventType
                var newEventType = thatArbiter.nextState(thatArbiter, "eventTypes", currentEventType);
                thatHistorian.State.currentActorType = thatArbiter.State.actorTypes[0];
                thatHistorian.State.recurrentActionsIsDoneForCurrentEventType = false;

                // We may have finished: no more eventType, no more actorType, no more recurrentAction, no more event to respond to.
                var finished = newEventType === "";
                thatHistorian.State.currentEventType = finished ? thatArbiter.State.eventTypes[0] : newEventType;
                return finished;
            };

            this.putRecurrentActionsOntoStack = function (thatHistorian, thatArbiter, currentEventType, currentActorType) {
                var actions = thatArbiter.State.recurrentActions[currentEventType][currentActorType];
                var actorIds = thatArbiter.State.actorsByType[currentActorType];
                for (var id in actions) {
                    if (actions.hasOwnProperty(id)) { // False map
                        for (var n = 0; n < actorIds.length; n++) {
                            thatHistorian.State.shortStack.push({
                                "type": "action",
                                "actor": thatArbiter.State.actors[actorIds[n]],
                                "recurrentAction": actions[id]
                            });
                        }
                    }
                }
            };

            this.putEventOntoStack = function (thatHistorian, thatArbiter, thatEvent, currentActorType) {
                var observers = thatArbiter.State.actors[thatEvent.actorId].State.observers[currentActorType];
                for (var m = 0; m < observers.length; m++) {
                    var observer = thatArbiter.State.actors[observers[m]];
                    // First argument: observer
                    // 2nd arg: eventActor
                    // Other args: other args
                    var someArgs = [observer, thatArbiter.State.actors[thatEvent.actorId]].concat(thatEvent.args);
                    var responsesToExecute = observer.State.responses[thatEvent.eventType];
                    for (var responseId in responsesToExecute) {
                        if (responsesToExecute.hasOwnProperty(responseId)) { // False map
                            thatHistorian.State.shortStack.push({
                                "type": "response",
                                "responseFunction": responsesToExecute[responseId].responseFunction,
                                "args": someArgs
                            });
                        }
                    }
                }
            };

            /**
             * return true if finished (empty stack), false otherwise.
             * @param thatHistorian
             */
            this.executeStack = function (thatHistorian) {
                var action = thatHistorian.State.shortStack.shift();
                if (action === undefined) {
                    return true;
                }
                if (action.type === "action") {
                    action.recurrentAction.actionFunction(action.actor);
                } else { // === "response"
                    action.responseFunction(action.args);
                }
                return false;
            };

            this.addFrameCallback = function (thatHistorian) {
                if (thatHistorian.State.callback) {
                    return; // We don't run it twice
                }

                thatHistorian.State.callback = addFrameCallback(
                    // Our marvelous stack consumer
                    function (delta) {
                        var h = worldScripts["DayDiplomacy_000_Engine"].__DayDiplomacy_Engine_getDiplomacyEngine().HISTORIAN;
                        h.frame = ((h.frame || 0) + 1) % 10; // One action each 10 frames
                        if (h.frame !== 0) {
                            return; // Only one in n frames is used.
                        }

                        if (h.State.isJumpTokenBeingUsed) {

                            var stackIsEmpty = h.executeStack(h);
                            if (!stackIsEmpty) {
                                return; // we did enough this time
                            }

                            var isFinishedPopulating = h.populateStack(h);
                            if (!isFinishedPopulating) {
                                return; // we did enough this time
                            }

                            h.State.isJumpTokenBeingUsed = false;
                            return; // we did enough this time
                        }

                        // Do we have an available jump token?
                        if (h.State.jumpTokenNb > 0) {
                            var isFinishedGathering = h.gatherEventsToPublish(h);
                            if (isFinishedGathering) {
                                h.State.jumpTokenNb--;
                                h.State.isJumpTokenBeingUsed = true;
                            }
                            return; // we did enough this time
                        }

                        // We have finished, we remove the callback
                        h.removeFrameCallback(h);
                    });
            };

            this.removeFrameCallback = function (thatHistorian) {
                if (thatHistorian.State.callback) {
                    removeFrameCallback(thatHistorian.State.callback);
                    delete thatHistorian.State.callback;
                }
            };
        },

        /**
         * Our historian singleton.
         */
        getHistorian: function () {
            return __DayDiplomacy_Engine_Script.__DayDiplomacy_Engine_DIPLOMACY_ENGINE.HISTORIAN = __DayDiplomacy_Engine_Script.__DayDiplomacy_Engine_DIPLOMACY_ENGINE.HISTORIAN || new __DayDiplomacy_Engine_Script.__DayDiplomacy_Engine_DIPLOMACY_ENGINE.Historian(__DayDiplomacy_Engine_Script.__DayDiplomacy_Engine_DIPLOMACY_ENGINE.DefaultHistorianState());
        },

        DefaultActorState: function (anActorType, anId) {
            return {
                id: anId,
                actorType: anActorType,
                responses: {}, // { eventType => { id => response } }
                observers: {} // { actorType => [ actorIds ]} Ids of actors who can respond to this actor acts.
            };
        },

        /**
         * Class. A planetary system or an alliance, or whatever you wish :)
         * Must be init'd after instanciation.
         */
        Actor: function (anActorState) {
            this.stringifyType = "Actor";
            this.State = anActorState.hasOwnProperty("State") ? anActorState.State : anActorState;

            this.stringify = function (thatActor) {
                thatActor.stringifyString = JSON.stringify(thatActor, __DayDiplomacy_Engine_Script.__DayDiplomacy_Engine_updater);
            };

            this.init = function (thatActor) {
                thatActor.stringify(thatActor);
            };

            this.toString = function (thatActor) {
                return thatActor.stringifyString;
            };

            this.executeAction = function (thatActor, anAction) {
                anAction.actionFunction(thatActor);
            };

            this.act = function (thatActor, anEventType, someArgs) {
                var h = __DayDiplomacy_Engine_Script.__DayDiplomacy_Engine_DIPLOMACY_ENGINE.getHistorian();
                h.record(h, new __DayDiplomacy_Engine_Script.__DayDiplomacy_Engine_DIPLOMACY_ENGINE.Event({
                    eventType: anEventType,
                    actorId: thatActor.State.id,
                    args: someArgs
                }));
            };

            this.actNextTurn = function (thatActor, anEventType, someArgs) {
                var h = __DayDiplomacy_Engine_Script.__DayDiplomacy_Engine_DIPLOMACY_ENGINE.getHistorian();
                h.recordForNextTurn(h, new __DayDiplomacy_Engine_Script.__DayDiplomacy_Engine_DIPLOMACY_ENGINE.Event({
                    eventType: anEventType,
                    actorId: thatActor.State.id,
                    args: someArgs
                }));
            };

            this.addResponse = function (thatActor, aResponse) {
                thatActor.State.responses[aResponse.eventType] || (thatActor.State.responses[aResponse.eventType] = {});
                thatActor.State.responses[aResponse.eventType][aResponse.id] = aResponse;
                thatActor.stringify(thatActor);
            };

            this.removeResponse = function (thatActor, aResponse) {
                delete thatActor.State.responses[aResponse.eventType][aResponse.id];
                thatActor.stringify(thatActor);
            };

            this.addObserver = function (thatActor, thatObserverType, thatObserverId) {
                var arr = thatActor.State.observers[thatObserverType] || (thatActor.State.observers[thatObserverType] = []);
                arr.push(thatObserverId);
                thatActor.stringify(thatActor);
            };
        }
    };
};
// FIXME 0.3: make IDiplomacy allowing to access the public methods? Into another js script? Speed cost?