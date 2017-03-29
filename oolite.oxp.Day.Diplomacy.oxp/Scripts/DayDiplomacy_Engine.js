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

this._loadState = function (thatState, aState) {
    for (var id in aState) {
        if (aState.hasOwnProperty(id)) { // Avoiding prototypes' fields
            thatState[id] = aState[id];
        }
    }
};

this.prototype.$getEngine = function () {
    // Init of the engine and the singletons.
    var e = this._buildEngine();
    this._e = e;
    var as = this._getArbiter().State; // At the same time, we init the singleton.
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
this.$Actor = function (anActorState) {
    this.State = anActorState.State ? anActorState.State : anActorState;
};
this.$Actor.prototype.stringifyRegexp = new RegExp(/^Actor\(.*\)$/);
this.$Actor.prototype.replaceRegexp = new RegExp(/^\/Actor\((.*)\)\/$/);
this.$Actor.prototype.stringifyType = "$Actor";
this.$Actor.prototype.jsonstringify = JSON.stringify;
this.$Actor.prototype.updater = this._updater;
this.$Actor.prototype.h = this._h; // FIXME inited?
this.$Actor.prototype.script = this; // FIXME use Event rather than script?

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
    this.h.record(new this.script.$Event({eventType: anEventType, actorId: this.State.id, args: someArgs}));
};
this.$Actor.prototype.actNextTurn = function (anEventType, someArgs) {
    this.h.recordForNextTurn(new this.script.$Event({eventType: anEventType, actorId: this.State.id, args: someArgs}));
};
this.$Actor.prototype.addResponse = function (aResponse) {
    this.State.responses[aResponse.eventType] || (this.State.responses[aResponse.eventType] = {});
    this.State.responses[aResponse.eventType][aResponse.id] = aResponse;
    this.stringify();
};
this.$Actor.prototype.removeResponse = function (aResponse) {
    delete this.State.responses[aResponse.eventType][aResponse.id];
    this.stringify();
};
this.$Actor.prototype.addObserver = function (thatObserverType, thatObserverId) {
    var arr = this.State.observers[thatObserverType] || (this.State.observers[thatObserverType] = []);
    arr.push(thatObserverId);
    this.stringify();
};

this.$buildDefaultActorState = function (anActorType, anId) {
    return {
        id: anId,
        actorType: anActorType,
        responses: {}, // { eventType => { id => response } }
        observers: {} // { actorType => [ actorIds ]} Ids of actors who can respond to this actor acts.
    };
};
// FIXME 0.n: actorsByType could be rebuilt rather than saved. Quicker? More consistent?
// FIXME Arbiter and Historian could be merged. And called Engine X)

this._buildDefaultArbiterState = function () {
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
        actorTypes: []
    };
};

this._Arbiter = function (anArbiterState) {
    this.State = anArbiterState;
};
this._Arbiter.prototype.h = this._getHistorian();

this._Arbiter.prototype.getNewActorId = function () {
    return "DAr_" + this.State.actorMaxId++;
};
this._Arbiter.prototype.getNewResponseId = function () {
    return "DR_" + this.State.responseMaxId++;
};
this._Arbiter.prototype.getNewActionId = function () {
    return "DAn_" + this.State.actionMaxId++;
};
this._Arbiter.prototype.addActor = function (anActor) {
    var responses = this.State.responses;
    var initActions = this.State.initActions;
    var eventTypes = this.State.eventTypes;

    // We add the actor to the actors maps.
    this.State.actorsByType[anActor.State.actorType].push(anActor.State.id);
    this.State.actors[anActor.State.id] = anActor;

    // We complete the existing actor responses with the arbiter responses in an ordered fashion.
    for (var i = 0, z = eventTypes.length; i < z; i++) {
        var eventType = eventTypes[i];
        responses[eventType] || (responses[eventType] = {});
        var responsesToAdd = responses[eventType][anActor.State.actorType] || (responses[eventType][anActor.State.actorType] = {});
        for (var responseId in responsesToAdd) {
            if (responsesToAdd.hasOwnProperty(responseId)) { // False map
                anActor.addResponse(responses[eventType][anActor.State.actorType][responseId]);
            }
        }
    }

    // We execute the initActions on the actor
    var initActionsToExecute = initActions[anActor.State.actorType];
    for (var initActionId in initActionsToExecute) {
        if (initActionsToExecute.hasOwnProperty(initActionId)) { // False map
            anActor.executeAction(initActionsToExecute[initActionId]);
        }
    }
};
// Consistent with history usage.
this._Arbiter.prototype.disableActor = function (anActor) {
    delete this.State.actors[anActor.State.id];
    var arr = this.State.actorsByType[anActor.State.actorType];
    arr.splice(arr.indexOf(anActor.State.id), 1);
};
this._Arbiter.prototype.setInitAction = function (anInitAction) {
    var initActions = this.State.initActions;
    // We add the initAction to initActions
    initActions[anInitAction.actorType] || (initActions[anInitAction.actorType] = {});
    initActions[anInitAction.actorType][anInitAction.id] = anInitAction;

    // We execute the action on the existing actors in an ordered fashion.
    this.executeAction(anInitAction);
};
this._Arbiter.prototype.setRecurrentAction = function (anAction) {
    var recurrentActions = this.State.recurrentActions;
    // We add the action to recurrentActions
    recurrentActions[anAction.eventType] || (recurrentActions[anAction.eventType] = {});
    recurrentActions[anAction.eventType][anAction.actorType] || (recurrentActions[anAction.eventType][anAction.actorType] = {});
    recurrentActions[anAction.eventType][anAction.actorType][anAction.id] = anAction;
};
this._Arbiter.prototype.executeAction = function (anAction) {
    var ourActorIds = this.State.actorsByType[anAction.actorType];
    for (var i = 0, z = ourActorIds.length; i < z; i++) {
        this.State.actors[ourActorIds[i]].executeAction(anAction);
    }
};
this._Arbiter.prototype.setResponse = function (aResponse) {
    // We add the response to responses
    this.State.responses[aResponse.eventType][aResponse.actorType][aResponse.id] = aResponse;

    // We add the response to the existing actors in an ordered fashion.
    var ourActorIds = this.State.actorsByType[aResponse.actorType];
    for (var i = 0, z = ourActorIds.length; i < z; i++) {
        this.State.actors[ourActorIds[i]].addResponse(aResponse);
    }
};
this._Arbiter.prototype.unsetInitAction = function (anInitAction) { // This doesn't impact History.
    delete this.State.initActions[anInitAction.actorType][anInitAction.id];
};
this._Arbiter.prototype.unsetRecurrentAction = function (anAction) { // This doesn't impact History.
    delete this.State.recurrentActions[anAction.actorType][anAction.id];
};
this._Arbiter.prototype.unsetResponse = function (aResponse) { // This doesn't impact History.
    delete this.State.responses[aResponse.eventType][aResponse.actorType][aResponse.id];
    var ourActorIds = this.State.actorsByType[aResponse.actorType];
    for (var i = 0, z = ourActorIds.length; i < z; i++) {
        this.State.actors[ourActorIds[i]].removeResponse(aResponse);
    }
};
/**
 * name must be different from already existing names.
 * We don't allow to remove eventTypes as it would make the history inconsistent.
 */
this._Arbiter.prototype.addEventType = function (name, position) {
    this.State.eventTypes.splice(position, 0, name);

    this.State.responses[name] = {};
    this.State.recurrentActions[name] = {};
    for (var i = 0, z = this.State.actorTypes.length; i < z; i++) {
        this.State.responses[name][this.State.actorTypes[i]] = {};
        this.State.recurrentActions[name][this.State.actorTypes[i]] = {};
    }

    this.h.addEventType(name);
};
this._Arbiter.prototype.addActorType = function (name, position) {
    // FIXME cost of traversal of this.State?
    this.State.actorTypes.splice(position, 0, name);

    this.State.actorsByType[name] = [];
    this.State.initActions[name] = {};

    for (var i = 0, z = this.State.eventTypes.length; i < z; i++) {
        this.State.responses[this.State.eventTypes[i]][name] = {};
        this.State.recurrentActions[this.State.eventTypes[i]][name] = {};
    }
};
/**
 * Gives the next state. Returns empty string if array is finished.
 * @param type: "eventTypes" or "actorTypes"
 * @param currentState
 */
this._Arbiter.prototype.nextState = function (type, currentState) {
    var arr = this.State[type];
    var newIndex = arr.indexOf(currentState) + 1;
    return newIndex === arr.length ? "" : arr[newIndex];
};
/**
 * Our arbiter singleton.
 */
this.prototype._getArbiter = function () {
    this._a = new this._Arbiter(this._buildDefaultArbiterState());
    this._getArbiter = function () {
        return this._a;
    };
    return this._a;
};

this._buildDefaultHistorianState = function () {
    return {
        eventsHistory: {}, // { date => [ events ] }
        eventsToPublish: {}, // { eventType => [ events ] }
        eventsToPublishNextTurn: {}, // { eventType => [ events ] }
        currentEventType: "",
        currentActorType: "",
        shortStack: []
    };
};

// The historian records the history and informs the systems and alliances.
this._Historian = function (aHistorianState) {
    this.State = aHistorianState;
};
this._Historian.prototype._a = this._getArbiter();

this._Historian.prototype.addEventType = function (eventTypeName) {
    this.State.eventsToPublish[eventTypeName] = [];
    this.State.eventsToPublishNextTurn[eventTypeName] = [];
};
this._Historian.prototype.record = function (anEvent) {
    var eventsToPublish = this.State.eventsToPublish;
    var eventType = anEvent.eventType;
    eventsToPublish[eventType] || (eventsToPublish[eventType] = []);
    eventsToPublish[eventType].push(anEvent);
};
this._Historian.prototype.recordForNextTurn = function (anEvent) {
    var eventsToPublishNextTurn = this.State.eventsToPublishNextTurn;
    var eventType = anEvent.eventType;
    eventsToPublishNextTurn[eventType] || (eventsToPublishNextTurn[eventType] = []);
    eventsToPublishNextTurn[eventType].push(anEvent);
};
this._Historian.prototype.gatherEventsToPublish = function () {
    var currentEventType = this.State.currentEventType;

    // We move the events from eventsToPublishNextTurn to eventsToPublish.
    var eventsToPublishNextTurn = this.State.eventsToPublishNextTurn;
    eventsToPublishNextTurn[currentEventType] || (eventsToPublishNextTurn[currentEventType] = []);
    while (eventsToPublishNextTurn[currentEventType].length > 0) { // FIXME 0.n: 'while' could be cut into frames
        this.record(eventsToPublishNextTurn[currentEventType].shift());
    }

    // We go to next eventType
    var newEventType = this._a.nextState("eventTypes", currentEventType);
    var finished = newEventType === "";
    this.State.currentEventType = finished ? this._a.State.eventTypes[0] : newEventType;
    return finished;
};
/**
 * Returns true when everything is finished, else false.
 */
this._Historian.prototype.populateStack = function () {
    var currentEventType = this.State.currentEventType;
    var currentActorType = this.State.currentActorType;

    if (!this.State.recurrentActionsIsDoneForCurrentEventType) {
        this.putRecurrentActionsOntoStack(currentEventType, currentActorType);

        // We go to next actorType
        var newActorType = this._a.nextState("actorTypes", currentActorType);
        if (newActorType === "") {
            this.State.currentActorType = this._a.State.actorTypes[0];
            this.State.recurrentActionsIsDoneForCurrentEventType = true;
        } else {
            this.State.currentActorType = newActorType;
        }
        return false; // No need to use too much time.
    }

    if (this.State.eventsToPublish[currentEventType].length > 0) {
        var thatEvent = this.State.eventsToPublish[currentEventType][0];
        this.putEventOntoStack(thatEvent, currentActorType);

        // We go to next actorType
        var newActorType2 = this._a.nextState("actorTypes", currentActorType);
        if (newActorType2 === "") {
            this.State.currentActorType = this._a.State.actorTypes[0];
            // The event is processed, we remove it from the array.
            this.State.eventsToPublish[currentEventType].shift();
        } else {
            this.State.currentActorType = newActorType2;
        }
        return false; // No need to use too much time.
    }

    // We go to next eventType
    var newEventType = this._a.nextState("eventTypes", currentEventType);
    this.State.currentActorType = this._a.State.actorTypes[0];
    this.State.recurrentActionsIsDoneForCurrentEventType = false;

    // We may have finished: no more eventType, no more actorType, no more recurrentAction, no more event to respond to.
    var finished = newEventType === "";
    this.State.currentEventType = finished ? this._a.State.eventTypes[0] : newEventType;
    return finished;
};
this._Historian.prototype.putRecurrentActionsOntoStack = function (currentEventType, currentActorType) {
    var actions = this._a.State.recurrentActions[currentEventType][currentActorType];
    var actorIds = this._a.State.actorsByType[currentActorType];
    for (var id in actions) {
        if (actions.hasOwnProperty(id)) { // False map
            for (var n = 0, z = actorIds.length; n < z; n++) {
                this.State.shortStack.push({
                    "type": "action",
                    "actor": this._a.State.actors[actorIds[n]],
                    "recurrentAction": actions[id]
                });
            }
        }
    }
};
this._Historian.prototype.putEventOntoStack = function (thatEvent, currentActorType) {
    var observers = this._a.State.actors[thatEvent.actorId].State.observers[currentActorType];
    for (var m = 0, z = observers.length; m < z; m++) {
        var observer = this._a.State.actors[observers[m]];
        // First argument: observer, 2nd arg: eventActor, other args: other args
        var someArgs = [observer, this._a.State.actors[thatEvent.actorId]].concat(thatEvent.args);
        var responsesToExecute = observer.State.responses[thatEvent.eventType];
        for (var responseId in responsesToExecute) {
            if (responsesToExecute.hasOwnProperty(responseId)) { // False map
                this.State.shortStack.push({
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
 */
this._Historian.prototype.executeStack = function () {
    var action = this.State.shortStack.shift();
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

// FIXME we are here
this._Historian.prototype.addFrameCallback = function () {
    if (this.State.callback) {
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

this._Historian.prototype.removeFrameCallback = function (thatHistorian) {
    if (thatHistorian.State.callback) {
        removeFrameCallback(thatHistorian.State.callback);
        delete thatHistorian.State.callback;
    }
};


this._buildEngine = function () {
    var engine = {
        /**
         * Our historian singleton.
         */
        _getHistorian: function () {
            return __DayDiplomacy_Engine_Script._e.HISTORIAN = __DayDiplomacy_Engine_Script._e.HISTORIAN || new __DayDiplomacy_Engine_Script._e.Historian(__DayDiplomacy_Engine_Script._e.DefaultHistorianState());
        }
    };

    return engine;
};

/*************************** End of engine ***************************************************************/
/*************************** Methods to save/restore *****************************************************/

// We cannot avoid a closure on eval as it cannot be referenced outside of calls, and on innerFn as it is necessary for recursion.
// Yet all other closures have been avoided in the function body.
this._reviver = (function () {

    var innerFn = function (key, value) {
        // All our special cases are strings
        if (typeof value !== "string") {
            return value;
        }

        var that = innerFn; // Closure for recursion

        // FIXME benchmark using only one regexp rather than 2
        if (value.match(that._functionRegexp)) {
            return eval(value.replace(that._functionReplaceRegexp, that._functionReplaceString));
        }

        for (var i = 0; i < 4; i++) {
            var clas = that._classesData[i];
            if (value.match(clas.stringifyRegexp)) {
                // FIXME simplify ?
                // var obj = new clas(that._jsonparse(that._unescape(value.replace(clas.replaceRegexp, that._replaceString)).replace(that._escapingRegexp, "\""), that));
                var obj = new clas(that._jsonparse(value.replace(clas.replaceRegexp, that._replaceString), that));
                if (obj.init) {
                    obj.init();
                }
                return obj;
            }
        }

        return value;
    };
    innerFn.functionRegexp = new RegExp(/^\/Function\(.*\)\/$/);
    innerFn._functionReplaceRegexp = new RegExp(/^\/Function\((.*)\)\/$/);
    innerFn._functionReplaceString = "($1)";
    var engine = worldScripts.DayDiplomacy_000_Engine.$getEngine();
    var script = worldScripts.DayDiplomacy_000_Engine;
    innerFn._classesData = [engine.$Actor, script.$Action, engine.$Event, engine.$Response];
    innerFn._jsonparse = JSON.parse;
    //innerFn._unescape = unescape;
    innerFn._replaceString = "$1"; // Avoiding memory usage?
    // innerFn._escapingRegexp = new RegExp(/\\"/g);
    return innerFn;
})();

this._replacer = function (key, value) {
    var t = typeof value;

    if (t === "function") {
        return "/Function(" + value.toString() + ")/";
    }

    if (t === "object" && value.stringifyString) {
        return value.stringifyString;
    }

    return value;
};

// Only one closure allowing recursion.
this._updater = (function () {

    var innerFn = function (key, value) {
        var t = typeof value;

        if (t === "function") {
            return "/Function(" + value.toString() + ")/";
        }

        if (t === "object" && value.stringifyType) {
            var that = innerFn;
            var result = {};
            for (var id in value) {
                // Avoiding fatal recursion + we don't want methods or prototype fields
                if (value.hasOwnProperty(id) && id !== "stringifyString") {
                    result[id] = value[id];
                }
            }
            return "/" + value.stringifyType + "(" + that._jsonstringify(result, that) + ")/";
        }

        return value;
    };
    innerFn._jsonstringify = JSON.stringify;
    return innerFn;
})();

/*************************** End of methods to save/restore **********************************************/
/*************************** Oolite events ***************************************************************/

this.startUp = function () {
    this.$getEngine(); // Ensuring initialization
    this.shipDockedWithStation(null); // When starting, the player is docked.
    delete this.startUp;
};

this.playerWillSaveGame = function (message) {
    this._h.removeFrameCallback(this._h);
    this._missionVariables.DayDiplomacyEngine_ArbiterState = this._jsonstringify(this._a.State, this._replacer);
    this._missionVariables.DayDiplomacyEngine_HistorianState = this._jsonstringify(this._h.State, this._replacer);
    this._h.addFrameCallback(this._h);
};

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