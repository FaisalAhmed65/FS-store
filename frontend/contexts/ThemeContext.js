import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext({ isDark: false, toggle: () => {} });
const THEME_KEY = "trd-theme";

function applyTheme(isDark) {
  if (typeof document === "undefined") return;

  document.body.classList.toggle("theme-dark", isDark);
  document.documentElement.dataset.theme = isDark ? "dark" : "light";

  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) {
    themeColor.setAttribute("content", isDark ? "#0d1716" : "#f7fbfa");
  }
}

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      const next = saved === "dark";
      setIsDark(next);
      applyTheme(next);
    } catch {
      applyTheme(false);
    }
  }, []);

  function toggle() {
    setIsDark((prev) => {
      const next = !prev;
      applyTheme(next);

      try {
        localStorage.setItem(THEME_KEY, next ? "dark" : "light");
      } catch {
        // Theme still updates for the current session if storage is blocked.
      }

      return next;
    });
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
