import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type DistanceUnit = "km" | "mi";

interface PreferencesCtx {
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  distanceUnit: DistanceUnit;
  setDistanceUnit: (v: DistanceUnit) => void;
}

const Ctx = createContext<PreferencesCtx>({
  darkMode: false,
  setDarkMode: () => {},
  distanceUnit: "km",
  setDistanceUnit: () => {},
});

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkModeState] = useState<boolean>(() => {
    try { return localStorage.getItem("gari_dark") === "1"; } catch { return false; }
  });
  const [distanceUnit, setDistanceUnitState] = useState<DistanceUnit>(() => {
    try { return (localStorage.getItem("gari_unit") as DistanceUnit) ?? "km"; } catch { return "km"; }
  });

  function setDarkMode(v: boolean) {
    setDarkModeState(v);
    try { localStorage.setItem("gari_dark", v ? "1" : "0"); } catch {}
  }

  function setDistanceUnit(v: DistanceUnit) {
    setDistanceUnitState(v);
    try { localStorage.setItem("gari_unit", v); } catch {}
  }

  useEffect(() => {
    document.documentElement.setAttribute("data-gari-dark", darkMode ? "1" : "0");
  }, [darkMode]);

  return (
    <Ctx.Provider value={{ darkMode, setDarkMode, distanceUnit, setDistanceUnit }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePreferences() {
  return useContext(Ctx);
}
