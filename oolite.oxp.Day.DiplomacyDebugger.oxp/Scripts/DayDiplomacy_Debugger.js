"use strict";
this.name = "DayDiplomacy_080_Happener";
this.author = "David (Day) Pradier";
this.copyright = "(C) 2017 David Pradier";
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script scripts the Happener F4 interface, which lets the player advance History as if it had jumped. It is designed for debug.";

this._F4InterfaceCallback = function (choice) {
    switch (choice) {
        case "ADVANCE":
            worldScripts.DayDiplomacy_000_Engine.shipExitedWitchspace();
            break;
        case "ANA":
            player.ship.awardEquipment("EQ_ADVANCED_NAVIGATIONAL_ARRAY");
            break;
        default: // "EXIT":
    }
};

this._displayF4Interface = function () {
    player.ship.hudHidden || (player.ship.hudHidden = true);

    var opts = {
        screenID: "DiplomacyHistoryHappenerScreenId",
        title: "System history happener",
        allowInterrupt: true,
        exitScreen: "GUI_SCREEN_INTERFACES",
        message: "You may advance one History turn and add Advanced Navigational Array to your ship",
        choices:{
            ADVANCE:"Avance History one turn",
            ANA:"Add ANA equipment to ship",
            EXIT:"Exit"
        }
    };
    mission.runScreen(opts, this._F4InterfaceCallback.bind(this));
};
this._initF4Interface = function () {
    player.ship.dockedStation.setInterface("DiplomacyHistoryHappener",
        {
            title: "System history happener",
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
    // FIXME rassembler
    worldScripts.XenonUI && worldScripts.XenonUI.$addMissionScreenException("DiplomacyHistoryHappenerScreenId");
    worldScripts.XenonReduxUI && worldScripts.XenonReduxUI.$addMissionScreenException("DiplomacyHistoryHappenerScreenId");

    this._initF4Interface();
    delete this._startUp; // No need to startup twice
};
this.startUp = function () {
    worldScripts.DayDiplomacy_000_Engine.$subscribe(this.name);
    delete this.startUp; // No need to startup twice
};
/*************************** End Oolite events ***********************************************************/