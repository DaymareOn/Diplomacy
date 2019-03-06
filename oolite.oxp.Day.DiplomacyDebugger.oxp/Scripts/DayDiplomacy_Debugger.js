"use strict";
this.name = "DayDiplomacy_080_Debugger";
this.author = "David (Day) Pradier";
this.copyright = "(C) 2017 David Pradier";
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script scripts the Diplomacy Debugger F4 interface";

this._F4InterfaceCallback = function (choice) {
    switch (choice) {
        case "1_ADVANCE":
            worldScripts.DayDiplomacy_000_Engine.shipExitedWitchspace();
            break;
        case "2_ANA":
            player.ship.awardEquipment("EQ_ADVANCED_NAVIGATIONAL_ARRAY");
            break;
        case "3_MONEY":
            player.credits += 100000;
            break;
        default: // "4_EXIT":
    }
};

this._displayF4Interface = function () {
    player.ship.hudHidden || (player.ship.hudHidden = true);

    var opts = {
        screenID: "DiplomacyDebuggerScreenId",
        title: "Diplomacy Debugger",
        allowInterrupt: true,
        exitScreen: "GUI_SCREEN_INTERFACES",
        message: "Make your choice",
        choices: {
            "1_ADVANCE": "Advance History one turn",
            "2_ANA": "Add Advanced Navigational Array equipment to ship to see the star wars maps",
            "3_MONEY": "Earn 100.000 ₢",
            "4_EXIT": "Exit"
        }
    };
    mission.runScreen(opts, this._F4InterfaceCallback.bind(this));
};
this._initF4Interface = function () {
    player.ship.dockedStation.setInterface("DiplomacyDebugger",
        {
            title: "Diplomacy Debugger",
            category: "Diplomacy",
            summary: "Make History advance one turn",
            callback: this._displayF4Interface.bind(this)
        });
};

/*************************** OXP public functions ********************************************************/
/*************************** End OXP public functions ****************************************************/

/*************************** Oolite events ***************************************************************/
this.shipDockedWithStation = function (station) {
    this._initF4Interface();
};
this.missionScreenEnded = function () {
    player.ship.hudHidden = false;
};

this._startUp = function () {
    worldScripts.XenonUI && worldScripts.XenonUI.$addMissionScreenException("DiplomacyDebuggerScreenId");
    worldScripts.XenonReduxUI && worldScripts.XenonReduxUI.$addMissionScreenException("DiplomacyDebuggerScreenId");

    this._initF4Interface();
    delete this._startUp; // No need to startup twice
};
this.startUp = function () {
    worldScripts.DayDiplomacy_000_Engine.$subscribe(this.name);
    delete this.startUp; // No need to startup twice
};
/*************************** End Oolite events ***********************************************************/