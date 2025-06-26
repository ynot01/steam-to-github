#!/bin/bash
set -o allexport
source .env
set +o allexport
setsid tsx index.ts > ./steam-to-github.log 2>&1 < /dev/null &