"use strict";
this.name = "DayDiplomacy_002_EngineAPI";
this.author = "David (Day) Pradier";
this.copyright = "(C) 2017 David Pradier";
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script is the Diplomacy engine API for external scripts.";

// <oxpDevelopersIgnore> Common variable to this script. Oxp developers: please ignore. #####################################
this.startUp = function () {
    this._s = worldScripts.DayDiplomacy_000_Engine;
    this._e = this._s.$getEngine();
    this._S = this._e.State;
    delete this.startUp;
};
// </oxpDevelopersIgnore> ####################################################################################################

// $$$$$$$$$$$$$$$$$$$$$$$$$$$$ Builder functions (factory) $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
this.$buildNewActionId = function () {
    return this._e.getNewActionId();
};
this.$buildNewResponseId = function () {
    return this._e.getNewResponseId();
};
this.$buildNewActorId = function () {
    return this._e.getNewActorId();
};
/**
 * An action, whether it is init or recurrent isn't put into the History. Only Events are.
 * @param string: anEventType is used to order the actions and events execution. For a same eventType, Actions are executed before Events.
 * @param string: anActorType Only actors of the type will execute the action.
 * @param function: someFunction This function must take one and only one argument: the actor which will "act".
 */
this.$buildAction = function (id, eventType, actorType, actionFunction) {
    return new this._s.$Action({id: id, eventType: eventType, actorType: actorType, actionFunction: actionFunction});
};
/**
 *
 * @param string: anEventType
 * @param string: anActorId
 * @param []: someArgs Have to be compatible with our implementation of JSON stringify/parse.
 * Those are the information/arguments which will be given to the response function.
 */
this.$buildEvent = function (eventType, actorId, args) {
    return new this._s.$Event({eventType: eventType, actorId: actorId, args: args});
};
/**
 * A Response contains a behaviour to be executed when a certain event happens.
 * The responseFunction must take as first argument the responding actor,
 * 2nd argument the eventActor, and may take as many additional arguments as you wish.
 * The actorType is the type of the responding actors.
 */
this.$buildResponse = function (id, eventType, actorType, responseFunction) {
    return new _s.$Response({id: id, eventType: eventType, actorType: actorType, responseFunction: responseFunction});
};
/**
 * A planetary system or an alliance, or whatever you wish :)
 */
this.$buildActor = function (actorType, id) {
    var a = new _s.$Actor(_s.$buildDefaultActorState(actorType, id));
    a.init();
    return a;
};

// $$$$$$$$$$$$$$$$$$$$$$$$$$$$ End of builder functions (factory) $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$ Universe modification functions $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

this.$addEventType = function (name, position) {
    _e.addEventType(name, position);
};
this.$addActorType = function (name, position) {
    _e.addActorType(name, position);
};
this.$addActor = function (anActor) {
    _e.addActor(anActor);
};
this.$disableActor = function (anActor) {
    _e.disableActor(anActor);
};
this.$setInitAction = function (anAction) {
    _e.setInitAction(anAction);
};
this.$unsetInitAction = function (anAction) {
    _e.unsetInitAction(anAction);
};
this.$setRecurrentAction = function (anAction) {
    _e.setRecurrentAction(anAction);
};
this.$unsetRecurrentAction = function (anAction) {
    _e.unsetRecurrentAction(anAction);
};
this.$setResponse = function (aResponse) {
    _e.setResponse(aResponse);
};
this.$unsetResponse = function (aResponse) {
    _e.unsetResponse(aResponse);
};
this.$addObserverToActor = function (anObserverId, anObserverActorType, anActor) {
    anActor.addObserver(anObserverActorType, anObserverId);
};
this.$setField = function (anObject, fieldName, fieldValue) {
    if (anObject.hasOwnProperty("State")) { // We put the field into State
        anObject.State[fieldName] = fieldValue;
    } else {
        anObject[fieldName] = fieldValue;
    }
    if (anObject.hasOwnProperty("stringifyType")) { // We must stringify after having set the field
        anObject.stringify();
    }
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
    // FIXME do this._S = _e.State?
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
    return anActor.State.observers[observersActorType];
};

// $$$$$$$$$$$$$$$$$$$$$$$$$$$$ End of universe getter functions $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$