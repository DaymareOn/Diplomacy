"use strict";
this.name = "DayDiplomacy_020_Tax";
this.author = "David (Day) Pradier";
this.copyright = "(C) 2017 David Pradier";
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script makes systems tax themselves.";

this.startUp = function () {
    var ENGINE = worldScripts["DayDiplomacy_000_Engine"].__DayDiplomacy_Engine_getDiplomacyEngine();
    var a = ENGINE.getArbiter();

    // The idea here is to use the system GDP, called 'productivity' in Oolite,
    // a 'tax level' on __DayDiplomacy_Engine_Script GDP which adds to the system's government's 'treasury'.
    // TODO 0.n: make the tax level evolve
    // TODO 0.n: make the productivity evolve

    var GOVERNMENT_DEFAULT_TAX_LEVEL = {
        "0": 0.0, // Anarchy
        "1": 0.3, // Feudal
        "2": 0.1, // Multi-government
        "3": 0.2, // Dictator
        "4": 0.5, // Communist
        "5": 0.1, // Confederacy
        "6": 0.5, // Democracy
        "7": 0.1 // Corporate
    };

    // Not initializing if already done.
    if (a.State.eventTypes.indexOf("SELFTAX") != -1) {
        return;
    }

    // This eventType means a system government taxes the system GDP (economic output) to fund its treasury.
    a.addEventType(a, "SELFTAX", 0/*8*/); // To be put after COMBINE

    a.setInitAction(a, new ENGINE.Action({
        id: a.getNewActionId(a),
        eventType: "SELFTAX",
        actorType: "SYSTEM",
        actionFunction: function (aSystem) {
            var ourSystemInOolite = System.infoForSystem(aSystem.State.galaxyNb, aSystem.State.systemId);
            aSystem.State.taxLevel = GOVERNMENT_DEFAULT_TAX_LEVEL[ourSystemInOolite.government];
            aSystem.State.treasury = 0; // Everybody begins with treasury = 0.
            ourSystemInOolite.description += " Tax level: " + aSystem.State.taxLevel + " Treasury: " + aSystem.State.treasury + " €";
            aSystem.init(aSystem);
        }
    }));

    // Recurrent tax
    // FIXME 0.n: this is the annual tax, the return should be proportional to the time elapsed since the previous jump
    a.setRecurrentAction(a, new ENGINE.Action({
        id: a.getNewActionId(a),
        eventType: "SELFTAX",
        actorType: "SYSTEM",
        actionFunction: function (aSystem) {
            var ourSystemInOolite = System.infoForSystem(aSystem.State.galaxyNb, aSystem.State.systemId);
            aSystem.State.treasury += ourSystemInOolite.productivity * aSystem.State.taxLevel;
            ourSystemInOolite.description = ourSystemInOolite.description.replace(/Tax.*€/, "Tax level: " + aSystem.State.taxLevel + " Treasury: " + aSystem.State.treasury + " €");
            aSystem.init(aSystem);
        }
    }));
};