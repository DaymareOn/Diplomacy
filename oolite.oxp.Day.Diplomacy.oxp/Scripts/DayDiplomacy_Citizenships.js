"use strict";
this.name = "DayDiplomacy_060_Citizenships";
this.author = "Loic Coissard, David Pradier";
this.copyright = "(C) 2019 Loic Coissard, David Pradier";
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script is the citizenships engine.";

/* ************************** OXP private functions *******************************************************/
/**
 Calls the necessary functions depending on the player's choice in the F4 interface
 @param {String} choice - predefined values: BUY, LOSE, DISPLAY_{int}
 @private
 */
this._F4InterfaceCallback = function (choice) {
    if (choice === "1_BUY" || choice === "2_LOSE") {
        var info = system.info;
        var success = (choice === "1_BUY" ? this._buyCitizenship : this._loseCitizenship)(info.galaxyID, info.systemID);
        if (success) {
            this._publishNewsSubscribers();
        }
        this._runCitizenship(!success);
    } else if (choice !== null && choice.substring(0, 10) === "3_DISPLAY_") {
        // noinspection JSValidateTypes The string is casted as int.
        player.ship.homeSystem = choice.substring(10);
        this._runCitizenship(false);
    } // else EXIT
};

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
    var info = system.info;
    var currentGalaxyID = info.galaxyID;
    var currentSystemID = info.systemID;
    // FIXME fix what happens to the player ship homeSystem when the player jumps galaxy
    var currentSystemName = this._Systems.$retrieveNameFromSystem(currentGalaxyID, currentSystemID);
    var currentDisplayedCitizenship = this._Systems.$retrieveNameFromSystem(currentGalaxyID, player.ship.homeSystem);
    var currentCitizenships = this._citizenships;
    var i = currentCitizenships.length;
    var price = this.$getCitizenshipPrice(system);
    var opts = {
        screenID: "DiplomacyCitizenshipsScreenId",
        title: "Citizenship",
        allowInterrupt: true,
        exitScreen: "GUI_SCREEN_INTERFACES",
        choices: {"4_EXIT": "Exit"},
        message: (notEnoughMoney ? "You had not enough money to do this.\n" : "")
            + "Your displayed citizenship: " + currentDisplayedCitizenship
            + "\nYour citizenships: " + this.$buildCitizenshipsString(currentCitizenships)
    };
    var currentChoices = opts.choices;
    if (this.$hasPlayerCitizenship(currentGalaxyID, currentSystemID)) {
        currentChoices["2_LOSE"] = "Renounce " + currentSystemName + " citizenship for " + price + "₢";
    } else {
        currentChoices["1_BUY"] = "Acquire " + currentSystemName + " citizenship for " + price + "₢";
    }

    while (i--) {
        var planetarySystem = currentCitizenships[i];
        if (currentDisplayedCitizenship !== planetarySystem.name) {
            currentChoices["3_DISPLAY_" + planetarySystem.systemID] = "Make your ship display your " + planetarySystem.name + " citizenship";
        }
    }
    mission.runScreen(opts, this._F4InterfaceCallback.bind(this));
};

/**
 * Hides the HUD and displays the F4 interface
 * @private
 */
this._displayF4Interface = function () {
    player.ship.hudHidden || (player.ship.hudHidden = true);
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
    // {String[]} _playerCitizenshipsUpdatesSubscribers - an array containing the names of the scripts which have subscribed to receive notifications when the player citizenships have changed.
    this._playerCitizenshipsUpdatesSubscribers || (this._playerCitizenshipsUpdatesSubscribers = []);
    this._playerCitizenshipsUpdatesSubscribers.push(scriptName);
};
/* ************************** End OXP public functions ****************************************************/

/* ************************** Oolite events ***************************************************************/
// noinspection JSUnusedLocalSymbols Called by Oolite itself
/**
 * Displays the citizenship's line in the F4 interface when the player is docked.
 * @param {Object} station an Oolite object where the ship is docked. We don't use it.
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

/**
 * Loads the player citizenship from the save file, loads the scripts which are subscribed to the
 * playerCitizenshipsUpdates, and initialises the F4 interface.
 * @private
 */
this._startUp = function () {
    this._Systems = worldScripts.DayDiplomacy_010_Systems;

    var currentGalaxyID = system.info.galaxyID;
    var originalHomeSystem = player.ship.homeSystem;
    /**
     * The object in which the player citizenships are saved. That object is saved into the saveGame file.
     * @type {planetarySystem[]}
     */
    this._citizenships = worldScripts.DayDiplomacy_002_EngineAPI.$initAndReturnSavedData("citizenships", [{
        "galaxyID": currentGalaxyID,
        "systemID": originalHomeSystem,
        "name": this._Systems.$retrieveNameFromSystem(currentGalaxyID, originalHomeSystem)
    }]);

    this._initF4Interface();
    delete this._startUp; // No need to startup twice
};

this.startUp = function () {
    worldScripts.DayDiplomacy_000_Engine.$subscribe(this.name);
    delete this.startUp; // No need to startup twice
};
/* ************************** End Oolite events ***********************************************************/