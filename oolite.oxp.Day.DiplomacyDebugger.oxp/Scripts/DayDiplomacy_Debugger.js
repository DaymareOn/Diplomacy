"use strict";
this.name = "DayDiplomacy_080_Debugger";
this.author = "David (Day) Pradier";
this.copyright = "(C) 2017 David Pradier";
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script scripts the Diplomacy Debugger F4 interface, which lets the player advance History as if it had jumped and add an ANA to their ship";

this._F4InterfaceCallback = function (choice) {
    switch (choice) {
        case "ADVANCE":
            worldScripts.DayDiplomacy_000_Engine.shipExitedWitchspace();
            break;
        case "ANA":
            player.ship.awardEquipment("EQ_ADVANCED_NAVIGATIONAL_ARRAY");
            break;
        case "SQL":
            this._logSqlDisplay();
            break;
        default: // "EXIT":
    }
};

this._logSqlDisplay=function(){
    var ships=system.allShips;
    var i = ships.length;
    while (i--){
        log("shipsname",ships[i].name);
        var req="insert into Ship (name) values ("+"ships[i].name"+");";
        log ("sql querry",req);
    }
};

this._displayF4Interface = function () {
    player.ship.hudHidden || (player.ship.hudHidden = true);

    var opts = {
        screenID: "DiplomacyDebuggerScreenId",
        title: "Diplomacy Debugger",
        allowInterrupt: true,
        exitScreen: "GUI_SCREEN_INTERFACES",
        message: "You may advance one History turn and add Advanced Navigational Array to your ship",
        choices:{
            ADVANCE:"Avance History one turn",
            ANA:"Add ANA equipment to ship",
            SQL:"return the name of the ships in the log file",
            EXIT:"Exit"
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