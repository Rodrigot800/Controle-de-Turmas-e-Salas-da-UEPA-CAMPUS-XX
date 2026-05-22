#!/bin/bash

# Backend
cd Backend
node src/server.js &
BACK_PID=$!

# Frontend
cd ../Frontend
npm run dev -- --host &
FRONT_PID=$!

echo "Backend PID: $BACK_PID"
echo "Frontend PID: $FRONT_PID"

trap "kill $BACK_PID $FRONT_PID" EXIT

wait
