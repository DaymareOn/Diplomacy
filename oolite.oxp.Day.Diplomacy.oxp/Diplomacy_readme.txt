==============================
Description

Hello everybody,

this is the version 0.1 of the Diplomacy OXP. Its intended goal is to allow historical events to happen between systems (attacks, loots, alliances, taxes...),
and to have actions depending on this (news, massed flottillas, state racket, who knows?).
Technically, I see it as a war/diplomacy framework.

What's currently implemented?

Functionality-wise, the oxp currently adds flavour by displaying a Tax level and a Treasury level in the F7 system information.
Each system treasury is increased by taxation each player jump.
Why taxation? Because wars require money, and countries are defeated either by battles or by bankruptcy, sometimes the latter producing the former.
So systems treasury should be a main factor in a war/diplomacy framework.

Technically the oxp contains an Engine which defines some useful classes (between double quotes) and not-classes (between single quotes) for oxp developers:

An 'EventType' is a string defined by an oxp developer. As an example, the system taxation EventType is "SELFTAX".
EventTypes are stored in an ordered array, so that "Event"s' "Response"s and "Action"s may be executed in a designed order
(for example, "VICTORY" should follow "ATTACK" and not happen before :) ).
For a same EventType, recurrent "Action"s are executed before "Event"s.

An 'ActorType' is a string defined by an oxp developer. As an example, the system ActorType is "SYSTEM".
ActorTypes are stored in an ordered array, so that "Event"s' "Response"s and "Action"s may be executed in a designed order
(for example, "SYSTEM"s should act before "ALLIANCE"s as information come to alliances through their systems :) ).
For a same ActorType, recurrent "Action"s are executed before "Event"s.

An "Action" may be said init (only executed once at the creation of an Actor) or recurring (executed each turn).
An "Action" encapsulates a function, which typically will fire Events, or act onto the Oolite world.
It contains: an 'EventType', an 'ActorType' (whose kind of actors will execute this action?), and a function.

An "Event" is something done by an "Actor", to which other Actors may react by some "Response"s.
It contains: an 'EventType', the acting Actor id, and some args to be used by the Responses (defined by the oxp developer).

An "Actor" is everything which should react to events. Systems are Actors, Alliances will be.
It contains : an 'ActorType', the Actor id, its responses, and the observing other actors' ids.
An Actor observer is another actor which may react onto that actor events.
This is useful so that for example only near systems may react to an event, and not far away systems.
It's useful to limit the cpu load too by at least a factor 100.

A "Response" encapsulates a function.
It contains: an Id, the 'EventType' to which it responds, the 'ActorType' of actors which will use this response, and a function which may use the args given in the event.

Now, how do an oxp developer interact with the engine to use these marvelous concepts?

To be written :)
But check DayDiplomacy_Systems.js and DayDiplomacy_Tax.js to see how the systems and the taxation were implemented in less than 70 lines each :)

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

0.1     First version of the Diplomacy engine. Systems are introduced as a type of "Actor". "SELFTAX" is introduced as an event for systems. Tax level and treasury are displayed on the F7 screen.