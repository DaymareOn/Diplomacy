"use strict";
this.name = "DayDiplomacy_000_Engine";
this.author = "David (Day) Pradier";
this.copyright = "(C) 2017 David Pradier";
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script is the engine of the Diplomacy OXP.";

/*************************** Closures ********************************************************************/
this._missionVariables = missionVariables;
this._JSON = JSON;
/*************************** End of closures *************************************************************/

/*************************** Engine **********************************************************************/
this._loadState = function (toBeModifiedState, sourceState) {
    for (var id in sourceState) {
        if (sourceState.hasOwnProperty(id)) { // Avoiding prototypes' fields
            toBeModifiedState[id] = sourceState[id];
        }
    }
};
// this.$Actor.prototype.act = function (anEventType, someArgs) {
//     this.record({eventType: anEventType, actorId: this.State.id, args: someArgs});
// };
// this.$Actor.prototype.actNextTurn = function (anEventType, someArgs) {
//     this.recordForNextTurn({eventType: anEventType, actorId: this.State.id, args: someArgs});
// };
// this.$Actor.prototype.addResponse = function (aResponse) {
//     var responses = this.State.responses;
//     (responses[aResponse.eventType] || (responses[aResponse.eventType] = [])).push(aResponse.id);
// };
// this.$Actor.prototype.removeResponse = function (aResponse) {
//     var arr = this.State.responses[aResponse.eventType];
//     arr.splice(arr.indexOf(aResponse.id), 1);
// };
this.State = {
    actors: {}, // {actorId => actor}
    initActions: {}, // { actionId => action }
    recurrentActions: {}, // { actionId => action }
//        events: {}, // { eventId => event }
//        responses: {}, // { responseId => response }
    actorsByType: {}, // { actorType => [ actorId ]}
    initActionsByType: {}, // { actorType => [ actionId ] }
    recurrentActionsByType: {}, // { eventType => { actorType => [ actionId ] } }
    // responsesByType: {}, // { eventType => { actorType => [ responseId ] } }
    actorMaxId: 1,
    actionMaxId: 1, // Useful to remove recurrentActions and initActions.
    // eventMaxId: 1,
    // responseMaxId: 1,
    functionMaxId: 1,
    eventTypes: [],
    actorTypes: [],
    // eventsHistory: {}, // { date => [ eventIds ] }
    eventsToPublish: {}, // { eventType => [ eventIds ] }
    eventsToPublishNextTurn: {}, // { eventType => [ eventIds ] }
    currentEventType: "",
    currentActorType: "",
    shortStack: []
};
this.Functions = {};// { functionId (string) => function }
this.$getNewActorId = function () {
    return "DAr_" + this.State.actorMaxId++;
};
// this.getNewResponseId = function () {
//     return "DR_" + this.State.responseMaxId++;
// };
this.$getNewActionId = function () {
    return "DAn_" + this.State.actionMaxId++;
};
this.$getNewFunctionId = function () {
    return "DFn_" + this.State.functionMaxId++;
};
// this.$getNewEventId = function () {
//     return "DEt_" + this.State.eventMaxId++;
// };
this.$letActorExecuteAction = function (anActor, anAction) {
    this.Functions[anAction.actionFunctionId](anActor);
};
this.$addActor = function (anActor) {
    var state = this.State, responses = state.responses, initActions = state.initActions,
        initActionsByType = state.initActionsByType, eventTypes = state.eventTypes, actorType = anActor.actorType,
        id = anActor.id;

    // We add the actor to the actors maps.
    state.actorsByType[actorType].push(id);
    state.actors[id] = anActor;

    // We complete the existing actor responses with the engine responses.
    // var z = eventTypes.length;
    // while (z--) {
    //     var eventType = eventTypes[z];
    //     var eventTypeResponses = responses[eventType] || (responses[eventType] = {});
    //     var responsesToAdd = eventTypeResponses[actorType] || (eventTypeResponses[actorType] = {});
    //     for (var rid in responsesToAdd) {
    //         if (responsesToAdd.hasOwnProperty(rid)) { // False map
    //             anActor.addResponse(rid);
    //         }
    //     }
    // }

    // We execute the initActions on the actor
    var initActionsToExecute = initActionsByType[actorType];
    var z = initActionsToExecute.length;
    while (z--) {
        this.$letActorExecuteAction(anActor, initActions[initActionsToExecute[z]]);
    }
};
// Consistent with history usage.
// this.disableActor = function (anActor) {
//     var engineState = this.State, actorState = anActor.State, arr = engineState.actorsByType[actorState.actorType];
//     arr.splice(arr.indexOf(actorState.id), 1);
//     delete engineState.actors[actorState.id];
// };
this.$addObserverToActor = function (anActor, thatObserverType, thatObserverId) {
    var observers = anActor.observers;
    (observers[thatObserverType] || (observers[thatObserverType] = [])).push(thatObserverId);
};
this.$setFunction = function(anId, aFunction) {
    this.Functions[anId] = aFunction;
};
this.$setInitAction = function (anInitAction) {
    var initActions = this.State.initActions, initActionActorType = anInitAction.actorType;
    // We add the initAction to initActions
    (initActions[initActionActorType] || (initActions[initActionActorType] = {}))[anInitAction.id] = anInitAction;

    // We execute the action on the existing actors in an ordered fashion.
    this.$executeAction(anInitAction);
};
// We add the action to recurrentActions
this.$setRecurrentAction = function (anAction) {
    var recurrentActionsByType = this.State.recurrentActionsByType, recurrentActions = this.State.recurrentActions,
        actionEventType = anAction.eventType, actionActorType = anAction.actorType;
    var eventTypeActions = recurrentActionsByType[actionEventType] || (recurrentActionsByType[actionEventType] = {});
    (eventTypeActions[actionActorType] || (eventTypeActions[actionActorType] = [])).push(anAction.id);
    recurrentActions[anAction.id] = anAction;
};
this.$executeAction = function (anAction) {
    var ourActorIds = this.State.actorsByType[anAction.actorType], actors = this.State.actors;
    var z = ourActorIds.length;
    while (z--) {
        this.$letActorExecuteAction(actors[ourActorIds[z]], anAction);
    }
};
// this.setResponse = function (aResponse) {
//     var state = this.State, actors = state.actors;
//     // We add the response to responses
//     state.responses[aResponse.eventType][aResponse.actorType][aResponse.id] = aResponse;
//
//     // We add the response to the existing actors in an ordered fashion.
//     var ourActorIds = state.actorsByType[aResponse.actorType];
//     var z = ourActorIds.length;
//     while (z--) {
//         actors[ourActorIds[z]].addResponse(aResponse);
//     }
// };
// this.unsetInitAction = function (anInitAction) { // This doesn't impact History.
//     delete this.State.initActions[anInitAction.actorType][anInitAction.id];
// };
// this.unsetRecurrentAction = function (anAction) { // This doesn't impact History.
//     var engineState = this.State, arr = engineState.recurrentActionsByType[anAction.eventType][anAction.actorType];
//     arr.splice(arr.indexOf(anAction.id), 1);
//     delete engineState.recurrentActions[anAction.id];
// };
// this.unsetResponse = function (aResponse) { // This doesn't impact History.
//     var state = this.State, actors = state.actors;
//     delete state.responses[aResponse.eventType][aResponse.actorType][aResponse.id];
//     var ourActorIds = state.actorsByType[aResponse.actorType];
//     var z = ourActorIds.length;
//     while (z--) {
//         actors[ourActorIds[z]].removeResponse(aResponse);
//     }
// };
/**
 * name must be different from already existing names.
 * We don't allow to remove eventTypes as it would make the history inconsistent.
 */
this.$addEventType = function (name, position) {
    var state = this.State;
    state.eventTypes.splice(position, 0, name);
    // var ourResponses = (state.responses[name] = {});
    var ourRecurrentActions = (state.recurrentActionsByType[name] = {});
    var actorTypes = state.actorTypes;
    var z = actorTypes.length;
    while (z--) {
        var ourActorType = actorTypes[z];
        // ourResponses[ourActorType] = {};
        ourRecurrentActions[ourActorType] = [];
    }
    // state.eventsToPublish[name] = [];
    // state.eventsToPublishNextTurn[name] = [];
};
this.$addActorType = function (name, position) {
    var state = this.State;
    state.actorTypes.splice(position, 0, name);

    state.actorsByType[name] = [];
    state.initActionsByType[name] = [];

    // var responses = state.responses;
    var recurrentActions = state.recurrentActionsByType;
    var z = state.eventTypes.length;
    while (z--) {
        var eventType = state.eventTypes[z];
        // responses[eventType][name] = {};
        recurrentActions[eventType][name] = [];
    }
};
/**
 * Gives the next state. Returns empty string if array is finished.
 * @param type: "eventTypes" or "actorTypes"
 * @param currentState
 */
this._nextState = function (type, currentState) {
    var arr = this.State[type];
    var newIndex = arr.indexOf(currentState) + 1;
    return newIndex === arr.length ? "" : arr[newIndex];
};
// this.record = function (anEvent) {
//     var eventsToPublish = this.State.eventsToPublish, eventType = anEvent.eventType;
//     (eventsToPublish[eventType] || (eventsToPublish[eventType] = [])).push(anEvent);
// };
// this.recordForNextTurn = function (anEvent) {
//     var eventsToPublishNextTurn = this.State.eventsToPublishNextTurn, eventType = anEvent.eventType;
//     (eventsToPublishNextTurn[eventType] || (eventsToPublishNextTurn[eventType] = [])).push(anEvent);
// };
this._gatherEventsToPublish = function () {
    var state = this.State;
    var currentEventType = state.currentEventType, eventsToPublishNextTurn = state.eventsToPublishNextTurn;
    var ourEvents = (eventsToPublishNextTurn[currentEventType] || (eventsToPublishNextTurn[currentEventType] = []));
    // FIXME 0.n, when we use Events: does the length change? check through logs
    // FIXME 0.n, when we use Events: 'while' could be cut into frames, but it would slow the history. Check the time spent through logs
    while (ourEvents.length) {
        var z = ourEvents.length;
        while (z--) {
            this.record(ourEvents.shift());
        }
    }

    // We go to next eventType
    var newEventType = this._nextState("eventTypes", currentEventType);
    state.currentEventType = newEventType || state.eventTypes[0];
    state.currentActorType = state.actorTypes[0];
    return !newEventType;
};
/**
 * Returns true when everything is finished, else false.
 */
this._populateStack = function () {
    var state = this.State, currentEventType = state.currentEventType, currentActorType = state.currentActorType,
        firstActorType = state.actorTypes[0];
    if (!state.recurrentActionsIsDoneForCurrentEventType) {
        this._putRecurrentActionsOntoStack(currentEventType, currentActorType);

        // We go to next actorType
        var newActorType = this._nextState("actorTypes", currentActorType);
        state.currentActorType = newActorType || firstActorType;
        state.recurrentActionsIsDoneForCurrentEventType = !newActorType;
        return false; // No need to use too much time.
    }

    // var ourEvents = state.eventsToPublish[currentEventType];
    // if (ourEvents.length) {
    //     this.putEventOntoStack(ourEvents[0], currentActorType);
    //
    //     // We go to next actorType
    //     var newActorType2 = this._nextState("actorTypes", currentActorType);
    //     state.currentActorType = newActorType2 || firstActorType;
    //     // When the event is processed, we remove it from the array.
    //     newActorType2 || ourEvents.shift();
    //     return false; // No need to use too much time.
    // }

    // We go to next eventType
    state.currentActorType = firstActorType;
    state.recurrentActionsIsDoneForCurrentEventType = false;
    var newEventType = this._nextState("eventTypes", currentEventType);
    // We may have finished: no more eventType, no more actorType, no more recurrentAction, no more event to respond to.
    state.currentEventType = newEventType || state.eventTypes[0];
    return !newEventType;
};
this._putRecurrentActionsOntoStack = function (currentEventType, currentActorType) {
    var state = this.State, actions = state.recurrentActionsByType[currentEventType][currentActorType],
        actorIds = state.actorsByType[currentActorType], shortStack = state.shortStack;
    var y = actions.length;
    while (y--) {
        var id = actions[y];
        var z = actorIds.length;
        while (z--) {
            shortStack.push({type: "action", actorId: actorIds[z], recurrentActionId: id});
        }
    }
};
// this.putEventOntoStack = function (thatEvent, currentActorType) {
//     var eventActorId = thatEvent.actorId, eventEventType = thatEvent.eventType, eventArgs = thatEvent.args,
//         state = this.State, actors = state.actors, eventActor = actors[eventActorId],
//         observers = eventActor.State.observers[currentActorType], z = observers.length, shortStack = state.shortStack,
//         responses = state.responses[eventEventType];
//     while (z--) {
//         var observer = actors[observers[z]];
//         // First argument: observer, 2nd arg: eventActor, other args: other args
//         var someArgs = [observer, eventActor].concat(eventArgs);
//         var responseIds = observer.State.responses[eventEventType];
//         var y = responseIds.length;
//         while (y--) {
//             shortStack.push({
//                 type: "response",
//                 responseFunction: responses[responseIds[y]].responseFunction, // FIXME put the id in the shortstack
//                 args: someArgs
//             });
//         }
//     }
// };
/**
 * return true if finished (empty stack), false otherwise.
 */
this._executeStack = function () {
    var s = this.State;
    var action = s.shortStack.shift();
    if (action === undefined) {
        return true;
    }
    if (action.type == "action") {
        this.Functions[s.recurrentActions[action.recurrentActionId].actionFunctionId](s.actors[action.actorId]);
        // } else { // == "response"
        //     action.responseFunction(action.args);
    }
    return false;
};
this._addFrameCallback = function () {
    this.State.callback || (this.State.callback = addFrameCallback(this._ourFrameCallback));
};
this._removeFrameCallback = function () {
    if (this.State.callback) {
        removeFrameCallback(this.State.callback);
        delete this.State.callback;
    }
};
this._ourFrameCallback = function (delta) {
    if (this._frame = ((this._frame || 0) + 1) % 10) { // One action each 10 frames
        return; // Only one in n frames is used.
    }

    var state = this.State;
    if (state.isJumpTokenBeingUsed) {
        state.isJumpTokenBeingUsed = !(this._executeStack() && this._populateStack()); // Still some work to do ?
        return; // we did enough this time
    }

    if (state.jumpTokenNb) { // Do we have an available jump token?
        if (this._gatherEventsToPublish()) { // Finished gathering
            state.jumpTokenNb--;
            state.isJumpTokenBeingUsed = true;
        }
        return; // we did enough this time
    }

    this._removeFrameCallback(); // We have finished, we remove the callback
}.bind(this);
/*************************** End of engine ***************************************************************/

/*************************** Methods to save/restore *****************************************************/
this._functionReplacer = function (key, value) {
    return typeof value == 'function' ? '/Function(' + value.toString() + ')/' : value;
};
this._functionReviver = (function () {
    var innerFn = function innerFn(key, value) {
        // All our special cases are strings // FIXME check if we get something else than string
        if (typeof value != 'string') {
            return value;
        }

        var that = innerFn; // Closure for recursion
        if (value.match(that._functionRegexp)) { // FIXME 0.n: benchmark using only one regexp rather than 2
            return eval(value.replace(that._functionReplaceRegexp, '($1)'));
        }
        return value;
    };
    innerFn._functionRegexp = new RegExp("^\\/Function\\([\\s\\S]*\\)\\/$");
    innerFn._functionReplaceRegexp = new RegExp("^\\/Function\\(([\\s\\S]*)\\)\\/$");
    return innerFn;
}.bind(this))();
/*************************** End of methods to save/restore **********************************************/

/*************************** Oolite events ***************************************************************/
this._startUp = function () {
    var as = this.State;
    var sa = this._missionVariables.DayDiplomacyEngine_EngineState;
    if (sa && sa.length) { // Loading if necessary.
        this._loadState(as, this._JSON.parse(sa));
        this._loadState(this.Functions, this._JSON.parse(this._missionVariables.DayDiplomacyEngine_Functions, this._functionReviver));
    }

    delete this._startUp; // No need to startup twice
    this.shipDockedWithStation(null); // When starting, the player is docked.
};
this.playerWillSaveGame = function (message) {
    this._removeFrameCallback();
    var start = new Date();
    this._missionVariables.DayDiplomacyEngine_EngineState = this._JSON.stringify(this.State);
    this._missionVariables.DayDiplomacyEngine_Functions = this._JSON.stringify(this.Functions, this._functionReplacer);
    var end = new Date();
    log("DiplomacyEngine", "Saved in ms: " + (end.getTime() - start.getTime()));
    this._addFrameCallback();
};
this.shipExitedWitchspace = function () {
    var s = this.State;
    s.jumpTokenNb || (s.jumpTokenNb = 0);
    s.jumpTokenNb++;
};
this.shipDockedWithStation = function (station) {
    this._addFrameCallback();
};
this.shipWillLaunchFromStation = function (station) {
    this._removeFrameCallback();
};
/*************************** End of oolite events ********************************************************/

/*************************** Subscribing system for scripts order ****************************************/
this.startUp = function () {
    worldScripts.DayDiplomacy_000_Engine.$subscribe(this.name);
    delete this.startUp; // No need to startup twice
};
this.startUpComplete = function () {
    var s = this._subscribers.sort();
    var z = s.length, y = z - 1;
    while (z--) {
        var startDate = new Date();
        worldScripts[s[y - z]]._startUp();
        log(s[y - z], "startUp in ms: " + (new Date().getTime() - startDate.getTime()));
    }
    delete this.startUpComplete; // No need to startup twice
};
this._subscribers = []; // [ scriptName ]
this.$subscribe = function (aScriptName) {
    this._subscribers.push(aScriptName);
};
/*************************** End of subscribing system for scripts order *********************************/