// Small namespace to avoid polluting page globals
window.YTFilter = window.YTFilter || {};

// Default settings & state
YTFilter.NEW_BUTTON_TEXT = 'Filters';
YTFilter.HOME_BUTTON_SELECTOR = 'ytd-guide-section-renderer.style-scope:nth-child(1) > div:nth-child(2) > ytd-guide-entry-renderer:nth-child(1) > a:nth-child(1)';
YTFilter.userLanguage = document.documentElement.lang || 'en';

YTFilter.defaultSettings = {
    homepage: true,
    videoSearch: false,
    subscriptions: false,
    channel: false,
    sidebarRecommendations: true,
    wordBlacklist: '',
    repeatRecommendationLimit: 10,
};

YTFilter.generalSettings = Object.assign({}, YTFilter.defaultSettings);

// language/time units & abbreviations
YTFilter.timeUnits = {
    //en: { 'day': 1, 'week': 7, 'month': 30, 'year': 365 },
    en: { 'day': 1, 'wk': 7, 'mo': 30, 'yr': 365 },
    lv: { 'dien': 1, 'nedēļ': 7, 'mēne': 30, 'gad': 365 },
    es: { 'día': 1, 'semana': 7, 'mes': 30, 'año': 365 },
    fr: { 'jour': 1, 'semaine': 7, 'mois': 30, 'an': 365 }
};
YTFilter.abbreviations = {
   // en: { thousand: 'K', million: 'M' },
    en: { thousand: 'k', million: 'm' },
    lv: { thousand: 'tūkst', million: 'milj' },
    es: { thousand: 'K', million: 'M' },
    fr: { thousand: 'k', million: 'M' }
};
YTFilter.badges = {
    en: { liveBadge: 'LIVE', playlistBadge: 'Mix' },
    lv: { liveBadge: 'TIEŠRAIDE', playlistBadge: 'Kolekcija' },
    es: { liveBadge: 'EN DIRECTO', playlistBadge: 'Mix' },
    fr: { liveBadge: 'EN DIRECT', playlistBadge: 'Mix' }
};


// UI & state handles
YTFilter.maxAgeField = null;
YTFilter.forceRecheckOnNextMutation = false;

// filter state variables (shared)
YTFilter.areFiltersSet = false;
YTFilter.currentMaxAge = null;
YTFilter.currentMinViews = null;
YTFilter.currentMaxViews = null;
YTFilter.currentMinLength = null;
YTFilter.currentMaxLength = null;
YTFilter.currentLivestreams = false;
YTFilter.currentPlaylists = false;
YTFilter.currentWatchedVideos = false;
YTFilter.currentBlacklistedWords = false;
YTFilter.currentRepeatRecommendation = false;

// DOM references
YTFilter.domObserver = null;
YTFilter.filtersButtonWrapper = null;
YTFilter.buttonUI = null;
