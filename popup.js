// --- Cross-browser storage wrapper ---
const storage = {
    get: (key, defaultValue) => {
        return new Promise((resolve, reject) => {
            try {
                // If key is string and defaultValue provided, wrap as object
                const getKey = defaultValue !== undefined ? { [key]: defaultValue } : key;
                const api = typeof browser !== "undefined" ? browser.storage.local : chrome.storage.local;
                api.get(getKey, (result) => {
                    if (chrome?.runtime?.lastError) reject(chrome.runtime.lastError);
                    else resolve(result);
                });
            } catch (err) { reject(err); }
        });
    },
    set: (items) => {
        return new Promise((resolve, reject) => {
            try {
                const api = typeof browser !== "undefined" ? browser.storage.local : chrome.storage.local;
                api.set(items, () => {
                    if (chrome?.runtime?.lastError) reject(chrome.runtime.lastError);
                    else resolve();
                });
            } catch (err) { reject(err); }
        });
    }
};

// --- Default settings ---
const defaultLangSettings = {
    useCustomLang: false,
    timeUnits: { day: 'day', week: 'week', month: 'month', year: 'year' },
    abbreviations: { thousand: 'K', million: 'M' },
    badges: {liveBadge: 'LIVE', playlistBadge:'Playlist'}
};
const defaultGeneralSettings = {
    homepage: true, videoSearch: false, subscriptions: false,
    channel: false, sidebarRecommendations: true, wordBlacklist: '', repeatRecommendationLimit: 10
};

// --- DOM Elements ---
const useCustomLangCheckbox = document.getElementById('use-custom-lang');
const dayInput = document.getElementById('day');
const weekInput = document.getElementById('week');
const monthInput = document.getElementById('month');
const yearInput = document.getElementById('year');
const thousandInput = document.getElementById('thousand');
const millionInput = document.getElementById('million');
const liveBadgeInput = document.getElementById('live-badge');           
const playlistBadgeInput = document.getElementById('playlist-badge');   
const saveLangButton = document.getElementById('save');
const resetLangButton = document.getElementById('reset');

const homepageCheckbox = document.getElementById('setting-homepage');
const videoSearchCheckbox = document.getElementById('setting-video-search');
const subscriptionsCheckbox = document.getElementById('setting-subscriptions');
const channelCheckbox = document.getElementById('setting-channel');
const sidebarRecommendationsCheckbox = document.getElementById('setting-sidebar-recomendations');
const wordBlacklistInput = document.getElementById('setting-word-blacklist');
const repeatRecommendationLimitInput = document.getElementById('repeat-recommendation-limit');
const clearRepeatRecommendationCounterButton = document.getElementById('clear-repeat-recommendation-counter');
const saveGeneralButton = document.getElementById('save-settings');

// --- Load Language Settings ---
async function loadLangSettings() {
    try {
        const result = await storage.get('langSettings', defaultLangSettings);
        const settings = result.langSettings;

        useCustomLangCheckbox.checked = settings.useCustomLang;
        dayInput.value = settings.timeUnits.day;
        weekInput.value = settings.timeUnits.week;
        monthInput.value = settings.timeUnits.month;
        yearInput.value = settings.timeUnits.year;
        thousandInput.value = settings.abbreviations.thousand;
        millionInput.value = settings.abbreviations.million;
        liveBadgeInput.value = settings.badges.liveBadge;
        playlistBadgeInput.value = settings.badges.playlistBadge;

    } catch (error) {
        console.error('Error loading lang settings:', error);
    }
}

// --- Save Language Settings ---
async function saveLangSettings() {
    const settings = {
        useCustomLang: useCustomLangCheckbox.checked,
        timeUnits: {
            day: dayInput.value || defaultLangSettings.timeUnits.day,
            week: weekInput.value || defaultLangSettings.timeUnits.week,
            month: monthInput.value || defaultLangSettings.timeUnits.month,
            year: yearInput.value || defaultLangSettings.timeUnits.year,
        },
        abbreviations: {
            thousand: thousandInput.value || defaultLangSettings.abbreviations.thousand,
            million: millionInput.value || defaultLangSettings.abbreviations.million,
        },
        badges: {
            liveBadge: liveBadgeInput.value || defaultLangSettings.badges.liveBadge,
            playlistBadge: playlistBadgeInput.value || defaultLangSettings.badges.playlistBadge,
        }
    };
    try { await storage.set({ langSettings: settings }); }
    catch (error) { console.error('Error saving lang settings:', error); }
}

// --- Reset Language Settings ---
async function resetLangSettings() {
    try {
        await storage.set({ langSettings: defaultLangSettings });
        loadLangSettings();
    } catch (error) {
        console.error('Error resetting lang settings:', error);
    }
}

// --- Load General Settings ---
async function loadGeneralSettings() {
    try {
        const result = await storage.get('generalSettings', defaultGeneralSettings);
        const settings = result.generalSettings;

        homepageCheckbox.checked = settings.homepage;
        videoSearchCheckbox.checked = settings.videoSearch;
        subscriptionsCheckbox.checked = settings.subscriptions;
        channelCheckbox.checked = settings.channel;
        sidebarRecommendationsCheckbox.checked = settings.sidebarRecommendations;
        wordBlacklistInput.value = settings.wordBlacklist ?? "";
        repeatRecommendationLimitInput.value = settings.repeatRecommendationLimit ?? 10;
    } catch (error) {
        console.error('Error loading general settings:', error);
    }
}

// --- Save General Settings ---
async function saveGeneralSettings() {
    const settings = {
        homepage: homepageCheckbox.checked,
        videoSearch: videoSearchCheckbox.checked,
        subscriptions: subscriptionsCheckbox.checked,
        channel: channelCheckbox.checked,
        sidebarRecommendations: sidebarRecommendationsCheckbox.checked,
        wordBlacklist: wordBlacklistInput.value,
        repeatRecommendationLimit: Number(repeatRecommendationLimitInput.value)
    };
    try { await storage.set({ generalSettings: settings }); }
    catch (error) { console.error('Error saving general settings:', error); }
}


// --- Clear Repeat Recommendation Counter ---
async function clearRepeatRecommendationCounterFunc() {
    const settings = {
        recommendCountDictionary: {}
    };
    try { await storage.set({ recommendCountStorage: settings }); }
    catch (error) { console.error('Error in Clear Repeat Recommendation Counter', error); }
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    loadLangSettings();
    loadGeneralSettings();
});

saveLangButton.addEventListener('click', saveLangSettings);
resetLangButton.addEventListener('click', resetLangSettings);
saveGeneralButton.addEventListener('click', saveGeneralSettings);
clearRepeatRecommendationCounterButton.addEventListener('click', clearRepeatRecommendationCounterFunc);

// --- Tab Switching ---
const tabs = document.querySelectorAll('.tab');
const contents = document.querySelectorAll('.content');

tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        contents[index].classList.add('active');
    });
});
