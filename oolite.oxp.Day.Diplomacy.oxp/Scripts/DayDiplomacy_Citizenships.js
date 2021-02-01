"use strict";

this.name = "DayDiplomacy_060_Citizenships";
this.author = "Loic Coissard, David Pradier";
// noinspection JSUnusedGlobalSymbols Used by Oolite itself
this.copyright = "(C) 2019 Loic Coissard, David Pradier";
// noinspection JSUnusedGlobalSymbols Used by Oolite itself
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script is the citizenships engine.";

/* ************************** Public functions ********************************************************/

/**
 * This formula would put the US citizenship at 57.000.000 USD in 2016 and the french one at 37.000.000 USD.
 * Remember everything is a lot more expensive in space!
 * @param {System} aSystem
 * @returns {number} the price to acquire or renounce this citizenship in credits
 * @lends worldScripts.DayDiplomacy_060_Citizenships.$getCitizenshipPrice
 */
this.$getCitizenshipPrice = function (aSystem) {
    // productivity is in 10^6 credits units, and population is in 10^8 people units
    // the price is 1000 years of 1-person productivity: prod*10^6 *1000 / (pop *10^8) = 10*prod/pop
    return Math.round(10 * aSystem.productivity / aSystem.population * 10) / 10;
};

/**
 * This formula would put the US 1-day visa at 15.600 USD in 2016 and the french one at 10.100 USD.
 * Remember everything is a lot more expensive in space!
 * @param {SystemInfo} aSystem
 * @returns {number} the price to acquire or renounce the visa for 1 day in credits
 * @lends worldScripts.DayDiplomacy_060_Citizenships.$getVisaPrice
 */
this.$getVisaPrice = function (aSystem) {
    // the price is 100 days of 1-person productivity: prod*10^6 / (pop*10^8) /365 * 100 = prod/pop/365
    return Math.round(aSystem.productivity / aSystem.population / 365 * 10) / 10;
};

/**
 * @param {int} galaxyID
 * @param {int} systemID
 * @returns {boolean} true if the player has the citizenship
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
 *
 * @param systemID
 * @return {boolean}
 * @lends worldScripts.DayDiplomacy_060_Citizenships.$hasPlayerVisa
 */
this.$hasPlayerVisa = function(systemID) {
    this._cleaningVisas();
    return this._visas.hasOwnProperty(systemID);
};

/**
 * @param {PlanetarySystem[]} citizenships
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

this.$buildVisasString = function () {
    this._cleaningVisas(); // Cleaning obsolete visas before displaying visas
    var visas = this._visas;
    var result = "";
    var now = clock.seconds;
    for (var systemID in visas) {
        if (visas.hasOwnProperty(systemID)) {
            var systemInfo = System.infoForSystem(system.info.galaxyID, systemID);
            var remainingTime = visas[systemID] - now;
            var remainingHours = Math.floor(remainingTime / 3600);
            var remainingMinutes = Math.floor((remainingTime - remainingHours * 3600) / 60);
            result += "\n   " + systemInfo.name + ": " + remainingHours + " h " + remainingMinutes + " min" + ","
        }
    }

    if (result.length) { // We delete the comma at the end of the string
        result = result.substring(0, result.length - 1);
    } else {
        result = "none";
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

/* ************************** OXP private functions *******************************************************/

/**
 * @param {number} price
 * @returns {boolean} true if there was enough money to pay
 * @private
 */
this._payIfCapable = function(price) {
    if (player.credits >= price) {
        player.credits -= price;
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
    if (this._payIfCapable(this.$getCitizenshipPrice(system))) { // FIXME incorrect price if not asking for the current system
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
    if (this._payIfCapable(this.$getCitizenshipPrice(system))) { // FIXME incorrect price if not asking for the current system
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
 *
 * @private
 */
this._cleaningVisas = function () {
    var now = clock.seconds;
    var visas = this._visas;
    for (var systemID in visas) {
        if (visas.hasOwnProperty(systemID)) {
            if (visas[systemID] <= now) {
                delete visas[systemID];
            }
        }
    }
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

    // Exit choice, and displayed information
    var opts = {
        screenID: "DiplomacyCitizenshipsScreenId",
        title: "Embassy",
        allowInterrupt: true,
        exitScreen: "GUI_SCREEN_INTERFACES",
        choices: {"6_EXIT": "Exit"},
        message: "Your credits: " + (Math.round(player.credits * 10) / 10) + " ₢\n"
            + (notEnoughMoney ? "You had not enough money to do this.\n" : "")
            + "Your flag: " + (currentFlag.name || "stateless")
            + "\nYour passports: " + (i ? this.$buildCitizenshipsString(currentCitizenships) : "none") // FIXME "none" should be in the $build
            + "\nYour visas: " + this.$buildVisasString()
    };

    // Choices to acquire or renounce the system citizenship
    var currentChoices = opts.choices;
    if (this.$hasPlayerCitizenship(currentGalaxyID, currentSystemID)) {
        currentChoices["2_LOSE"] = "Renounce your " + currentSystemName + "ian passport for a cost of " + price + " ₢";
    } else {
        currentChoices["1_BUY"] = "Acquire " + currentSystemName + " citizenship for a cost of " + price + " ₢";
    }

    // Choosing which among the owned citizenships to display as the flagship
    while (i--) {
        var planetarySystem = currentCitizenships[i];
        // We don't propose the current flagship
        if (!(currentFlag.galaxyID === planetarySystem.galaxyID && currentFlag.systemID === planetarySystem.systemID)) {
            currentChoices["3_DISPLAY_" + planetarySystem.galaxyID + "_" + planetarySystem.systemID] = "Make your ship display your " + planetarySystem.name + " flag";
        }
    }

    // Choice to hide the flagship
    if (currentFlag.name) {
        currentChoices["4_HIDEFLAG"] = "Hide your flag";
    }

    // Choices to buy a visa for the neighbouring, non-enemy, dictator, communist or corporate systems
    var theseSystems = info.systemsInRange(), j = theseSystems.length;
    if (j) {
        var systemsActorIdsByGalaxyAndSystemId = this._Systems.$getSystemsActorIdsByGalaxyAndSystemId();
        var war = worldScripts.DayDiplomacy_040_WarEngine;
        while (j--) {
            var thatSystemInfo = theseSystems[j];
            var gov = thatSystemInfo.government;
            if (gov === 3 || gov === 4 || gov === 7) { // dictator, communist, corporate
                var isEnemy = war.$areActorsWarring(
                    // current system ActorId
                    systemsActorIdsByGalaxyAndSystemId[currentGalaxyID][currentSystemID],
                    // other system ActorId
                    systemsActorIdsByGalaxyAndSystemId[currentGalaxyID][thatSystemInfo.systemID]
                );
                if (!isEnemy) {
                    if (this.$hasPlayerVisa(thatSystemInfo.systemID)) {
                        currentChoices["5_BUYVISA_" + thatSystemInfo.systemID] =
                            "Extend your visa for " + thatSystemInfo.name + " by 24 hours for a cost of " + this.$getVisaPrice(thatSystemInfo) + " ₢";
                    } else {
                        currentChoices["5_BUYVISA_" + thatSystemInfo.systemID] =
                            "Buy 24 hours of visa for " + thatSystemInfo.name + " for a cost of " + this.$getVisaPrice(thatSystemInfo) + " ₢";
                    }
                }
            }
        }
    }

    mission.runScreen(opts, this._F4InterfaceCallback.bind(this));
};

this._add1DayVisa = function (systemID) {
    var now = clock.seconds;
    if (this._visas[systemID] > now) {
        this._visas[systemID] += 3600 * 24;
    } else {
        this._visas[systemID] = now + 3600 * 24;
    }
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
        } else if (choice !== null && choice.substring(0, 10) === "5_BUYVISA_") {
            var systemID = parseInt(choice.substring(10));
            var thatSystemInfo = System.infoForSystem(system.info.galaxyID, systemID);
            var paid = this._payIfCapable(this.$getVisaPrice(thatSystemInfo));
            if (paid) {
                this._add1DayVisa(systemID);
            }
            this._runCitizenship(!paid);
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

    // No Embassy district in anarchies
    if (system.government === 0) return;

    player.ship.dockedStation.setInterface("DiplomacyCitizenships",
        {
            title: "Embassy district",
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
    var inEnemySystem = flag.systemID && worldScriptsVar.DayDiplomacy_040_WarEngine.$areActorsWarring(
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

/**
 *
 * @private
 */
this._setStationsVisaRequirements = function () {
    var gov = system.government;
    if (gov === 3 || gov === 4 || gov === 7) {
        var checker = function (ship) {
            if (!(ship instanceof PlayerShip)) { // Only for the player ship
                return true;
            }
            if (worldScripts.DayDiplomacy_060_Citizenships._citizenships.length) {
                // No problem if the player has a citizenship
                return true;
            }
            if (worldScripts.DayDiplomacy_060_Citizenships.$hasPlayerVisa(system.info.systemID)) {
                // No problem if the player has a visa
                return true;
            }
            this.commsMessage("WARNING - This station is accessible only to citizens and visa holders, Commander.", player.ship);
            return false;
        };
        var ss = system.stations, z = ss.length;
        while (z--) {
            var station = ss[z];
            var al = station.allegiance;
            if (al === "galcop" || al === "neutral") {
                var ses = station.subEntities, y = ses.length;
                while (y--) {
                    var se = ses[y];
                    if (se.isDock) {
                        se.script.acceptDockingRequestFrom = checker.bind(station);
                        break;
                    }
                }
            }
        }
    }
};

// noinspection JSUnusedGlobalSymbols Called by Oolite itself
this.shipExitedWitchspace = function () {
    this._checkPlayerStatusInWar();
    this._setStationsVisaRequirements();
};

// noinspection JSUnusedGlobalSymbols Called by Oolite itself
/**
 *
 * @param {Station}station - the station from which the ship is launched
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
    var engine = worldScripts.DayDiplomacy_000_Engine;

    // {String[]} _playerCitizenshipsUpdatesSubscribers - an array containing the names of the scripts which have subscribed to receive notifications when the player citizenships have changed.
    this._playerCitizenshipsUpdatesSubscribers || (this._playerCitizenshipsUpdatesSubscribers = []);

    /**
     * The flag of the player ship, saved. None by default.
     * @type {PlanetarySystem}
     * @private
     */
    this._flag = engine.$initAndReturnSavedData("flag", {});

    /**
     * The value is only set when the player is in an enemy system; else it is 'null'.
     * When beginning to use the Diplomacy Oxp, the player is not in an enemy system.
     * @type {Object}
     * @param {int} value
     * @private
     */
    this._peacefulSystemsBounty = engine.$initAndReturnSavedData("peacefulSystemsBounty", {value: null});

    /**
     * The object in which the player citizenships are saved. That object is saved into the saveGame file.
     * @type {PlanetarySystem[]}
     */
    this._citizenships = engine.$initAndReturnSavedData("citizenships", []);

    var visasDefaultValue = {};
    var gov = system.government;
    if (gov == 3 || gov == 4 || gov == 7) {
        visasDefaultValue[system.info.systemID] = clock.seconds + 24*3600;
    }
    /**
     * The object in which the player visas are saved. That object is saved into the saveGame file. The first int is the systemID, the second the end date of the visa in seconds.
     * The first time the Diplomacy OXP is used, if a visa is needed in the current system, we give the player a 1-day visa.
     * @type {Object<int,int>}
     */
    this._visas = engine.$initAndReturnSavedDataAndInitialize("visas", visasDefaultValue, function() {
        worldScripts.DayDiplomacy_015_GNN.$publishNews(
             "Serious news! To ensure their security, corporate systems have agreed to require a visa for all undocumented travelers."
            +" Are you up-to-date on your citizenship papers, Commanders?\n"
            +"\nIn a shocking political twist, dictatorships and communist systems have happily adopted the same law."
            +" The President of Ceesxe, the Preeminent Corporate Planet, told us: \"We are appalled that our well-meant initiatives and technologies are copied by rogue governments.\"\n"
            +"\nTo avoid an economic freeze due to the newly introduced laws, all pilots currently in a system requiring a visa will be provided a 1-day visa free of charge."
            +" The Ceesxe President confided in us: \"The first shot is always free. That's only good business, after all.\"\n"
            +" What he meant by this, the truth is, we don't know.");
    });

    this._setStationsVisaRequirements();
    this._initF4Interface();
    delete this._startUp; // No need to startup twice
};

this.startUp = function () {
    worldScripts.DayDiplomacy_000_Engine.$subscribe(this.name);
    delete this.startUp; // No need to startup twice
};