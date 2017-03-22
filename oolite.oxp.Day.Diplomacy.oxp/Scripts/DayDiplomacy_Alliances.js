"use strict";
this.name = "DayDiplomacy_030_Alliance";
this.author = "David (Day) Pradier";
this.copyright = "(C) 2017 David Pradier";
this.licence = "CC-NC-by-SA 4.0";
this.description = "This script makes systems ally to each other.";

this.startUp = function () {
    // FIXME 0.4: implement initial scoring of relations between systems

    // notion of goodwill towards systems in range
    // goodwill low depending on history:
    // if they have attacked that turn,    // polarization? if the system has several neighbours, it dislikes better one of them

    // if they have attacked that turn a member of the alliance,
    // if they prepare for attack (even an enemy?),
    // if they're from an opposite ideology,
    // if they're from an opposite economy,
    // if they're from a different alliance (enemy alliance?)
    // if they currently got a bad economy?
    // if the other currently has a bad economy?
    // polarization? if the system has several neighbours, it dislikes better one of them
    // if they harbor an enemy faction
    // polarization: if they have enough money to attack and the other not enough to defend

    // goodwill high:
    // if they have helped in the past,
    // if they are member of the alliance,
    // if they prepare for defense,
    // if they're from a comparable economy
    // if they're from a comparable ideology
    // if they're next to a common enemy
    // if they're on a commercial road?
    // polarization? if the system has several neighbours, it likes better one of them
    // if they harbor an ally faction
    // polarization: if they have enough money to defend and the other not enough to attack

    // What's an enemy?

    // initial scoring + eventsScoring losing 10% each turn (year?) + current turn eventStoring

    // initialScore = economy comparison + ideology comparison + commercial road
};