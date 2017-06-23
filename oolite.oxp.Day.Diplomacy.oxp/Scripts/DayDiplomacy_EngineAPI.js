"use strict";
this.name = "DayDiplomacy_002_EngineAPI";
this.author = "David (Day) Pradier";
this.copyright = "(C) 2017 David Pradier";
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script is the Diplomacy engine API for external scripts.";

/*************************** Factory functions ***********************************************************/
this.$buildNewActionId = function () {
    return this._s.$getNewActionId();
};
this.$buildNewEventId = function () {
    return this._s.$getNewEventId();
};
this.$buildNewResponseId = function () {
    return this._s.$getNewResponseId();
};
this.$buildNewActorId = function () {
    return this._s.$getNewActorId();
};
this.$buildNewFunctionId = function () {
    return this._s.$getNewFunctionId();
};
this.$buildAction = function (id, eventType, actorType, actionFunctionId) {
    /**
     * An action, whether it is init or recurrent isn't put into the History. Only Events are.
     * @param string: anEventType is used to order the actions and events execution. For a same eventType, Actions are executed before Events.
     * @param string: anActorType Only actors of the type will execute the action.
     * @param functionId the id of a function which must take one and only one argument: the actor which will "act".
     */
    return {id: id, eventType: eventType, actorType: actorType, actionFunctionId: actionFunctionId};
};
this.$buildEvent = function (id, eventType, actorId, args) {
    /**
     * @param string: anEventType
     * @param string: anActorId
     * @param []: someArgs Have to be compatible with our implementation of JSON stringify/parse.
     * Those are the information/arguments which will be given to the response function.
     */
    return {id: id, eventType: eventType, actorId: actorId, args: args};
};
this.$buildResponse = function (id, eventType, actorType, responseFunctionId) {
    /**
     * A Response contains a behaviour to be executed when a certain event happens.
     * The responseFunction must take as first argument the responding actor,
     * 2nd argument the eventActor, and may take as many additional arguments as you wish.
     * The actorType is the type of the responding actors.
     */
    return {id: id, eventType: eventType, actorType: actorType, responseFunctionId: responseFunctionId};
};
this.$buildActor = function (actorType, id) {
    /**
     * A planetary system or an alliance, or whatever you wish :)
     * An actor is {id:id, actorType:actorType, responsesIdByEventType:{eventType:[responseIds]}, observers:{actorType:[actorIds]}}
     */
    return {id: id, actorType: actorType, responsesIdByEventType: {}, observers: {}};
};
/*************************** End of Factory functions ****************************************************/

/*************************** Action functions ************************************************************/
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
this.$makeActorEventKnownToUniverse = function (actorId, anEventType, someArgs) {
    this._s.$makeActorEventKnownToUniverse(actorId, anEventType, someArgs);
};
this.$initAndReturnSavedData = function (name, defaultValue) {
    return this._s.State[name] || (this._s.State[name] = defaultValue);
};
/*************************** End of Action functions *****************************************************/

/*************************** Getter functions ************************************************************/
/******** Make sure you don't modify that or its content. Copy it before if you need to modify it. *******/
this.$getActorTypes = function () {
    /** @returns [string: actorType] */
    return this._S.actorTypes;
};
this.$getEventTypes = function () {
    /** @returns [string: eventType] */
    return this._S.eventTypes;
};
this.$getActorsIdByType = function (actorType) {
    /**
     * @param actorType
     * @returns [actorIds]
     */
    return this._S.actorsByType[actorType];
};
this.$getActors = function () {
    /** @returns {actorId => Actor} */
    return this._S.actors;
};
this.$getObservers = function (anActor, observersActorType) {
    /** @returns [observerActorId] */
    return anActor.observers[observersActorType];
};
this.$getEvents = function () {
    /** @returns {eventId => Event} */
    return this._S.events;
};
this.$getActorEvents = function (actorId) {
    /** @returns [eventId] */
    return this._S.actorsEvents[actorId] || [];
};
/*************************** End of Getter functions *****************************************************/

/*************************** Oolite events ***************************************************************/
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
/*************************** End Oolite events ***********************************************************/