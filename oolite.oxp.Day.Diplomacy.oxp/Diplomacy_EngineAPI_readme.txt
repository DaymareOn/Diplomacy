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

When docked in station, once every 10 frames, an action (event, response, etc) is realized.
A 'turn' of events is allowed each jump.
Before beginning a new 'turn', all the actions of the precedent turn have been realized.