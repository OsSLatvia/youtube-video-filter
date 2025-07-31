// Ensure the script runs only on YouTube
if (window.location.hostname === 'www.youtube.com') {

    const NEW_BUTTON_TEXT = 'Filters'; // Text for the new button
    const HOME_BUTTON_SELECTOR = 'ytd-guide-section-renderer.style-scope:nth-child(1) > div:nth-child(2) > ytd-guide-entry-renderer:nth-child(1) > a:nth-child(1)'; // Updated selector for the Home button
    let userLanguage = document.documentElement.lang || 'en';
    const defaultSettings = {
        homepage: true,
        videoSearch: false,
        subscriptions: false,
        channel: false,
        sidebarRecommendations: true,
        wordBlacklist: '',
    }; //used if user havent saved his settings
    let generalSettings = defaultSettings;
    const timeUnits = {
        en: { 'day': 1, 'week': 7, 'month': 30, 'year': 365 },
        lv: { 'dien': 1, 'nedēļ': 7, 'mēne': 30, 'gad': 365  }, //use olny word root
        es: { 'día': 1, 'semana': 7, 'mes': 30, 'año': 365 }, 
        fr: { 'jour': 1, 'semaine': 7, 'mois': 30, 'an': 365 }, 
    };// Add more languages as needed
    //careful of plural forms when adding new languages, use word roots that match plural forms
    
    const abbreviations = {
        en: { thousand: 'K', million: 'M' },
        lv: { thousand: 'tūkst', million: 'milj' }, 
        es: { thousand: 'K', million: 'M' },
        fr: { thousand: 'k', million: 'M' }, 
    }; // Add more languages as needed
    
    let maxAgeField=null;
    let forceRecheckOnNextMutation=false;
    
    async function loadLanguageSettings() {
        let result = {}
        try {
            result = await browser.storage.local.get('langSettings');
        } catch (error) {
            console.error('Error retrieving settings:', error);
        }
        const settings = result.langSettings || {};
        const useCustomLang = settings.useCustomLang || false;  // Default to false if not set
        if (useCustomLang) { 
            // Set userLanguage to 'custom' if the checkbox is checked
            userLanguage = 'custom';
            // Add custom language data to timeUnits and abbreviations (replace with custom values as needed)
            timeUnits.custom = {
                [settings.timeUnits.day]: 1,
                [settings.timeUnits.week]: 7,
                [settings.timeUnits.month]: 30,
                [settings.timeUnits.year]: 365
            };
            abbreviations.custom = {
                thousand: settings.abbreviations.thousand,
                million: settings.abbreviations.million 
            };
        };
    }
    async function loadGeneralSettings() {
        let result = {}
        try {
            result = await browser.storage.local.get('generalSettings');
            if (!result.generalSettings) {
                browser.storage.local.set({ generalSettings: defaultSettings }); //if settings are not set, for first time users, default values saved in browser storage
            } else {
                generalSettings = result.generalSettings;
            }
        } catch (error) {
            console.error('Error retrieving settings:', error);            
        }

    }
    
    (async () => {
        await Promise.all([
            loadLanguageSettings(),  // This starts immediately
            loadGeneralSettings()    // This starts immediately too
        ]);
    // console.log("general settings: ", generalSettings)
    let lastPath = window.location.pathname;
    // Variables to hold current filter values
    let areFiltersSet = false;
    let currentMaxAge = null;
    let currentMinViews = null;
    let currentMaxViews = null;
    let currentMinLength = null; 
    let currentMaxLength = null; 
    let currentLivestreams = null;
    let currentPlaylists = null;
    let currentWatchedVideos = null;
    let currentBlacklistedWords = null;
    function isFilterEnabledForPath(path) {
        if (path === '/') {
            return generalSettings.homepage;
        } else if (path.startsWith('/results')) {
            return generalSettings.videoSearch;
        } else if (path.startsWith('/feed/subscriptions')) {
            return generalSettings.subscriptions;
        } else if (path.startsWith('/@')) {
            return generalSettings.channel;
        } else if (path.startsWith('/watch')) {
            return generalSettings.sidebarRecommendations;
        }
        // Default to false if not an expected view
        return false;
    }
    if (isFilterEnabledForPath(lastPath)) {
        loadStoredFilters();
    }
    // Immediately call initYouTubeFilter
    initYouTubeFilter();


    // Global iteration counter to track the last filtered video
    // let lastProcessedIndex = 0;

    // Mutation observer instance (defined globally so we can start/stop it)
    let domObserver = null;

    // Function to initialize the YouTube Filter extension
    function initYouTubeFilter() {
        // Wait for the sidebar to load, then inject the Filters button
        waitForSidebarToLoad();
    }

    function loadStoredFilters() {
        const storedMaxAge = localStorage.getItem('ytMaxAge');
        const storedMinViews = localStorage.getItem('ytMinViews');
        const storedMaxViews = localStorage.getItem('ytMaxViews');
        const storedMinLength = localStorage.getItem('ytMinLength');
        const storedMaxLength = localStorage.getItem('ytMaxLength');
        const storedLivestreams = localStorage.getItem('ytRemoveLivestreams');
        const storedPlaylists = localStorage.getItem('ytRemovePlaylists');
        const storedWatchedVideos = localStorage.getItem('ytRemoveWatchedVideos');
        const storedBlacklistedWords = localStorage.getItem('ytFilterBlacklistedWords');
        if (storedMaxAge) currentMaxAge = parseInt(storedMaxAge);
        if (storedMinViews) currentMinViews = parseInt(storedMinViews);
        if (storedMaxViews) currentMaxViews = parseInt(storedMaxViews);
        if (storedMinLength) currentMinLength = parseFloat(storedMinLength);
        if (storedMaxLength) currentMaxLength = parseFloat(storedMaxLength);

        // Set the currentLivestreams and currentPlaylists only if stored as 'true'
        currentLivestreams = storedLivestreams === 'true';  // Default to false if not stored
        currentPlaylists = storedPlaylists === 'true';  // Default to false if not stored
        currentWatchedVideos = storedWatchedVideos === 'true';  // Default to false if not stored
        currentBlacklistedWords = storedBlacklistedWords === 'true';
    }

    function saveFilters() {
        localStorage.setItem('ytMaxAge', currentMaxAge);
        localStorage.setItem('ytMinViews', currentMinViews);
        localStorage.setItem('ytMaxViews', currentMaxViews);
        localStorage.setItem('ytMinLength', currentMinLength);
        localStorage.setItem('ytMaxLength', currentMaxLength);
        localStorage.setItem('ytRemoveLivestreams', currentLivestreams);
        localStorage.setItem('ytRemovePlaylists', currentPlaylists);
        localStorage.setItem('ytRemoveWatchedVideos', currentWatchedVideos);
        localStorage.setItem('ytFilterBlacklistedWords', currentBlacklistedWords);

    }
    
    let filtersButtonWrapper = null;

    function createFiltersButtonUI() {
        if (filtersButtonWrapper) return filtersButtonWrapper;
    
        filtersButtonWrapper = document.createElement('div');
        filtersButtonWrapper.style.display = 'flex';
        filtersButtonWrapper.style.flexDirection = 'column';
    
        const newButton = document.createElement('button');
        newButton.id = 'custom_filters_button';
        newButton.textContent = NEW_BUTTON_TEXT;
        newButton.classList.add('custom-filters-button');
    
        filtersButtonWrapper.appendChild(newButton);
        // Inject your filter input fields, but don’t add to DOM yet
        injectFilterBar(filtersButtonWrapper); // Assume this appends inside wrapper
        newButton.addEventListener('click', () => {
            let filterBar = document.getElementById('yt-filter-bar');
            toggleElementVisibility(filterBar);
        });
    
        return filtersButtonWrapper;
    }

    const buttonUI = createFiltersButtonUI();

    // Function to wait for the sidebar to load, then inject the Filters button
    function waitForSidebarToLoad() {
        const sidebarObserver = new MutationObserver((mutations, observer) => {
            const sidebar = document.querySelector(HOME_BUTTON_SELECTOR)?.parentElement;
            
            if (sidebar) {
                injectFiltersButton();
                observer.disconnect(); // Stop observing once the sidebar is loaded
            }
        });

        // Start observing the body for sidebar loading
        sidebarObserver.observe(document.body, { childList: true, subtree: true });
    }

    // Inject the Filters button into the YouTube sidebar
    
function injectFiltersButton() {
    const sidebar = document.querySelector(HOME_BUTTON_SELECTOR)?.parentElement;
    if (!sidebar) return;

    // Prevent duplicate injection
    if (document.getElementById('custom_filters_button')) return;

    // Create UI if not already created

    // Inject UI into DOM
    sidebar.insertAdjacentElement('beforebegin', buttonUI);
    maxAgeField = document.getElementById('ageFilterContainer');
    updateMaxAgeFieldVisibility(window.location.pathname);
}

    function allowedPath(path){
        if (path === '/') {
            return true;
        } else if (path.startsWith('/results')) {
            return true;
        } else if (path.startsWith('/watch')) {
            return true;
        }
        // Default to false if not an expected view
        return false;
    }
    // Inject the filter bar into the YouTube page
    function injectFilterBar(buttonWrapper) {
        // Create the filter bar container
        const filterBar = document.createElement('div');
        filterBar.id = 'yt-filter-bar';
        filterBar.style.display = 'none';
    
        // Create filter elements
    
        // Max Age Filter
        const ageFilterGroup = document.createElement('div');
        ageFilterGroup.className = 'filter-group';
        ageFilterGroup.id = 'ageFilterContainer'
        const ageLabel = document.createElement('label');
        ageLabel.setAttribute('for', 'ageFilter');
        ageLabel.textContent = 'Max Age (days):';
        const ageInput = document.createElement('input');
        ageInput.type = 'number';
        ageInput.id = 'ageFilter';
        ageInput.min = '1';
        ageInput.placeholder = 'e.g., 30';
        ageInput.value = currentMaxAge || '';
        ageFilterGroup.appendChild(ageLabel);
        ageFilterGroup.appendChild(ageInput);
    
        // Min Views Filter
        const viewFilterGroup = document.createElement('div');
        viewFilterGroup.className = 'filter-group';
        const viewLabel = document.createElement('label');
        viewLabel.setAttribute('for', 'viewFilter');
        viewLabel.textContent = 'Min Views:';
        const viewInput = document.createElement('input');
        viewInput.type = 'number';
        viewInput.id = 'viewFilter';
        viewInput.min = '0';
        viewInput.placeholder = 'e.g., 10000';
        viewInput.value = currentMinViews || '';
        viewFilterGroup.appendChild(viewLabel);
        viewFilterGroup.appendChild(viewInput);

                // Max Views Filter
        const maxViewFilterGroup = document.createElement('div');
        maxViewFilterGroup.className = 'filter-group';
        const maxViewLabel = document.createElement('label');
        maxViewLabel.setAttribute('for', 'maxViewFilter');
        maxViewLabel.textContent = 'Max Views:';
        const maxViewInput = document.createElement('input');
        maxViewInput.type = 'number';
        maxViewInput.id = 'maxViewFilter';
        maxViewInput.min = '0';
        maxViewInput.placeholder = 'e.g., 10000';
        maxViewInput.value = currentMaxViews || '';
        maxViewFilterGroup.appendChild(maxViewLabel);
        maxViewFilterGroup.appendChild(maxViewInput);
    
        // Min Length Filter
        const lengthMinFilterGroup = document.createElement('div');
        lengthMinFilterGroup.className = 'filter-group';
        const lengthMinLabel = document.createElement('label');
        lengthMinLabel.setAttribute('for', 'lengthMinFilter');
        lengthMinLabel.textContent = 'Min Length (minutes):';
        const lengthMinInput = document.createElement('input');
        lengthMinInput.type = 'number';
        lengthMinInput.id = 'lengthMinFilter';
        lengthMinInput.min = '0';
        lengthMinInput.placeholder = 'e.g., 5';
        lengthMinInput.value = currentMinLength || '';
        lengthMinFilterGroup.appendChild(lengthMinLabel);
        lengthMinFilterGroup.appendChild(lengthMinInput);
    
        // Max Length Filter
        const lengthMaxFilterGroup = document.createElement('div');
        lengthMaxFilterGroup.className = 'filter-group';
        const lengthMaxLabel = document.createElement('label');
        lengthMaxLabel.setAttribute('for', 'lengthMaxFilter');
        lengthMaxLabel.textContent = 'Max Length (minutes):';
        const lengthMaxInput = document.createElement('input');
        lengthMaxInput.type = 'number';
        lengthMaxInput.id = 'lengthMaxFilter';
        lengthMaxInput.min = '0';
        lengthMaxInput.placeholder = 'e.g., 60';
        lengthMaxInput.value = currentMaxLength || '';
        lengthMaxFilterGroup.appendChild(lengthMaxLabel);
        lengthMaxFilterGroup.appendChild(lengthMaxInput);
    
        // Livestreams Checkbox
        const livestreamsFilterGroup = document.createElement('div');
        livestreamsFilterGroup.className = 'filter-group checkbox-group';
        const livestreamsInput = document.createElement('input');
        livestreamsInput.type = 'checkbox';
        livestreamsInput.id = 'filterLivestreams';
        livestreamsInput.style.marginRight = '5px';
        livestreamsInput.checked = currentLivestreams;
        const livestreamsLabel = document.createElement('label');
        livestreamsLabel.setAttribute('for', 'filterLivestreams');
        livestreamsLabel.style.marginRight = '15px';
        livestreamsLabel.textContent = 'Remove Livestreams';
        livestreamsFilterGroup.appendChild(livestreamsInput);
        livestreamsFilterGroup.appendChild(livestreamsLabel);
    
        // Playlists Checkbox
        const playlistsFilterGroup = document.createElement('div');
        playlistsFilterGroup.className = 'filter-group checkbox-group';
        const playlistsInput = document.createElement('input');
        playlistsInput.type = 'checkbox';
        playlistsInput.id = 'filterPlaylists';
        playlistsInput.style.marginRight = '5px';
        playlistsInput.checked = currentPlaylists;
        const playlistsLabel = document.createElement('label');
        playlistsLabel.setAttribute('for', 'filterPlaylists');
        playlistsLabel.style.marginRight = '15px';
        playlistsLabel.textContent = 'Remove Playlists';
        playlistsFilterGroup.appendChild(playlistsInput);
        playlistsFilterGroup.appendChild(playlistsLabel);

        // Watched Videos Checkbox
        const watchedVideosFilterGroup = document.createElement('div');
        watchedVideosFilterGroup.className = 'filter-group checkbox-group';
        const watchedVideosInput = document.createElement('input');
        watchedVideosInput.type = 'checkbox';
        watchedVideosInput.id = 'filterWatchedVideos';
        watchedVideosInput.style.marginRight = '5px';
        watchedVideosInput.checked = currentWatchedVideos;
        const watchedVideosLabel = document.createElement('label');
        watchedVideosLabel.setAttribute('for', 'filterWatchedVideos');
        watchedVideosLabel.style.marginRight = '15px';
        watchedVideosLabel.textContent = 'Remove Watched Videos';
        watchedVideosFilterGroup.appendChild(watchedVideosInput);
        watchedVideosFilterGroup.appendChild(watchedVideosLabel);

        // Blacklisted Words Checkbox
        const blacklistedWordsFilterGroup = document.createElement('div');
        blacklistedWordsFilterGroup.className = 'filter-group checkbox-group';
        const blacklistedWordsInput = document.createElement('input');
        blacklistedWordsInput.type = 'checkbox';
        blacklistedWordsInput.id = 'filterBlacklistedWords';
        blacklistedWordsInput.style.marginRight = '5px';
        blacklistedWordsInput.checked = currentBlacklistedWords; 
        const blacklistedWordsLabel = document.createElement('label');
        blacklistedWordsLabel.setAttribute('for', 'filterBlacklistedWords');
        blacklistedWordsLabel.style.marginRight = '15px';
        blacklistedWordsLabel.textContent = 'Filter Blacklisted Words';
        blacklistedWordsFilterGroup.appendChild(blacklistedWordsInput);
        blacklistedWordsFilterGroup.appendChild(blacklistedWordsLabel);
    
        // Buttons
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'filter-group';
        // apply button
        const applyButton = document.createElement('button');
        applyButton.id = 'applyFilters';
        applyButton.textContent = 'Save Filters';
        // reset button
        const resetButton = document.createElement('button');
        resetButton.id = 'resetFilters';
        resetButton.textContent = 'Reset';
        resetButton.style.marginLeft = '10px';
        //apply once button
        const applyOnceButton = document.createElement('button');
        applyOnceButton.id = 'applyOnceFilters';
        applyOnceButton.textContent = 'Apply Filters Once';

        buttonGroup.appendChild(applyOnceButton);    
        buttonGroup.appendChild(applyButton);
        buttonGroup.appendChild(resetButton);
    
        // Append all filter groups to the filter bar
        filterBar.appendChild(ageFilterGroup);
        filterBar.appendChild(viewFilterGroup);
        filterBar.appendChild(maxViewFilterGroup);
        filterBar.appendChild(lengthMinFilterGroup);
        filterBar.appendChild(lengthMaxFilterGroup);
        filterBar.appendChild(livestreamsFilterGroup);
        filterBar.appendChild(playlistsFilterGroup);
        filterBar.appendChild(watchedVideosFilterGroup)
        filterBar.appendChild(blacklistedWordsFilterGroup);
        filterBar.appendChild(buttonGroup);
    
        buttonWrapper.appendChild(filterBar);

        // Set the flag for filters
        areFiltersSet = (
            (currentMaxAge !== null && allowedPath(window.location.pathname)) ||
            currentMinViews !== null ||
            currentMaxViews !== null ||
            currentMinLength !== null ||
            currentMaxLength !== null ||
            currentLivestreams ||
            currentPlaylists ||
            currentWatchedVideos ||
            currentBlacklistedWords 
        );
        applyOnceFilters();
        setupLinkClickListener();
        startObservingDOMChanges();
        
    
        resetButton.addEventListener('click', resetFilters);
        applyButton.addEventListener('click', () => applyFilters());
        applyOnceButton.addEventListener('click', applyOnceFilters);
    }
    
    function getVideoSelectorByPath() {
        const path = window.location.pathname;
    
        if (path === '/') {
            return 'ytd-rich-item-renderer'; // Homepage
        } else if (path.startsWith('/results')) {
            return 'ytd-video-renderer'; // Search results
        } else if (path.startsWith('/feed/subscriptions')) {
            return 'ytd-rich-item-renderer'; // Subscriptions
        } else if (path.startsWith('/@') || path.startsWith('/channel/')) {
            return 'ytd-rich-item-renderer'; // Channel page
        } else if (path.startsWith('/watch')) {
            return 'ytd-compact-video-renderer'; // sidebar page *old selector
            // return 'yt-lockup-view-model-wiz--compact'; // sidebar page *new selector but on sidebar recomendations element ids have changed so cant use the same filters.
        } else {
            return '#dismissible'; // Fallback (old structure)
        }
    }
    function findAllVideos(dom) {
        const selector = getVideoSelectorByPath();
        videos=dom.querySelectorAll(selector);
        return videos;
    }
    
    function findAllMutationVideos(mutations) {
        const selector = getVideoSelectorByPath();
        let videoItems = [];
    
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && node.matches(selector)) {
                        videoItems.push(node);
                    }
                });
            }
        });
        return videoItems;
    }


function checkAndCallFilters(
    videos,
    currentMaxAge,
    currentMinViews,
    currentMaxViews,
    currentMinLength,
    currentMaxLength,
    currentLivestreams,
    currentPlaylists,
    currentWatchedVideos,
    currentBlacklistedWords
) {
    let allVideos = videos;
    filterRecommendations(
        allVideos,
        currentMaxAge,
        currentMinViews,
        currentMaxViews,
        currentMinLength,
        currentMaxLength,
        currentLivestreams,
        currentPlaylists,
        currentWatchedVideos,
        currentBlacklistedWords
    );
}

    












    // Function to filter recommendations based on age, views, and video length
    async function filterRecommendations(
        videoItems,
        maxAge,
        minViews,
        maxViews,
        minLength,
        maxLength,
        removeLivestreams,
        removePlaylists,
        removeWatchedVideos,
        removeBlacklistedWords
    ) {
        let hiddenVideos = 0;
        let shownVideos = 0;
        const selector = getVideoSelectorByPath();
        const blacklist = (generalSettings.wordBlacklist ?? "").toLowerCase().split(";").filter(Boolean);

        for (const item of videoItems) {
            const parentContainer = item.closest(selector);
            if (!parentContainer) continue;

            // 🔴 Livestream
            if (isLivestream(item)) {
                if (removeLivestreams) {
                    hiddenVideos += hideElement(parentContainer);
                    continue;
                } else {
                    shownVideos += showElement(parentContainer);
                }
            }

            // 🔴 Watched
            if (isWatched(item)) {
                if (removeWatchedVideos) {
                    hiddenVideos += hideElement(parentContainer);
                    continue;
                } else {
                    shownVideos += showElement(parentContainer);
                }
            }

            // 🔴 Blacklist
            if (blacklist.length > 0) {
                const title = getVideoTitle(item).toLowerCase();
                const isBlacklisted = blacklist.some(word => title.includes(word));
                if (isBlacklisted) {
                    if (removeBlacklistedWords) {
                        hiddenVideos += hideElement(parentContainer);
                        continue;
                    } else {
                        shownVideos += showElement(parentContainer);
                    }
                }
            }

            // 🔴 Playlist
            if (isPlaylist(item)) {
                if (removePlaylists) {
                    hiddenVideos += hideElement(parentContainer);
                    continue;
                } else {
                    shownVideos += showElement(parentContainer);
                }
            }
            // 🔴 Age filter
            const dateElement = getDateElement(item);
            if (dateElement){
                if (maxAge) {
                    const videoAgeInDays = parseVideoAge(dateElement);
                    if (videoAgeInDays > maxAge) {
                        hiddenVideos += hideElement(parentContainer);
                        continue;
                    } else {
                        shownVideos += showElement(parentContainer);
                    }
                }
                else {
                    shownVideos += showElement(parentContainer);
                }
            }
            // 🔴 Views filter
            const viewsElement = getViewsElement(item);
            if(viewsElement) {
                if (minViews || maxViews) {
                    const videoViews = parseVideoViews(viewsElement);
                    let shouldHide = false;
                    if (minViews !== null && videoViews < minViews) {
                        shouldHide = true;
                    }
                    if (!shouldHide && maxViews !== null && videoViews > maxViews) {
                        shouldHide = true;
                    }
                    if (shouldHide) {
                        hiddenVideos += hideElement(parentContainer);
                        continue;
                    } 
                    else {
                        shownVideos += showElement(parentContainer);
                    }
                }
                else{
                    shownVideos += showElement(parentContainer);
                }

            }

            // 🔴 Length
            const timeElement = await getTimeElement(item);
            if (timeElement) {
                if (minLength || maxLength) {
                    const videoLengthInMinutes = parseVideoLength(timeElement);
                    const isTooShort = minLength !== null && videoLengthInMinutes < minLength;
                    const isTooLong = maxLength !== null && videoLengthInMinutes > maxLength;
                    if (isTooShort || isTooLong) {
                        hiddenVideos += hideElement(parentContainer);
                        continue;
                    }
                } else {
                    shownVideos += showElement(parentContainer);
                }
                
            }



        }
    }




    // // Helper function to parse video age (in days)
    // function parseVideoAge(ageText) {
    //     // Assuming `ytInitialData` is available in the global scope

    //     const days = { 'day': 1, 'week': 7, 'month': 30, 'year': 365 };
    //     let match = ageText.match(/(\d+)\s+(day|week|month|year)s?/);
    //     return match ? parseInt(match[1]) * days[match[2]] : 0;
    // }
    // Helper function to parse video age (in days)
    function parseVideoAge(ageText) {
        lang = userLanguage.split('-')[0];;
        const units = timeUnits[lang];
        if (!units) {
            console.error(`Unsupported language: ${lang}, setting language as eng`);
            lang='en';
            units = timeUnits[lang];
        }

        // Build a dynamic regex for the chosen language
        const unitRegex = Object.keys(units).join('|');
        const regex = new RegExp(`(\\d+)\\s+(${unitRegex})s?`, 'i');

        let match = ageText.match(regex);
        return match ? parseInt(match[1]) * units[match[2].toLowerCase()] : 0;
    }



    // Helper function to parse views
    // function parseVideoViews(viewsText) {
    //     if (viewsText.includes('K')) {
    //         return parseFloat(viewsText.replace('K', '').replace(',', '.')) * 1000;
    //     } else if (viewsText.includes('M')) {
    //         return parseFloat(viewsText.replace('M', '').replace(',', '.')) * 1000000;
    //     } else {
    //         return parseInt(viewsText.replace(',', '.'));
    //     }
    // }
    function parseVideoViews(viewsText) {
        const lang = userLanguage.split('-')[0];;  // The language of the user, e.g., 'en', 'lv', etc.
        const units = abbreviations[lang];
        
        if (!units) {
            console.error(`Unsupported language: ${lang}, setting language as eng`);
            lang='en';
            units = abbreviations[lang];
        }
    
        // Check for "K" or language-specific abbreviation for thousands
        if (viewsText.includes(units.thousand)) {
            return parseFloat(viewsText.replace(units.thousand, '').replace(',', '.')) * 1000;
        } 
        
        // Check for "M" or language-specific abbreviation for millions
        else if (viewsText.includes(units.million)) {
            return parseFloat(viewsText.replace(units.million, '').replace(',', '.')) * 1000000;
        } 
        
        // No abbreviation found, just return the number with possible commas replaced
        else {
            return parseInt(viewsText.replace(',', '.'));
        }
    }



    // Helper function to parse video length (in minutes)
    function parseVideoLength(lengthText) {
        const parts = lengthText.trim().split(':').map(Number);
        
        if (parts.length === 3) {
            // Format is "HH:MM:SS"
            return (parts[0] * 60) + parts[1] + (parts[2] / 60); // Convert to total minutes
        } else if (parts.length === 2) {
            // Format is "MM:SS"
            return parts[0] + (parts[1] / 60); // Convert to total minutes
        }
    
        return 0; // In case of unexpected format
    }





    // Start observing DOM changes only when filters are applied
    function startObservingDOMChanges() {
        if (domObserver) return;

        let currentPath = "";
        function handlePathChange(newPath) {
            if (newPath !== currentPath) {
                currentPath = newPath;
                updateMaxAgeFieldVisibility(newPath);
                if (!isFilterEnabledForPath(newPath)){
                    loadEmptyFilters();
                } else {
                    loadStoredFilters();
                    setInputFieldsToStoredValues();
                    applyOnceFilters();
                    areFiltersSet = (
                        (currentMaxAge !== null && allowedPath(newPath)) ||
                        currentMinViews !== null ||
                        currentMaxViews !== null ||
                        currentMinLength !== null ||
                        currentMaxLength !== null ||
                        currentLivestreams ||
                        currentPlaylists ||
                        currentWatchedVideos ||
                        currentBlacklistedWords 
                    );
                }
            }
        }

        // Create a new MutationObserver instance
        domObserver = new MutationObserver((mutations) => {
            // Check if path changed
            const newPath = window.location.pathname;
            handlePathChange(newPath);
            let newVideos;
            if (forceRecheckOnNextMutation){
                newVideos = findAllVideos(document);
                forceRecheckOnNextMutation=false;
            }
            else{
                newVideos = findAllMutationVideos(mutations);
            }
            if (areFiltersSet && newVideos.length > 0) {
                checkAndCallFilters(
                    newVideos,
                    allowedPath(newPath) ? currentMaxAge : null,
                    currentMinViews,
                    currentMaxViews,
                    currentMinLength,
                    currentMaxLength,
                    currentLivestreams,
                    currentPlaylists,
                    currentWatchedVideos,
                    currentBlacklistedWords
                );
            }
        });
    
        domObserver.observe(document.body, { childList: true, subtree: true });
    }
    
function setInputFieldsToStoredValues() {
    const storedMaxAge = localStorage.getItem('ytMaxAge');
    const storedMinViews = localStorage.getItem('ytMinViews');
    const storedMaxViews = localStorage.getItem('ytMaxViews');
    const storedMinLength = localStorage.getItem('ytMinLength');
    const storedMaxLength = localStorage.getItem('ytMaxLength');
    
    if (storedMaxAge) {
        document.getElementById('ageFilter').value = parseInt(storedMaxAge);
    } else {
        document.getElementById('ageFilter').value = '';
    }

    if (storedMinViews) {
        document.getElementById('viewFilter').value = parseInt(storedMinViews);
    } else {
        document.getElementById('viewFilter').value = '';
    }

    if (storedMaxViews) {
        document.getElementById('maxViewFilter').value = parseInt(storedMaxViews);
    } else {
        document.getElementById('maxViewFilter').value = '';
    }

    if (storedMinLength) {
        document.getElementById('lengthMinFilter').value = parseFloat(storedMinLength);
    } else {
        document.getElementById('lengthMinFilter').value = '';
    }

    if (storedMaxLength) {
        document.getElementById('lengthMaxFilter').value = parseFloat(storedMaxLength);
    } else {
        document.getElementById('lengthMaxFilter').value = '';
    }

    const storedLivestreams = localStorage.getItem('ytRemoveLivestreams');
    const storedPlaylists = localStorage.getItem('ytRemovePlaylists');
    const storedWatchedVideos = localStorage.getItem('ytRemoveWatchedVideos');
    const storedBlacklistedWords = localStorage.getItem('ytFilterBlacklistedWords');
    document.getElementById('filterLivestreams').checked = (storedLivestreams === 'true');
    document.getElementById('filterPlaylists').checked = (storedPlaylists === 'true');
    document.getElementById('filterWatchedVideos').checked = (storedWatchedVideos === 'true');
    document.getElementById('filterBlacklistedWords').checked = (storedBlacklistedWords === 'true');

    // Get stored blacklisted words and set them in the input field
    
    if (storedBlacklistedWords) {
        document.getElementById('blacklistedWordsInput').value = storedBlacklistedWords;
    } else {
        document.getElementById('blacklistedWordsInput').value = ''; // Default to empty if no words are stored
    }
}

    // Function to reset all filters
    function resetFilters() {

        loadStoredFilters();
        setInputFieldsToStoredValues();
        applyOnceFilters();
    }
function loadEmptyFilters(){
    document.getElementById('ageFilter').value = '';
    document.getElementById('viewFilter').value = '';
    document.getElementById('lengthMinFilter').value = '';
    document.getElementById('lengthMaxFilter').value = '';
    document.getElementById('filterLivestreams').checked = false;
    document.getElementById('filterPlaylists').checked = false;
    document.getElementById('filterWatchedVideos').checked = false;
    document.getElementById('filterBlacklistedWords').checked = false;

    currentMaxAge = null;
    currentMinViews = null;
    currentMaxViews = null;
    currentMinLength = null;
    currentMaxLength = null;
    currentLivestreams = null;
    currentPlaylists = null;
    currentWatchedVideos = null;
    currentBlacklistedWords = null;

    areFiltersSet = false;

    checkAndCallFilters(
        findAllVideos(document),
        currentMaxAge,
        currentMinViews,
        currentMaxViews,
        currentMinLength,
        currentMaxLength,
        currentLivestreams,
        currentPlaylists,
        currentWatchedVideos,
        currentBlacklistedWords
    );
}


    function applyOnceFilters(){
        applyFilters(false);
    }
    // Function to apply filters
function applyFilters(shouldFiltersSave = true) {
    // fallback to current stored values
    let maxAge = currentMaxAge ?? null;
    let minViews = currentMinViews ?? null;
    let maxViews = currentMaxViews ?? null;
    let minLength = currentMinLength ?? null;
    let maxLength = currentMaxLength ?? null;
    let filterLivestreams = currentLivestreams ?? false;
    let filterPlaylists = currentPlaylists ?? false;
    let filterWatchedVideos = currentWatchedVideos ?? false;
    let filterBlacklistedWords = currentBlacklistedWords ?? false;

    // try to override from DOM if elements exist
    const ageEl = document.getElementById('ageFilter');
    if (ageEl) maxAge = parseInt(ageEl.value) || null;

    const viewsEl = document.getElementById('viewFilter');
    if (viewsEl) minViews = parseInt(viewsEl.value) || null;

    const maxViewsEl = document.getElementById('maxViewFilter');
    if (maxViewsEl) maxViews = parseInt(maxViewsEl.value) || null;

    const minLenEl = document.getElementById('lengthMinFilter');
    if (minLenEl) minLength = parseFloat(minLenEl.value) || null;

    const maxLenEl = document.getElementById('lengthMaxFilter');
    if (maxLenEl) maxLength = parseFloat(maxLenEl.value) || null;

    const liveEl = document.getElementById('filterLivestreams');
    if (liveEl) filterLivestreams = liveEl.checked;

    const playlistEl = document.getElementById('filterPlaylists');
    if (playlistEl) filterPlaylists = playlistEl.checked;

    const watchedVideosEl = document.getElementById('filterWatchedVideos');
    if (watchedVideosEl) filterWatchedVideos = watchedVideosEl.checked;

    const blacklistedEl = document.getElementById('filterBlacklistedWords');
    if (blacklistedEl) filterBlacklistedWords = blacklistedEl.checked;

    // update current values
    currentMaxAge = maxAge ? parseInt(maxAge) : null;
    currentMinViews = minViews ? parseInt(minViews) : null;
    currentMaxViews = maxViews ? parseInt(maxViews) : null;
    currentMinLength = minLength ? parseFloat(minLength) : null;
    currentMaxLength = maxLength ? parseFloat(maxLength) : null;
    currentLivestreams = filterLivestreams;
    currentPlaylists = filterPlaylists;
    currentWatchedVideos = filterWatchedVideos;
    currentBlacklistedWords = filterBlacklistedWords;

    // Save filters if requested
    if (shouldFiltersSave) {
        saveFilters(); 
    }

    // Update filters set flag
    areFiltersSet = (
        (currentMaxAge !== null && allowedPath(window.location.pathname)) ||
        currentMinViews !== null ||
        currentMaxViews !== null ||
        currentMinLength !== null ||
        currentMaxLength !== null ||
        currentLivestreams ||
        currentPlaylists ||
        currentWatchedVideos ||
        currentBlacklistedWords
    );

    // Call filtering logic
    checkAndCallFilters(
        findAllVideos(document),
        currentMaxAge,
        currentMinViews,
        currentMaxViews,
        currentMinLength,
        currentMaxLength,
        currentLivestreams,
        currentPlaylists,
        currentWatchedVideos,
        currentBlacklistedWords 
    );
}

    function hideElement(element) {
        if (element) {
            element.style.display = 'none';
        }
        return 1;
    }
    function showElement(element) {
        if (element) {
            element.style.display = '';
        }
        return 1;
    }
    function toggleElementVisibility(element) {
        if (element.style.display === 'none') {
            showElement(element);
        } else {
            hideElement(element);
        }
    }
    function updateMaxAgeFieldVisibility(path) {
        if (!maxAgeField) return;
    
        if (path === '/' || path.startsWith('/watch') || path.startsWith('/results')) {
            showElement(maxAgeField);
        } else {
            hideElement(maxAgeField);
        }
    }
    // function resetProcessedIndex() {
    //     lastProcessedIndex = 0;
    // }

    function setupLinkClickListener() {
        document.addEventListener('click', (event) => {
            const link = event.target.closest('a');
            if (!link || !link.href) return;
    
            const targetPath = new URL(link.href).pathname;
            const currentPath = window.location.pathname;
    
            if (targetPath === currentPath) {
                // Same path link clicked → expect a soft reload
                forceRecheckOnNextMutation = true;
                console.log('[Filters] Soft reload via link click');
            }
        }, { capture: true }); // Capture phase to catch clicks before navigation
    }
    
    // Stop observing DOM changes when filters are cleared
    function stopObservingDOMChanges() {
        if (domObserver) {
            domObserver.disconnect(); // Stop the observer
            domObserver = null; // Clear observer reference
        }
    }
    })();
}



// All selectors from youtube

    function isLivestream(item) {
        // item.querySelector('.badge-style-type-live-now-alternate') ||
        // item.querySelector('.badge-shape-wiz.badge-shape-wiz--thumbnail-live.badge-shape-wiz--thumbnail-badge') //old selectors didnt work for me (might be dependant on youtube version)
            
        liveBadgeElement = item.querySelector('.badge-shape-wiz--thumbnail-live')     //should work for all languages, looks for live badge class selector.
        // const liveTextElement = item.querySelector('.badge-shape-wiz__text');
        // return liveTextElement && liveTextElement.textContent.trim() === "LIVE"; //checks for text value so for other languages might not work
        
        return liveBadgeElement
    }

    function isWatched(item) {
        // return item.querySelector('ytd-thumbnail-overlay-resume-playback-renderer'); //old selectors didnt work for me (might be dependant on youtube version)
        return item.querySelector('yt-thumbnail-overlay-progress-bar-view-model')
    }

    function getVideoTitle(item) {
        // return item.querySelector('#video-title-link')?.title ?? ""; //old selectors didnt work for me (might be dependant on youtube version)
        titleElement = item.querySelector('.yt-lockup-metadata-view-model-wiz__title');
        if (!titleElement) return "";  // return empty string if no title found
        return titleElement.textContent.trim();
    }

    function isPlaylist(item) {
        // return (
        //     // item.querySelector('ytd-thumbnail-overlay-bottom-panel-renderer yt-formatted-string') ||
        //     // item.querySelector('yt-thumbnail-overlay-badge-view-model')
        // ); //old selectors didnt work for me (might be dependant on youtube version)
        const playlistTextElement = item.querySelector('.badge-shape-wiz__text');
        return playlistTextElement && (playlistTextElement.textContent.trim() === "Mix" || playlistTextElement.textContent.trim() === "Playlist");  //works for olny english (mix and playlist)
        //should change this to look for playlist badge class selector so it doesnt compare text values that may differ depending on language
    }

    function getViewsElement(item) {
        const metadataLine = item.querySelector('yt-lockup-metadata-view-model');
        if (!metadataLine) return null;
        // return metadataLine?.querySelector('span.inline-metadata-item:nth-of-type(1)'); //old selectors didnt work for me (might be dependant on youtube version)
        return metadataLine.querySelector('div:nth-of-type(2) > span[role="text"]:nth-of-type(1)').textContent;

    }

    function getDateElement(item) {
        const metadataLine = item.querySelector('yt-lockup-metadata-view-model');
        if (!metadataLine) return null;
         
        // return metadataLine?.querySelector('span.inline-metadata-item:nth-of-type(2)'); //old selectors didnt work for me (might be dependant on youtube version)
        return metadataLine.querySelector('div:nth-of-type(2) > span[role="text"]:nth-of-type(3)').textContent;
 
    }


    async function getTimeElement(item) {
        const timeBadgeTextElement = await  waitForElementInsideNode(item, '.badge-shape-wiz__text');
        return timeBadgeTextElement.textContent.trim();
    }

        function waitForElementInsideNode(node, selector, timeout = 1000) {
        return new Promise((resolve, reject) => {
            const interval = 50; // Check every 50ms
            const maxAttempts = timeout / interval; // Max attempts before giving up
            let attempts = 0;
    
            const check = () => {
                const el = node.querySelector(selector);
                if (el || attempts >= maxAttempts) {
                    resolve(el); // If element found or timeout reached
                } else {
                    attempts++;
                    setTimeout(check, interval); // Keep checking
                }
            };
    
            check(); // Start checking immediately
        });
    }