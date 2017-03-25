#!/bin/sh
rm oolite.oxp.Day.Diplomacy.oxz
cd oolite.oxp.Day.Diplomacy.oxp
zip -r ../oolite.oxp.Day.Diplomacy.zip *
cd ..
mv oolite.oxp.Day.Diplomacy.zip oolite.oxp.Day.Diplomacy.oxz
#scp oolite.oxp.Day.Diplomacy.oxz pradier.info:/tmp/
