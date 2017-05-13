"use strict";
this.name = "DayDiplomacy_002_EngineAPI";
this.author = "David (Day) Pradier";
this.copyright = "(C) 2017 David Pradier";
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script is the Diplomacy engine API for external scripts.";

// $$$$$$$$$$$$$$$$$$$$$$$$$$$$ Builder functions (factory) $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
this.$buildNewActionId = function () {
    return this._s.$getNewActionId();
};
this.$buildNewEventId = function () {
    return this._s.$getNewEventId();
};
this.$buildNewResponseId = function () {
    return this._s.getNewResponseId();
};
this.$buildNewActorId = function () {
    return this._s.$getNewActorId();
};
this.$buildNewFunctionId = function () {
    return this._s.$getNewFunctionId();
};
/**
 * An action, whether it is init or recurrent isn't put into the History. Only Events are.
 * @param string: anEventType is used to order the actions and events execution. For a same eventType, Actions are executed before Events.
 * @param string: anActorType Only actors of the type will execute the action.
 * @param functionId the id of a function which must take one and only one argument: the actor which will "act".
 */
this.$buildAction = function (id, eventType, actorType, actionFunctionId) {
    return {id: id, eventType: eventType, actorType: actorType, actionFunctionId: actionFunctionId};
};
/**
 *
 * @param string: anEventType
 * @param string: anActorId
 * @param []: someArgs Have to be compatible with our implementation of JSON stringify/parse.
 * Those are the information/arguments which will be given to the response function.
 */
// An event is { id:id, eventType:eventType, actorId:actorId, args:args }
this.$buildEvent = function (id, eventType, actorId, args) {
    return {id: id, eventType: eventType, actorId: actorId, args: args};
};
// A response is { id:id, eventType:eventType, actorType:responderActorType, responseFunctionId:functionId }
// This function must take as first argument the responder actor, 2nd argument the eventActor, and may take as many additional arguments as you wish.
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
 */
this.$buildActor = function (actorType, id) {
    return {id: id, actorType: actorType, responsesIdByEventType: {}, observers: {}};
};
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$ End of builder functions (factory) $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

// $$$$$$$$$$$$$$$$$$$$$$$$$$$$ Universe modification functions $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
this.$addEventType = function (name, position) {
    this._s.$addEventType(name, position);
};
this.$addActorType = function (name, position) {
    this._s.$addActorType(name, position);
};
this.$addActor = function (anActor) {
    this._s.$addActor(anActor);
};
// this.$disableActor = function (anActor) {
//     this._s.disableActor(anActor);
// };
this.$setFunction = function (anId, aFunction) {
    this._s.$setFunction(anId, aFunction);
};
this.$getFunctions = function() {
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
this.$addObserverToActor = function (anObserverId, anObserverActorType, anActor) {
    this._s.$addObserverToActor(anActor, anObserverActorType, anObserverId);
};
this.$setField = function (anObject, fieldName, fieldValue) {
    if (anObject.hasOwnProperty("State")) { // We put the field into State
        anObject.State[fieldName] = fieldValue;
    } else {
        anObject[fieldName] = fieldValue;
    }
};
this.$letActorActAnEvent = function(actorId, anEventType, someArgs) {
    this._s.$letActorActAnEvent(actorId, anEventType, someArgs);
};
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$ End of universe modification functions $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

// $$$$$$$$$$$$$$$$$$$$$$$$$$$$ Universe getter functions $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
/**
 * Make sure you don't modify that or its content. Copy it before if you need to modify it.
 * @returns [string: actorType]
 */
this.$getActorTypes = function () {
    return this._S.actorTypes;
};
/**
 * Make sure you don't modify that or its content. Copy it before if you need to modify it.
 * @returns [string: eventType]
 */
this.$getEventTypes = function () {
    return this._S.eventTypes;
};
/**
 * Make sure you don't modify that list or its content. Copy it before if you need to modify it.
 * @param actorType
 * @returns [actorIds]
 */
this.$getActorsIdByType = function (actorType) {
    return this._S.actorsByType[actorType];
};
/**
 * Make sure you don't modify that {} or its content. Copy it before if you need to modify it.
 * @returns {actorId => Actor}
 */
this.$getActors = function () {
    return this._S.actors;
};
/**
 * Make sure you don't modify that or its content. Copy it before if you need to modify it.
 * @returns [observerActorId]
 */
this.$getObservers = function (anActor, observersActorType) {
    return anActor.observers[observersActorType];
};
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$ End of universe getter functions $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

// ############################ Oxp developers: please ignore from here. ##############################################
this._startUp = function () {
    this._S = this._s.State;
    this._F = this._s.Functions;
    delete this._startUp;
};
this.startUp = function () {
    this._s = worldScripts.DayDiplomacy_000_Engine;
    this._s.$subscribe(this.name);
    delete this.startUp; // No need to startup twice
};