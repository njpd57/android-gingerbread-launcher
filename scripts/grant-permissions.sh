#!/usr/bin/env bash
# Grant Bridge the permission it needs to change the system night mode (the "Modo noche" button
# of the Power control widget). Only needed once per device; it survives reboots and Bridge updates,
# but not a reinstall of Bridge.
# Usage: scripts/grant-permissions.sh   (with the phone connected over adb, USB debugging on)
set -euo pipefail

PACKAGE="com.tored.bridgelauncher"

command -v adb >/dev/null || { echo "adb not found in PATH" >&2; exit 1; }
adb get-state >/dev/null 2>&1 || { echo "No adb device connected" >&2; exit 1; }

adb shell pm grant "$PACKAGE" android.permission.WRITE_SECURE_SETTINGS
echo "Granted WRITE_SECURE_SETTINGS to $PACKAGE:"
adb shell dumpsys package "$PACKAGE" | grep -m1 "WRITE_SECURE_SETTINGS: granted"
