"use strict";
this.name = "DayDiplomacy_002_EngineAPI";
this.author = "David (Day) Pradier";
this.copyright = "(C) 2017 David Pradier";
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script is the Diplomacy engine API for external scripts.";

// <oxpDevelopersIgnore> Common variable to this script. Oxp developers: please ignore. #####################################
var __DayDiplomacy_EngineAPI_state = {};
this.__DayDiplomacy_EngineAPI_initState = function () {
    __DayDiplomacy_EngineAPI_state.engine = worldScripts.DayDiplomacy_000_Engine.$getEngine();
    __DayDiplomacy_EngineAPI_state.arbiter = __DayDiplomacy_EngineAPI_state.engine._getArbiter();
    __DayDiplomacy_EngineAPI_state.historian = __DayDiplomacy_EngineAPI_state.engine._getHistorian();
};
this.startUp = function () {
    this.__DayDiplomacy_EngineAPI_initState();
};
this.__DayDiplomacy_EngineAPI_methods = {};
// </oxpDevelopersIgnore> ####################################################################################################

// $$$$$$$$$$$$$$$$$$$$$$$$$$$$ Builder functions (factory) $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
this.__DayDiplomacy_EngineAPI_methods.buildNewActionId = function () {
    return __DayDiplomacy_EngineAPI_state.arbiter.getNewActionId(__DayDiplomacy_EngineAPI_state.arbiter);
};

this.__DayDiplomacy_EngineAPI_methods.buildNewResponseId = function () {
    return __DayDiplomacy_EngineAPI_state.arbiter.getNewResponseId(__DayDiplomacy_EngineAPI_state.arbiter);
};

this.__DayDiplomacy_EngineAPI_methods.buildNewActorId = function () {
    return __DayDiplomacy_EngineAPI_state.arbiter.getNewActorId(__DayDiplomacy_EngineAPI_state.arbiter);
};

/**
 * An action, whether it is init or recurrent isn't put into the History. Only Events are.
 * @param string: anEventType is used to order the actions and events execution. For a same eventType, Actions are executed before Events.
 * @param string: anActorType Only actors of the type will execute the action.
 * @param function: someFunction This function must take one and only one argument: the actor which will "act".
 */
this.__DayDiplomacy_EngineAPI_methods.buildAction = function (id, eventType, actorType, actionFunction) {
    return new __DayDiplomacy_EngineAPI_state.engine.$Action({
        "id": id,
        "eventType": eventType,
        "actorType": actorType,
        "actionFunction": actionFunction
    });
};

/**
 *
 * @param string: anEventType
 * @param string: anActorId
 * @param []: someArgs Have to be compatible with our implementation of JSON stringify/parse.
 * Those are the information/arguments which will be given to the response function.
 */
this.__DayDiplomacy_EngineAPI_methods.buildEvent = function (eventType, actorId, args) {
    return new __DayDiplomacy_EngineAPI_state.engine.$Event({
        "eventType": eventType,
        "actorId": actorId,
        "args": args
    });
};

/**
 * A Response contains a behaviour to be executed when a certain event happens.
 * The responseFunction must take as first argument the responding actor,
 * 2nd argument the eventActor, and may take as many additional arguments as you wish.
 */
this.__DayDiplomacy_EngineAPI_methods.buildResponse = function (id, eventType, actorType, responseFunction) {
    return new __DayDiplomacy_EngineAPI_state.engine.Response({
        "id": id,
        "eventType": eventType,
        "actorType": actorType, // The type of the responding actor
        "responseFunction": responseFunction
    });
};

/**
 * A planetary system or an alliance, or whatever you wish :)
 */
this.__DayDiplomacy_EngineAPI_methods.buildActor = function (actorType, id) {
    var a = new __DayDiplomacy_EngineAPI_state.engine.Actor(__DayDiplomacy_EngineAPI_state.engine.DefaultActorState(actorType, id));
    a.init(a);
    return a;
};

// $$$$$$$$$$$$$$$$$$$$$$$$$$$$ End of builder functions (factory) $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

// $$$$$$$$$$$$$$$$$$$$$$$$$$$$ Universe modification functions $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

this.__DayDiplomacy_EngineAPI_methods.addEventType = function (name, position) {
    __DayDiplomacy_EngineAPI_state.arbiter.addEventType(__DayDiplomacy_EngineAPI_state.arbiter, name, position);
};

this.__DayDiplomacy_EngineAPI_methods.addActorType = function (name, position) {
    __DayDiplomacy_EngineAPI_state.arbiter.addActorType(__DayDiplomacy_EngineAPI_state.arbiter, name, position);
};

this.__DayDiplomacy_EngineAPI_methods.addActor = function (anActor) {
    __DayDiplomacy_EngineAPI_state.arbiter.addActor(__DayDiplomacy_EngineAPI_state.arbiter, anActor);
};

this.__DayDiplomacy_EngineAPI_methods.disableActor = function (anActor) {
    __DayDiplomacy_EngineAPI_state.arbiter.disableActor(__DayDiplomacy_EngineAPI_state.arbiter, anActor);
};

this.__DayDiplomacy_EngineAPI_methods.setInitAction = function (anAction) {
    __DayDiplomacy_EngineAPI_state.arbiter.setInitAction(__DayDiplomacy_EngineAPI_state.arbiter, anAction);
};

this.__DayDiplomacy_EngineAPI_methods.unsetInitAction = function (anAction) {
    __DayDiplomacy_EngineAPI_state.arbiter.unsetInitAction(__DayDiplomacy_EngineAPI_state.arbiter, anAction);
};

this.__DayDiplomacy_EngineAPI_methods.setRecurrentAction = function (anAction) {
    __DayDiplomacy_EngineAPI_state.arbiter.setRecurrentAction(__DayDiplomacy_EngineAPI_state.arbiter, anAction);
};

this.__DayDiplomacy_EngineAPI_methods.unsetRecurrentAction = function (anAction) {
    __DayDiplomacy_EngineAPI_state.arbiter.unsetRecurrentAction(__DayDiplomacy_EngineAPI_state.arbiter, anAction);
};

this.__DayDiplomacy_EngineAPI_methods.setResponse = function (aResponse) {
    __DayDiplomacy_EngineAPI_state.arbiter.setResponse(__DayDiplomacy_EngineAPI_state.arbiter, aResponse);
};

this.__DayDiplomacy_EngineAPI_methods.unsetResponse = function (aResponse) {
    __DayDiplomacy_EngineAPI_state.arbiter.unsetResponse(__DayDiplomacy_EngineAPI_state.arbiter, aResponse);
};

this.__DayDiplomacy_EngineAPI_methods.addObserverToActor = function (anObserverId, anObserverActorType, anActor) {
    anActor.addObserver(anActor, anObserverActorType, anObserverId);
};

this.__DayDiplomacy_EngineAPI_methods.setField = function (anObject, fieldName, fieldValue) {
    if (anObject.hasOwnProperty("State")) { // We put the field into State
        anObject.State[fieldName] = fieldValue;
    } else {
        anObject[fieldName] = fieldValue;
    }
    if (anObject.hasOwnProperty("stringifyType")) { // We must stringify after having set the field
        anObject.stringify(anObject);
    }
};


// $$$$$$$$$$$$$$$$$$$$$$$$$$$$ End of universe modification functions $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

// $$$$$$$$$$$$$$$$$$$$$$$$$$$$ Universe getter functions $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

/**
 * Make sure you don't modify that or its content. Copy it before if you need to modify it.
 * @returns [string: actorType]
 */
this.__DayDiplomacy_EngineAPI_methods.getActorTypes = function () {
    return __DayDiplomacy_EngineAPI_state.arbiter.State.actorTypes;
};

/**
 * Make sure you don't modify that or its content. Copy it before if you need to modify it.
 * @returns [string: eventType]
 */
this.__DayDiplomacy_EngineAPI_methods.getEventTypes = function () {
    return __DayDiplomacy_EngineAPI_state.arbiter.State.eventTypes;
};

/**
 * Make sure you don't modify that list or its content. Copy it before if you need to modify it.
 * @param actorType
 * @returns [actorIds]
 */
this.__DayDiplomacy_EngineAPI_methods.getActorsIdByType = function (actorType) {
    return __DayDiplomacy_EngineAPI_state.arbiter.State.actorsByType[actorType];
};

/**
 * Make sure you don't modify that {} or its content. Copy it before if you need to modify it.
 * @returns {actorId => Actor}
 */
this.__DayDiplomacy_EngineAPI_methods.getActors = function () {
    return __DayDiplomacy_EngineAPI_state.arbiter.State.actors;
};

/**
 * Make sure you don't modify that or its content. Copy it before if you need to modify it.
 * @returns [observerActorId]
 */
this.__DayDiplomacy_EngineAPI_methods.getObservers = function (anActor, observersActorType) {
    return anActor.State.observers[observersActorType];
};

// $$$$$$$$$$$$$$$$$$$$$$$$$$$$ End of universe getter functions $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$