import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext({ lang: "en", toggleLang: () => {} });

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("en");

  useEffect(() => {
    document.body.classList.remove("lang-bn");
    localStorage.setItem("trd-lang", "en");
  }, []);

  function toggleLang() {
    setLang("en");
    document.body.classList.remove("lang-bn");
    localStorage.setItem("trd-lang", "en");
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
