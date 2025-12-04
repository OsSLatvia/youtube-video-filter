// filters.js - core filtering logic
(function(ns) {
    ns.filters = ns.filters || {};

    ns.checkAndCallFilters = function(
        videos,
        currentMaxAge,
        currentMinViews,
        currentMaxViews,
        currentMinLength,
        currentMaxLength,
        currentLivestreams,
        currentPlaylists,
        currentWatchedVideos,
        currentBlacklistedWords,
        currentRepeatRecommendation
    ) {
        const allVideos = Array.isArray(videos) ? videos : Array.from(videos || []);
        ns.filters.filterRecommendations(
            allVideos,
            currentMaxAge,
            currentMinViews,
            currentMaxViews,
            currentMinLength,
            currentMaxLength,
            currentLivestreams,
            currentPlaylists,
            currentWatchedVideos,
            currentBlacklistedWords,
            currentRepeatRecommendation
        );
    };

    ns.filters.filterRecommendations = async function(
        videoItems,
        maxAge,
        minViews,
        maxViews,
        minLength,
        maxLength,
        removeLivestreams,
        removePlaylists,
        removeWatchedVideos,
        removeBlacklistedWords,
        removeRepeatRecommendation
    ) {
        let hiddenVideos = 0;
        let shownVideos = 0;
        const selector = ns.utils.getVideoSelectorByPath();
        const blacklist = (ns.generalSettings.wordBlacklist ?? "").toLowerCase().split(";").filter(Boolean);

        let recommendCountStorage = await ns.storage.loadRecommendCountStorage();

        for (const item of videoItems) {
            const parentContainer = item.closest && item.closest(selector);
            if (!parentContainer) continue;

            // Livestream
            if (ns.utils.isLivestream(item)) {
                if (removeLivestreams) {
                    hiddenVideos += ns.utils.hideElement(parentContainer);
                    continue;
                } else {
                    shownVideos += ns.utils.showElement(parentContainer);
                }
            }

            // Watched
            if (ns.utils.isWatched(item)) {
                if (removeWatchedVideos) {
                    hiddenVideos += ns.utils.hideElement(parentContainer);
                    continue;
                } else {
                    shownVideos += ns.utils.showElement(parentContainer);
                }
            }

            // Blacklist
            if (blacklist.length > 0) {
                const title = ns.utils.getVideoTitle(item).toLowerCase();
                const isBlacklisted = blacklist.some(word => title.includes(word));
                if (isBlacklisted) {
                    if (removeBlacklistedWords) {
                        hiddenVideos += ns.utils.hideElement(parentContainer);
                        continue;
                    } else {
                        shownVideos += ns.utils.showElement(parentContainer);
                    }
                }
            }

            // Playlist
            if (ns.utils.isPlaylist(item)) {
                if (removePlaylists) {
                    hiddenVideos += ns.utils.hideElement(parentContainer);
                    continue;
                } else {
                    shownVideos += ns.utils.showElement(parentContainer);
                }
            }

            // Age filter
            const dateElement = ns.utils.getDateElement(item);
            if (dateElement && maxAge) {
                const videoAgeInDays = ns.utils.parseVideoAge(dateElement);
                if (videoAgeInDays > maxAge) {
                    hiddenVideos += ns.utils.hideElement(parentContainer);
                    continue;
                } else {
                    shownVideos += ns.utils.showElement(parentContainer);
                }
            } else {
                // If no age filter, show (unless earlier rules hid it)
                shownVideos += ns.utils.showElement(parentContainer);
            }

            // Views filter
            const viewsElement = ns.utils.getViewsElement(item);
            if (viewsElement && (minViews !== null || maxViews !== null)) {
                const videoViews = ns.utils.parseVideoViews(viewsElement);
                let shouldHide = false;
                if (minViews !== null && videoViews < minViews) shouldHide = true;
                if (!shouldHide && maxViews !== null && videoViews > maxViews) shouldHide = true;
                if (shouldHide) {
                    hiddenVideos += ns.utils.hideElement(parentContainer);
                    continue;
                } else {
                    shownVideos += ns.utils.showElement(parentContainer);
                }
            }

            // Length
            const timeElement = ns.utils.getTimeElement(item);
            if (timeElement && (minLength !== null || maxLength !== null)) {
                const videoLengthInMinutes = ns.utils.parseVideoLength(timeElement);
                const isTooShort = minLength !== null && videoLengthInMinutes < minLength;
                const isTooLong = maxLength !== null && videoLengthInMinutes > maxLength;
                if (isTooShort || isTooLong) {
                    hiddenVideos += ns.utils.hideElement(parentContainer);
                    continue;
                }
            }

            // Repeat recommendations
            if (removeRepeatRecommendation) {
                const video_id = ns.utils.getVideoTitle(item) || '__unknown__';
                let count = recommendCountStorage[video_id] || 0;
                if (count > ns.generalSettings.repeatRecommendationLimit) {
                    hiddenVideos += ns.utils.hideElement(parentContainer);
                    continue;
                } else {
                    recommendCountStorage[video_id] = count + 1;
                    shownVideos += ns.utils.showElement(parentContainer);
                }
            }
        }

        // Save counts back to storage
        ns.storage.saveRecommendCountStorage(recommendCountStorage);
        // (optional) you could console.log hidden/shown counts here for debugging
    };

})(YTFilter);
