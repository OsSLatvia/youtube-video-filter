// Default settings
const defaultSettings = {
    useCustomLang: false,  // This will store the custom language preference (true or false)
    timeUnits: {
        day: 'day',
        week: 'week',
        month: 'month',
        year: 'year',
    },
    abbreviations: {
        thousand: 'K',
        million: 'M',
    },
};

// DOM Elements
const useCustomLangCheckbox = document.getElementById('use-custom-lang');
const dayInput = document.getElementById('day');
const weekInput = document.getElementById('week');
const monthInput = document.getElementById('month');
const yearInput = document.getElementById('year');
const thousandInput = document.getElementById('thousand');
const millionInput = document.getElementById('million');
const saveButton = document.getElementById('save');
const resetButton = document.getElementById('reset');

// Load settings from browser.storage.local
async function loadSettings() {
    try {
        const result = await browser.storage.local.get('settings');
        const storedSettings = result.settings || defaultSettings;

        // Populate fields with stored or default values
        useCustomLangCheckbox.checked = storedSettings.useCustomLang;
        dayInput.value = storedSettings.timeUnits.day;
        weekInput.value = storedSettings.timeUnits.week;
        monthInput.value = storedSettings.timeUnits.month;
        yearInput.value = storedSettings.timeUnits.year;
        thousandInput.value = storedSettings.abbreviations.thousand;
        millionInput.value = storedSettings.abbreviations.million;
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Save settings to browser.storage.local
async function saveSettings() {
    const settings = {
        useCustomLang: useCustomLangCheckbox.checked,
        timeUnits: {
            day: dayInput.value || defaultSettings.timeUnits.day,
            week: weekInput.value || defaultSettings.timeUnits.week,
            month: monthInput.value || defaultSettings.timeUnits.month,
            year: yearInput.value || defaultSettings.timeUnits.year,
        },
        abbreviations: {
            thousand: thousandInput.value || defaultSettings.abbreviations.thousand,
            million: millionInput.value || defaultSettings.abbreviations.million,
        },
    };

    try {
        await browser.storage.local.set({ settings: settings });
        console.log('Settings saved!');
    } catch (error) {
        console.error('Error saving settings:', error);
    }
}

// Reset settings to default
async function resetSettings() {
    try {
        await browser.storage.local.set({ settings: defaultSettings });
        loadSettings(); // Reload UI with default settings
        console.log('Settings reset to default!');
    } catch (error) {
        console.error('Error resetting settings:', error);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', loadSettings); // Load settings when DOM is loaded
saveButton.addEventListener('click', saveSettings);
resetButton.addEventListener('click', resetSettings);

// Tab navigation logic (if needed)
const tabs = document.querySelectorAll('.tab'); // Select all tab elements
const contents = document.querySelectorAll('.content'); // Select all content sections

tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
        // Deactivate all tabs and hide all contents
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));

        // Activate the clicked tab and corresponding content
        tab.classList.add('active');
        contents[index].classList.add('active');
    });
});
