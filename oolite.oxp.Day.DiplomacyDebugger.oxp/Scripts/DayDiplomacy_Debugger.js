"use strict";
this.name = "DayDiplomacy_080_Debugger";
this.author = "David (Day) Pradier, Loic Coissard";
// noinspection JSUnusedGlobalSymbols Used by Oolite itself
this.copyright = "(C) 2017-2019 David Pradier, Loic Coissard";
// noinspection JSUnusedGlobalSymbols Used by Oolite itself
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
            player.credits += 1000000;
            break;
        case "4_TECH_LEVEL":
            system.techLevel = 15;
            break;
        case "5_WAR":
            var flag = worldScripts.DayDiplomacy_060_Citizenships._flag;
            var flagActorId = worldScripts.DayDiplomacy_010_Systems.$getSystemsActorIdsByGalaxyAndSystemId()[flag.galaxyID][flag.systemID];
            var currentSystemActorId = worldScripts.DayDiplomacy_010_Systems.$getSystemsActorIdsByGalaxyAndSystemId()[system.info.galaxyID][system.info.systemID];
            worldScripts.DayDiplomacy_040_WarEngine._declareWar(flagActorId, currentSystemActorId);
            break;
        case "6_DISO":
            worldScripts.DayDiplomacy_060_Citizenships._buyCitizenship(1,7);
            break;
        case "7_SQL":
            this._logSqlDisplay();
            break;
        default: // "7_EXIT":
    }
};

this._logSqlDisplay=function(){
    var ships=system.allShips;
    var i = ships.length;
    var database="create table role (" +
        "id BIGINT AUTO_INCREMENT," +
        "role TEXT NOT NULL," +
        "PRIMARY KEY(id));\n" +

        "create table ship (" +
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
        "primary_role BIGINT,"+
        "ship_class_name TEXT,"+
        "ship_unique_name TEXT,"+
        "PRIMARY KEY(id)," +
        "FOREIGN KEY (primary_role) REFERENCES role(id));\n" +

        "create table roleWeight(" +
        "id_ship BIGINT NOT NULL,"+
        "id_role BIGINT NOT NULL,"+
        "weight FLOAT NOT NULL,"+
        "FOREIGN KEY (id_ship) REFERENCES ship(id)," +
        "FOREIGN KEY (id_role) REFERENCES role(id)," +
        "UNIQUE KEY weight (id_ship,id_role));\n";

    while (i--){
        var j=ships[i].roles.length;
        while (j--){
            var req="insert into role (role) values ('" + ships[i].roles[j] + "');\n";
            if (database.indexOf(req)==-1) {
                database += req;
            }
        }
        database+="START TRANSACTION;\n";
        database+="insert into ship (name,home_system,ai,datakey,display_name,is_beacon,is_boulder,is_cargo,is_frangible,is_jamming,is_minable,is_mine,is_missile,is_piloted,is_pirate,is_pirate_victim,is_police,is_rock,is_thargoid,is_trader,is_turret,is_weapon,primary_role,ship_class_name,ship_unique_name) values ('"+ships[i].name+"','"+ships[i].homeSystem+"','"+ships[i].AI+"','"+ships[i].dataKey+"','"+ships[i].displayName+"','"+ships[i].isBeacon+"','"+ships[i].isBoulder+"','"+ships[i].isCargo+"','"+ships[i].isFrangible+"','"+ships[i].isJamming +"','"+ships[i].isMinable+"','"+ships[i].isMine+"','"+ships[i].isMissile+"','"+ships[i].isPiloted+"','"+ships[i].isPirate+"','"+ships[i].isPirateVictim+"','"+ships[i].isPolice+"','"+ships[i].isRock+"','"+ships[i].isThargoid+"','"+ships[i].isTrader+"','"+ships[i].isTurret+"','"+ships[i].isWeapon+"',(SELECT id FROM role WHERE role ='"+ships[i].primaryRole+"'),'"+ships[i].shipClassName+"','"+ships[i].shipUniqueName+"');\n";
        j=ships[i].roles.length;
        while (j--){
            database+="insert into roleWeight (id_ship, id_role, weight) values ((SELECT MAX(id) FROM ship),(SELECT id FROM role WHERE role ='"+ships[i].roles[j]+"'),"+ships[i].roleWeights[ships[i].roles[j]]+");\n";
        }
        database+="COMMIT;\n";
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
            "3_MONEY": "Earn 1.000.000 ₢",
            "4_TECH_LEVEL": "Set current system to tech level 15",
            "5_WAR": "Set current system at war with your flag",
            "6_DISO": "Buy Esrilees citizenship",
            "7_SQL":"export the oolite state in SQL in the log file",
            "8_EXIT": "Exit"
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

/* ************************** Oolite events ***************************************************************/

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