#!/bin/sh
rm oolite.oxp.Day.Diplomacy.oxz
cd oolite.oxp.Day.Diplomacy.oxp
zip -r ../oolite.oxp.Day.Diplomacy.zip *
cd ..
mv oolite.oxp.Day.Diplomacy.zip oolite.oxp.Day.Diplomacy.oxz
cp oolite.oxp.Day.Diplomacy.oxz /home/day/ownCloud/personnelDavid/
