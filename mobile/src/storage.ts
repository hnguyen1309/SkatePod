import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

/** Like useState, but saved on the phone so it survives closing the app. */
export function usePersistentState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (!active || !raw) return;
        try {
          setValue(JSON.parse(raw) as T);
        } catch {
          // Ignore unreadable data and keep the default.
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});
  }, [key, value, loaded]);

  return [value, setValue, loaded] as const;
}
