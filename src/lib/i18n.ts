/**
 * Multi-Language UI (i18n) — 6 Languages
 *
 * Matches the Bestie companion language support:
 * English, Chinese, Spanish, Hindi, French, Arabic.
 *
 * Usage:
 *   import { t, getLocale, setLocale, LOCALES } from "@/lib/i18n";
 *   const label = t("common.dashboard");       // uses detected locale
 *   const label = t("chat.send", "es");         // explicit locale
 */

// ═══════════════════════════════════════════
// LOCALE DEFINITIONS
// ═══════════════════════════════════════════

export type Locale = "en" | "es" | "fr" | "pt" | "ja" | "ko";

export interface LocaleInfo {
  code: Locale;
  name: string;
  nativeName: string;
  flag: string;
}

export const LOCALES: LocaleInfo[] = [
  { code: "en", name: "English",    nativeName: "English",    flag: "\uD83C\uDDFA\uD83C\uDDF8" },
  { code: "es", name: "Spanish",    nativeName: "Espa\u00f1ol",     flag: "\uD83C\uDDEA\uD83C\uDDF8" },
  { code: "fr", name: "French",     nativeName: "Fran\u00e7ais",    flag: "\uD83C\uDDEB\uD83C\uDDF7" },
  { code: "pt", name: "Portuguese", nativeName: "Portugu\u00eas",   flag: "\uD83C\uDDE7\uD83C\uDDF7" },
  { code: "ja", name: "Japanese",   nativeName: "\u65E5\u672C\u8A9E",       flag: "\uD83C\uDDEF\uD83C\uDDF5" },
  { code: "ko", name: "Korean",     nativeName: "\uD55C\uAD6D\uC5B4",       flag: "\uD83C\uDDF0\uD83C\uDDF7" },
];

export const DEFAULT_LOCALE: Locale = "en";

const VALID_LOCALES = new Set<string>(LOCALES.map((l) => l.code));

function isValidLocale(code: string): code is Locale {
  return VALID_LOCALES.has(code);
}

// ═══════════════════════════════════════════
// TRANSLATIONS
// ═══════════════════════════════════════════

type TranslationNamespace = Record<string, string>;
type LocaleTranslations = Record<string, TranslationNamespace>;
type AllTranslations = Record<Locale, LocaleTranslations>;

const translations: AllTranslations = {
  // ── English ────────────────────────────
  en: {
    common: {
      dashboard: "Dashboard",
      chat: "Chat",
      agents: "Agents",
      settings: "Settings",
      billing: "Billing",
      help: "Help",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      confirm: "Confirm",
      loading: "Loading...",
      error: "Something went wrong",
      success: "Success",
      back: "Back",
      next: "Next",
      search: "Search",
      noResults: "No results found",
      signOut: "Sign Out",
    },
    chat: {
      send: "Send",
      newChat: "New Chat",
      typeMessage: "Type a message...",
      regenerate: "Regenerate",
      copy: "Copy",
      copied: "Copied!",
      edit: "Edit",
      editing: "Editing message...",
      saveEdit: "Save Edit",
      cancelEdit: "Cancel",
      deleteChat: "Delete Chat",
      clearHistory: "Clear History",
      noMessages: "Start a conversation",
      thinking: "Thinking...",
      stoneEngine: "Stone Engine",
      cloudAI: "Cloud AI",
    },
    agents: {
      allAgents: "All Agents",
      favorites: "Favorites",
      categories: "Categories",
      startChat: "Start Chat",
      noAgents: "No agents available",
      tierRequired: "Upgrade required",
      featured: "Featured",
      popular: "Popular",
    },
    billing: {
      currentPlan: "Current Plan",
      upgrade: "Upgrade",
      usage: "Usage",
      messagesRemaining: "Messages Remaining",
      managePlan: "Manage Plan",
      billingHistory: "Billing History",
      nextBilling: "Next Billing Date",
      freePlan: "Free Plan",
      cancelPlan: "Cancel Plan",
      annual: "Annual",
      monthly: "Monthly",
      savePercent: "Save {percent}%",
    },
    settings: {
      theme: "Theme",
      language: "Language",
      notifications: "Notifications",
      apiKeys: "API Keys",
      profile: "Profile",
      appearance: "Appearance",
      dark: "Dark",
      light: "Light",
      system: "System",
      emailNotifications: "Email Notifications",
      pushNotifications: "Push Notifications",
    },
  },

  // ── Spanish ────────────────────────────
  es: {
    common: {
      dashboard: "Panel",
      chat: "Chat",
      agents: "Agentes",
      settings: "Configuraci\u00f3n",
      billing: "Facturaci\u00f3n",
      help: "Ayuda",
      save: "Guardar",
      cancel: "Cancelar",
      delete: "Eliminar",
      confirm: "Confirmar",
      loading: "Cargando...",
      error: "Algo sali\u00f3 mal",
      success: "\u00c9xito",
      back: "Atr\u00e1s",
      next: "Siguiente",
      search: "Buscar",
      noResults: "Sin resultados",
      signOut: "Cerrar sesi\u00f3n",
    },
    chat: {
      send: "Enviar",
      newChat: "Nuevo Chat",
      typeMessage: "Escribe un mensaje...",
      regenerate: "Regenerar",
      copy: "Copiar",
      copied: "\u00a1Copiado!",
      edit: "Editar",
      editing: "Editando mensaje...",
      saveEdit: "Guardar",
      cancelEdit: "Cancelar",
      deleteChat: "Eliminar Chat",
      clearHistory: "Borrar Historial",
      noMessages: "Inicia una conversaci\u00f3n",
      thinking: "Pensando...",
      stoneEngine: "Motor Stone",
      cloudAI: "IA en la Nube",
    },
    agents: {
      allAgents: "Todos los Agentes",
      favorites: "Favoritos",
      categories: "Categor\u00edas",
      startChat: "Iniciar Chat",
      noAgents: "No hay agentes disponibles",
      tierRequired: "Mejora requerida",
      featured: "Destacados",
      popular: "Populares",
    },
    billing: {
      currentPlan: "Plan Actual",
      upgrade: "Mejorar",
      usage: "Uso",
      messagesRemaining: "Mensajes Restantes",
      managePlan: "Gestionar Plan",
      billingHistory: "Historial de Facturaci\u00f3n",
      nextBilling: "Pr\u00f3xima Facturaci\u00f3n",
      freePlan: "Plan Gratuito",
      cancelPlan: "Cancelar Plan",
      annual: "Anual",
      monthly: "Mensual",
      savePercent: "Ahorra {percent}%",
    },
    settings: {
      theme: "Tema",
      language: "Idioma",
      notifications: "Notificaciones",
      apiKeys: "Claves API",
      profile: "Perfil",
      appearance: "Apariencia",
      dark: "Oscuro",
      light: "Claro",
      system: "Sistema",
      emailNotifications: "Notificaciones por Email",
      pushNotifications: "Notificaciones Push",
    },
  },

  // ── French ─────────────────────────────
  fr: {
    common: {
      dashboard: "Tableau de bord",
      chat: "Discussion",
      agents: "Agents",
      settings: "Param\u00e8tres",
      billing: "Facturation",
      help: "Aide",
      save: "Enregistrer",
      cancel: "Annuler",
      delete: "Supprimer",
      confirm: "Confirmer",
      loading: "Chargement...",
      error: "Une erreur est survenue",
      success: "Succ\u00e8s",
      back: "Retour",
      next: "Suivant",
      search: "Rechercher",
      noResults: "Aucun r\u00e9sultat",
      signOut: "D\u00e9connexion",
    },
    chat: {
      send: "Envoyer",
      newChat: "Nouvelle Discussion",
      typeMessage: "\u00c9crivez un message...",
      regenerate: "R\u00e9g\u00e9n\u00e9rer",
      copy: "Copier",
      copied: "Copi\u00e9 !",
      edit: "Modifier",
      editing: "Modification du message...",
      saveEdit: "Enregistrer",
      cancelEdit: "Annuler",
      deleteChat: "Supprimer la Discussion",
      clearHistory: "Effacer l'Historique",
      noMessages: "Commencez une conversation",
      thinking: "R\u00e9flexion...",
      stoneEngine: "Moteur Stone",
      cloudAI: "IA Cloud",
    },
    agents: {
      allAgents: "Tous les Agents",
      favorites: "Favoris",
      categories: "Cat\u00e9gories",
      startChat: "D\u00e9marrer une Discussion",
      noAgents: "Aucun agent disponible",
      tierRequired: "Mise \u00e0 niveau requise",
      featured: "En Vedette",
      popular: "Populaires",
    },
    billing: {
      currentPlan: "Plan Actuel",
      upgrade: "Am\u00e9liorer",
      usage: "Utilisation",
      messagesRemaining: "Messages Restants",
      managePlan: "G\u00e9rer le Plan",
      billingHistory: "Historique de Facturation",
      nextBilling: "Prochaine Facturation",
      freePlan: "Plan Gratuit",
      cancelPlan: "Annuler le Plan",
      annual: "Annuel",
      monthly: "Mensuel",
      savePercent: "\u00c9conomisez {percent}%",
    },
    settings: {
      theme: "Th\u00e8me",
      language: "Langue",
      notifications: "Notifications",
      apiKeys: "Cl\u00e9s API",
      profile: "Profil",
      appearance: "Apparence",
      dark: "Sombre",
      light: "Clair",
      system: "Syst\u00e8me",
      emailNotifications: "Notifications par Email",
      pushNotifications: "Notifications Push",
    },
  },

  // ── Portuguese ─────────────────────────
  pt: {
    common: {
      dashboard: "Painel",
      chat: "Chat",
      agents: "Agentes",
      settings: "Configura\u00e7\u00f5es",
      billing: "Faturamento",
      help: "Ajuda",
      save: "Salvar",
      cancel: "Cancelar",
      delete: "Excluir",
      confirm: "Confirmar",
      loading: "Carregando...",
      error: "Algo deu errado",
      success: "Sucesso",
      back: "Voltar",
      next: "Pr\u00f3ximo",
      search: "Buscar",
      noResults: "Nenhum resultado encontrado",
      signOut: "Sair",
    },
    chat: {
      send: "Enviar",
      newChat: "Novo Chat",
      typeMessage: "Digite uma mensagem...",
      regenerate: "Regenerar",
      copy: "Copiar",
      copied: "Copiado!",
      edit: "Editar",
      editing: "Editando mensagem...",
      saveEdit: "Salvar",
      cancelEdit: "Cancelar",
      deleteChat: "Excluir Chat",
      clearHistory: "Limpar Hist\u00f3rico",
      noMessages: "Inicie uma conversa",
      thinking: "Pensando...",
      stoneEngine: "Motor Stone",
      cloudAI: "IA na Nuvem",
    },
    agents: {
      allAgents: "Todos os Agentes",
      favorites: "Favoritos",
      categories: "Categorias",
      startChat: "Iniciar Chat",
      noAgents: "Nenhum agente dispon\u00edvel",
      tierRequired: "Upgrade necess\u00e1rio",
      featured: "Destaques",
      popular: "Populares",
    },
    billing: {
      currentPlan: "Plano Atual",
      upgrade: "Melhorar",
      usage: "Uso",
      messagesRemaining: "Mensagens Restantes",
      managePlan: "Gerenciar Plano",
      billingHistory: "Hist\u00f3rico de Faturamento",
      nextBilling: "Pr\u00f3ximo Faturamento",
      freePlan: "Plano Gratuito",
      cancelPlan: "Cancelar Plano",
      annual: "Anual",
      monthly: "Mensal",
      savePercent: "Economize {percent}%",
    },
    settings: {
      theme: "Tema",
      language: "Idioma",
      notifications: "Notifica\u00e7\u00f5es",
      apiKeys: "Chaves API",
      profile: "Perfil",
      appearance: "Apar\u00eancia",
      dark: "Escuro",
      light: "Claro",
      system: "Sistema",
      emailNotifications: "Notifica\u00e7\u00f5es por Email",
      pushNotifications: "Notifica\u00e7\u00f5es Push",
    },
  },

  // ── Japanese ───────────────────────────
  ja: {
    common: {
      dashboard: "\u30C0\u30C3\u30B7\u30E5\u30DC\u30FC\u30C9",
      chat: "\u30C1\u30E3\u30C3\u30C8",
      agents: "\u30A8\u30FC\u30B8\u30A7\u30F3\u30C8",
      settings: "\u8A2D\u5B9A",
      billing: "\u8ACB\u6C42",
      help: "\u30D8\u30EB\u30D7",
      save: "\u4FDD\u5B58",
      cancel: "\u30AD\u30E3\u30F3\u30BB\u30EB",
      delete: "\u524A\u9664",
      confirm: "\u78BA\u8A8D",
      loading: "\u8AAD\u307F\u8FBC\u307F\u4E2D...",
      error: "\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F",
      success: "\u6210\u529F",
      back: "\u623B\u308B",
      next: "\u6B21\u3078",
      search: "\u691C\u7D22",
      noResults: "\u7D50\u679C\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093",
      signOut: "\u30ED\u30B0\u30A2\u30A6\u30C8",
    },
    chat: {
      send: "\u9001\u4FE1",
      newChat: "\u65B0\u3057\u3044\u30C1\u30E3\u30C3\u30C8",
      typeMessage: "\u30E1\u30C3\u30BB\u30FC\u30B8\u3092\u5165\u529B...",
      regenerate: "\u518D\u751F\u6210",
      copy: "\u30B3\u30D4\u30FC",
      copied: "\u30B3\u30D4\u30FC\u3057\u307E\u3057\u305F\uFF01",
      edit: "\u7DE8\u96C6",
      editing: "\u30E1\u30C3\u30BB\u30FC\u30B8\u3092\u7DE8\u96C6\u4E2D...",
      saveEdit: "\u4FDD\u5B58",
      cancelEdit: "\u30AD\u30E3\u30F3\u30BB\u30EB",
      deleteChat: "\u30C1\u30E3\u30C3\u30C8\u3092\u524A\u9664",
      clearHistory: "\u5C65\u6B74\u3092\u30AF\u30EA\u30A2",
      noMessages: "\u4F1A\u8A71\u3092\u59CB\u3081\u307E\u3057\u3087\u3046",
      thinking: "\u8003\u3048\u4E2D...",
      stoneEngine: "Stone\u30A8\u30F3\u30B8\u30F3",
      cloudAI: "\u30AF\u30E9\u30A6\u30C9AI",
    },
    agents: {
      allAgents: "\u3059\u3079\u3066\u306E\u30A8\u30FC\u30B8\u30A7\u30F3\u30C8",
      favorites: "\u304A\u6C17\u306B\u5165\u308A",
      categories: "\u30AB\u30C6\u30B4\u30EA\u30FC",
      startChat: "\u30C1\u30E3\u30C3\u30C8\u3092\u958B\u59CB",
      noAgents: "\u5229\u7528\u53EF\u80FD\u306A\u30A8\u30FC\u30B8\u30A7\u30F3\u30C8\u306A\u3057",
      tierRequired: "\u30A2\u30C3\u30D7\u30B0\u30EC\u30FC\u30C9\u304C\u5FC5\u8981",
      featured: "\u6CE8\u76EE",
      popular: "\u4EBA\u6C17",
    },
    billing: {
      currentPlan: "\u73FE\u5728\u306E\u30D7\u30E9\u30F3",
      upgrade: "\u30A2\u30C3\u30D7\u30B0\u30EC\u30FC\u30C9",
      usage: "\u4F7F\u7528\u72B6\u6CC1",
      messagesRemaining: "\u6B8B\u308A\u30E1\u30C3\u30BB\u30FC\u30B8\u6570",
      managePlan: "\u30D7\u30E9\u30F3\u7BA1\u7406",
      billingHistory: "\u8ACB\u6C42\u5C65\u6B74",
      nextBilling: "\u6B21\u306E\u8ACB\u6C42\u65E5",
      freePlan: "\u7121\u6599\u30D7\u30E9\u30F3",
      cancelPlan: "\u30D7\u30E9\u30F3\u3092\u30AD\u30E3\u30F3\u30BB\u30EB",
      annual: "\u5E74\u9593",
      monthly: "\u6708\u9593",
      savePercent: "{percent}%\u304A\u5F97",
    },
    settings: {
      theme: "\u30C6\u30FC\u30DE",
      language: "\u8A00\u8A9E",
      notifications: "\u901A\u77E5",
      apiKeys: "API\u30AD\u30FC",
      profile: "\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB",
      appearance: "\u5916\u89B3",
      dark: "\u30C0\u30FC\u30AF",
      light: "\u30E9\u30A4\u30C8",
      system: "\u30B7\u30B9\u30C6\u30E0",
      emailNotifications: "\u30E1\u30FC\u30EB\u901A\u77E5",
      pushNotifications: "\u30D7\u30C3\u30B7\u30E5\u901A\u77E5",
    },
  },

  // ── Korean ─────────────────────────────
  ko: {
    common: {
      dashboard: "\uB300\uC2DC\uBCF4\uB4DC",
      chat: "\uCC44\uD305",
      agents: "\uC5D0\uC774\uC804\uD2B8",
      settings: "\uC124\uC815",
      billing: "\uACB0\uC81C",
      help: "\uB3C4\uC6C0\uB9D0",
      save: "\uC800\uC7A5",
      cancel: "\uCDE8\uC18C",
      delete: "\uC0AD\uC81C",
      confirm: "\uD655\uC778",
      loading: "\uB85C\uB529 \uC911...",
      error: "\uBB38\uC81C\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4",
      success: "\uC131\uACF5",
      back: "\uB4A4\uB85C",
      next: "\uB2E4\uC74C",
      search: "\uAC80\uC0C9",
      noResults: "\uACB0\uACFC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4",
      signOut: "\uB85C\uADF8\uC544\uC6C3",
    },
    chat: {
      send: "\uBCF4\uB0B4\uAE30",
      newChat: "\uC0C8 \uCC44\uD305",
      typeMessage: "\uBA54\uC2DC\uC9C0\uB97C \uC785\uB825\uD558\uC138\uC694...",
      regenerate: "\uC7AC\uC0DD\uC131",
      copy: "\uBCF5\uC0AC",
      copied: "\uBCF5\uC0AC\uB428!",
      edit: "\uD3B8\uC9D1",
      editing: "\uBA54\uC2DC\uC9C0 \uD3B8\uC9D1 \uC911...",
      saveEdit: "\uC800\uC7A5",
      cancelEdit: "\uCDE8\uC18C",
      deleteChat: "\uCC44\uD305 \uC0AD\uC81C",
      clearHistory: "\uAE30\uB85D \uC0AD\uC81C",
      noMessages: "\uB300\uD654\uB97C \uC2DC\uC791\uD558\uC138\uC694",
      thinking: "\uC0DD\uAC01 \uC911...",
      stoneEngine: "Stone \uC5D4\uC9C4",
      cloudAI: "\uD074\uB77C\uC6B0\uB4DC AI",
    },
    agents: {
      allAgents: "\uBAA8\uB4E0 \uC5D0\uC774\uC804\uD2B8",
      favorites: "\uC990\uACA8\uCC3E\uAE30",
      categories: "\uCE74\uD14C\uACE0\uB9AC",
      startChat: "\uCC44\uD305 \uC2DC\uC791",
      noAgents: "\uC0AC\uC6A9 \uAC00\uB2A5\uD55C \uC5D0\uC774\uC804\uD2B8 \uC5C6\uC74C",
      tierRequired: "\uC5C5\uADF8\uB808\uC774\uB4DC \uD544\uC694",
      featured: "\uCD94\uCC9C",
      popular: "\uC778\uAE30",
    },
    billing: {
      currentPlan: "\uD604\uC7AC \uD50C\uB79C",
      upgrade: "\uC5C5\uADF8\uB808\uC774\uB4DC",
      usage: "\uC0AC\uC6A9\uB7C9",
      messagesRemaining: "\uB0A8\uC740 \uBA54\uC2DC\uC9C0",
      managePlan: "\uD50C\uB79C \uAD00\uB9AC",
      billingHistory: "\uACB0\uC81C \uB0B4\uC5ED",
      nextBilling: "\uB2E4\uC74C \uACB0\uC81C\uC77C",
      freePlan: "\uBB34\uB8CC \uD50C\uB79C",
      cancelPlan: "\uD50C\uB79C \uCDE8\uC18C",
      annual: "\uC5F0\uAC04",
      monthly: "\uC6D4\uAC04",
      savePercent: "{percent}% \uC808\uC57D",
    },
    settings: {
      theme: "\uD14C\uB9C8",
      language: "\uC5B8\uC5B4",
      notifications: "\uC54C\uB9BC",
      apiKeys: "API \uD0A4",
      profile: "\uD504\uB85C\uD544",
      appearance: "\uC678\uAD00",
      dark: "\uB2E4\uD06C",
      light: "\uB77C\uC774\uD2B8",
      system: "\uC2DC\uC2A4\uD15C",
      emailNotifications: "\uC774\uBA54\uC77C \uC54C\uB9BC",
      pushNotifications: "\uD478\uC2DC \uC54C\uB9BC",
    },
  },
};

// ═══════════════════════════════════════════
// LOCALE DETECTION & STORAGE
// ═══════════════════════════════════════════

let _currentLocale: Locale = DEFAULT_LOCALE;

/**
 * Detects locale from browser settings or returns the stored preference.
 * Safe to call on server (returns default) or client (reads navigator/localStorage).
 */
export function getLocale(): Locale {
  if (typeof window === "undefined") {
    return _currentLocale;
  }

  // Check localStorage for user preference
  try {
    const stored = localStorage.getItem("stone-ai-locale");
    if (stored && isValidLocale(stored)) {
      _currentLocale = stored;
      return _currentLocale;
    }
  } catch {
    // localStorage not available (SSR, privacy mode)
  }

  // Detect from browser
  try {
    const browserLang = navigator.language?.slice(0, 2).toLowerCase();
    if (browserLang && isValidLocale(browserLang)) {
      _currentLocale = browserLang;
      return _currentLocale;
    }
  } catch {
    // navigator not available
  }

  return _currentLocale;
}

/**
 * Sets the active locale and persists to localStorage.
 */
export function setLocale(locale: string): void {
  if (!isValidLocale(locale)) {
    console.warn(`Invalid locale: ${locale}. Valid: ${LOCALES.map((l) => l.code).join(", ")}`);
    return;
  }

  _currentLocale = locale;

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("stone-ai-locale", locale);
    } catch {
      // localStorage not available
    }
  }
}

// ═══════════════════════════════════════════
// TRANSLATION FUNCTION
// ═══════════════════════════════════════════

/**
 * Translates a dotted key (e.g. "common.dashboard", "chat.send") to the
 * current or specified locale. Falls back to English if the key is missing
 * in the target locale, then to the raw key if not found at all.
 *
 * Supports simple interpolation: t("billing.savePercent", "en") with
 * the string "Save {percent}%" — call t() and then .replace("{percent}", "20").
 */
export function t(key: string, locale?: string): string {
  const activeLocale: Locale = locale && isValidLocale(locale) ? locale : getLocale();

  const [namespace, ...rest] = key.split(".");
  const translationKey = rest.join(".");

  if (!namespace || !translationKey) {
    return key;
  }

  // Try target locale
  const targetValue = translations[activeLocale]?.[namespace]?.[translationKey];
  if (targetValue) {
    return targetValue;
  }

  // Fallback to English
  if (activeLocale !== "en") {
    const fallback = translations.en?.[namespace]?.[translationKey];
    if (fallback) {
      return fallback;
    }
  }

  // Return raw key as last resort
  return key;
}

/**
 * Returns all translations for a given namespace and locale.
 * Useful for bulk rendering (e.g., rendering all nav items).
 */
export function getNamespace(
  namespace: string,
  locale?: string
): Record<string, string> {
  const activeLocale: Locale = locale && isValidLocale(locale) ? locale : getLocale();
  return translations[activeLocale]?.[namespace] ?? translations.en?.[namespace] ?? {};
}
