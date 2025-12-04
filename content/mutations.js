// mutations.js - DOM observation, injection triggers, path-change handling
(function(ns) {
    ns.mutations = ns.mutations || {};

    ns.mutations.waitForSidebarToLoad = function() {
        const sidebarObserver = new MutationObserver((mutations, observer) => {
            const sidebar = document.querySelector(ns.HOME_BUTTON_SELECTOR)?.parentElement;
            if (sidebar) {
                ns.ui.injectFiltersButton();
                observer.disconnect();
            }
        });
        sidebarObserver.observe(document.body, { childList: true, subtree: true });
    };

    ns.mutations.injectFiltersButton = function() {
        ns.ui.injectFiltersButton();
    };

    ns.mutations.startObservingDOMChanges = function() {
        if (ns.domObserver) return;

        let currentPath = window.location.pathname;
        function handlePathChange(newPath) {
            if (newPath !== currentPath) {
                currentPath = newPath;
                ns.utils.updateMaxAgeFieldVisibility(newPath);
                if (!ns.utils.isFilterEnabledForPath(newPath)) {
                    ns.loadEmptyFilters && ns.loadEmptyFilters();
                } else {
                    ns.loadStoredFilters && ns.loadStoredFilters();
                    ns.areFiltersSet = (
                        (ns.currentMaxAge !== null && ns.utils.allowedPath(newPath)) ||
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
                }
                ns.ui.setInputFieldsToCurrentValuesSafe && ns.ui.setInputFieldsToCurrentValuesSafe();
                ns.applyOnceFilters && ns.applyOnceFilters();
            }
        }

        ns.domObserver = new MutationObserver((mutations) => {
            const newPath = window.location.pathname;
            handlePathChange(newPath);

            let newVideos = [];
            if (ns.forceRecheckOnNextMutation) {
                newVideos = ns.utils.findAllVideos(document);
                ns.applyOnceFilters && ns.applyOnceFilters();
                ns.forceRecheckOnNextMutation = false;
            } else {
                newVideos = ns.utils.findAllMutationVideos(mutations);
            }

            if (ns.areFiltersSet && newVideos.length > 0) {
                ns.checkAndCallFilters(
                    newVideos,
                    ns.utils.allowedPath(newPath) ? ns.currentMaxAge : null,
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
            }
        });

        ns.domObserver.observe(document.body, { childList: true, subtree: true });
    };

    ns.mutations.stopObservingDOMChanges = function() {
        if (ns.domObserver) {
            ns.domObserver.disconnect();
            ns.domObserver = null;
        }
    };

})(YTFilter);
