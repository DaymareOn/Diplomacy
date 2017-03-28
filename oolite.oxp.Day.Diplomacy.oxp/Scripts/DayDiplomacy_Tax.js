"use strict";
this.name = "DayDiplomacy_020_Tax";
this.author = "David (Day) Pradier";
this.copyright = "(C) 2017 David Pradier";
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script makes systems tax themselves. The idea here is to use the system GDP, called 'productivity' in Oolite, and a 'tax level' on GDP which adds to the system's government's 'treasury'.";

this.__DayDiplomacy_Tax_GOVERNMENT_DEFAULT_TAX_LEVEL = {
    "0": 0.0, // Anarchy => no tax
    "1": 0.3, // Feudal => not everybody is taxed
    "2": 0.1, // Multi-government => tax avoiding is rampant
    "3": 0.2, // Dictator => feeble taxes
    "4": 0.5, // Communist => major taxes, but those systems are not crumbling
    "5": 0.1, // Confederacy => tax avoiding is rampant
    "6": 0.5, // Democracy => major taxes, but those systems are not crumbling
    "7": 0.1 // Corporate => tax avoiding is rampant
};

this.startUp = function () {
    var api = worldScripts.DayDiplomacy_002_EngineAPI.__DayDiplomacy_EngineAPI_methods;

    // Not initializing if already done.
    if (api.getEventTypes().indexOf("SELFTAX") != -1) {
        return;
    }

    // This eventType means a system government taxes the system GDP (economic output) to fund its treasury.
    api.addEventType("SELFTAX", 0);

    api.setInitAction(api.buildAction(api.buildNewActionId(), "SELFTAX", "SYSTEM", function (aSystem) {
        var ourSystemInOolite = System.infoForSystem(aSystem.State.galaxyNb, aSystem.State.systemId);
        var taxLevel = worldScripts.DayDiplomacy_020_Tax.__DayDiplomacy_Tax_GOVERNMENT_DEFAULT_TAX_LEVEL;
        var api = worldScripts.DayDiplomacy_002_EngineAPI.__DayDiplomacy_EngineAPI_methods;
        api.setField(aSystem, "taxLevel", taxLevel[ourSystemInOolite.government]);
        api.setField(aSystem, "treasury", 0); // Everybody begins with treasury = 0.
        api.setField(aSystem, "lastTaxDate", clock.seconds);
        log("DiplomacyTax", ourSystemInOolite.name + " treasury: " + aSystem.State.treasury);
        ourSystemInOolite.description += " Tax level: " + aSystem.State.taxLevel + " Treasury: 0 €";
    }));

    // Recurrent tax. A year contains 31557600 seconds. Productivity is in M€ => factor = 31.5576.
    api.setRecurrentAction(api.buildAction(api.buildNewActionId(), "SELFTAX", "SYSTEM", function (aSystem) {
        var s = aSystem.State;
        var ourSystemInOolite = System.infoForSystem(s.galaxyNb, s.systemId);
        var api = worldScripts.DayDiplomacy_002_EngineAPI.__DayDiplomacy_EngineAPI_methods;
        var now = clock.seconds;
        api.setField(aSystem, "treasury", s.treasury + Math.floor(ourSystemInOolite.productivity * (now - parseInt(s.lastTaxDate)) / 31.5576 * s.taxLevel));
        api.setField(aSystem, "lastTaxDate", now);
        log("DiplomacyTax", ourSystemInOolite.name + " treasury: " + aSystem.State.treasury);
        ourSystemInOolite.description = ourSystemInOolite.description.replace(/Tax.*€/, "Tax level: " + s.taxLevel + " Treasury: " + s.treasury + " €");
    }));
};