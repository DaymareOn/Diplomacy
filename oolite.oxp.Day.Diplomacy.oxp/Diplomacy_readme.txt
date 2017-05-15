Diplomacy OXP

==============================
Summary
1. Description
2. What's currently implemented functionality-wise?
3. What's currently implemented technically?
4. Effects on game difficulty
5. Compatibility
6. Dependencies
7. Instructions
8. License
9. Known bugs
10. Changelog

==============================
Description

Hello everybody,

this is the Diplomacy OXP. Its intended goal is to allow historical events to happen between systems (attacks, loots, alliances, taxes...),
and to have actions depending on this (news, massed flottillas, state racket, who knows?).
Technically, I see it as a war/diplomacy framework.
It includes an easy API for oxp developers.

It is STILL a Work In Progress.

In particular, the savefile format might change in the future; so it wouldn't do to expect a savefile from an old version to work with a newer version code.
If experimenting problems, the easy way is to edit the savefile and remove the lines including "Diplomacy". Then next start, the oxp will begin anew.

==============================
What's currently implemented functionality-wise?

Systems treasury!
    Wars require money, and countries are defeated either by battles or by bankruptcy,
     sometimes the latter producing the former.
    The Treasury and Tax levels are displayed in the F7 system information.
    Each system treasury is increased through taxation each player jump,
     depending on the time past since the last jump.

Strategic map!
    New F4 Interface screen: the Diplomacy Strategic Map!
    There, you can see the systems which (dis)like each other...

Systems alliances!
    Two systems within 7ly of each other may now form an alliance, if they like each other enough.

News!
    Some Snooper news are now displayed when an alliance is formed between two systems,
    and the player is within 7ly of one of the allied systems.

==============================
What's currently implemented technically?

The oxp contains an Engine which implements some useful concepts.
An easy API for oxp developers is delivered in DayDiplomacy_EngineAPI.js
Its main concepts are explained in Diplomacy_EngineAPI_readme.txt
Check DayDiplomacy_Systems.js and DayDiplomacy_Tax.js to see
how the Systems and the taxation were implemented in less than 100 lines each :)
An AlliancesEngine is implemented, no easy api is yet delivered.

==============================
Effects on game difficulty

None yet.

==============================
Compatibility

==============================
Dependencies
- Snoopers OXP

==============================
Instructions

Do not unzip the .oxz file, just move into the AddOns folder of your Oolite installation.

==============================
License

This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike License version 4.0.
If you are re-using any piece of this OXP, please let me know by sending an e-mail to david at pradier dot info

==============================
Known bugs

- currently, only systems within 7 ly of the system with the highest id of the 2 systems in an alliance
  are informed of the alliance. It should be systems within 7 ly of any of the 2 systems in the alliance.

==============================
Changelog

0.8     Improvement, flavor: Two systems within 7ly of each other may now form an alliance, depending
        on their relation quality. Currently, each must have a score for the other of at least +0.5.
        Improvement, flavor: some Snooper news are now displayed when an alliance is formed between two systems,
        and the player is within 7ly of one of the allied systems.
        New, oxp dev func: introduced a functional Event system.
0.7     Improvement, flavor: added a F4 Strategic Map, showing links between systems nearer than 7. The relation between systems is currently based on their government.
0.6     Improvement, flavor: tax amount depends on the time spent since the last taxation.
        Improvement, speed: major refactor to remove closures, dereferences, JSON (de)serialization special functions.
0.5     Bugfix manifest.plist for the oxz manager.
0.4     Put into the oxz manager.
0.3     New, oxp dev func: delivered DiplomacyEngineAPI for oxp developers, provided a dedicated readme file.
        New, doc: provided a dedicated file DiplomacyRoadmap.txt
        Improvement, code consistency: the Systems and Tax js script now use the API rather than the native engine calls.
        Improvement, speed: optimized the loops in the engine
        Improvement, logic: when starting, the player is docked, so we should process the saved actions.
        Bugfix: solved a bug in the Tax script recurrent tax task after a savefile load.
        Bugfix: the init action using the api wasn't working after a restore from the savefile.
        Cleaning: log cleaning, file cleaning.
0.2     The actions are made progressively, one every 10 frames when docked, so as not to need more execution time than allowed at the same time, and to avoid slowdowns during the game.
0.1     First version of the Diplomacy engine. Systems are introduced as a type of "Actor". "SELFTAX" is introduced as an event for systems. Tax level and treasury are displayed on the F7 screen.