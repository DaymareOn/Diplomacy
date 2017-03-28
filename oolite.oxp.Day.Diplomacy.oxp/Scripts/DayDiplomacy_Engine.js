"use strict";
this.name = "DayDiplomacy_000_Engine";
this.author = "David (Day) Pradier";
this.copyright = "(C) 2017 David Pradier";
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script is the engine of the Diplomacy OXP.";

/*************************** Closures ********************************************************************/

this._missionVariables = missionVariables;
this._jsonparse = JSON.parse;
this.jsonstringify = JSON.stringify;
this.functionRegexp = new RegExp(/^\/Function\(.*\)\/$/);
this.functionReplaceRegexp = new RegExp(/^\/Function\((.*)\)\/$/);
this.functionReplaceString = "($1)";
this.escapingRegexp = new RegExp(/\\"/g);
this.unescape = unescape;
this.replaceString = "$1";

/*************************** End of closures *************************************************************/
/*************************** Engine **********************************************************************/

this._loadState = function (thatState, aState) {
    for (var id in aState) {
        if (aState.hasOwnProperty(id)) { // Avoiding prototypes' fields
            thatState[id] = aState[id];
        }
    }
};

this.prototype.$getEngine = function() {
    // Init of the engine and the singletons.
    var e = this._buildEngine();
    this._e = e;
    var as = e._getArbiter().State; // At the same time, we init the singleton.
    var hs = e._getHistorian().State; // Idem

    // Loading if necessary.
    var sa = this._missionVariables.DayDiplomacyEngine_ArbiterState;
    var sh = this._missionVariables.DayDiplomacyEngine_HistorianState;
    if (sa && sa.length > 0) {
        this._loadState(as, this._jsonparse(sa, this._reviver));
        this._loadState(hs, this._jsonparse(sh, this._reviver));
    }

    // We set the shadowing method to avoid init'ing each time.
    this.$getEngine = function () {
        return this._e;
    };

    // Returning.
    return e;
};

this._buildEngine = function () {
    var engine = {

        $Action: function (anActionState) {
            this.id = anActionState.id;
            this.eventType = anActionState.eventType;
            this.actorType = anActionState.actorType;
            this.actionFunction = anActionState.actionFunction;
        },

        $Event: function (anEventState) {
            this.eventType = anEventState.eventType;
            this.actorId = anEventState.actorId;
            this.args = anEventState.args;
        },

        Response: function (aResponseState) {
            this.id = aResponseState.id;
            this.eventType = aResponseState.eventType;
            this.actorType = aResponseState.actorType; // The type of the responder actor
            // This function must take as first argument the responder actor, 2nd argument the eventActor, and may take as many additional arguments as you wish.
            this.responseFunction = aResponseState.responseFunction;
        },

        DefaultArbiterState: function () {
            return {
                // FIXME 0.n: this could be rebuilt rather than saved. Quicker? More consistent?
                actorsByType: {}, // { actorType => [ actorId ]}
                actors: {}, // {actorId => actor}
                responses: {}, // { eventType => { actorType => { responseId => response } } }
                initActions: {}, // { actorType => { actionId => action } }
                recurrentActions: {}, // { eventType => { actorType => { actionId => action } } }
                actorMaxId: 1,
                responseMaxId: 1,
                actionMaxId: 1, // Useful to remove recurrentActions and initActions.
                // The base events (or actions) in our history. Some may be added. These events are ordered.
                eventTypes: [],
                actorTypes: []
            };
        },

        /**
         * Class. Our arbiter, ie responses manager.
         */
        Arbiter: function (anArbiterState) {
            this.State = anArbiterState;

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
                for (var i = 0, z = eventTypes.length; i < z; i++) {
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
                for (var i = 0, z = ourActorIds.length; i < z; i++) {
                    var actor = thatArbiter.State.actors[ourActorIds[i]];
                    actor.executeAction(actor, anAction);
                }
            };

            this.setResponse = function (thatArbiter, aResponse) {
                // We add the response to responses
                thatArbiter.State.responses[aResponse.eventType][aResponse.actorType][aResponse.id] = aResponse;

                // We add the response to the existing actors in an ordered fashion.
                var ourActorIds = thatArbiter.State.actorsByType[aResponse.actorType];
                for (var i = 0, z = ourActorIds.length; i < z; i++) {
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
                for (var i = 0, z = ourActorIds.length; i < z; i++) {
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
                for (var i = 0, z = thatArbiter.State.actorTypes.length; i < z; i++) {
                    thatArbiter.State.responses[name][thatArbiter.State.actorTypes[i]] = {};
                    thatArbiter.State.recurrentActions[name][thatArbiter.State.actorTypes[i]] = {};
                }

                var h = _e._getHistorian();
                h.__addEventType(h, name);
            };

            this.addActorType = function (thatArbiter, name, position) {
                thatArbiter.State.actorTypes.splice(position, 0, name);

                thatArbiter.State.actorsByType[name] = [];
                thatArbiter.State.initActions[name] = {};

                for (var i = 0, z = thatArbiter.State.eventTypes.length; i < z; i++) {
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
        _getArbiter: function () {
            return __DayDiplomacy_Engine_Script._e.ARBITER = __DayDiplomacy_Engine_Script._e.ARBITER || new __DayDiplomacy_Engine_Script._e.Arbiter(__DayDiplomacy_Engine_Script._e.DefaultArbiterState());
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

            this.record = function (thatHistorian, anEvent) {
                var eventsToPublish = thatHistorian.State.eventsToPublish;
                var eventType = anEvent.eventType;
                eventsToPublish[eventType] || (eventsToPublish[eventType] = []);
                eventsToPublish[eventType].push(anEvent);
            };

            this.recordForNextTurn = function (thatHistorian, anEvent) {
                var eventsToPublishNextTurn = thatHistorian.State.eventsToPublishNextTurn;
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
                var thatArbiter = __DayDiplomacy_Engine_Script._e._getArbiter();
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
                var thatArbiter = __DayDiplomacy_Engine_Script._e._getArbiter();

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
                        for (var n = 0, z = actorIds.length; n < z; n++) {
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
                for (var m = 0, z = observers.length; m < z; m++) {
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
                    function (delta) { // FIXME 0.n we could reuse the function rather than create it each time
                        var h = worldScripts["DayDiplomacy_000_Engine"].$getEngine().HISTORIAN;
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
        _getHistorian: function () {
            return __DayDiplomacy_Engine_Script._e.HISTORIAN = __DayDiplomacy_Engine_Script._e.HISTORIAN || new __DayDiplomacy_Engine_Script._e.Historian(__DayDiplomacy_Engine_Script._e.DefaultHistorianState());
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
            // FIXME 0.6: the test anActorState.State should be enough?
            this.State = anActorState.hasOwnProperty("State") ? anActorState.State : anActorState;
        }
    };

    // Using prototype rather than defining it into Actor allows to have only one method/field defined rather than one per Actor.
    // This is useless for Arbiter and Historian, as they are singletons.
    engine.Actor.prototype.stringifyType = "Actor";
    engine.$Action.prototype.stringifyType = "$Action";
    engine.$Event.prototype.stringifyType = "Event";
    engine.Response.prototype.stringifyType = "Response";

    engine.Actor.prototype.stringify = function (thatActor) {
        thatActor.stringifyString = JSON.stringify(thatActor, __DayDiplomacy_Engine_Script.__DayDiplomacy_Engine_updater);
    };

    engine.Actor.prototype.init = function (thatActor) {
        thatActor.stringify(thatActor);
    };

    engine.Actor.prototype.toString = function (thatActor) {
        return thatActor.stringifyString;
    };

    engine.Actor.prototype.executeAction = function (thatActor, anAction) {
        anAction.actionFunction(thatActor);
    };

    engine.Actor.prototype.act = function (thatActor, anEventType, someArgs) {
        var h = __DayDiplomacy_Engine_Script._e._getHistorian();
        h.record(h, new __DayDiplomacy_Engine_Script._e.$Event({
            eventType: anEventType,
            actorId: thatActor.State.id,
            args: someArgs
        }));
    };

    engine.Actor.prototype.actNextTurn = function (thatActor, anEventType, someArgs) {
        var h = __DayDiplomacy_Engine_Script._e._getHistorian();
        h.recordForNextTurn(h, new __DayDiplomacy_Engine_Script._e.$Event({
            eventType: anEventType,
            actorId: thatActor.State.id,
            args: someArgs
        }));
    };

    engine.Actor.prototype.addResponse = function (thatActor, aResponse) {
        thatActor.State.responses[aResponse.eventType] || (thatActor.State.responses[aResponse.eventType] = {});
        thatActor.State.responses[aResponse.eventType][aResponse.id] = aResponse;
        thatActor.stringify(thatActor);
    };

    engine.Actor.prototype.removeResponse = function (thatActor, aResponse) {
        delete thatActor.State.responses[aResponse.eventType][aResponse.id];
        thatActor.stringify(thatActor);
    };

    engine.Actor.prototype.addObserver = function (thatActor, thatObserverType, thatObserverId) {
        var arr = thatActor.State.observers[thatObserverType] || (thatActor.State.observers[thatObserverType] = []);
        arr.push(thatObserverId);
        thatActor.stringify(thatActor);
    };

    engine.$Action.prototype.stringifyRegexp = new RegExp(/^Action\(.*\)$/);
    engine.Actor.prototype.stringifyRegexp = new RegExp(/^Actor\(.*\)$/);
    engine.$Event.prototype.stringifyRegexp = new RegExp(/^Event\(.*\)$/);
    engine.Response.prototype.stringifyRegexp = new RegExp(/^Response\(.*\)$/);
    engine.Actor.prototype.replaceRegexp = new RegExp(/^\/Actor\((.*)\)\/$/);
    engine.$Action.prototype.replaceRegexp = new RegExp(/^\/Action\((.*)\)\/$/);
    engine.$Event.prototype.replaceRegexp = new RegExp(/^\/Event\((.*)\)\/$/);
    engine.Response.prototype.replaceRegexp = new RegExp(/^\/Response\((.*)\)\/$/);

    return engine;
};

/*************************** End of engine ***************************************************************/
/*************************** Oolite events ***************************************************************/

this.startUp = function () {
    this.$getEngine(); // Ensuring initialization
    this.shipDockedWithStation(null); // When starting, the player is docked.
    delete this.startUp;
};

this.playerWillSaveGame = function (message) {
    this._h.removeFrameCallback(this._h);
    this._missionVariables.DayDiplomacyEngine_ArbiterState = this.jsonstringify(this._a.State, this.__DayDiplomacy_Engine_replacer);
    this._missionVariables.DayDiplomacyEngine_HistorianState = this.jsonstringify(this._h.State, this.__DayDiplomacy_Engine_replacer);
    this._h.addFrameCallback(this._h);
};

// FIXME would it be possible to implement singletons through prototypes? The interest being we would not test each time for null :)
// FIXME rename direct with $, privates with _

this.shipExitedWitchspace = function () {
    var hs = this._h.State;
    hs.jumpTokenNb || (hs.jumpTokenNb = 0);
    hs.jumpTokenNb++;
};

this.shipDockedWithStation = function (station) {
    this.shipExitedWitchspace(); // FIXME Debug
    this._h.addFrameCallback(this._h);
};

this.shipWillLaunchFromStation = function (station) {
    this._h.removeFrameCallback(this._h);
};

/*************************** End of oolite events ********************************************************/
/*************************** Methods to save/restore *****************************************************/

// We cannot avoid a closure on eval as it cannot be referenced outside of calls.
// FIXME Where is it called, really? what about closure?
this._reviver = function (key, value) {

    // All our special cases are strings
    if (typeof value !== "string") {
        return value;
    }

    // FIXME benchmark using only one regexp rather than 2
    if (value.match(this.functionRegexp)) {
        return eval(value.replace(this.functionReplaceRegexp, this.functionReplaceString));
    }

    for (var i = 0; i < 4; i++) {
        var c = this.classesData[i];
        var clas = c.class;
        if (value.match(clas.stringifyRegexp)) {
            // FIXME simplify ?
            var obj = new clas(this._jsonparse(this.unescape(value.replace(clas.replaceRegexp, this.replaceString)).replace(this.escapingRegexp, "\""), this));
            if (obj.init) {
                obj.init(obj);
            }
            return obj;
        }
    }

    return value;
};

this._reviver.prototype.classesData = [
    this.$getEngine()["Actor"],
    this.$getEngine()["$Action"],
    this.$getEngine()["$Event"],
    this.$getEngine()["Response"]];

// FIXME Where is it called, really? what about closure?
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

    if (t === "object" && value.stringifyType) {
        var result = {};
        for (var id in value) {
            // False map + avoiding fatal recursion + we don't want methods or prototype fields
            if (value.hasOwnProperty(id) && id !== "stringifyString") {
                result[id] = value[id];
            }
        }
        return "/" + value.stringifyType + "(" + this.jsonstringify(result, this) + ")/";
    }

    return value;
};
this.__DayDiplomacy_Engine_updater.prototype.jsonstringify = JSON.stringify;

/*************************** End of methods to save/restore **********************************************/