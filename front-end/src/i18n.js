import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-locize-backend";

i18n
  .use(Backend) // Connecte i18next à Locize
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    lng: localStorage.getItem("app_language") || "fr",

    saveMissing: false,

    interpolation: {
      escapeValue: false, // React gère déjà la sécurité XSS
    },

    backend: {
      // Vos identifiants secrets Locize
      projectId: "0a648788-fd95-438d-99bd-a306ed0cbfce",
      apiKey: "lz_api_NtN4aOMWUztlHRLfIvsOCPKlKOIizJwc",
      referenceLng: "en", // La langue par défaut envoyée
      // Force l'API directe pour éviter l'attente du CDN (Lite) de Locize :
      loadPath: "https://api.locize.app/{{projectId}}/{{version}}/{{lng}}/{{ns}}"
    }
  });

export default i18n;
