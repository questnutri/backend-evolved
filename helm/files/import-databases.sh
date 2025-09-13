#!/bin/sh

mongoimport --uri "mongodb://localhost:27017/questnutri" \
  --collection "taco" \
  --file /docker-entrypoint-initdb.d/new-taco.json \
  --jsonArray \
  --username root \
  --password root \
  --authenticationDatabase admin && 
mongoimport --uri "mongodb://localhost:27017/questnutri" \
  --collection "home-measures" \
  --file /docker-entrypoint-initdb.d/home-measures.json \
  --jsonArray \
  --username root \
  --password root \
  --authenticationDatabase admin