import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext({ isDark: false, toggle: () => {} });

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("trd-theme");
    if (saved === "dark") {
      setIsDark(true);
      document.body.classList.add("theme-dark");
    }
  }, []);

  function toggle() {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.body.classList.add("theme-dark");
        localStorage.setItem("trd-theme", "dark");
      } else {
        document.body.classList.remove("theme-dark");
        localStorage.setItem("trd-theme", "light");
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
