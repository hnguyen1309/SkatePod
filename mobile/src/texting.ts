import * as SMS from "expo-sms";
import { useEffect, useState } from "react";
import { Alert, Linking, Platform } from "react-native";
import { smsLink } from "./data";

/**
 * Whether this phone can send texts (never on the Simulator or an iPad without Messages).
 * Screens show their "Text" button only when it can.
 */
export function useCanText() {
  const [canText, setCanText] = useState(false);
  useEffect(() => {
    SMS.isAvailableAsync()
      .then(setCanText)
      .catch(() => setCanText(false));
  }, []);
  return canText;
}

/**
 * Opens the Messages app with `message` filled in, addressed to `phone` when there is one (otherwise the
 * coach picks a contact). The coach taps Send, from their own number; SkatePod sends nothing itself.
 * (expo-sms's in-app Messages window didn't open inside Expo Go on iPhone, so this uses an sms: link.)
 * Resolves to true once Messages opened.
 */
export async function openTextMessage(phone: string | undefined, message: string): Promise<boolean> {
  try {
    await Linking.openURL(smsLink(phone, message, Platform.OS === "android" ? "android" : "ios"));
    return true;
  } catch {
    Alert.alert("Couldn’t open Messages", "Try Share instead.");
    return false;
  }
}
