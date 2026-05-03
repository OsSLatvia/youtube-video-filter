// utils.js - parsing helpers and DOM helpers
(function(ns) {
    ns.utils = ns.utils || {};

    // =========================
    // SELECTORS CONFIG
    // =========================
    ns.selectors = {
        video: {
            homepage: 'ytd-rich-item-renderer',
            search: 'ytd-video-renderer',
            subscriptions: 'ytd-rich-item-renderer',
            channel: 'ytd-rich-item-renderer',
            watch: 'yt-lockup-view-model',
            fallback: '#dismissible'
        },
        badges: {
            /*container: 'yt-thumbnail-overlay-badge-view-model',
            text: '.yt-badge-shape__text' */ //old selectors
            container: 'yt-thumbnail-badge-view-model',
            text: '.ytBadgeShapeText'
        },
        overlays: {
            //watched: 'yt-thumbnail-overlay-progress-bar-view-model'
            watched: 'yt-thumbnail-overlay-progress-bar-view-model'
        },
        metadata: {
            /*container: 'yt-lockup-metadata-view-model',
            views: 'div:nth-of-type(2) > span[role="text"]:nth-of-type(1)',
            date: 'div:nth-of-type(2) > span[role="text"]:nth-of-type(3)' */
            //bigContainer: 'yt-lockup-metadata-view-model',
            container: 'yt-content-metadata-view-model',
        },
        title: '[title]'
    };

    // =========================
    // VIDEO SELECTORS BY PATH
    // =========================
    ns.utils.getVideoSelectorByPath = function() {
        const path = window.location.pathname;
        const s = ns.selectors.video;

        if (path === '/') return s.homepage;
        if (path.startsWith('/results')) return s.search;
        if (path.startsWith('/feed/subscriptions')) return s.subscriptions;
        if (path.startsWith('/@') || path.startsWith('/channel/')) return s.channel;
        if (path.startsWith('/watch')) return s.watch;

        return s.fallback;
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

    // =========================
    // PARSERS
    // =========================
    ns.utils.parseVideoAge = function(ageText) {
        const lang = (ns.userLanguage || 'en').split('-')[0];
        let units = ns.timeUnits[lang];

        if (!units) {
            console.error(`Unsupported language: ${lang}, fallback to en`);
            units = ns.timeUnits['en'];
        }

        const unitRegex = Object.keys(units)
            .map(u => u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            .join('|');

        const regex = new RegExp(`(\\d+)\\s+(${unitRegex})s?`, 'i');
        let match = (ageText || '').match(regex);

        return match
            ? parseInt(match[1], 10) * units[match[2].toLowerCase()]
            : 0;
    };

    ns.utils.parseVideoViews = function(viewsText) {
        const lang = (ns.userLanguage || 'en').split('-')[0];
        let units = ns.abbreviations[lang];
        if (!units) {
            console.error(`Unsupported language: ${lang}, fallback to en`);
            units = ns.abbreviations['en'];
        }

        if (!viewsText) return 0;

        const text = viewsText.trim().toLowerCase();

        if (text.includes(units.thousand.toLowerCase())) {
            return parseFloat(text.replace(units.thousand, '').replace(',', '.')) * 1000;
        } else if (text.includes(units.million.toLowerCase())) {
            return parseFloat(text.replace(units.million.toLowerCase(), '').replace(',', '.')) * 1000000;
        } else {
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

    // =========================
    // DOM HELPERS
    // =========================
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

    // =========================
    // VIDEO STATE HELPERS
    // =========================
    ns.utils.isLivestream = function(item) {
        const badge = item.querySelector(ns.selectors.badges.container);
        if (!badge) return false;

        const lang = (ns.userLanguage || 'en').split('-')[0];
        const badges = ns.badges[lang] || ns.badges['en'];
        const liveText = badges.liveBadge.toLowerCase();

        return badge.textContent.trim().toLowerCase().includes(liveText);
    };

    ns.utils.isWatched = function(item) {
        return !!item.querySelector(ns.selectors.overlays.watched);
    };

    ns.utils.getVideoTitle = function(item) {
        const el = item.querySelector(ns.selectors.title);
        return el ? el.getAttribute("title").trim() : '';
    };

    ns.utils.isPlaylist = function(item) {
        const badge = item.querySelector(ns.selectors.badges.container);
        if (!badge) return false;

        const lang = (ns.userLanguage || 'en').split('-')[0];
        const badges = ns.badges[lang] || ns.badges['en'];
        const playlistText = badges.playlistBadge.toLowerCase();

        return badge.textContent.trim().toLowerCase().includes(playlistText);
    };

    ns.utils.getViewsElement = function(item) {
        const meta = item.querySelector(ns.selectors.metadata.container);
        if (!meta) return null;

        const spans = meta.querySelectorAll('span[role="text"]');

        const lang = (ns.userLanguage || 'en').split('-')[0];
        const units = ns.timeUnits[lang] || ns.timeUnits['en'];
        const keywords = Object.keys(units).map(k => k.toLowerCase());

        for (const span of spans) {
            const text = (span.textContent || '').trim();
            if (!text) continue;

            const lower = text.toLowerCase();

            const hasNumber = /\d/.test(lower);

            const isTime =
                lower.includes('ago') ||
                keywords.some(k => lower.includes(k));

            if (hasNumber && !isTime) {
                return text;
            }
        }

        return null;
    };

    ns.utils.getDateElement = function(item) {
        const meta = item.querySelector(ns.selectors.metadata.container);
        if (!meta) return null;

        const spans = meta.querySelectorAll('span[role="text"]');

        const lang = (ns.userLanguage || 'en').split('-')[0];
        const units = ns.timeUnits[lang] || ns.timeUnits['en'];
        const keywords = Object.keys(units).map(k => k.toLowerCase());

        for (const span of spans) {
            const text = (span.textContent || '').trim();
            if (!text) continue;

            const lower = text.toLowerCase();

            const isTime =
                lower.includes('ago') ||
                keywords.some(k => lower.includes(k));

            if (isTime) return text;
        }

        return null;
    };

    ns.utils.getTimeElement = function(item) {
        const el = item.querySelector(ns.selectors.badges.text);
        return el ? el.textContent.trim() : null;
    };

    // =========================
    // ASYNC HELPERS
    // =========================
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

    // =========================
    // PATH / SETTINGS HELPERS
    // =========================
    ns.utils.allowedPath = function(path) {
        return (
            path === '/' ||
            path.startsWith('/results') ||
            path.startsWith('/watch')
        );
    };

    ns.utils.isFilterEnabledForPath = function(path) {
        if (path === '/') return ns.generalSettings.homepage;
        if (path.startsWith('/results')) return ns.generalSettings.videoSearch;
        if (path.startsWith('/feed/subscriptions')) return ns.generalSettings.subscriptions;
        if (path.startsWith('/@')) return ns.generalSettings.channel;
        if (path.startsWith('/watch')) return ns.generalSettings.sidebarRecommendations;
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

        if (
            path === '/' ||
            path.startsWith('/watch') ||
            path.startsWith('/results')
        ) {
            ns.utils.showElement(ns.maxAgeField);
        } else {
            ns.utils.hideElement(ns.maxAgeField);
        }
    };

})(YTFilter);