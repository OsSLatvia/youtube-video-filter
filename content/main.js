// main.js - initialization glue
(function(ns) {
    // These functions reference other modules which are loaded earlier via manifest order

    // Load stored filters from localStorage (preserve previous behavior)
    ns.loadStoredFilters = function() {
        const storedMaxAge = localStorage.getItem('ytMaxAge');
        const storedMinViews = localStorage.getItem('ytMinViews');
        const storedMaxViews = localStorage.getItem('ytMaxViews');
        const storedMinLength = localStorage.getItem('ytMinLength');
        const storedMaxLength = localStorage.getItem('ytMaxLength');
        const storedLivestreams = localStorage.getItem('ytRemoveLivestreams') === "true";
        const storedPlaylists = localStorage.getItem('ytRemovePlaylists') === "true";
        const storedWatchedVideos = localStorage.getItem('ytRemoveWatchedVideos') === "true";
        const storedBlacklistedWords = localStorage.getItem('ytFilterBlacklistedWords') === "true";
        const storedRepeatRecommendation = localStorage.getItem('ytRepeatRecommendation') === "true";

        if (storedMaxAge) ns.currentMaxAge = parseInt(storedMaxAge);
        if (storedMinViews) ns.currentMinViews = parseInt(storedMinViews);
        if (storedMaxViews) ns.currentMaxViews = parseInt(storedMaxViews);
        if (storedMinLength) ns.currentMinLength = parseFloat(storedMinLength);
        if (storedMaxLength) ns.currentMaxLength = parseFloat(storedMaxLength);
        ns.currentLivestreams = storedLivestreams === true;
        ns.currentPlaylists = storedPlaylists === true;
        ns.currentWatchedVideos = storedWatchedVideos === true;
        ns.currentBlacklistedWords = storedBlacklistedWords === true;
        ns.currentRepeatRecommendation = storedRepeatRecommendation === true;
    };

    ns.saveFilters = function() {
        localStorage.setItem('ytMaxAge', ns.currentMaxAge);
        localStorage.setItem('ytMinViews', ns.currentMinViews);
        localStorage.setItem('ytMaxViews', ns.currentMaxViews);
        localStorage.setItem('ytMinLength', ns.currentMinLength);
        localStorage.setItem('ytMaxLength', ns.currentMaxLength);
        localStorage.setItem('ytRemoveLivestreams', ns.currentLivestreams);
        localStorage.setItem('ytRemovePlaylists', ns.currentPlaylists);
        localStorage.setItem('ytRemoveWatchedVideos', ns.currentWatchedVideos);
        localStorage.setItem('ytFilterBlacklistedWords', ns.currentBlacklistedWords);
        localStorage.setItem('ytRepeatRecommendation', ns.currentRepeatRecommendation);
    };

    ns.loadEmptyFilters = function() {
        ns.currentMaxAge = null;
        ns.currentMinViews = null;
        ns.currentMaxViews = null;
        ns.currentMinLength = null;
        ns.currentMaxLength = null;
        ns.currentLivestreams = false;
        ns.currentPlaylists = false;
        ns.currentWatchedVideos = false;
        ns.currentBlacklistedWords = false;
        ns.currentRepeatRecommendation = false;

        ns.areFiltersSet = false;

        ns.checkAndCallFilters(
            ns.utils.findAllVideos(document),
            ns.currentMaxAge,
            ns.currentMinViews,
            ns.currentMaxViews,
            ns.currentMinLength,
            ns.currentMaxLength,
            ns.currentLivestreams,
            ns.currentPlaylists,
            ns.currentWatchedVideos,
            ns.currentBlacklistedWords,
            ns.currentRepeatRecommendation
        );
    };

    ns.applyOnceFilters = function() {
        ns.applyFilters(false);
    };

    ns.applyFilters = function(shouldFiltersSave = true) {
        // get current values from UI (if present)
        let maxAge = ns.currentMaxAge ?? null;
        let minViews = ns.currentMinViews ?? null;
        let maxViews = ns.currentMaxViews ?? null;
        let minLength = ns.currentMinLength ?? null;
        let maxLength = ns.currentMaxLength ?? null;
        let filterLivestreams = ns.currentLivestreams ?? false;
        let filterPlaylists = ns.currentPlaylists ?? false;
        let filterWatchedVideos = ns.currentWatchedVideos ?? false;
        let filterBlacklistedWords = ns.currentBlacklistedWords ?? false;
        let filterRepeatRecommendation = ns.currentRepeatRecommendation ?? false;

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

        const repeatedEl = document.getElementById('filterRepeatRecommendation');
        if (repeatedEl) filterRepeatRecommendation = repeatedEl.checked;

        // update current values
        ns.currentMaxAge = maxAge ? parseInt(maxAge) : null;
        ns.currentMinViews = minViews ? parseInt(minViews) : null;
        ns.currentMaxViews = maxViews ? parseInt(maxViews) : null;
        ns.currentMinLength = minLength ? parseFloat(minLength) : null;
        ns.currentMaxLength = maxLength ? parseFloat(maxLength) : null;
        ns.currentLivestreams = filterLivestreams;
        ns.currentPlaylists = filterPlaylists;
        ns.currentWatchedVideos = filterWatchedVideos;
        ns.currentBlacklistedWords = filterBlacklistedWords;
        ns.currentRepeatRecommendation = filterRepeatRecommendation;

        if (shouldFiltersSave) ns.saveFilters();

        // Update areFiltersSet flag
        ns.areFiltersSet = (
            (ns.currentMaxAge !== null && ns.utils.allowedPath(window.location.pathname)) ||
            ns.currentMinViews !== null ||
            ns.currentMaxViews !== null ||
            ns.currentMinLength !== null ||
            ns.currentMaxLength !== null ||
            ns.currentLivestreams ||
            ns.currentPlaylists ||
            ns.currentWatchedVideos ||
            ns.currentBlacklistedWords ||
            ns.currentRepeatRecommendation
        );

        ns.checkAndCallFilters(
            ns.utils.findAllVideos(document),
            ns.currentMaxAge,
            ns.currentMinViews,
            ns.currentMaxViews,
            ns.currentMinLength,
            ns.currentMaxLength,
            ns.currentLivestreams,
            ns.currentPlaylists,
            ns.currentWatchedVideos,
            ns.currentBlacklistedWords,
            ns.currentRepeatRecommendation
        );
    };

    ns.initYouTubeFilter = function() {
        ns.mutations.waitForSidebarToLoad();
    };

    // startup
    (async function startup() {
        // load settings from chrome.storage (if any)
        await Promise.all([
            ns.storage.loadLanguageSettings && ns.storage.loadLanguageSettings(),
            ns.storage.loadGeneralSettings && ns.storage.loadGeneralSettings()
        ]);

        // load stored filters from localStorage (existing logic)
        ns.loadStoredFilters();

        // create UI wrapper (but don't inject yet)
        ns.buttonUI = ns.ui.createFiltersButtonUI();

        // insert into DOM if sidebar already present
        ns.mutations.waitForSidebarToLoad();

        // set initial lastPath and start observing
        ns.mutations.startObservingDOMChanges();

        // watch clicks for soft navigation
        ns.utils.setupLinkClickListener();

        // initial injection attempt
        ns.ui.injectFiltersButton();
    })();

})(YTFilter);
