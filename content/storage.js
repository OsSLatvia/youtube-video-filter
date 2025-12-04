// storage.js - wrapper for chrome.storage.local, and higher-level helpers
(function(ns) {
    ns.storage = ns.storage || {};

    ns.storage.get = (key) => {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.local.get(key, (result) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve(result);
                    }
                });
            } catch (err) {
                reject(err);
            }
        });
    };

    ns.storage.set = (items) => {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.local.set(items, () => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve();
                    }
                });
            } catch (err) {
                reject(err);
            }
        });
    };

    // Load language settings (if user saved custom language labels)
    ns.storage.loadLanguageSettings = async function() {
        let result = {};
        try {
            result = await ns.storage.get('langSettings');
        } catch (error) {
            console.error('Error retrieving language settings:', error);
        }
        const settings = result.langSettings || {};
        const useCustomLang = settings.useCustomLang || false;
        if (useCustomLang) {
            ns.userLanguage = 'custom';
            ns.timeUnits.custom = {
                [settings.timeUnits.day]: 1,
                [settings.timeUnits.week]: 7,
                [settings.timeUnits.month]: 30,
                [settings.timeUnits.year]: 365
            };
            ns.abbreviations.custom = {
                thousand: settings.abbreviations.thousand,
                million: settings.abbreviations.million
            };
            ns.userLanguage = 'custom';
        }
    };

    // Load general settings (persisted)
    ns.storage.loadGeneralSettings = async function() {
        let result = {};
        try {
            result = await ns.storage.get('generalSettings');
            if (!result.generalSettings) {
                await ns.storage.set({ generalSettings: ns.defaultSettings });
                ns.generalSettings = Object.assign({}, ns.defaultSettings);
            } else {
                ns.generalSettings = result.generalSettings;
            }
        } catch (error) {
            console.error('Error retrieving settings:', error);
        }
    };

    // recommendCountStorage helpers
    ns.storage.loadRecommendCountStorage = async function() {
        try {
            let result = await ns.storage.get('recommendCountStorage');
            if (result.recommendCountStorage && result.recommendCountStorage.recommendCountDictionary) {
                return result.recommendCountStorage.recommendCountDictionary;
            }
        } catch (error) {
            console.error('Error retrieving recommend count storage:', error);
        }
        return {};
    };

    ns.storage.saveRecommendCountStorage = async function(new_counts) {
        const settings = { recommendCountDictionary: new_counts };
        try {
            await ns.storage.set({ recommendCountStorage: settings });
        } catch (error) {
            console.error('Error saving recommend count storage:', error);
        }
    };

})(YTFilter);
