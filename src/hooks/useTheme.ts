import { useState, useEffect } from "react";

type ThemeMode = "light" | "dark" | "system";

export function useTheme() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem("hoego_theme_mode");
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
    return "system";
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.getItem("hoego_theme_mode");
    if (stored === "light") return false;
    if (stored === "dark") return true;
    // system or no stored value
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  });

  // 다크모드 테마 적용
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
    }
  }, [isDarkMode]);

  // System theme detection and update
  useEffect(() => {
    if (themeMode !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsDarkMode(e.matches);
    };

    // Initial check
    handleChange(mediaQuery);

    // Listen for changes
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [themeMode]);

  // Save themeMode to localStorage
  useEffect(() => {
    localStorage.setItem("hoego_theme_mode", themeMode);

    // Update isDarkMode based on themeMode
    if (themeMode === "light") {
      setIsDarkMode(false);
    } else if (themeMode === "dark") {
      setIsDarkMode(true);
    }
    // For 'system', the effect above handles it
  }, [themeMode]);

  // Cross-window theme synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "hoego_theme_mode" && e.newValue) {
        const newMode = e.newValue;
        if (newMode === "light" || newMode === "dark" || newMode === "system") {
          setThemeMode(newMode);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // 테마 모드 전환: light → dark → system → light
  const toggleTheme = () => {
    setThemeMode((prev) => {
      if (prev === "light") return "dark";
      if (prev === "dark") return "system";
      return "light";
    });
  };

  return {
    themeMode,
    isDarkMode,
    toggleTheme,
  };
}
