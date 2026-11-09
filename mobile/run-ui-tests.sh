#!/bin/sh
# Runs the Maestro UI regression suite (mobile/.maestro) on the iOS Simulator, in Expo Go.
#
# Before you run it:
#   1. Start the app's server in another terminal: npx expo start
#   2. Boot a Simulator that has Expo Go (pressing "i" in the Expo terminal does both).
#
# Usage (from mobile/):
#   sh run-ui-tests.sh                                   # regression + edge cases (.maestro/config.yaml)
#   sh run-ui-tests.sh .maestro/regression               # one folder
#   sh run-ui-tests.sh .maestro/regression/03-students.yaml   # one flow
#   sh run-ui-tests.sh .maestro/backend/full-flow.yaml   # front to back (needs the backend, see that file)
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

# Before running, print the test cases, so you know what you're about to watch:
#  - one flow file: its numbered sections ("# 1. Launch…", "# 2. Connection…"), first line of each;
#  - a folder: each flow's name and its first comment line (for .maestro itself: the folders in config.yaml).
print_cases() {
  file="$1"
  name=$(sed -n 's/^name: *//p' "$file" | head -1)
  echo "▶ ${name:-$file}  ($file)"
  if grep -q '^# [0-9][0-9]*\. ' "$file"; then
    grep '^# [0-9][0-9]*\. ' "$file" | sed 's/^# /   /'
  else
    sed -n '1s/^# */   /p' "$file"
  fi
}
TARGET="${1:-.maestro}"
echo "Test cases:"
if [ -f "$TARGET/config.yaml" ]; then
  for folder in $(sed -n 's|^ *- *\([^*]*\)/\*.*|\1|p' "$TARGET/config.yaml"); do
    echo "[$folder]"
    for flow in "$TARGET/$folder"/*.yaml; do print_cases "$flow"; done
  done
elif [ -d "$TARGET" ]; then
  for flow in "$TARGET"/*.yaml; do print_cases "$flow"; done
else
  print_cases "$TARGET"
fi
echo

mkdir -p ui-test-results
"$MAESTRO" test "${1:-.maestro}" \
  -e EXPO_URL="$EXPO_URL" \
  --format junit --output ui-test-results/report.xml \
  --test-output-dir ui-test-results
