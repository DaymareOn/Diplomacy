#!/bin/sh
for NAME in 'Diplomacy' 'DiplomacyDebugger'; do
	rm oolite.oxp.Day.${NAME}.oxz
	cd oolite.oxp.Day.${NAME}.oxp
	zip -r ../oolite.oxp.Day.${NAME}.zip *
	cd ..
	mv oolite.oxp.Day.${NAME}.zip oolite.oxp.Day.${NAME}.oxz
done
