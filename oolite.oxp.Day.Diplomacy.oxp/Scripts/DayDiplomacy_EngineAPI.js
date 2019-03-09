"use strict";
this.name = "DayDiplomacy_002_EngineAPI";
this.author = "David (Day) Pradier";
// noinspection JSUnusedGlobalSymbols Used by Oolite itself
this.copyright = "(C) 2017 David Pradier";
// noinspection JSUnusedGlobalSymbols Used by Oolite itself
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script is the Diplomacy engine API for external scripts.";

/* ************************** Factory functions ***********************************************************/

/**
 * @return {ActionId}
 * @lends worldScripts.DayDiplomacy_002_EngineAPI.$buildNewActionId
 */
this.$buildNewActionId = function () {
    return this._s.$getNewActionId();
};
this.$buildNewEventId = function () {
    return this._s.$getNewEventId();
};
this.$buildNewResponseId = function () {
    return this._s.$getNewResponseId();
};
/**
 * @return {ActorId}
 * @lends worldScripts.DayDiplomacy_002_EngineAPI.$buildNewActorId
 */
this.$buildNewActorId = function () {
    return this._s.$getNewActorId();
};
/**
 * @return {FunctionId}
 * @lends worldScripts.DayDiplomacy_002_EngineAPI.$buildNewFunctionId
 */
this.$buildNewFunctionId = function () {
    return this._s.$getNewFunctionId();
};

/**
 * An action, whether it is init or recurrent isn't put into the History. Only Events are.
 * @param {ActionId} id -
 * @param {EventType} eventType - is used to order the actions and events execution. For a same eventType, Actions are executed before Events.
 * @param {ActorType} actorType - Only actors of the type will execute the action.
 * @param {FunctionId} actionFunctionId - the id of a function which must take one and only one argument: the actor which will "act".
 * @return {Action}
 * @lends worldScripts.DayDiplomacy_002_EngineAPI.$buildAction
 */
this.$buildAction = function (id, eventType, actorType, actionFunctionId) {
    /** @type {Action} */
    return {id: id, eventType: eventType, actorType: actorType, actionFunctionId: actionFunctionId};
};

/**
 *
 * @param {EventId} id
 * @param {EventType} eventType
 * @param {ActorId} actorId
 * @param {Object[]} args  Have to be compatible with our implementation of JSON stringify/parse. Those are the information/arguments which will be given to the response function.
 * @return {DiplomacyEvent}
 */
this.$buildEvent = function (id, eventType, actorId, args) {
    return {id: id, eventType: eventType, actorId: actorId, args: args};
};
// FIXME define the Response type
    /**
     * A Response contains a behaviour to be executed when a certain event happens.
     * The responseFunction must take as first argument the responding actor,
     * 2nd argument the eventActor, and may take as many additional arguments as you wish.
     * The actorType is the type of the responding actors.
     */
this.$buildResponse = function (id, eventType, actorType, responseFunctionId) {
    return {id: id, eventType: eventType, actorType: actorType, responseFunctionId: responseFunctionId};
};

/**
 * A planetary system or an alliance, or whatever you wish :)
 * An actor is {id:id, actorType:actorType, responsesIdByEventType:{eventType:[responseIds]}, observers:{actorType:[actorIds]}}
 * @param {string} actorType
 * @param {ActorId} id
 * @return {{actorType: *, id: *, responsesIdByEventType: {}, observers: {}}}
 * @lends worldScripts.DayDiplomacy_002_EngineAPI.$buildActor
 */
this.$buildActor = function (actorType, id) {
    return {id: id, actorType: actorType, responsesIdByEventType: {}, observers: {}};
};

/* ************************** Action functions ************************************************************/

this.$addEventType = function (name, position) {
    this._s.$addEventType(name, position);
};
/**
 *
 * @param {string} name
 * @param {int} position
 * @lends worldScripts.DayDiplomacy_002_EngineAPI.$addActorType
 */
this.$addActorType = function (name, position) {
    this._s.$addActorType(name, position);
};
/**
 *
 * @param {Object} anActor
 * @lends worldScripts.DayDiplomacy_002_EngineAPI.$addActor
 */
this.$addActor = function (anActor) {
    this._s.$addActor(anActor);
};
// this.$disableActor = function (anActor) {
//     this._s.disableActor(anActor);
// };
this.$setFunction = function (anId, aFunction) {
    this._s.$setFunction(anId, aFunction);
};
this.$getFunctions = function () {
    return this._F;
};
this.$setInitAction = function (anAction) {
    this._s.$setInitAction(anAction);
};
// this.$unsetInitAction = function (anAction) {
//     this._s.unsetInitAction(anAction);
// };
this.$setRecurrentAction = function (anAction) {
    this._s.$setRecurrentAction(anAction);
};
// this.$unsetRecurrentAction = function (anAction) {
//     this._s.unsetRecurrentAction(anAction);
// };
this.$setResponse = function (aResponse) {
    this._s.$setResponse(aResponse);
};
// this.$unsetResponse = function (aResponse) {
//     this._s.unsetResponse(aResponse);
// };
/**
 *
 * @param {string} anObserverId
 * @param {string} anObserverActorType
 * @param {Object} anActor
 * @lends worldScripts.DayDiplomacy_002_EngineAPI.$addObserverToActor
 */
this.$addObserverToActor = function (anObserverId, anObserverActorType, anActor) {
    // FIXME the order of parameters, one more reason to remove the API
    this._s.$addObserverToActor(anActor, anObserverActorType, anObserverId);
};
/**
 * @param {Object} anObject
 * @param {string} fieldName
 * @param {Object} fieldValue
 * @lends worldScripts.DayDiplomacy_002_EngineAPI.$setField
 */
this.$setField = function (anObject, fieldName, fieldValue) {
    if (anObject.hasOwnProperty("_State")) { // We put the field into _State
        anObject._State[fieldName] = fieldValue;
    } else {
        anObject[fieldName] = fieldValue;
    }
};

/**
 *
 * @param {ActorId} actorId
 * @param {EventType} anEventType
 * @param {Object[]} someArgs
 * @lends worldScripts.DayDiplomacy_002_EngineAPI.$makeActorEventKnownToUniverse
 */
this.$makeActorEventKnownToUniverse = function (actorId, anEventType, someArgs) {
    this._s.$makeActorEventKnownToUniverse(actorId, anEventType, someArgs);
};

/**
 * FIXME
 * @param name
 * @param defaultValue
 * @returns {*}
 * @lends worldScripts.DayDiplomacy_002_EngineAPI.$initAndReturnSavedData
 */
this.$initAndReturnSavedData = function (name, defaultValue) {
    return this._s._State[name] || (this._s._State[name] = defaultValue);
};

/* ************************** Getter functions ************************************************************/
/* ******* Make sure you don't modify that or its content. Copy it before if you need to modify it. *******/

/**
 * Make sure you don't modify that or its content. Copy it before if you need to modify it.
 * @return {string[]} The ActorType list
 * @lends worldScripts.DayDiplomacy_002_EngineAPI.$getActorTypes
 */
this.$getActorTypes = function () {
    return this._S.actorTypes;
};
this.$getEventTypes = function () {
    /** @returns [string: eventType] */
    return this._S.eventTypes;
};
/**
 *
 * @param {string} actorType
 * @returns {string[]} the list of actorId having the type given as parameter
 * @lends worldScripts.DayDiplomacy_002_EngineAPI.$getActorsIdByType
 */
this.$getActorsIdByType = function (actorType) {
    return this._S.actorsByType[actorType];
};
/**
 * @name $getActors
 * @returns {{}} - an object with {@link ActorId} as keys and as value the corresponding {@link Actor}
 * @lends worldScripts.DayDiplomacy_002_EngineAPI.$getActors
 */
this.$getActors = function () {
    return this._S.actors;
};
/**
 *
 * @param {Object} anActor
 * @param {string} observersActorType
 * @returns {string[]} the list of the actorId's of the observers of the given actor, which are of the given type
 * @lends worldScripts.DayDiplomacy_002_EngineAPI.$getObservers
 */
this.$getObservers = function (anActor, observersActorType) {
    return anActor.observers[observersActorType];
};
/**
 * Returns the events dictionary with {@link EventId} as keys, and {@link Event} as values
 * @return {{}}
 * @lends worldScripts.DayDiplomacy_002_EngineAPI.$getEvents
 */
this.$getEvents = function () {
    return this._S.events;
};
/**
 * @param {ActorId} actorId
 * @return {EventId[]}
 * @lends worldScripts.DayDiplomacy_002_EngineAPI.$getActorEvents
 */
this.$getActorEvents = function (actorId) {
    return this._S.actorsEvents[actorId] || [];
};

/* ************************** Oolite events ***************************************************************/

this._startUp = function () {
    this._S = this._s._State;
    this._F = this._s._Functions;
    delete this._startUp;
};
this.startUp = function () {
    this._s = worldScripts.DayDiplomacy_000_Engine;
    this._s.$subscribe(this.name);
    delete this.startUp; // No need to startup twice
};