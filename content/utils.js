// utils.js - parsing helpers and DOM helpers
(function(ns) {
    ns.utils = ns.utils || {};

    ns.utils.getVideoSelectorByPath = function() {
        const path = window.location.pathname;
        if (path === '/') {
            return 'ytd-rich-item-renderer';
        } else if (path.startsWith('/results')) {
            return 'ytd-video-renderer';
        } else if (path.startsWith('/feed/subscriptions')) {
            return 'ytd-rich-item-renderer';
        } else if (path.startsWith('/@') || path.startsWith('/channel/')) {
            return 'ytd-rich-item-renderer';
        } else if (path.startsWith('/watch')) {
            return 'yt-lockup-view-model';
        } else {
            return '#dismissible';
        }
    };

    ns.utils.findAllVideos = function(dom = document) {
        const selector = ns.utils.getVideoSelectorByPath();
        return Array.from(dom.querySelectorAll(selector));
    };

    ns.utils.findAllMutationVideos = function(mutations) {
        const selector = ns.utils.getVideoSelectorByPath();
        let videoItems = [];
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && node.matches && node.matches(selector)) {
                        videoItems.push(node);
                    }
                });
            }
        });
        return videoItems;
    };

    ns.utils.parseVideoAge = function(ageText) {
        const lang = (ns.userLanguage || 'en').split('-')[0];
        let units = ns.timeUnits[lang];
        if (!units) {
            console.error(`Unsupported language: ${lang}, fallback to en`);
            units = ns.timeUnits['en'];
        }
        const unitRegex = Object.keys(units).map(u => u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
        const regex = new RegExp(`(\\d+)\\s+(${unitRegex})s?`, 'i');
        let match = (ageText || '').match(regex);
        return match ? parseInt(match[1], 10) * units[match[2].toLowerCase()] : 0;
    };

    ns.utils.parseVideoViews = function(viewsText) {
        const lang = (ns.userLanguage || 'en').split('-')[0];
        let units = ns.abbreviations[lang];
        if (!units) {
            console.error(`Unsupported language: ${lang}, fallback to en`);
            units = ns.abbreviations['en'];
        }
        if (!viewsText) return 0;
        // Normalize spacing
        const text = viewsText.trim();
        if (text.includes(units.thousand)) {
            return parseFloat(text.replace(units.thousand, '').replace(',', '.')) * 1000;
        } else if (text.includes(units.million)) {
            return parseFloat(text.replace(units.million, '').replace(',', '.')) * 1000000;
        } else {
            // remove non-digit characters
            const numb = text.replace(/[^\d]/g, '');
            return parseInt(numb || '0', 10);
        }
    };

    ns.utils.parseVideoLength = function(lengthText) {
        if (!lengthText) return 0;
        const parts = lengthText.trim().split(':').map(Number);
        if (parts.length === 3) {
            return (parts[0] * 60) + parts[1] + (parts[2] / 60);
        } else if (parts.length === 2) {
            return parts[0] + (parts[1] / 60);
        }
        return 0;
    };

    ns.utils.hideElement = function(el) {
        if (el && el.style) el.style.display = 'none';
        return 1;
    };
    ns.utils.showElement = function(el) {
        if (el && el.style) el.style.display = '';
        return 1;
    };
    ns.utils.toggleElementVisibility = function(el) {
        if (!el) return;
        el.style.display = (el.style.display === 'none') ? '' : 'none';
    };

    // Helper selectors & heuristics (a few of these may be brittle; keep tuning)
    ns.utils.isLivestream = function(item) {
        const badge = item.querySelector('yt-thumbnail-overlay-badge-view-model');
        if (!badge) return false;
        const lang = (ns.userLanguage || 'en').split('-')[0];
        const badges = ns.badges[lang] || ns.badges['en'];
        const liveText = badges.liveBadge.toLowerCase();
        return badge.textContent.trim().toLowerCase().includes(liveText);
    };

    ns.utils.isWatched = function(item) {
        return !!item.querySelector('yt-thumbnail-overlay-progress-bar-view-model');
    };

    ns.utils.getVideoTitle = function(item) {
        const titleElement = item.querySelector('[title]');
        return titleElement ? titleElement.getAttribute("title").trim() : '';
    };

    ns.utils.isPlaylist = function(item) {
        const badge = item.querySelector('yt-thumbnail-overlay-badge-view-model');
        if (!badge) return false;
        const lang = (ns.userLanguage || 'en').split('-')[0];
        const badges = ns.badges[lang] || ns.badges['en'];
        const playlistText = badges.playlistBadge.toLowerCase();
        return badge.textContent.trim().toLowerCase().includes(playlistText);
    };

    ns.utils.getViewsElement = function(item) {
        const metadataLine = item.querySelector('yt-lockup-metadata-view-model');
        if (!metadataLine) return null;
        const el = metadataLine.querySelector('div:nth-of-type(2) > span[role="text"]:nth-of-type(1)');
        return el ? el.textContent : null;
    };

    ns.utils.getDateElement = function(item) {
        const metadataLine = item.querySelector('yt-lockup-metadata-view-model');
        if (!metadataLine) return null;
        const el = metadataLine.querySelector('div:nth-of-type(2) > span[role="text"]:nth-of-type(3)');
        return el ? el.textContent : null;
    };

    ns.utils.getTimeElement = function(item) {
        const timeBadgeTextElement = item.querySelector('.yt-badge-shape__text');
        return timeBadgeTextElement ? timeBadgeTextElement.textContent.trim() : null;
    };

    ns.utils.waitForElementInsideNode = function(node, selector, timeout = 1000) {
        return new Promise((resolve) => {
            const interval = 50;
            const maxAttempts = Math.ceil(timeout / interval);
            let attempts = 0;
            const check = () => {
                const el = node.querySelector(selector);
                if (el || attempts >= maxAttempts) {
                    resolve(el || null);
                } else {
                    attempts++;
                    setTimeout(check, interval);
                }
            };
            check();
        });
    };

    ns.utils.allowedPath = function(path) {
        if (path === '/') return true;
        if (path.startsWith('/results')) return true;
        if (path.startsWith('/watch')) return true;
        return false;
    };

    ns.utils.isFilterEnabledForPath = function(path) {
        if (path === '/') return ns.generalSettings.homepage;
        else if (path.startsWith('/results')) return ns.generalSettings.videoSearch;
        else if (path.startsWith('/feed/subscriptions')) return ns.generalSettings.subscriptions;
        else if (path.startsWith('/@')) return ns.generalSettings.channel;
        else if (path.startsWith('/watch')) return ns.generalSettings.sidebarRecommendations;
        return false;
    };

    ns.utils.setupLinkClickListener = function() {
        document.addEventListener('click', (event) => {
            const link = event.target.closest && event.target.closest('a');
            if (!link || !link.href) return;
            const targetPath = new URL(link.href).pathname;
            const currentPath = window.location.pathname;
            if (targetPath === currentPath) {
                ns.forceRecheckOnNextMutation = true;
            }
        }, { capture: true });
    };

    ns.utils.updateMaxAgeFieldVisibility = function(path) {
        if (!ns.maxAgeField) return;
        if (path === '/' || path.startsWith('/watch') || path.startsWith('/results')) {
            ns.utils.showElement(ns.maxAgeField);
        } else {
            ns.utils.hideElement(ns.maxAgeField);
        }
    };

})(YTFilter);
