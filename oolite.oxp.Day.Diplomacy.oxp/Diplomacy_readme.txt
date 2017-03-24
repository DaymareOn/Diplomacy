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
9. Changelog

==============================
Description

Hello everybody,

this is the version 0.3 of the Diplomacy OXP. Its intended goal is to allow historical events to happen between systems (attacks, loots, alliances, taxes...),
and to have actions depending on this (news, massed flottillas, state racket, who knows?).
Technically, I see it as a war/diplomacy framework.
It includes an easy API for oxp developers.

==============================
What's currently implemented functionality-wise?

The oxp currently adds flavour by displaying a Tax level and a Treasury level in the F7 system information.
Each system treasury is increased by taxation each player jump.
Why taxation? Because wars require money, and countries are defeated either by battles or by bankruptcy, sometimes the latter producing the former.
So systems treasury should be a main factor in a war/diplomacy framework.

==============================
What's currently implemented technically?

The oxp contains an Engine which implements some useful concepts.
An easy API for oxp developers is delivered in DayDiplomacy_EngineAPI.js
Its main concepts are explained in Diplomacy_EngineAPI_readme.txt
Check DayDiplomacy_Systems.js and DayDiplomacy_Tax.js to see
how the Systems and the taxation were implemented in less than 66 lines each :)

==============================
Effects on game difficulty

None yet.

==============================
Compatibility

==============================
Dependencies

==============================
Instructions

Do not unzip the .oxz file, just move into the AddOns folder of your Oolite installation.

==============================
License

This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike License version 4.0.
If you are re-using any piece of this OXP, please let me know by sending an e-mail to david at pradier dot info

==============================
Changelog

0.2     The actions are made progressively, one every 10 frames when docked, so as not to need more execution time than allowed at the same time, and to avoid slowdowns during the game.
0.1     First version of the Diplomacy engine. Systems are introduced as a type of "Actor". "SELFTAX" is introduced as an event for systems. Tax level and treasury are displayed on the F7 screen.