/**
 * contexts/LanguageContext.js
 * Bengali / English language toggle — mirrors Odoo Arabic/English switch.
 * Adds "lang-bn" class to <body> when Bengali is active.
 * Use CSS classes:
 *   .t-en  — visible when English (default)
 *   .t-bn  — visible when Bengali
 */
import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext({ lang: "en", toggleLang: () => {} });

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("en");

  useEffect(() => {
    const saved = typeof window !== "undefined" && localStorage.getItem("trd-lang");
    if (saved === "bn") {
      setLang("bn");
      document.body.classList.add("lang-bn");
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
