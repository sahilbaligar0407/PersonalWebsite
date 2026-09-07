#!/bin/sh
# Boot wrapper with loud markers so Railway deploy logs show how far we get.
echo ">>> [boot] SmartCal start.sh | pwd=$(pwd) | PORT=${PORT:-<unset>} | NODE_ENV=${NODE_ENV:-<unset>} | base=${APP_BASE_PATH:-<unset>}"

echo ">>> [boot] running: prisma migrate deploy ..."
npx prisma migrate deploy
echo ">>> [boot] prisma migrate deploy exit=$?"

echo ">>> [boot] exec node server.js ..."
exec node server.js
