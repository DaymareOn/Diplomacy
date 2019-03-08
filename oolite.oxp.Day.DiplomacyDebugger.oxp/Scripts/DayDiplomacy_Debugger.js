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
        case "SQL":
            this._logSqlDisplay();
            break;
        case "3_MONEY":
            player.credits += 1000000;
            break;
        default: // "4_EXIT":
    }
};

this._logSqlDisplay=function(){
    var ships=system.allShips;
    var i = ships.length;
    var database="create table ship (" +
        "id BIGINT AUTO_INCREMENT," +
        "name TEXT," +
        "home_system BIGINT," +
        "ai TEXT," +
        "datakey TEXT,"+
        "display_name TEXT,"+
        "is_beacon BOOLEAN," +
        "is_boulder BOOLEAN,"+
        "is_cargo BOOLEAN,"+
        "is_frangible BOOLEAN,"+
        "is_jamming BOOLEAN,"+
        "is_minable BOOLEAN,"+
        "is_mine BOOLEAN,"+
        "is_missile BOOLEAN,"+
        "is_piloted BOOLEAN,"+
        "is_pirate BOOLEAN,"+
        "is_pirate_victim BOOLEAN,"+
        "is_police BOOLEAN,"+
        "is_rock BOOLEAN,"+
        "is_thargoid BOOLEAN,"+
        "is_trader BOOLEAN,"+
        "is_turret BOOLEAN,"+
        "is_weapon BOOLEAN,"+
        "primary_role TEXT,"+
        "ship_class_name TEXT,"+
        "ship_unique_name TEXT,"+
        "PRIMARY KEY(id));\n" +

        "create table roles (" +
        "id BIGINT AUTO_INCREMENT," +
        "primary_role TEXT," +
        "PRIMARY KEY(id));\n" +

        "create table roleWeights(" +
        "id_ship BIGINT,"+
        "id_roles BIGINT,"+
        "weight FLOAT,"+
        "FOREIGN KEY (id_ship) REFERENCES ship(id)," +
        "FOREIGN KEY (id_roles) REFERENCES roles(id));\n";

    while (i--){
        database+="insert into ship (name,home_system,ai,datakey,display_name,is_beacon,is_boulder,is_cargo,is_frangible,is_jamming,is_minable,is_mine,is_missile,is_piloted,is_pirate,is_pirate_victim,is_police,is_rock,is_thargoid,is_trader,is_turret,is_weapon,primary_role,ship_class_name,ship_unique_name) values ('"+ships[i].name+"','"+ships[i].homeSystem+"','"+ships[i].AI+"','"+ships[i].dataKey+"','"+ships[i].displayName+"','"+ships[i].isBeacon+"','"+ships[i].isBoulder+"','"+ships[i].isCargo+"','"+ships[i].isFrangible+"','"+ships[i].isJamming +"','"+ships[i].isMinable+"','"+ships[i].isMine+"','"+ships[i].isMissile+"','"+ships[i].isPiloted+"','"+ships[i].isPirate+"','"+ships[i].isPirateVictim+"','"+ships[i].isPolice+"','"+ships[i].isRock+"','"+ships[i].isThargoid+"','"+ships[i].isTrader+"','"+ships[i].isTurret+"','"+ships[i].isWeapon+"','"+ships[i].primaryRole+"','"+ships[i].shipClassName+"','"+ships[i].shipUniqueName+"');\n";
    }
    log ("sql query",database);
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
            SQL:"export the oolite state in SQL in the log file",
            "3_MONEY": "Earn 1.000.000 ₢",
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