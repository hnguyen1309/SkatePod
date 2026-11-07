#!/bin/sh
# Runs the Maestro UI regression suite (mobile/.maestro) on the iOS Simulator, in Expo Go.
#
# Before you run it:
#   1. Start the app's server in another terminal: npx expo start
#   2. Boot a Simulator that has Expo Go (pressing "i" in the Expo terminal does both).
#
# Usage (from mobile/):
#   sh run-ui-tests.sh                     # every flow
#   sh run-ui-tests.sh .maestro/03-students.yaml   # one flow
#
# Results go to mobile/ui-test-results/ (a JUnit report plus screenshots of any failure).
# Each flow resets the app to the sample data first, so don't run it on a phone with real data.

set -e
cd "$(dirname "$0")"

MAESTRO="${MAESTRO:-$(command -v maestro || echo "$HOME/.maestro/maestro/bin/maestro")}"
export MAESTRO_CLI_NO_ANALYTICS=1 MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true
# Maestro's helper app on the Simulator can take a few minutes to start the first time after a reboot.
export MAESTRO_DRIVER_STARTUP_TIMEOUT="${MAESTRO_DRIVER_STARTUP_TIMEOUT:-300000}"
EXPO_URL="${EXPO_URL:-exp://127.0.0.1:8081}"

mkdir -p ui-test-results
"$MAESTRO" test "${1:-.maestro}" \
  -e EXPO_URL="$EXPO_URL" \
  --format junit --output ui-test-results/report.xml \
  --test-output-dir ui-test-results
