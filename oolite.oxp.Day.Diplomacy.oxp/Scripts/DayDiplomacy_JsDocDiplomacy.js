"use strict";

/**
 * An id identifying an {@link Actor}
 * @typedef ActorId
 * @alias {string}
 */

/**
 * An id identifying an {@link Action}
 * @typedef ActionId
 * @alias {string}
 */

/**
 * An id identifying a {@link DiplomacyEvent}
 * @typedef EventId
 * @alias {string}
 */

/**
 * An id identifying a {@link DiplomacyFunction}
 * @typedef FunctionId
 * @alias {string}
 */

/**
 * An id identifying a {@link DiplomacyResponse}
 * @typedef ResponseId
 * @alias {string}
 */

/**
 * A type qualifying a {@link DiplomacyEvent}
 * @typedef EventType
 * @alias {string}
 */

/**
 * A type of {@link Actor}
 * @typedef ActorType
 * @alias {string}
 */

/**
 @typedef DiplomacyEvent
 @property {EventId} id
 @property {EventType} eventType
 @property {ActorId} actorId - actorId
 @property {Object[]} args
 */

/**
 @typedef DiplomacyResponse
 @property {ResponseId} id
 */

/**
 @typedef Actor
 @property {ActorId} id
 @property {string} name
 @property {ActorType} actorType
 @property {Object<ActorType,ActorId[]>} observers
 @property {Object<EventType,ResponseId[]>} responsesIdByEventType
 */

/**
 @typedef Action
 @property {ActionId} id
 @property {EventType} eventType - anEventType is used to order the actions and events execution. For a same eventType, Actions are executed before Events.
 @property {ActorType} actorType - Only actors of the type will execute the action.
 @property {FunctionId} actionFunctionId - the id of a function which must take one and only one argument: the actor which will "act".

 */

/**
 * @typedef Script
 * @property {string} name FIXME
 * @property {string} author FIXME
 * @property {string} copyright FIXME
 * @property {string} description FIXME
 * @property {string} licence FIXME
 */

/**
 * The Diplomacy Engine script
 * @type Script
 */
worldScripts.DayDiplomacy_000_Engine;

/**
 * The Diplomacy Planetary Systems script
 * @type Script
 */
worldScripts.DayDiplomacy_010_Systems;


/**
 * The Diplomacy History script
 * @type Script
 */
worldScripts.DayDiplomacy_020_History;

/**
 * The Diplomacy Economy script
 * @type Script
 */
worldScripts.DayDiplomacy_030_EconomyEngine;

/**
 * The Diplomacy War Engine script
 * @type Script
 */
worldScripts.DayDiplomacy_040_WarEngine;

/**
 * The Diplomacy War script
 * @type Script
 */
worldScripts.DayDiplomacy_045_War;

/**
 * The Diplomacy Citizenships script
 * @type Script
 */
worldScripts.DayDiplomacy_060_Citizenships;

/**
 * The XenonUI script, for compatibility
 * @type Script
 */
worldScripts.XenonUI;

/**
 * @function
 */
worldScripts.XenonUI.$addMissionScreenException;

/**
 * The XenonReduxUI script, for compatibility
 * @type Script
 */
worldScripts.XenonReduxUI;

/**
 * @function
 */
worldScripts.XenonReduxUI.$addMissionScreenException;