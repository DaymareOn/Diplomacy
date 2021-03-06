"use strict";
this.name = "DayDiplomacy_000_Engine";
this.author = "David (Day) Pradier";
// noinspection JSUnusedGlobalSymbols Used by Oolite itself
this.copyright = "(C) 2017 David Pradier";
// noinspection JSUnusedGlobalSymbols Used by Oolite itself
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script is the engine of the Diplomacy OXP.";

/* ************************** Closures ********************************************************************/

this._missionVariables = missionVariables;
this._clock = clock;
this._JSON = JSON;

/* ************************** Engine **********************************************************************/

// FIXME use the debugger to set _debug to true
this._debug = false;

/**
 * Loads state from the saved game
 * @param toBeModifiedState
 * @param sourceState
 * @private
 */
this._loadState = function (toBeModifiedState, sourceState) {
    for (var id in sourceState) {
        if (sourceState.hasOwnProperty(id)) { // Avoiding prototypes' fields
            toBeModifiedState[id] = sourceState[id];
        }
    }
};

/**
 *
 * @return {{shortStack: Array, eventsToPublish: {}, initActions: {}, eventMaxId: number, actorTypes: Array, initActionsByType: {}, recurrentActionsByType: {}, actorsEvents: {}, functionMaxId: number, eventTypes: Array, actorMaxId: number, actors: {}, recurrentActions: {}, responseMaxId: number, actionMaxId: number, responsesByType: {}, actorsByType: {}, eventsToPublishNextTurn: {}, responses: {}, currentActorType: string, currentEventType: string, events: {}}}
 * @private
 * @lends worldScripts.DayDiplomacy_000_Engine._getInitState
 */
this._getInitState = function () {
  return {

      /** @type {Object.<ActorId,Actor>}*/
      actors: {},

      /** @type {Object.<ActionId,Action>}*/
      initActions: {},

      /** @type {Object.<ActionId,Action>}*/
      recurrentActions: {},

      /** @type {Object.<EventId,DiplomacyEvent>}*/
      events: {},

      /** @type {Object.<ResponseId,DiplomacyResponse>}*/
      responses: {},

      /** @type {Object.<ActorType,ActorId[]>}*/
      actorsByType: {},

      /** @type {Object.<ActorType,ActionId[]>}*/
      initActionsByType: {},

      /** @type {Object.<EventType,Object.<ActorType,ActionId[]>>}*/
      recurrentActionsByType: {},

      /** @type {Object.<EventType,Object.<ActorType,ResponseId[]>>}*/
      responsesByType: {},

      /** @type {int} */
      actorMaxId: 1,

      /** Useful to remove recurrentActions and initActions.
       *  @type {int} */
      actionMaxId: 1,

      /** @type {int} */
      eventMaxId: 1,

      /** @type {int} */
      responseMaxId: 1,

      /** @type {int} */
      functionMaxId: 1,

      /** @type {EventType[]} */
      eventTypes: [],

      /** @type {ActorType[]} */
      actorTypes: [],

      /** @type {Object.<ActorId,EventId[]>}*/
      actorsEvents: {},

      /** @type {Object.<EventType,EventId[]>}*/
      eventsToPublish: {},

      /** @type {Object.<EventType,EventId[]>}*/
      eventsToPublishNextTurn: {},

      /** @type EventType */
      currentEventType: "",

      /** @type ActorType */
      currentActorType: "",

      /** @type {Object[]} */
      shortStack: []
  };
};

// FIXME should _State be of a defined state? That would be what would make stable the savefile... ?
/**
 * @type {{shortStack: Array, eventsToPublish: {}, initActions: {}, eventMaxId: number, actorTypes: Array, initActionsByType: {}, recurrentActionsByType: {}, actorsEvents: {}, functionMaxId: number, eventTypes: Array, actorMaxId: number, actors: {}, recurrentActions: {}, responseMaxId: number, actionMaxId: number, responsesByType: {}, actorsByType: {}, eventsToPublishNextTurn: {}, responses: {}, currentActorType: string, currentEventType: string, events: {}}}
 * @private
 * @lends worldScripts.DayDiplomacy_000_Engine._State
 */
this._State = this._getInitState();

/**
 * @type {Object.<FunctionId,function>}
 * @private
 */
this._Functions = {};

/**
 * @return {ActorId}
 * @lends worldScripts.DayDiplomacy_000_Engine.$getNewActorId
 */
this.$getNewActorId = function () {
    return "DAr_" + this._State.actorMaxId++;
};

/**
 * @return {ResponseId}
 * @lends worldScripts.DayDiplomacy_000_Engine.$getNewResponseId
 */
this.$getNewResponseId = function () {
    return "DR_" + this._State.responseMaxId++;
};

/**
 * @return {ActionId}
 * @lends worldScripts.DayDiplomacy_000_Engine.$getNewActionId
 */
this.$getNewActionId = function () {
    return "DAn_" + this._State.actionMaxId++;
};

/**
 * @return {FunctionId}
 * @lends worldScripts.DayDiplomacy_000_Engine.$getNewFunctionId
 */
this.$getNewFunctionId = function () {
    return "DFn_" + this._State.functionMaxId++;
};

/**
 * @return {EventId}
 * @lends worldScripts.DayDiplomacy_000_Engine.$getNewEventId
 */
this.$getNewEventId = function () {
    return "DEt_" + this._State.eventMaxId++;
};

/**
 * An action, whether it is init or recurrent isn't put into the History. Only Events are.
 * @param {ActionId}id -
 * @param {EventType}eventType - is used to order the actions and events execution. For a same eventType, Actions are executed before Events.
 * @param {ActorType}actorType - Only actors of the type will execute the action.
 * @param {FunctionId} actionFunctionId - the id of a function which must take one and only one argument: the actor which will "act".
 * @return {Action}
 * @lends worldScripts.DayDiplomacy_000_Engine.$buildAction
 */
this.$buildAction = function (id, eventType, actorType, actionFunctionId) {
    /** @type {Action} */
    return {id: id, eventType: eventType, actorType: actorType, actionFunctionId: actionFunctionId};
};

/**
 * To copy before modifying
 * @return {EventType[]}
 * @lends worldScripts.DayDiplomacy_000_Engine.$getEventTypes
 */
this.$getEventTypes = function () {
    return this._State.eventTypes;
};

/**
 * @return {Object<FunctionId, function>}
 * @lends worldScripts.DayDiplomacy_000_Engine.$getFunctions
 */
this.$getFunctions = function () {
    return this._Functions;
};

/**
 * @return {Object<EventId,DiplomacyEvent>}
 * @lends worldScripts.DayDiplomacy_000_Engine.$getEvents
 */
this.$getEvents = function () {
    return this._State.events;
};

/**
 * @param {ActorId} actorId
 * @return {EventId[]}
 * @lends worldScripts.DayDiplomacy_000_Engine.$getActorEvents
 */
this.$getActorEvents = function (actorId) {
    return this._State.actorsEvents[actorId] || [];
};

/**
 * Make sure you don't modify that or its content. Copy it before if you need to modify it.
 * @return {ActorType[]} The ActorType list
 * @lends worldScripts.DayDiplomacy_000_Engine.$getActorTypes
 */
this.$getActorTypes = function () {
    return this._State.actorTypes;
};

/**
 * @param {ActorType} actorType
 * @returns {ActorId[]} the list of actorId having the type given as parameter
 * @lends worldScripts.DayDiplomacy_000_Engine.$getActorsIdByType
 */
this.$getActorsIdByType = function (actorType) {
    return this._State.actorsByType[actorType];
};

/**
 * @name $getActors
 * @returns {Object.<ActorId,Actor>} - an object with {@link ActorId} as keys and as value the corresponding {@link Actor}
 * @lends worldScripts.DayDiplomacy_000_Engine.$getActors
 */
this.$getActors = function () {
    return this._State.actors;
};

/**
 * A planetary system or an alliance, or whatever you wish :)
 * An actor is {id:id, actorType:actorType, responsesIdByEventType:{eventType:[responseIds]}, observers:{actorType:[actorIds]}}
 * @param {ActorType} actorType
 * @param {ActorId} id
 * @return {Actor}
 * @lends worldScripts.DayDiplomacy_000_Engine.$buildActor
 */
this.$buildActor = function (actorType, id) {
    /** @type {Actor} */
    return {id: id, actorType: actorType, responsesIdByEventType: {}, observers: {}};
};

/**
 * @param {EventId} id
 * @param {EventType}eventType
 * @param {ActorId} actorId
 * @param {Object[]} args  Have to be compatible with our implementation of JSON stringify/parse. Those are the information/arguments which will be given to the response function.
 * @return {DiplomacyEvent}
 */
this.$buildEvent = function (id, eventType, actorId, args) {
    return {id: id, eventType: eventType, actorId: actorId, args: args, date:0};
};

/**
 *
 * @param {Actor} anActor
 * @param {ActorType} observersActorType
 * @returns {ActorId[]} the list of the actorId's of the observers of the given actor, which are of the given type
 * @lends worldScripts.DayDiplomacy_000_Engine.$getObservers
 */
this.$getObservers = function (anActor, observersActorType) {
    return anActor.observers[observersActorType];
};

/**
 * @param {Actor} anActor
 * @param {Action} anAction
 */
this.$letActorExecuteAction = function (anActor, anAction) {
    this._Functions[anAction.actionFunctionId](anActor);
};

/**
 *
 * @param {ActorId} actorId
 * @param {EventType}anEventType
 * @param {Object[]} someArgs
 * @lends worldScripts.DayDiplomacy_000_Engine.$makeActorEventKnownToUniverse
 */
this.$makeActorEventKnownToUniverse = function (actorId, anEventType, someArgs) {
    this._record(this.$buildEvent(this.$getNewEventId(), anEventType, actorId, someArgs));
};

// this.$Actor.prototype.actNextTurn = function (anEventType, someArgs) {
//     this.recordForNextTurn({id:eventId, eventType: anEventType, actorId: this._State.id, args: someArgs});
// };

/**
 * @param {Actor} anActor
 * @lends worldScripts.DayDiplomacy_000_Engine.$addActor
 */
this.$addActor = function (anActor) {
    var state = this._State, responsesByType = state.responsesByType, initActions = state.initActions,
        initActionsByType = state.initActionsByType, eventTypes = state.eventTypes, actorType = anActor.actorType,
        id = anActor.id, responses = state.responses;

    // We add the actor to the actors maps.
    state.actorsByType[actorType].push(id);
    state.actors[id] = anActor;

    // We complete the existing actor responses with the engine responses.
    var y = eventTypes.length;
    while (y--) {
        var eventType = eventTypes[y];
        var eventTypeResponses = responsesByType[eventType] || (responsesByType[eventType] = {});
        var responsesIdsToAdd = eventTypeResponses[actorType] || (eventTypeResponses[actorType] = []);
        var x = responsesIdsToAdd.length;
        while (x--) {
            this.$addResponseToActor(responses[responsesIdsToAdd[x]], anActor);
        }
    }

    // We execute the initActions on the actor
    var initActionsToExecute = initActionsByType[actorType];
    var z = initActionsToExecute.length;
    while (z--) {
        this.$letActorExecuteAction(anActor, initActions[initActionsToExecute[z]]);
    }
};

// Consistent with history usage.
// this.disableActor = function (anActor) {
//     var engineState = this._State, actorState = anActor._State, arr = engineState.actorsByType[actorState.actorType];
//     arr.splice(arr.indexOf(actorState.id), 1);
//     delete engineState.actors[actorState.id];
// };

/**
 * @param {Actor} anActor
 * @param {ActorType} thatObserverType
 * @param {ActorId} thatObserverId
 * @lends worldScripts.DayDiplomacy_000_Engine.$addObserverToActor
 */
this.$addObserverToActor = function (anActor, thatObserverType, thatObserverId) {
    var observers = anActor.observers;
    (observers[thatObserverType] || (observers[thatObserverType] = [])).push(thatObserverId);
};

/**
 * @param {DiplomacyResponse}aResponse
 * @param {Actor}anActor
 */
this.$addResponseToActor = function (aResponse, anActor) {
    var responsesIdByEventType = anActor.responsesIdByEventType;
    (responsesIdByEventType[aResponse.eventType] || (responsesIdByEventType[aResponse.eventType] = [])).push(aResponse.id);
};

// this.$Actor.prototype.removeResponse = function (aResponse) {
//     var arr = this._State.responses[aResponse.eventType];
//     arr.splice(arr.indexOf(aResponse.id), 1);
// };

/**
 * @param {FunctionId} anId
 * @param {function} aFunction
 * @lends worldScripts.DayDiplomacy_000_Engine.$setFunction
 */
this.$setFunction = function (anId, aFunction) {
    this._Functions[anId] = aFunction;
};

/**
 * @param {Object} anObject
 * @param {string} fieldName
 * @param {Object} fieldValue
 * @lends worldScripts.DayDiplomacy_000_Engine.$setField
 */
this.$setField = function (anObject, fieldName, fieldValue) {
    if (anObject.hasOwnProperty("_State")) { // We put the field into _State
        anObject._State[fieldName] = fieldValue;
    } else {
        anObject[fieldName] = fieldValue;
    }
};

/**
 * @param {Action} anInitAction
 * @lends worldScripts.DayDiplomacy_000_Engine.$setInitAction
 */
this.$setInitAction = function (anInitAction) {
    var initActions = this._State.initActions, initActionsByType = this._State.initActionsByType,
        initActionActorType = anInitAction.actorType;

    // We add the initAction to initActions and initActionsByType
    initActions[anInitAction.id] = anInitAction;
    (initActionsByType[initActionActorType] || (initActionsByType[initActionActorType] = [])).push(anInitAction.id);

    // We execute the action on the existing actors in an ordered fashion.
    this.$executeAction(anInitAction);
};

/**
 * @param {Action} anAction
 * @lends worldScripts.DayDiplomacy_000_Engine.$setRecurrentAction
 */
this.$setRecurrentAction = function (anAction) {
    // We add the action to recurrentActions
    var recurrentActionsByType = this._State.recurrentActionsByType, recurrentActions = this._State.recurrentActions,
        actionEventType = anAction.eventType, actionActorType = anAction.actorType;
    var eventTypeActions = recurrentActionsByType[actionEventType] || (recurrentActionsByType[actionEventType] = {});
    (eventTypeActions[actionActorType] || (eventTypeActions[actionActorType] = [])).push(anAction.id);
    recurrentActions[anAction.id] = anAction;
};

/**
 * FIXME
 * @param {string} name
 * @param {*} defaultValue
 * @returns {*}
 * @lends worldScripts.DayDiplomacy_000_Engine.$initAndReturnSavedData
 */
this.$initAndReturnSavedData = function (name, defaultValue) {
    return this._State[name] || (this._State[name] = defaultValue);
};

/**
 * FIXME
 * @param {string} name
 * @param {*} defaultValue
 * @returns {*}
 * @lends worldScripts.DayDiplomacy_000_Engine.$initAndReturnSavedDataAndInitialize
 */
this.$initAndReturnSavedDataAndInitialize = function (name, defaultValue, initFunction) {
    if (this._State[name] === undefined) {
        initFunction();
    }
    return this._State[name] || (this._State[name] = defaultValue);
};

this.$executeAction = function (anAction) {
    var ourActorIds = this._State.actorsByType[anAction.actorType], actors = this._State.actors;
    var z = ourActorIds.length;
    while (z--) {
        this.$letActorExecuteAction(actors[ourActorIds[z]], anAction);
    }
};

/**
 * A Response contains a behaviour to be executed when a certain event happens.
 * The responseFunction must take as first argument the responding actor,
 * 2nd argument the eventActor, and may take as many additional arguments as you wish.
 * The actorType is the type of the responding actors.
 *
 * @param {ResponseId}id
 * @param {EventType}eventType
 * @param {ActorType}actorType
 * @param {FunctionId}responseFunctionId
 * @return {DiplomacyResponse}
 * @lends worldScripts.DayDiplomacy_000_Engine.$buildResponse
 */
this.$buildResponse = function (id, eventType, actorType, responseFunctionId) {
    return {id: id, eventType: eventType, actorType: actorType, responseFunctionId: responseFunctionId};
};

/**
 * @param {DiplomacyResponse} aResponse
 * @lends worldScripts.DayDiplomacy_000_Engine.$setResponse
 */
this.$setResponse = function (aResponse) {
    var state = this._State, actors = state.actors;
    // We add the response to responses
    state.responsesByType[aResponse.eventType][aResponse.actorType].push(aResponse.id);
    state.responses[aResponse.id] = aResponse;

    // We add the response to the existing actors in an ordered fashion.
    var ourActorIds = state.actorsByType[aResponse.actorType];
    var z = ourActorIds.length;
    while (z--) {
        this.$addResponseToActor(aResponse, actors[ourActorIds[z]]);
    }
};

// this.unsetInitAction = function (anInitAction) { // This doesn't impact History.
//     delete this._State.initActions[anInitAction.actorType][anInitAction.id];
// };
// this.unsetRecurrentAction = function (anAction) { // This doesn't impact History.
//     var engineState = this._State, arr = engineState.recurrentActionsByType[anAction.eventType][anAction.actorType];
//     arr.splice(arr.indexOf(anAction.id), 1);
//     delete engineState.recurrentActions[anAction.id];
// };
// this.unsetResponse = function (aResponse) { // This doesn't impact History.
//     var state = this._State, actors = state.actors;
//     delete state.responses[aResponse.eventType][aResponse.actorType][aResponse.id];
//     var ourActorIds = state.actorsByType[aResponse.actorType];
//     var z = ourActorIds.length;
//     while (z--) {
//         actors[ourActorIds[z]].removeResponse(aResponse);
//     }
// };

/**
 * We don't allow to remove eventTypes as it would make the history inconsistent.
 * @param {EventType} name - name of the new eventType, it must be different from already existing names.
 * @param {int} position - the position in the ordered list of existing types
 * @lends worldScripts.DayDiplomacy_000_Engine.$addEventType
 */
this.$addEventType = function (name, position) {
    var state = this._State;
    state.eventTypes.splice(position, 0, name);
    if (this._debug) log("DiplomacyEngine", "Added " + name + " event type in position " + position + ". Current event types: " + state.eventTypes);
    var ourResponses = (state.responsesByType[name] = {});
    var ourRecurrentActions = (state.recurrentActionsByType[name] = {});
    var actorTypes = state.actorTypes;
    var z = actorTypes.length;
    while (z--) {
        var ourActorType = actorTypes[z];
        ourResponses[ourActorType] = [];
        ourRecurrentActions[ourActorType] = [];
    }
    state.eventsToPublish[name] = [];
    state.eventsToPublishNextTurn[name] = [];
};

/**
 * @param {ActorType} name
 * @param {int} position
 * @lends worldScripts.DayDiplomacy_000_Engine.$addActorType
 */
this.$addActorType = function (name, position) {
    var state = this._State;
    state.actorTypes.splice(position, 0, name);

    state.actorsByType[name] = [];
    state.initActionsByType[name] = [];

    var responses = state.responsesByType;
    var recurrentActions = state.recurrentActionsByType;
    var z = state.eventTypes.length;
    while (z--) {
        var eventType = state.eventTypes[z];
        responses[eventType][name] = [];
        recurrentActions[eventType][name] = [];
    }
};

/**
 * Gives the next state. Returns empty string if array is finished.
 * @param {EventType | ActorType} type
 * @param currentState FIXME document what's a state
 */
this._nextState = function (type, currentState) {
    var arr = this._State[type];
    var newIndex = arr.indexOf(currentState) + 1;
    return newIndex === arr.length ? "" : arr[newIndex];
};

/**
 * @param {DiplomacyEvent} anEvent
 * @private
 */
this._record = function (anEvent) {
    var eventsToPublish = this._State.eventsToPublish, eventType = anEvent.eventType,
        eventId = anEvent.id, eventActorId = anEvent.actorId, actorsEvents = this._State.actorsEvents;

    // Stamping the event
    anEvent.date = this._clock.seconds;

    // Recording the history. This is ordered by insertion, so ordered by date.
    (actorsEvents[eventActorId] || (actorsEvents[eventActorId] = [])).push(eventId);

    this._State.events[eventId] = anEvent;

    // Publishing the reality
    (eventsToPublish[eventType] || (eventsToPublish[eventType] = [])).push(anEvent);
};
// this.recordForNextTurn = function (anEvent) {
//     var eventsToPublishNextTurn = this._State.eventsToPublishNextTurn, eventType = anEvent.eventType;
//     (eventsToPublishNextTurn[eventType] || (eventsToPublishNextTurn[eventType] = [])).push(anEvent);
// };

this._gatherEventsToPublish = function () {
    var state = this._State;
    var currentEventType = state.currentEventType, eventsToPublishNextTurn = state.eventsToPublishNextTurn;
    var ourEvents = (eventsToPublishNextTurn[currentEventType] || (eventsToPublishNextTurn[currentEventType] = []));
    // FIXME 0.perfectperf, when we use Events: does the length change? check through logs
    // FIXME 0.perfectperf, when we use Events: 'while' could be cut into frames, but it would slow the history. Check the time spent through logs
    while (ourEvents.length) {
        var z = ourEvents.length;
        while (z--) {
            this._record(ourEvents.shift());
        }
    }

    // We go to next eventType
    var newEventType = this._nextState("eventTypes", currentEventType);
    if (this._debug && newEventType !== "") log(this.name, "Gathering events to publish for state: " + newEventType);

    state.currentEventType = newEventType || state.eventTypes[0];
    state.currentActorType = state.actorTypes[0];
    return !newEventType;
};

/** @return {boolean} - true when everything is finished, else false. */
this._populateStack = function () {
    var state = this._State, currentEventType = state.currentEventType, currentActorType = state.currentActorType,
        firstActorType = state.actorTypes[0];
    if (!state.recurrentActionsIsDoneForCurrentEventType) {
        if (this._debug) log(this.name, "Putting recurrent actions onto stack for event type: " + currentEventType + " and actor type: " + state.currentActorType);
        this._putRecurrentActionsOntoStack(currentEventType, currentActorType);

        // We go to next actorType
        var newActorType = this._nextState("actorTypes", currentActorType);
        state.currentActorType = newActorType || firstActorType;
        state.recurrentActionsIsDoneForCurrentEventType = !newActorType;
        return false; // No need to use too much time.
    }

    var ourEvents = state.eventsToPublish[currentEventType];
    if (ourEvents.length) {
        this._putEventOntoStack(ourEvents[0], currentActorType);

        // We go to next actorType
        var newActorType2 = this._nextState("actorTypes", currentActorType);
        state.currentActorType = newActorType2 || firstActorType;
        // When the event is processed, we remove it from the array.
        newActorType2 || ourEvents.shift();
        return false; // No need to use too much time.
    }

    // We go to next eventType
    state.currentActorType = firstActorType;
    state.recurrentActionsIsDoneForCurrentEventType = false;
    var newEventType = this._nextState("eventTypes", currentEventType);
    if (this._debug && newEventType !== "") log(this.name, "Gathering events to publish for state: " + newEventType);
    // We may have finished: no more eventType, no more actorType, no more recurrentAction, no more event to respond to.
    state.currentEventType = newEventType || state.eventTypes[0];
    return !newEventType;
};
this._putRecurrentActionsOntoStack = function (currentEventType, currentActorType) {
    var state = this._State, actions = state.recurrentActionsByType[currentEventType][currentActorType],
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
this._putEventOntoStack = function (thatEvent, currentActorType) {
    // FIXME perfectstyle we should use the eventId as arg rather than the whole event
    var eventActorId = thatEvent.actorId, eventEventType = thatEvent.eventType, eventArgs = thatEvent.args,
        state = this._State, actors = state.actors, eventActor = actors[eventActorId],
        observers = eventActor.observers[currentActorType], z = observers.length, shortStack = state.shortStack,
        responses = state.responses;
    while (z--) {
        var observer = actors[observers[z]];
        // First argument: observer, 2nd arg: eventActor, other args: other args
        var someArgs = [observer, eventActor].concat(eventArgs);
        var responseIds = observer.responsesIdByEventType[eventEventType];
        if (!responseIds) {
            continue; // No responses to process for this observer
        }
        var y = responseIds.length;
        while (y--) {
            shortStack.push({
                type: "response",
                responseFunctionId: responses[responseIds[y]].responseFunctionId,
                args: someArgs
            });
        }
    }
};

/** @return {boolean} true if finished (empty stack), false otherwise. */
this._executeStack = function () {
    var s = this._State;
    var action = s.shortStack.shift();
    if (action === undefined) {
        return true;
    }
    // FIXME 0.perfectperf measure execution time?
    if (action.type == "action") {
        this._Functions[s.recurrentActions[action.recurrentActionId].actionFunctionId](s.actors[action.actorId]);
    } else { // == "response"
        this._Functions[action.responseFunctionId](action.args);
    }
    return false;
};
this._addFrameCallback = function () {
    this._removeFrameCallback();
    if (this._debug) log(this.name, "Adding frame callback");
    this._State.callback = addFrameCallback(this._ourFrameCallback);
};
this._removeFrameCallback = function () {
    if (this._State.callback) {
        removeFrameCallback(this._State.callback);
        delete this._State.callback;
        if (this._debug) log(this.name, "Removed frame callback");
    }
};
this._ourFrameCallback = function (delta) {
    if (this._frame = ((this._frame || 0) + 1) % 10) { // One action each 10 frames
        return; // Only one in n frames is used.
    }

    var state = this._State;
    if (state.isJumpTokenBeingUsed) {
        state.isJumpTokenBeingUsed = !(this._executeStack() && this._populateStack()); // Still some work to do ?
        return; // we did enough this time
    }

    if (state.jumpTokenNb) { // Do we have an available jump token?
        if (this._gatherEventsToPublish()) { // Finished gathering
            if (this._debug) log(this.name, "Using a jump token");
            state.jumpTokenNb--;
            state.isJumpTokenBeingUsed = true;
        }
        return; // we did enough this time
    }

    if (this._debug) log(this.name, "No more jump token");
    this._removeFrameCallback(); // We have finished, we remove the callback
}.bind(this);

/* ************************** Methods to save/restore *****************************************************/

this._functionReplacer = function (key, value) {
    return typeof value == 'function' ? '/Function(' + value.toString() + ')/' : value;
};
this._functionReviver = (function () {
    var innerFn = function innerFn(key, value) {
        // All our special cases are strings // FIXME 0.perfectperf check if we get something else than string
        if (typeof value != 'string') {
            return value;
        }

        var that = innerFn; // Closure for recursion
        if (value.match(that._functionRegexp)) { // FIXME 0.perfectperf: benchmark using only one regexp rather than 2
            return eval(value.replace(that._functionReplaceRegexp, '($1)'));
        }
        return value;
    };
    innerFn._functionRegexp = new RegExp("^\\/Function\\([\\s\\S]*\\)\\/$");
    innerFn._functionReplaceRegexp = new RegExp("^\\/Function\\(([\\s\\S]*)\\)\\/$");
    return innerFn;
}.bind(this))();

/* ************************** Oolite events ***************************************************************/

this._startUp = function () {
    var sa = this._missionVariables.DayDiplomacyEngine_EngineState;
    if (sa && sa.length) { // Loading if necessary.
        this._loadState(this._State, this._JSON.parse(sa));
        this._loadState(this._Functions, this._JSON.parse(this._missionVariables.DayDiplomacyEngine_Functions, this._functionReviver));
    }

    delete this._startUp; // No need to startup twice
};
this.playerWillSaveGame = function (message) {
    this._removeFrameCallback();
    var start = new Date();
    this._missionVariables.DayDiplomacyEngine_EngineState = this._JSON.stringify(this._State);
    this._missionVariables.DayDiplomacyEngine_Functions = this._JSON.stringify(this._Functions, this._functionReplacer);
    var end = new Date();
    log("DiplomacyEngine", "Saved in ms: " + (end.getTime() - start.getTime()));
    this._addFrameCallback();
};
this.shipExitedWitchspace = function () {
    var s = this._State;
    s.jumpTokenNb || (s.jumpTokenNb = 0);
    s.jumpTokenNb++;
    if (this._debug) log(this.name, "Added jump token");
};
this.shipDockedWithStation = function (station) {
    this._addFrameCallback();
};
this.shipWillLaunchFromStation = function (station) {
    this._removeFrameCallback();
};

/* ************************** Subscribing system for scripts order ****************************************/

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

    this.shipDockedWithStation(null); // When starting, the player is docked.

    delete this.startUpComplete; // No need to startup twice
};

// FIXME create a type ScriptName?
/**  names of scripts
 * @type {string[]} */
this._subscribers = [];

/**
 * Allows an external script to use the Diplomacy API.
 * The external script must implement a function named _startUp() which will be called during the startUpComplete() function of the Diplomacy Engine.
 * @name $subscribe
 * @param {string} scriptName - the name property of the subscribing script object
 * @lends worldScripts.DayDiplomacy_000_Engine.$subscribe
 */
this.$subscribe = function (scriptName) {
    this._subscribers.push(scriptName);
};