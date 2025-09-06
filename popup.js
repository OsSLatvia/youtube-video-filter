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
};
const defaultGeneralSettings = {
    homepage: true, videoSearch: false, subscriptions: false,
    channel: false, sidebarRecommendations: true, wordBlacklist: ''
};

// --- DOM Elements ---
const useCustomLangCheckbox = document.getElementById('use-custom-lang');
const dayInput = document.getElementById('day');
const weekInput = document.getElementById('week');
const monthInput = document.getElementById('month');
const yearInput = document.getElementById('year');
const thousandInput = document.getElementById('thousand');
const millionInput = document.getElementById('million');
const saveLangButton = document.getElementById('save');
const resetLangButton = document.getElementById('reset');

const homepageCheckbox = document.getElementById('setting-homepage');
const videoSearchCheckbox = document.getElementById('setting-video-search');
const subscriptionsCheckbox = document.getElementById('setting-subscriptions');
const channelCheckbox = document.getElementById('setting-channel');
const sidebarRecommendationsCheckbox = document.getElementById('setting-sidebar-recomendations');
const wordBlacklistInput = document.getElementById('setting-word-blacklist');
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
    };
    try { await storage.set({ generalSettings: settings }); }
    catch (error) { console.error('Error saving general settings:', error); }
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    loadLangSettings();
    loadGeneralSettings();
});

saveLangButton.addEventListener('click', saveLangSettings);
resetLangButton.addEventListener('click', resetLangSettings);
saveGeneralButton.addEventListener('click', saveGeneralSettings);

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
