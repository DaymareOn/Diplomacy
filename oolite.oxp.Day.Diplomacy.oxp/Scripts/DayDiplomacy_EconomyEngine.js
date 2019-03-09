"use strict";
this.name = "DayDiplomacy_030_EconomyEngine";
this.author = "David (Day) Pradier";
// noinspection JSUnusedGlobalSymbols Used by Oolite itself
this.copyright = "(C) 2017 David Pradier";
// noinspection JSUnusedGlobalSymbols Used by Oolite itself
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script is the economy engine of the Diplomacy OXP. It makes systems tax themselves." +
    " The idea here is to use the system GDP, called 'productivity' in Oolite," +
    " and a 'tax level' on GDP which adds to the system's government's 'treasury'.";

/* Credit monetary policy is such that the total number of credits in the Ooniverse is always the same.
   This is needed to avoid game imbalances leading to exploding monetary mass, or monetary mass converging to zero.
   This implies that the money cannot be produced, destroyed or counterfeited, which is a mystery in itself. */
/**
 *
 * @type {{"0": number, "1": number, "2": number, "3": number, "4": number, "5": number, "6": number, "7": number}}
 * @lends worldScripts.DayDiplomacy_030_EconomyEngine.$GOVERNMENT_DEFAULT_TAX_LEVEL;
 */
this.$GOVERNMENT_DEFAULT_TAX_LEVEL = {
    "0": 0.0, // Anarchy => no tax
    "1": 0.3, // Feudal => not everybody is taxed
    "2": 0.1, // Multi-government => tax avoiding is rampant
    "3": 0.2, // Dictator => feeble taxes
    "4": 0.5, // Communist => major taxes, but those systems are not crumbling
    "5": 0.1, // Confederacy => tax avoiding is rampant
    "6": 0.5, // Democracy => major taxes, but those systems are not crumbling
    "7": 0.1  // Corporate => tax avoiding is rampant
};

this.$moveProductivityInPercentage = function(fromSystemActor, percentage) {
    // FIXME 0.15 TODO
};
this.$moveProductivityInCredits = function(fromSystemActor, creditsNb) {
    // FIXME 0.15 TODO
};
this.$moveProductivityToNeighborsInPercentage = function(fromSystemActor, percentage) {
    // FIXME 0.15 TODO
};
this.$moveProductivityToNeighborsInCredits = function(fromSystemActor, creditsNb) {
    // FIXME 0.15 TODO
};
this.$moveProductivityToNeighborsDependingOnDistanceInPercentage = function(fromSystemActor, percentage) {
    // FIXME 0.15 TODO
};
this.$moveProductivityToNeighborsDependingOnDistanceInCredits = function(fromSystemActor, creditsNb) {
    // FIXME 0.15 TODO
};

/*************************** Oolite events ***************************************************************/
this._startUp = function () {
    var api = worldScripts.DayDiplomacy_002_EngineAPI;

    // Not initializing if already done.
    if (api.$getEventTypes().indexOf("SELFTAX") !== -1) {
        return;
    }

    // This eventType means a system government taxes the system GDP (economic output) to fund its treasury.
    api.$addEventType("SELFTAX", 0);

    /**
     *
     * @param {Actor} aSystem
     */
    var diplomacyTaxInitAction = function diplomacyTaxInitAction(aSystem) {
        var that = diplomacyTaxInitAction;
        var api = that.api || (that.api = worldScripts.DayDiplomacy_002_EngineAPI);
        var taxLevel = that.taxLevel || (that.taxLevel = worldScripts.DayDiplomacy_030_EconomyEngine.$GOVERNMENT_DEFAULT_TAX_LEVEL);
        var sys = that.sys || (that.sys = System);
        var cloc = that.cloc || (that.cloc = clock);
        var ourSystemInOolite = sys.infoForSystem(aSystem.galaxyNb, aSystem.systemId);
        var government = ourSystemInOolite.government;
        api.$setField(aSystem, "government", government);
        // Necessary for alliancesAndWars. Bad location but avoids other system initialization :/
        // FIXME 0.perfectstyle fields should be inited in the systems part. Make it all fields?
        // FIXME 0.f move treasury and tax level to a F4 Diplomacy system information including the history.
        // Or use the new description system?
        api.$setField(aSystem, "name", ourSystemInOolite.name);
        api.$setField(aSystem, "taxLevel", taxLevel[government]);
        api.$setField(aSystem, "treasury", 0); // Everybody begins with treasury = 0.
        api.$setField(aSystem, "lastTaxDate", cloc.seconds);
        ourSystemInOolite.description += " Tax level: " + aSystem.taxLevel + " Treasury: 0 €";
    };
    var functionId = api.$buildNewFunctionId();
    api.$setFunction(functionId, diplomacyTaxInitAction);
    api.$setInitAction(api.$buildAction(api.$buildNewActionId(), "SELFTAX", "SYSTEM", functionId));

    // Recurrent tax.
    var diplomacyTaxRecurrentAction = function diplomacyTaxRecurrentAction(aSystem) {
        var that = diplomacyTaxRecurrentAction;
        var api = that.api || (that.api = worldScripts.DayDiplomacy_002_EngineAPI);
        var sys = that.sys || (that.sys = System);
        var cloc = that.cloc || (that.cloc = clock);
        var ourSystemInOolite = sys.infoForSystem(aSystem.galaxyNb, aSystem.systemId);
        var now = cloc.seconds;
        api.$setField(aSystem, "treasury", aSystem.treasury + Math.floor(ourSystemInOolite.productivity * (now - parseInt(aSystem.lastTaxDate)) / 31.5576 * aSystem.taxLevel));
        api.$setField(aSystem, "lastTaxDate", now);
        ourSystemInOolite.description = ourSystemInOolite.description.replace(new RegExp(/Tax.*€/), "Tax level: " + aSystem.taxLevel + " Treasury: " + aSystem.treasury + " €");
    };
    var fid =  api.$buildNewFunctionId();
    api.$setFunction(fid, diplomacyTaxRecurrentAction);
    api.$setRecurrentAction(api.$buildAction(api.$buildNewActionId(), "SELFTAX", "SYSTEM", fid));
    delete this._startUp; // No need to startup twice
};
this.startUp = function() {
    worldScripts.DayDiplomacy_000_Engine.$subscribe(this.name);
    delete this.startUp; // No need to startup twice
};
/*************************** End Oolite events ***********************************************************/