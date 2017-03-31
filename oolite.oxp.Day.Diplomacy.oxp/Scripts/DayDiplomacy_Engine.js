"use strict";
this.name = "DayDiplomacy_000_Engine";
this.author = "David (Day) Pradier";
this.copyright = "(C) 2017 David Pradier";
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script is the engine of the Diplomacy OXP.";

/*************************** Closures ********************************************************************/

this._missionVariables = missionVariables;
this._jsonparse = JSON.parse;
this._jsonstringify = JSON.stringify;

/*************************** End of closures *************************************************************/
/*************************** Engine **********************************************************************/

this.$buildDefaultActorState = function (anActorType, anId) {
    return {
        id: anId,
        actorType: anActorType,
        responses: {}, // { eventType => { id => response } }
        observers: {} // { actorType => [ actorIds ]} Ids of actors who can respond to this actor acts.
    };
};
// FIXME 0.n: actorsByType could be rebuilt rather than saved. Quicker? More consistent? Unicity?
this._buildDefaultEngineState = function () {
    return {
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
        actorTypes: [],
        eventsHistory: {}, // { date => [ events ] }
        eventsToPublish: {}, // { eventType => [ events ] }
        eventsToPublishNextTurn: {}, // { eventType => [ events ] }
        currentEventType: "",
        currentActorType: "",
        shortStack: []
    };
};

this._loadState = function (thatState, aState) {
    for (var id in aState) {
        if (aState.hasOwnProperty(id)) { // Avoiding prototypes' fields
            thatState[id] = aState[id];
        }
    }
};

this.$Action = function (anActionState) {
    this.id = anActionState.id;
    this.eventType = anActionState.eventType;
    this.actorType = anActionState.actorType;
    this.actionFunction = anActionState.actionFunction;
};
this.$Action.prototype.stringifyType = "$Action";
this.$Action.prototype.stringifyRegexp = new RegExp(/^\$Action\(.*\)$/);
this.$Action.prototype.replaceRegexp = new RegExp(/^\/\$Action\((.*)\)\/$/);

this.$Event = function (anEventState) {
    this.eventType = anEventState.eventType;
    this.actorId = anEventState.actorId;
    this.args = anEventState.args;
};
this.$Event.prototype.stringifyType = "$Event";
this.$Event.prototype.stringifyRegexp = new RegExp(/^\$Event\(.*\)$/);
this.$Event.prototype.replaceRegexp = new RegExp(/^\/\$Event\((.*)\)\/$/);

this.$Response = function (aResponseState) {
    this.id = aResponseState.id;
    this.eventType = aResponseState.eventType;
    this.actorType = aResponseState.actorType; // The type of the responder actor
    // This function must take as first argument the responder actor, 2nd argument the eventActor, and may take as many additional arguments as you wish.
    this.responseFunction = aResponseState.responseFunction;
};
this.$Response.prototype.stringifyType = "$Response";
this.$Response.prototype.stringifyRegexp = new RegExp(/^\$Response\(.*\)$/);
this.$Response.prototype.replaceRegexp = new RegExp(/^\/\$Response\((.*)\)\/$/);

/**
 * A planetary system or an alliance, or whatever you wish :)
 * Must be init'd after instanciation.
 */
this._initActor = function() {
    this.$Actor = function (anActorState) {
        this.State = anActorState.State ? anActorState.State : anActorState; // FIXME 0.6end: check use through logs
    };
    this.$Actor.prototype.stringifyRegexp = new RegExp(/^\$Actor\(.*\)$/);
    this.$Actor.prototype.replaceRegexp = new RegExp(/^\/\$Actor\((.*)\)\/$/);
    this.$Actor.prototype.stringifyType = "$Actor";
    this.$Actor.prototype.jsonstringify = JSON.stringify;
    this.$Actor.prototype.updater = this._updater;
    this.$Actor.prototype.e = this._e; // Actor after Engine build (startUp )
    this.$Actor.prototype.$Event = this.$Event;

    this.$Actor.prototype.stringify = function () {
        this.stringifyString = this.jsonstringify(this, this.updater);
    };
    this.$Actor.prototype.init = function () {
        this.stringify();
    };
    this.$Actor.prototype.executeAction = function (anAction) {
        anAction.actionFunction(this);
    };
    this.$Actor.prototype.act = function (anEventType, someArgs) {
        this.e.record(new this.$Event({eventType: anEventType, actorId: this.State.id, args: someArgs}));
    };
    this.$Actor.prototype.actNextTurn = function (anEventType, someArgs) {
        this.e.recordForNextTurn(new this.$Event({eventType: anEventType, actorId: this.State.id, args: someArgs}));
    };
    this.$Actor.prototype.addResponse = function (aResponse) {
        var responses = this.State.responses;
        (responses[aResponse.eventType] || (responses[aResponse.eventType] = {}))[aResponse.id] = aResponse;
        this.stringify();
    };
    this.$Actor.prototype.removeResponse = function (aResponse) {
        delete this.State.responses[aResponse.eventType][aResponse.id];
        this.stringify();
    };
    this.$Actor.prototype.addObserver = function (thatObserverType, thatObserverId) {
        var observers = this.State.observers;
        (observers[thatObserverType] || (observers[thatObserverType] = [])).push(thatObserverId);
        this.stringify();
    };
};

this._Engine = function (anEngineState) {
    this.State = anEngineState;
};

this._Engine.prototype.getNewActorId = function () {
    return "DAr_" + this.State.actorMaxId++;
};
this._Engine.prototype.getNewResponseId = function () {
    return "DR_" + this.State.responseMaxId++;
};
this._Engine.prototype.getNewActionId = function () {
    return "DAn_" + this.State.actionMaxId++;
};
this._Engine.prototype.addActor = function (anActor) {
    var state = this.State, responses = state.responses, initActions = state.initActions, eventTypes = state.eventTypes,
        actorType = anActor.State.actorType, id = anActor.State.id;

    // We add the actor to the actors maps.
    state.actorsByType[actorType].push(id);
    state.actors[id] = anActor;

    // We complete the existing actor responses with the engine responses.
    var z = eventTypes.length;
    while (z--) {
        var eventType = eventTypes[z];
        var eventTypeResponses = responses[eventType] || (responses[eventType] = {});
        var responsesToAdd = eventTypeResponses[actorType] || (eventTypeResponses[actorType] = {});
        for (var id in responsesToAdd) {
            if (responsesToAdd.hasOwnProperty(id)) { // False map
                anActor.addResponse(responsesToAdd[id]);
            }
        }
    }

    // We execute the initActions on the actor
    var initActionsToExecute = initActions[actorType];
    for (var initActionId in initActionsToExecute) {
        if (initActionsToExecute.hasOwnProperty(initActionId)) { // False map
            anActor.executeAction(initActionsToExecute[initActionId]);
        }
    }
};
// Consistent with history usage.
this._Engine.prototype.disableActor = function (anActor) {
    var engineState = this.State, actorState = anActor.State, arr = engineState.actorsByType[actorState.actorType];
    arr.splice(arr.indexOf(actorState.id), 1);
    delete engineState.actors[actorState.id];
};
this._Engine.prototype.setInitAction = function (anInitAction) {
    var initActions = this.State.initActions, initActionActorType = anInitAction.actorType;
    // We add the initAction to initActions
    (initActions[initActionActorType] || (initActions[initActionActorType] = {}))[anInitAction.id] = anInitAction;

    // We execute the action on the existing actors in an ordered fashion.
    this.executeAction(anInitAction);
};
// We add the action to recurrentActions
this._Engine.prototype.setRecurrentAction = function (anAction) {
    var recurrentActions = this.State.recurrentActions, actionEventType = anAction.eventType,
        actionActorType = anAction.actorType;
    var eventTypeActions = recurrentActions[actionEventType] || (recurrentActions[actionEventType] = {});
    (eventTypeActions[actionActorType] || (eventTypeActions[actionActorType] = {}))[anAction.id] = anAction;
};
this._Engine.prototype.executeAction = function (anAction) {
    var ourActorIds = this.State.actorsByType[anAction.actorType], actors = this.State.actors;
    var z = ourActorIds.length;
    while (z--) {
        actors[ourActorIds[z]].executeAction(anAction);
    }
};
this._Engine.prototype.setResponse = function (aResponse) {
    var state = this.State, actors = state.actors;
    // We add the response to responses
    state.responses[aResponse.eventType][aResponse.actorType][aResponse.id] = aResponse;

    // We add the response to the existing actors in an ordered fashion.
    var ourActorIds = state.actorsByType[aResponse.actorType];
    var z = ourActorIds.length;
    while (z--) {
        actors[ourActorIds[z]].addResponse(aResponse);
    }
};
this._Engine.prototype.unsetInitAction = function (anInitAction) { // This doesn't impact History.
    delete this.State.initActions[anInitAction.actorType][anInitAction.id];
};
this._Engine.prototype.unsetRecurrentAction = function (anAction) { // This doesn't impact History.
    delete this.State.recurrentActions[anAction.actorType][anAction.id];
};
this._Engine.prototype.unsetResponse = function (aResponse) { // This doesn't impact History.
    var state = this.State, actors = state.actors;
    delete state.responses[aResponse.eventType][aResponse.actorType][aResponse.id];
    var ourActorIds = state.actorsByType[aResponse.actorType];
    var z = ourActorIds.length;
    while (z--) {
        actors[ourActorIds[i]].removeResponse(aResponse);
    }
};
/**
 * name must be different from already existing names.
 * We don't allow to remove eventTypes as it would make the history inconsistent.
 */
this._Engine.prototype.addEventType = function (name, position) {
    var state = this.State;
    state.eventTypes.splice(position, 0, name);
    var ourResponses = (state.responses[name] = {});
    var ourRecurrentActions = (state.recurrentActions[name] = {});
    var actorTypes = state.actorTypes;
    var z = actorTypes.length;
    while (z--) {
        var ourActorType = actorTypes[z];
        ourResponses[ourActorType] = {};
        ourRecurrentActions[ourActorType] = {};
    }
    state.eventsToPublish[name] = [];
    state.eventsToPublishNextTurn[name] = [];
};
this._Engine.prototype.addActorType = function (name, position) {
    var state = this.State;
    state.actorTypes.splice(position, 0, name);

    state.actorsByType[name] = [];
    state.initActions[name] = {};

    var responses = state.responses;
    var recurrentActions = state.recurrentActions;
    var z = state.eventTypes.length;
    while (z--) {
        var eventType = state.eventTypes[z];
        responses[eventType][name] = {};
        recurrentActions[eventType][name] = {};
    }
};
/**
 * Gives the next state. Returns empty string if array is finished.
 * @param type: "eventTypes" or "actorTypes"
 * @param currentState
 */
this._Engine.prototype.nextState = function (type, currentState) {
    var arr = this.State[type];
    var newIndex = arr.indexOf(currentState) + 1;
    return newIndex == arr.length ? "" : arr[newIndex];
};
this._Engine.prototype.record = function (anEvent) {
    var eventsToPublish = this.State.eventsToPublish, eventType = anEvent.eventType;
    (eventsToPublish[eventType] || (eventsToPublish[eventType] = [])).push(anEvent);
};
this._Engine.prototype.recordForNextTurn = function (anEvent) {
    var eventsToPublishNextTurn = this.State.eventsToPublishNextTurn, eventType = anEvent.eventType;
    (eventsToPublishNextTurn[eventType] || (eventsToPublishNextTurn[eventType] = [])).push(anEvent);
};
this._Engine.prototype.gatherEventsToPublish = function () {
    // We move the events from eventsToPublishNextTurn to eventsToPublish.
    var state = this.State;
    var currentEventType = state.currentEventType, eventsToPublishNextTurn = state.eventsToPublishNextTurn;
    var ourEvents = (eventsToPublishNextTurn[currentEventType] || (eventsToPublishNextTurn[currentEventType] = []));
    // FIXME 0.n: does the length change? check through logs
    // FIXME 0.n: 'while' could be cut into frames
    while (ourEvents.length) {
        var z = ourEvents.length;
        while (z--) {
            this.record(ourEvents.shift());
        }
    }

    // We go to next eventType
    var newEventType = this.nextState("eventTypes", currentEventType), finished = newEventType == "";
    state.currentEventType = finished ? state.eventTypes[0] : newEventType;
    return finished;
};
/**
 * Returns true when everything is finished, else false.
 */
this._Engine.prototype.populateStack = function () {
    var state = this.State, currentEventType = state.currentEventType, currentActorType = state.currentActorType,
        firstActorType = state.actorTypes[0], nextState = this.nextState;
    if (!state.recurrentActionsIsDoneForCurrentEventType) {
        this.putRecurrentActionsOntoStack(currentEventType, currentActorType);

        // We go to next actorType
        var newActorType = nextState("actorTypes", currentActorType);
        state.currentActorType = newActorType || firstActorType;
        state.recurrentActionsIsDoneForCurrentEventType = !newActorType;
        return false; // No need to use too much time.
    }

    var ourEvents = state.eventsToPublish[currentEventType];
    if (ourEvents.length) {
        this.putEventOntoStack(ourEvents[0], currentActorType);

        // We go to next actorType
        var newActorType2 = nextState("actorTypes", currentActorType);
        state.currentActorType = newActorType2 || firstActorType;
        // When the event is processed, we remove it from the array.
        newActorType2 || ourEvents.shift();
        return false; // No need to use too much time.
    }

    // We go to next eventType
    state.currentActorType = firstActorType;
    state.recurrentActionsIsDoneForCurrentEventType = false;
    var newEventType = nextState("eventTypes", currentEventType);
    // We may have finished: no more eventType, no more actorType, no more recurrentAction, no more event to respond to.
    state.currentEventType = newEventType || state.eventTypes[0];
    return !newEventType;
};
this._Engine.prototype.putRecurrentActionsOntoStack = function (currentEventType, currentActorType) {
    var state = this.State, actions = state.recurrentActions[currentEventType][currentActorType],
        actorIds = state.actorsByType[currentActorType], shortStack = state.shortStack, actors = state.actors;
    for (var id in actions) {
        if (actions.hasOwnProperty(id)) { // False map
            var z = actorIds.length, action = actions[id];
            while (z--) {
                shortStack.push({type: "action", actor: actors[actorIds[z]], recurrentAction: action});
            }
        }
    }
};
this._Engine.prototype.putEventOntoStack = function (thatEvent, currentActorType) {
    var eventActorId = thatEvent.actorId, eventEventType = thatEvent.eventType, eventArgs = thatEvent.args,
        state = this.State, actors = state.actors, eventActor = actors[eventActorId],
        observers = eventActor.State.observers[currentActorType], z = observers.length, shortStack = state.shortStack;
    while (z--) {
        var observer = actors[observers[z]];
        // First argument: observer, 2nd arg: eventActor, other args: other args
        var someArgs = [observer, eventActor].concat(eventArgs);
        var responses = observer.State.responses[eventEventType];
        for (var id in responses) {
            if (responses.hasOwnProperty(id)) { // False map
                shortStack.push({type: "response", responseFunction: responses[id].responseFunction, args: someArgs});
            }
        }
    }
};
/**
 * return true if finished (empty stack), false otherwise.
 */
this._Engine.prototype.executeStack = function () {
    var action = this.State.shortStack.shift();
    if (action == undefined) {
        return true;
    }
    if (action.type == "action") {
        action.recurrentAction.actionFunction(action.actor);
    } else { // == "response"
        action.responseFunction(action.args);
    }
    return false;
};
this._Engine.prototype.addFrameCallback = function () {
    this.State.callback || (this.State.callback = addFrameCallback(this.ourFrameCallback));
};
this._Engine.prototype.removeFrameCallback = function () {
    if (this.State.callback) {
        removeFrameCallback(this.State.callback);
        delete this.State.callback;
    }
};
this._Engine.prototype.ourFrameCallback = (function () {
    var innerFn = function (delta) {
        var e = innerFn.script.$getEngine(); // Self-contained.
        if (e.frame = ((e.frame || 0) + 1) % 10) { // One action each 10 frames
            return; // Only one in n frames is used.
        }

        var state = e.State;
        if (state.isJumpTokenBeingUsed) {
            if (!e.executeStack() || !e.populateStack()) { // Still some work to do
                return; // we did enough this time
            }

            state.isJumpTokenBeingUsed = false;
            return; // we did enough this time
        }

        if (state.jumpTokenNb) { // Do we have an available jump token?
            if (e.gatherEventsToPublish()) { // Finished gathering
                state.jumpTokenNb--;
                state.isJumpTokenBeingUsed = true;
            }
            return; // we did enough this time
        }

        e.removeFrameCallback(); // We have finished, we remove the callback
    };
    innerFn.script = worldScripts.DayDiplomacy_000_Engine;
    return innerFn;
})();
this.prototype.$getEngine = function () {
    this._e = new this._Engine(this._buildDefaultEngineState());
    this.$getEngine = function () {
        return this._e;
    };
    return this._e;
};

/*************************** End of engine ***************************************************************/
/*************************** Methods to save/restore *****************************************************/

// We cannot avoid a closure on eval as it cannot be referenced outside of calls, and on innerFn as it is necessary for recursion.
// Yet all other closures have been avoided in the function body.
this._reviver = (function () {
    var innerFn = function (key, value) {
        // All our special cases are strings
        if (typeof value != 'string') {
            return value;
        }

        var that = innerFn; // Closure for recursion
        if (value.match(that._functionRegexp)) { // FIXME 0.n: benchmark using only one regexp rather than 2
            return eval(value.replace(that._functionReplaceRegexp, '($1)'));
        }

        var z = 4;
        while (z--) {
            var clas = that._classesData[z];
            if (value.match(clas.stringifyRegexp)) {
                var obj = new clas(that._jsonparse(value.replace(clas.replaceRegexp, '$1'), that));
                obj.init && obj.init();
                return obj;
            }
        }

        return value;
    };
    innerFn._functionRegexp = new RegExp(/^\/Function\(.*\)\/$/);
    innerFn._functionReplaceRegexp = new RegExp(/^\/Function\((.*)\)\/$/);
    var script = worldScripts.DayDiplomacy_000_Engine;
    innerFn._classesData = [script.$Action, script.$Event, script.$Response, script.$Actor];
    innerFn._jsonparse = JSON.parse;
    return innerFn;
})();
this._replacer = function (key, value) {
    var t = typeof value;

    if (t == 'function') {
        return '/Function(' + value.toString() + ')/';
    }

    if (t == 'object' && value.stringifyString) {
        return value.stringifyString;
    }

    return value;
};

// Only one closure allowing recursion.
this._updater = (function () {

    var innerFn = function (key, value) {
        var t = typeof value;

        if (t == 'function') {
            return '/Function(' + value.toString() + ')/';
        }

        if (t == 'object' && value.stringifyString) {
            var that = innerFn, result = {};
            for (var id in value) { // FIXME 0.n: Could we avoid this loop by specifying that an object with stringifyType must have a State field that we would stringify?
                // Avoiding fatal recursion + we don't want methods or prototype fields
                if (value.hasOwnProperty(id) && id != 'stringifyString') {
                    result[id] = value[id];
                }
            }
            return "/" + value.stringifyType + '(' + that._jsonstringify(result, that) + ')/';
        }

        return value;
    };
    innerFn._jsonstringify = JSON.stringify;
    return innerFn;
})();

/*************************** End of methods to save/restore **********************************************/
/*************************** Oolite events ***************************************************************/

this.startUp = function () {
    var as = this.$getEngine().State; // At the same time, we init the singleton.
    this._initActor(); // Must be inited after the Engine.
    var sa = this._missionVariables.DayDiplomacyEngine_EngineState;
    if (sa && sa.length) { // Loading if necessary.
        this._loadState(as, this._jsonparse(sa, this._reviver));
    }
    this.shipDockedWithStation(null); // When starting, the player is docked.
    delete this.startUp; // No need to startup twice
};
this.playerWillSaveGame = function (message) {
    var e = this.$getEngine();
    e.removeFrameCallback();
    this._missionVariables.DayDiplomacyEngine_EngineState = this._jsonstringify(e.State, this._replacer);
    e.addFrameCallback();
};
this.shipExitedWitchspace = function () {
    var s = this.$getEngine().State;
    s.jumpTokenNb || (s.jumpTokenNb = 0);
    s.jumpTokenNb++;
};
this.shipDockedWithStation = function (station) {
    this.shipExitedWitchspace(); // FIXME 0.6: Debug
    this.$getEngine().addFrameCallback();
};
this.shipWillLaunchFromStation = function (station) {
    this.$getEngine().removeFrameCallback();
};

/*************************** End of oolite events ********************************************************/