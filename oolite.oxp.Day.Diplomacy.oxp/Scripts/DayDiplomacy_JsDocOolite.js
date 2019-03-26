"use strict";
/**
 * The System class represents the current system. There is always one System object, available through the global property system.
 * @typedef System
 * @property {int} ID {@link http://wiki.alioth.net/index.php/Oolite_JavaScript_Reference:_System#ID}
 * @property {SystemInfo} info {@link http://wiki.alioth.net/index.php/Oolite_JavaScript_Reference:_System#info}
 * @property {function} infoForSystem {@link http://wiki.alioth.net/index.php/Oolite_JavaScript_Reference:_System#infoForSystem}
 * @property {string} name {@link http://wiki.alioth.net/index.php/Oolite_JavaScript_Reference:_System#name}
 * @property {int} population {@link http://wiki.alioth.net/index.php/Oolite_JavaScript_Reference:_System#population}
 * @property {int} productivity {@link http://wiki.alioth.net/index.php/Oolite_JavaScript_Reference:_System#productivity}
 * @property {int} techLevel {@link http://wiki.alioth.net/index.php/Oolite_JavaScript_Reference:_System#techLevel}
 * @property {int} government {@link http://wiki.alioth.net/index.php/Oolite_JavaScript_Reference:_System#government}
 * @see {@link http://wiki.alioth.net/index.php/Oolite_JavaScript_Reference:_System}
 */

/**
 * @function System.infoForSystem
 * @param {int} galaxyID
 * @param {int} systemID
 * @return {SystemInfo}
 * @see {@link http://wiki.alioth.net/index.php/Oolite_JavaScript_Reference:_System#infoForSystem}
 */

/**
 * SystemInfo objects provide information about a specific system.
 * @typedef SystemInfo
 * @property {int} galaxyID {@link http://wiki.alioth.net/index.php/Oolite_JavaScript_Reference:_SystemInfo#galaxyID}
 * @property {int} systemID {@link http://wiki.alioth.net/index.php/Oolite_JavaScript_Reference:_SystemInfo#systemID}
 * @property {int} productivity
 * @property {int} population
 * @property {function} systemsInRange {@link http://wiki.alioth.net/index.php/Oolite_JavaScript_Reference:_SystemInfo#systemsInRange}
 * @see {@link http://wiki.alioth.net/index.php/Oolite_JavaScript_Reference:_SystemInfo}
 */

/**
 *  Returns the SystemInfo of the systems nearer than 7 ly from the original SystemInfo
 * @function SystemInfo.systemsInRange
 * @instance
 * @return {SystemInfo[]}
 */

// Note: player.ship doesn't exist in the Oolite player wiki.
/**
 * The Player class is represents the player. There is always exactly one Player object in existence, which can be accessed through the player global property.
 * @typedef Player
 * @property {PlayerShip} ship
 * @property {Number} credits {@link http://wiki.alioth.net/index.php/Oolite_JavaScript_Reference:_Player#credits}
 * @property {int} bounty {@link http://wiki.alioth.net/index.php/Oolite_JavaScript_Reference:_Player#bounty}
 * @property {function} commsMessage  {@link http://wiki.alioth.net/index.php/Oolite_JavaScript_Reference:_Player#commsMessage}
 * @see {@link http://wiki.alioth.net/index.php/Oolite_JavaScript_Reference:_Player}
 */

/**
 * @function Player.commsMessage
 * @param {string} message
 * @instance
 * @see {@link http://wiki.alioth.net/index.php/Oolite_JavaScript_Reference:_Player#commsMessage}
 */

/**
 * The Ship class is an Entity representing a ship, station, missile, cargo pod or other flying item – anything that can be specified in shipdata.plist.
 * @typedef Ship
 * @property {int} homeSystem {@link http://wiki.alioth.net/index.php/Oolite_JavaScript_Reference:_Ship#homeSystem}
 * @property {function} awardEquipment {@link http://wiki.alioth.net/index.php/Oolite_JavaScript_Reference:_Ship#awardEquipment}
 * @see {@link http://wiki.alioth.net/index.php/Oolite_JavaScript_Reference:_Ship}
 */

/**
 * The Station class is an Entity representing a station or carrier (i.e., a ship with a docking port). A Station has all the properties and methods of a Ship, and some others.
 * @typedef {Ship} Station
 * @augments {Ship}
 * @property {function} setInterface {@link http://wiki.alioth.net/index.php/Oolite_JavaScript_Reference:_Station#setInterface}
 * @see {@link http://wiki.alioth.net/index.php/Oolite_JavaScript_Reference:_Station}
 */

/**
 * The PlayerShip class is an Entity representing the player’s ship. The PlayerShip has all the properties and methods of a Ship, and several others. There is always exactly one PlayerShip object in existence, which can be accessed through player.ship.
 * @typedef {Ship} PlayerShip
 * @augments {Ship}
 * @property {boolean} hudHidden {@link http://wiki.alioth.net/index.php/Oolite_JavaScript_Reference:_PlayerShip#hudHidden}
 * @property {Station} dockedStation {@link http://wiki.alioth.net/index.php/Oolite_JavaScript_Reference:_PlayerShip#dockedStation}
 * @see {@link http://wiki.alioth.net/index.php/Oolite_JavaScript_Reference:_PlayerShip}
 */

/**
 * The mission global object is used to run mission screens, and perform other actions related to mission scripting.
 * @typedef Mission
 * @property {function} runScreen {@link http://wiki.alioth.net/index.php/Oolite_JavaScript_Reference:_Mission#runScreen}
 * @see {@link http://wiki.alioth.net/index.php/Oolite_JavaScript_Reference:_Mission}
 */

/**
 * The clock global object is used to tell the time. Apart from absoluteSeconds, all its properties have to do with game clock time.
 * @typedef Clock
 * @property {int} seconds
 * @property {function} clockStringForTime {@link http://wiki.alioth.net/index.php/Oolite_JavaScript_Reference:Clock#clockStringForTime}
 * @see {@link http://wiki.alioth.net/index.php/Oolite_JavaScript_Reference:_Clock}
 */

/**
 * @name system
 * @type System
 * */
var system;

/**
 * @name player
 * @type Player
 * */
var player;

/**
 * @name mission
 * @type Mission
 * */
var mission;

/**
 * @name missionVariables
 * @type Object
 * @see {@link http://wiki.alioth.net/index.php/Oolite_JavaScript_Reference:_Global#missionVariables}
 * */
var missionVariables;


/**
 * The dictionary of all available oxp scripts.
 * @name worldScripts
 * @type Object
 * @see {@link http://wiki.alioth.net/index.php/Oolite_JavaScript_Reference:_Global#worldScripts}
 */
var worldScripts;

/**
 * @name clock
 * @type Clock
 * */
var clock;

/**
 * @function
 * @param {string} prefix prefix
 * @param {string} textToLog text to log
 * @see {@link http://wiki.alioth.net/index.php/Oolite_JavaScript_Reference:_Global#log}
 */
var log = function(prefix, textToLog) {};

/**
 * @function
 * @param {function} callback
 * @return {string} trackingID
 * @see {@link http://wiki.alioth.net/index.php/Oolite_JavaScript_Reference:_Global#addFrameCallback}
 */
var addFrameCallback = function (callback) {};

/**
 * @function
 * @param {string} trackingID
 * @see {@link http://wiki.alioth.net/index.php/Oolite_JavaScript_Reference:_Global#removeFrameCallback}
 */
var removeFrameCallback = function (trackingID) {};