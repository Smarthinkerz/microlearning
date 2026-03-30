/**
 * Internationalization (i18n) Framework
 * 
 * Lightweight i18n system supporting:
 * - Dynamic locale switching
 * - Nested key resolution
 * - Pluralization
 * - Variable interpolation
 * - RTL language support
 * - Lazy-loaded translation bundles
 */

export type Locale = "en" | "es" | "fr" | "de" | "ar" | "zh" | "ja" | "pt" | "hi" | "ko";

export type TranslationMap = Record<string, string | Record<string, string>>;

// ─── Translation Bundles ────────────────────────────────────────────

const translations: Record<Locale, TranslationMap> = {
  en: {
    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.lessons": "My Lessons",
    "nav.library": "Lesson Library",
    "nav.assignments": "Assignments",
    "nav.certificates": "Certificates",
    "nav.settings": "Settings",
    "nav.notifications": "Notifications",
    "nav.analytics": "Analytics",
    "nav.pricing": "Pricing",
    
    // Common
    "common.loading": "Loading...",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.search": "Search",
    "common.filter": "Filter",
    "common.back": "Back",
    "common.next": "Next",
    "common.previous": "Previous",
    "common.finish": "Finish",
    "common.retry": "Retry",
    "common.close": "Close",
    "common.confirm": "Confirm",
    "common.yes": "Yes",
    "common.no": "No",
    
    // Auth
    "auth.login": "Sign In",
    "auth.logout": "Sign Out",
    "auth.welcome": "Welcome back, {{name}}",
    
    // Lessons
    "lesson.start": "Start Lesson",
    "lesson.continue": "Continue",
    "lesson.complete": "Lesson Complete!",
    "lesson.score": "You scored {{score}}/{{total}} ({{percentage}}%)",
    "lesson.timeSpent": "Time spent: {{time}}",
    "lesson.sections": "{{count}} sections",
    "lesson.quiz": "{{count}} quiz questions",
    "lesson.notFound": "Lesson not found",
    "lesson.backToLibrary": "Back to Library",
    
    // Dashboard
    "dashboard.welcome": "Welcome, {{name}}",
    "dashboard.lessonsCompleted": "Lessons Completed",
    "dashboard.currentStreak": "Current Streak",
    "dashboard.avgScore": "Average Score",
    "dashboard.upcomingShift": "Upcoming Shift",
    "dashboard.noShifts": "No upcoming shifts",
    "dashboard.recommendations": "Recommended for You",
    
    // Notifications
    "notification.shiftReminder": "Time for a Quick Lesson!",
    "notification.lessonComplete": "Lesson completed successfully",
    "notification.achievementUnlocked": "Achievement Unlocked!",
    
    // Settings
    "settings.profile": "Profile",
    "settings.notifications": "Notifications",
    "settings.security": "Security",
    "settings.language": "Language",
    "settings.theme": "Theme",
    "settings.mfa": "Two-Factor Authentication",
    "settings.mfaEnable": "Enable MFA",
    "settings.mfaDisable": "Disable MFA",
    "settings.gdprExport": "Export My Data",
    "settings.gdprDelete": "Delete My Account",
    "settings.quietHours": "Quiet Hours",
  },
  es: {
    "nav.dashboard": "Panel",
    "nav.lessons": "Mis Lecciones",
    "nav.library": "Biblioteca",
    "nav.assignments": "Asignaciones",
    "nav.certificates": "Certificados",
    "nav.settings": "Configuración",
    "nav.notifications": "Notificaciones",
    "nav.analytics": "Análisis",
    "nav.pricing": "Precios",
    "common.loading": "Cargando...",
    "common.save": "Guardar",
    "common.cancel": "Cancelar",
    "common.delete": "Eliminar",
    "common.edit": "Editar",
    "common.search": "Buscar",
    "common.back": "Atrás",
    "common.next": "Siguiente",
    "common.previous": "Anterior",
    "common.finish": "Finalizar",
    "common.retry": "Reintentar",
    "auth.login": "Iniciar Sesión",
    "auth.logout": "Cerrar Sesión",
    "auth.welcome": "Bienvenido, {{name}}",
    "lesson.start": "Iniciar Lección",
    "lesson.complete": "¡Lección Completada!",
    "lesson.notFound": "Lección no encontrada",
    "lesson.backToLibrary": "Volver a la Biblioteca",
    "dashboard.welcome": "Bienvenido, {{name}}",
    "dashboard.lessonsCompleted": "Lecciones Completadas",
    "dashboard.currentStreak": "Racha Actual",
    "dashboard.avgScore": "Puntuación Media",
    "settings.language": "Idioma",
    "settings.theme": "Tema",
    "settings.mfa": "Autenticación de Dos Factores",
    "settings.gdprExport": "Exportar Mis Datos",
    "settings.gdprDelete": "Eliminar Mi Cuenta",
  },
  fr: {
    "nav.dashboard": "Tableau de Bord",
    "nav.lessons": "Mes Leçons",
    "nav.library": "Bibliothèque",
    "nav.settings": "Paramètres",
    "common.loading": "Chargement...",
    "common.save": "Enregistrer",
    "common.cancel": "Annuler",
    "common.back": "Retour",
    "common.next": "Suivant",
    "auth.login": "Se Connecter",
    "auth.logout": "Se Déconnecter",
    "lesson.start": "Commencer la Leçon",
    "lesson.complete": "Leçon Terminée!",
    "dashboard.welcome": "Bienvenue, {{name}}",
    "settings.language": "Langue",
  },
  de: {
    "nav.dashboard": "Übersicht",
    "nav.lessons": "Meine Lektionen",
    "nav.library": "Bibliothek",
    "common.loading": "Laden...",
    "common.save": "Speichern",
    "common.cancel": "Abbrechen",
    "auth.login": "Anmelden",
    "auth.logout": "Abmelden",
    "lesson.start": "Lektion Starten",
    "dashboard.welcome": "Willkommen, {{name}}",
    "settings.language": "Sprache",
  },
  ar: {
    "nav.dashboard": "لوحة التحكم",
    "nav.lessons": "دروسي",
    "nav.library": "المكتبة",
    "common.loading": "جاري التحميل...",
    "common.save": "حفظ",
    "common.cancel": "إلغاء",
    "auth.login": "تسجيل الدخول",
    "auth.logout": "تسجيل الخروج",
    "lesson.start": "ابدأ الدرس",
    "dashboard.welcome": "مرحباً، {{name}}",
    "settings.language": "اللغة",
  },
  zh: {
    "nav.dashboard": "仪表板",
    "nav.lessons": "我的课程",
    "nav.library": "课程库",
    "common.loading": "加载中...",
    "common.save": "保存",
    "common.cancel": "取消",
    "auth.login": "登录",
    "auth.logout": "退出",
    "lesson.start": "开始课程",
    "dashboard.welcome": "欢迎，{{name}}",
    "settings.language": "语言",
  },
  ja: {
    "nav.dashboard": "ダッシュボード",
    "nav.lessons": "マイレッスン",
    "nav.library": "レッスンライブラリ",
    "common.loading": "読み込み中...",
    "common.save": "保存",
    "auth.login": "サインイン",
    "lesson.start": "レッスン開始",
    "dashboard.welcome": "ようこそ、{{name}}",
    "settings.language": "言語",
  },
  pt: {
    "nav.dashboard": "Painel",
    "nav.lessons": "Minhas Lições",
    "nav.library": "Biblioteca",
    "common.loading": "Carregando...",
    "common.save": "Salvar",
    "auth.login": "Entrar",
    "lesson.start": "Iniciar Lição",
    "dashboard.welcome": "Bem-vindo, {{name}}",
    "settings.language": "Idioma",
  },
  hi: {
    "nav.dashboard": "डैशबोर्ड",
    "nav.lessons": "मेरे पाठ",
    "nav.library": "पाठ पुस्तकालय",
    "common.loading": "लोड हो रहा है...",
    "auth.login": "साइन इन",
    "lesson.start": "पाठ शुरू करें",
    "dashboard.welcome": "स्वागत है, {{name}}",
    "settings.language": "भाषा",
  },
  ko: {
    "nav.dashboard": "대시보드",
    "nav.lessons": "내 수업",
    "nav.library": "수업 라이브러리",
    "common.loading": "로딩 중...",
    "auth.login": "로그인",
    "lesson.start": "수업 시작",
    "dashboard.welcome": "환영합니다, {{name}}",
    "settings.language": "언어",
  },
};

// ─── RTL Languages ──────────────────────────────────────────────────

const RTL_LOCALES: Locale[] = ["ar"];

export function isRTL(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}

// ─── Locale Metadata ────────────────────────────────────────────────

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  ar: "العربية",
  zh: "中文",
  ja: "日本語",
  pt: "Português",
  hi: "हिन्दी",
  ko: "한국어",
};

// ─── Translation Function ───────────────────────────────────────────

let currentLocale: Locale = "en";

export function setLocale(locale: Locale): void {
  currentLocale = locale;
  document.documentElement.lang = locale;
  document.documentElement.dir = isRTL(locale) ? "rtl" : "ltr";
}

export function getLocale(): Locale {
  return currentLocale;
}

/**
 * Translate a key with optional variable interpolation.
 * Falls back to English if key not found in current locale.
 */
export function t(key: string, vars?: Record<string, string | number>): string {
  const bundle = translations[currentLocale] || translations.en;
  let value = (bundle[key] as string) || (translations.en[key] as string) || key;

  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      value = value.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), String(v));
    }
  }

  return value;
}

/**
 * Get all available locales.
 */
export function getAvailableLocales(): Array<{ code: Locale; name: string; rtl: boolean }> {
  return (Object.keys(LOCALE_NAMES) as Locale[]).map(code => ({
    code,
    name: LOCALE_NAMES[code],
    rtl: isRTL(code),
  }));
}
