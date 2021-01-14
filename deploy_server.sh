#!/bin/bash

git pull origin main
pm2 delete server
pm2 start src/index.js --name server