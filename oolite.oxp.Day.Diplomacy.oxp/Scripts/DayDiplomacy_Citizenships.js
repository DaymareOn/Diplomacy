"use strict";

this.name = "DayDiplomacy_060_Citizenships";
this.author = "Loic Coissard, David Pradier";
// noinspection JSUnusedGlobalSymbols Used by Oolite itself
this.copyright = "(C) 2019 Loic Coissard, David Pradier";
// noinspection JSUnusedGlobalSymbols Used by Oolite itself
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script is the citizenships engine.";

/* ************************** OXP private functions *******************************************************/

/**
 * Pays for citizenship changes
 * @returns {boolean} true if there was enough money to pay
 * @private
 */
this._payForCitizenshipChanges = function () {
    var CitizenshipPrice = this.$getCitizenshipPrice(system);
    if (player.credits >= CitizenshipPrice) {
        player.credits -= CitizenshipPrice;
        return true;
    }
    return false;
};

/**
 * Allows the player to acquire a citizenship
 * @param {int} galaxyID the galaxyID of the citizenship
 * @param {int} systemID the systemID of the citizenship
 * @returns {boolean} true if the player had the money to acquire the citizenship
 * @private
 */
this._buyCitizenship = function (galaxyID, systemID) {
    if (this._payForCitizenshipChanges()) {
        this._citizenships.push({
            "galaxyID": galaxyID,
            "systemID": systemID,
            "name": this._Systems.$retrieveNameFromSystem(galaxyID, systemID)
        });
        return true;
    }
    return false;
};

/**
 * Allows the player to renounce a citizenship
 * @param {int} galaxyID the galaxyID of the citizenship
 * @param {int} systemID the systemID of the citizenship
 * @returns {boolean} true if the citizenship has been renounced
 * @private
 */
this._loseCitizenship = function (galaxyID, systemID) {
    if (this._payForCitizenshipChanges()) {
        var citizenships = this._citizenships;
        var i = citizenships.length;
        while (i--) {
            var planetarySystem = citizenships[i];
            if (planetarySystem.galaxyID === galaxyID && planetarySystem.systemID === systemID) {
                if (this._flag.galaxyID === galaxyID && this._flag.systemID === systemID) {
                    delete this._flag.galaxyID;
                    delete this._flag.systemID;
                    delete this._flag.name;
                }
                citizenships.splice(i, 1);
                return true;
            }
        }
    }
    return false;
};

/**
 * Displays the citizenship's screen allowing the player to buy and lose citizenships, to display their citizenships
 * and to choose which citizenship is displayed.
 * @param {boolean} notEnoughMoney set to true if a previous command failed because the player had not enough money
 * @private
 */
this._runCitizenship = function (notEnoughMoney) {
    player.ship.hudHidden || (player.ship.hudHidden = true);
    var info = system.info;
    var currentGalaxyID = info.galaxyID;
    var currentSystemID = info.systemID;
    var currentSystemName = this._Systems.$retrieveNameFromSystem(currentGalaxyID, currentSystemID);
    var currentCitizenships = this._citizenships;
    var i = currentCitizenships.length;
    var price = this.$getCitizenshipPrice(system);
    var currentFlag = this._flag;
    var opts = {
        screenID: "DiplomacyCitizenshipsScreenId",
        title: "Citizenship",
        allowInterrupt: true,
        exitScreen: "GUI_SCREEN_INTERFACES",
        choices: {"5_EXIT": "Exit"},
        message: "Your credits: " + player.credits + " ₢\n"
            + (notEnoughMoney ? "You had not enough money to do this.\n" : "")
            + "Your displayed citizenship: " + (currentFlag.name || "stateless")
            + "\nYour citizenships: " + (i ? this.$buildCitizenshipsString(currentCitizenships) : "none")
    };
    var currentChoices = opts.choices;
    if (this.$hasPlayerCitizenship(currentGalaxyID, currentSystemID)) {
        currentChoices["2_LOSE"] = "Renounce " + currentSystemName + " citizenship for a cost of " + price + " ₢";
    } else {
        currentChoices["1_BUY"] = "Acquire " + currentSystemName + " citizenship for a cost of " + price + " ₢";
    }

    while (i--) {
        var planetarySystem = currentCitizenships[i];
        // We don't propose the current flag
        if (!(currentFlag.galaxyID === planetarySystem.galaxyID && currentFlag.systemID === planetarySystem.systemID)) {
            currentChoices["3_DISPLAY_" + planetarySystem.galaxyID + "_" + planetarySystem.systemID] = "Make your ship display your " + planetarySystem.name + " flag";
        }
    }

    if (currentFlag.name) {
        currentChoices["4_HIDEFLAG"] = "Hide your flag";
    }

    mission.runScreen(opts, this._F4InterfaceCallback.bind(this));
};

/**
 Calls the necessary functions depending on the player's choice in the F4 interface
 @param {String} choice - predefined values: 1_BUY, 2_LOSE, 3_DISPLAY_{int}, 4_HIDEFLAG, 5_EXIT
 @private
 */
this._F4InterfaceCallback = function (choice) {
    if (choice === "1_BUY" || choice === "2_LOSE") {
        var info = system.info;
        var success = choice === "1_BUY" ? this._buyCitizenship(info.galaxyID, info.systemID) : this._loseCitizenship(info.galaxyID, info.systemID);
        if (success) {
            this._publishNewsSubscribers();
        }
        this._runCitizenship(!success);
    } else {
        var currentFlag = this._flag;
        if (choice === "4_HIDEFLAG") {
            delete currentFlag.galaxyID;
            delete currentFlag.systemID;
            delete currentFlag.name;
            this._runCitizenship(false);
        } else if (choice !== null && choice.substring(0, 10) === "3_DISPLAY_") {
            var galaxyID = parseInt(choice.substring(10, 11)), systemID = parseInt(choice.substring(12));
            currentFlag.galaxyID = galaxyID;
            currentFlag.systemID = systemID;
            currentFlag.name = this._Systems.$retrieveNameFromSystem(galaxyID, systemID);
            this._runCitizenship(false);
        }
    } // else EXIT
};

/**
 * Hides the HUD and displays the F4 interface
 * @private
 */
this._displayF4Interface = function () {
    this._runCitizenship(false);
};

/**
 * Displays the citizenship line in the F4 interface
 * @private
 */
this._initF4Interface = function () {
    player.ship.dockedStation.setInterface("DiplomacyCitizenships",
        {
            title: "Citizenships",
            category: "Diplomacy",
            summary: "You may see current citizenships",
            callback: this._displayF4Interface.bind(this)
        });
};

/**
 * Calls the method $playerCitizenshipsUpdated() for each subscribed script with the current citizenships list as argument.
 * @private
 */
this._publishNewsSubscribers = function () {
    var subscribers = this._playerCitizenshipsUpdatesSubscribers, l = subscribers.length,
        citizenships = this._citizenships;
    while (l--) {
        // noinspection JSUnresolvedFunction This method must be implemented in the subscribed scripts.
        worldScripts[subscribers[l]].$playerCitizenshipsUpdated(citizenships);
    }
};

/**
 * This function makes sure that the player is considered as a fugitive in an enemy system.
 * @private
 */
this._checkPlayerStatusInWar = function () {
    var worldScriptsVar = worldScripts;
    var systemInfo = system.info;
    var flag = this._flag;
    var systemsActorIdsByGalaxyAndSystemId = worldScriptsVar.DayDiplomacy_010_Systems.$getSystemsActorIdsByGalaxyAndSystemId();
    var inEnemySystem = worldScriptsVar.DayDiplomacy_040_WarEngine.$areActorsWarring(
        // current system ActorId
        systemsActorIdsByGalaxyAndSystemId[systemInfo.galaxyID][systemInfo.systemID],
        // current flag ActorId
        systemsActorIdsByGalaxyAndSystemId[flag.galaxyID][flag.systemID]
    );
    var comingFromEnemySystem = this._peacefulSystemsBounty.value !== null;

    if (inEnemySystem) {
        if (!comingFromEnemySystem) { // Entering enemy system
            this._peacefulSystemsBounty.value = player.bounty;
        }
        player.bounty = 200;
        player.commsMessage("It seems we are in an enemy system, fights are probable...");
    } else if (comingFromEnemySystem) { // Exiting enemy system
        player.bounty = this._peacefulSystemsBounty.value;
        this._peacefulSystemsBounty.value = null;
    }
};
/* ************************** End OXP private functions ***************************************************/

/* ************************** OXP public functions ********************************************************/

/**
 * This formula would put the US citizenship at 5.700.000 USD in 2016 and the french one at 3.700.000 USD.
 * @param {System} aSystem
 * @returns {number} the price to acquire or renounce this citizenship in credits
 * @lends worldScripts.DayDiplomacy_060_Citizenships.$getCitizenshipPrice
 */
this.$getCitizenshipPrice = function (aSystem) {
    return aSystem.productivity * 100 / aSystem.population;
};

/**
 * @param {int} galaxyID
 * @param {int} systemID
 * @returns {boolean} true is the player has the citizenship
 * @lends worldScripts.DayDiplomacy_060_Citizenships.$hasPlayerCitizenship
 */
this.$hasPlayerCitizenship = function (galaxyID, systemID) {
    var citizenships = this._citizenships;
    var i = citizenships.length;
    while (i--) {
        var planetarySystem = citizenships[i];
        if (planetarySystem.galaxyID === galaxyID && planetarySystem.systemID === systemID) {
            return true;
        }
    }
    return false;
};

/**
 * @param {planetarySystem[]} citizenships
 * @returns {string} a displayable list of citizenships
 * @lends worldScripts.DayDiplomacy_060_Citizenships.$buildCitizenshipsString
 */
this.$buildCitizenshipsString = function (citizenships) {
    var result = "";
    var i = citizenships.length;
    while (i--) {
        result += citizenships[i].name + ", ";
    }
    if (result.length) { // We delete the comma at the end of the string
        result = result.substring(0, result.length - 2);
    }
    return result;
};

/**
 * Allows the script which name is given as argument to be called through the method $playerCitizenshipsUpdated
 * each time the player citizenships are updated. The script must implement that method: this.$playerCitizenshipsUpdated = function(citizenships) {}
 * @param {string} scriptName the script.name
 * @lends worldScripts.DayDiplomacy_060_Citizenships.$subscribeToPlayerCitizenshipsUpdates
 */
this.$subscribeToPlayerCitizenshipsUpdates = function (scriptName) {
    (this._playerCitizenshipsUpdatesSubscribers || (this._playerCitizenshipsUpdatesSubscribers = [])).push(scriptName);
};
/* ************************** End OXP public functions ****************************************************/

/* ************************** Oolite events ***************************************************************/

// noinspection JSUnusedLocalSymbols Called by Oolite itself
/**
 * Displays the citizenship's line in the F4 interface when the player is docked.
 * @param {Station} station an Oolite object where the ship is docked. We don't use it.
 */
this.shipDockedWithStation = function (station) {
    this._initF4Interface();
};

// noinspection JSUnusedGlobalSymbols Called by Oolite itself
/**
 * We stop hiding the HUD when we exit our citizenship interface
 */
this.missionScreenEnded = function () {
    player.ship.hudHidden = false;
};

// noinspection JSUnusedGlobalSymbols Called by Oolite itself
this.shipExitedWitchspace = function () {
    this._checkPlayerStatusInWar();
};

// noinspection JSUnusedGlobalSymbols Called by Oolite itself
/**
 *
 * @param {Station} station
 */
this.shipLaunchedFromStation = function (station) {
    this._checkPlayerStatusInWar();
};

/**
 * Loads the player citizenship from the save file, loads the scripts which are subscribed to the
 * playerCitizenshipsUpdates, and initialises the F4 interface.
 * @private
 */
this._startUp = function () {
    worldScripts.XenonUI && worldScripts.XenonUI.$addMissionScreenException("DiplomacyCitizenshipsScreenId");
    worldScripts.XenonReduxUI && worldScripts.XenonReduxUI.$addMissionScreenException("DiplomacyCitizenshipsScreenId");

    this._Systems = worldScripts.DayDiplomacy_010_Systems;
    var engineAPI = worldScripts.DayDiplomacy_002_EngineAPI;

    // {String[]} _playerCitizenshipsUpdatesSubscribers - an array containing the names of the scripts which have subscribed to receive notifications when the player citizenships have changed.
    this._playerCitizenshipsUpdatesSubscribers || (this._playerCitizenshipsUpdatesSubscribers = []);

    /**
     * The flag of the player ship, saved. None by default.
     * @type {PlanetarySystem}
     * @private
     */
    this._flag = engineAPI.$initAndReturnSavedData("flag", {});

    /**
     * The value is only set when the player is in an enemy system; else it is 'null'.
     * When beginning to use the Diplomacy Oxp, the player is not in an enemy system.
     * @type {Object}
     * @param {int} value
     * @private
     */
    this._peacefulSystemsBounty = engineAPI.$initAndReturnSavedData("_peacefulSystemsBounty", {value: null});

    /**
     * The object in which the player citizenships are saved. That object is saved into the saveGame file.
     * @type {PlanetarySystem[]}
     */
    this._citizenships = engineAPI.$initAndReturnSavedData("citizenships", []);

    this._initF4Interface();
    delete this._startUp; // No need to startup twice
};

this.startUp = function () {
    worldScripts.DayDiplomacy_000_Engine.$subscribe(this.name);
    delete this.startUp; // No need to startup twice
};