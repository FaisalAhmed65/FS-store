import { createContext, useContext, useState, useEffect } from "react";

const LANG_KEY = "trd-lang";
const LanguageContext = createContext({
  lang: "en",
  setLanguage: () => {},
  toggleLang: () => {},
});

function applyLanguage(nextLang) {
  if (typeof document === "undefined") return;

  document.body.classList.toggle("lang-bn", nextLang === "bn");
  document.documentElement.lang = nextLang;
  document.documentElement.dir = "ltr";
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      const nextLang = saved === "bn" ? "bn" : "en";
      setLang(nextLang);
      applyLanguage(nextLang);
    } catch {
      applyLanguage("en");
    }
  }, []);

  function setLanguage(nextLang) {
    const safeLang = nextLang === "bn" ? "bn" : "en";
    setLang(safeLang);
    applyLanguage(safeLang);

    try {
      localStorage.setItem(LANG_KEY, safeLang);
    } catch {
      // The UI still switches for the current session when storage is blocked.
    }
  }

  function toggleLang() {
    setLanguage(lang === "bn" ? "en" : "bn");
  }

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
