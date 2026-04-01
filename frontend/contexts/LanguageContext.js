/**
 * contexts/LanguageContext.js
 * Bengali / English language toggle — mirrors Odoo Arabic/English switch.
 * Adds "lang-bn" class to <body> when Bengali is active.
 * Default: English ("en"). Persisted across sessions via localStorage.
 * Use CSS classes:
 *   .t-en  — visible in English mode (default)
 *   .t-bn  — visible in Bengali mode
 */
import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext({ lang: "en", toggleLang: () => {} });

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("en"); // default is always English

  useEffect(() => {
    // Sync from localStorage on client mount
    const saved = localStorage.getItem("trd-lang");
    if (saved === "bn") {
      setLang("bn");
      document.body.classList.add("lang-bn");
    } else {
      // Ensure lang-bn is removed on English (in case of stale class)
      document.body.classList.remove("lang-bn");
    }
  }, []);

  function toggleLang() {
    setLang((prev) => {
      const next = prev === "en" ? "bn" : "en";
      if (next === "bn") {
        document.body.classList.add("lang-bn");
        localStorage.setItem("trd-lang", "bn");
      } else {
        document.body.classList.remove("lang-bn");
        localStorage.setItem("trd-lang", "en");
      }
      return next;
    });
  }

  return (
    <LanguageContext.Provider value={{ lang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
