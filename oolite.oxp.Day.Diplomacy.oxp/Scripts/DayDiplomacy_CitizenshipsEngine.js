"use strict";
this.name = "DayDiplomacy_060_CitizenshipsEngine";
this.author = "Loic Coissard";
this.copyright = "(C) 2019 Loic Coissard";
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script is the citizenships engine.";

/*************************** OXP private functions *******************************************************/
// citizenships: {systemName: citizenship, ...}
// citizenship: {"galaxyID"=>galaxyID, "systemID"=>systemID}

// {"galaxyID"=>galaxyID, "systemID"=>systemID : name}

/*
	@param galaxyID: int ; Identifies the galaxy of the wanted system
	@param systemID: int ; Identifies the wanted system in the given galaxy
	@return: String ; Return the system name of the system defined by the give galaxyId and systemId
*/
this._retrieveNameFromSystem = function (galaxyID, systemID) {
    // For us, the unique identifier is the name.
    return this._api.$getActors()[this._sapi.$getSystemsActorIdsByGalaxyAndSystemId()[galaxyID][systemID]].name;
};

/*
    @Description: calls the necessary functions depending on the player's choice
	@param choice: String; predefined values (BUY, LOSE, DISPLAY_)
*/
this._F4InterfaceCallback = function (choice) {
    if (choice === "BUY") {
        this._buyCitizenship({"galaxyID": system.info.galaxyID, "systemID": system.info.systemID});
        this._publishNewsSubscribers();
        this._runCitizenship();
    } else if (choice === "LOSE") {
        this._loseCitizenship({"galaxyID": system.info.galaxyID, "systemID": system.info.systemID});
        this._publishNewsSubscribers();
        this._runCitizenship();
    } else if (choice !== null && choice.substring(0, 8) === "DISPLAY_") {
        var systemId = choice.substring(8);
        PlayerShip.homeSystem = systemId;
        log("DayDiplomacyCitizenshipsEngine.(choice.startsWith(\"DISPLAY_\"))", "player homeSystem" + PlayerShip.homeSystem);
    } else {
        // EXIT
    }
};

/*
    @Description: pays for citizenship changes
*/
this._payForCitizenshipChanges = function () {
    var CitizenshipPrice = 1;
    if (player.credits >= CitizenshipPrice) {
        player.credits -= CitizenshipPrice;
    }
};

/*
    @Description: allows the player to buy a citizenship
	@param citizenship: map; the galaxyID and the systemID
*/
this._buyCitizenship = function (citizenship) {
    this._payForCitizenshipChanges();
    this._citizenships[this._retrieveNameFromSystem(citizenship.galaxyID, citizenship.systemID)] = citizenship;
};

/*
    @Description: allows the player to lose a citizenship
	@param citizenship: map; the galaxyID and the systemID
*/
this._loseCitizenship = function (citizenship) {
    this._payForCitizenshipChanges();
    delete this._citizenships[this._retrieveNameFromSystem(citizenship.galaxyID, citizenship.systemID)];
};

/*
    @Description: displays the citizenship's screen allowing the player to buy and lose citizenships, to display their citizenships and to choose which citizenship is displayed
*/
this._runCitizenship = function () {
    var currentSystemName = this._retrieveNameFromSystem(system.info.galaxyID, system.info.systemID);
    var opts = {
        screenID: "DiplomacyCitizenshipsScreenId",
        title: "Citizenship",
        allowInterrupt: true,
        exitScreen: "GUI_SCREEN_INTERFACES",
        choices: {
            BUY: "Buy " + currentSystemName + " citizenship",
            LOSE: "Lose " + currentSystemName + " citizenship",
            EXIT: "Exit"
        },
        message: "Citizenships: " + this.$buildCitizenshipsString(this._citizenships)
    };
    var currentgalaxyID = system.info.galaxyID;
    var currentCitizenships = this._citizenships;
    var currentChoices = opts.choices;
    for (var systemName in currentCitizenships) {
        if (currentCitizenships.hasOwnProperty(systemName)) {
            if (currentgalaxyID === currentCitizenships[systemName].galaxyID) {
                var s = "DISPLAY_" + currentCitizenships[systemName].systemID;
                var s1 = "Display " + systemName + " citizenship";
                currentChoices[s] = s1;
                log("DayDiplomacyCitizenshipsEngine.currentCitizenship", "current citizenship" + s);
            }
        }
    }
    mission.runScreen(opts, this._F4InterfaceCallback.bind(this));
};

/*
    @Description: hide the HUD and display the interface
 */
this._displayF4Interface = function () {
    player.ship.hudHidden || (player.ship.hudHidden = true);
    this._runCitizenship();
};

/*
    @Description: displays the citizenship line in the F4 interface
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

/*
    @Description: calls the method $playerCitizenshipsUpdated() for each subscribed script with the current citizenship dictionnary as argument
 */
this._publishNewsSubscribers = function () {
    var myNewSubscribers = this._citizenshipsNewsSubscribers;
    var l = myNewSubscribers.length;
    while (l--) {
        worldScripts[myNewSubscribers[l]].$playerCitizenshipsUpdated(this._citizenships);
    }
};
/*************************** End OXP private functions ***************************************************/

/*************************** OXP public functions ********************************************************/
/*
	@param citizenships:{(String)systemName: citizenship}; a map in which the systemName is the key and the citizenship is the value
	@return result: String; a displayable list of citizenship
*/
this.$buildCitizenshipsString = function (citizenships) {
    var result = "";
    for (var name in citizenships) {
        if (citizenships.hasOwnProperty(name)) {
            result += name + ", ";
        }
    }
    if (result.length) {
        result = result.substring(0, result.length - 2);
    }
    return result;
};

/*
    @Description: allows the script which name is given as argument to be called through the method $playerCitizenshipsUpdated each time the player citizenships are updated. The script must implement that method. An example of that method is available in DayDiplomacy_Citizenships.js
    @param scriptname: String ; the script name property
*/
this.$subscribeToPlayerCitizenshipsUpdates = function (scriptname) {
    this._citizenshipsNewsSubscribers.push(scriptname);
};
/*************************** End OXP public functions ****************************************************/

/*************************** Oolite events ***************************************************************/
/*
    @Description: displays the citizenship's line in the F4 interface when the player is docked
    @param station: station; an Oolite object where the ship is docked. We don't use it
 */

this.shipDockedWithStation = function (station) {
    this._initF4Interface();
};

/*
    @Description: we stop hidding the HUD when we exit our citizenship interface
*/
this.missionScreenEnded = function () {
    player.ship.hudHidden = false;
};

/*
    @Description: loads the player's citizenship from the save file, loads the scripts which are subscribed to the citizenshipChangesNews, moreover it initialises the F4 interfaceF
*/
this._startUp = function () {
    var api = this._api = worldScripts.DayDiplomacy_002_EngineAPI;
    this._sapi = worldScripts.DayDiplomacy_012_SystemsAPI;
    this._citizenships = api.$initAndReturnSavedData("citizenships", {}); // { systemName => citizenship }
    this._citizenshipsNewsSubscribers = api.$initAndReturnSavedData("citizenshipsNewsSubscribers", []);
    this._initF4Interface();
    delete this._startUp; // No need to startup twice
};


this.startUp = function () {
    worldScripts.DayDiplomacy_000_Engine.$subscribe(this.name);

    delete this.startUp; // No need to startup twice
};
/*************************** End Oolite events ***********************************************************/