const NEW_BUTTON_TEXT = 'Filters'; // Text for the new button
const HOME_BUTTON_SELECTOR = 'ytd-guide-section-renderer.style-scope:nth-child(1) > div:nth-child(2) > ytd-guide-entry-renderer:nth-child(1) > a:nth-child(1)'; // Updated selector for the Home button

// Ensure the script runs only on YouTube
if (window.location.hostname === 'www.youtube.com') {
    // Immediately call initYouTubeFilter
    initYouTubeFilter();

    // Variables to hold current filter values
    let currentMaxAge = null;
    let currentMinViews = null;

    // Mutation observer instance (defined globally so we can start/stop it)
    let domObserver = null;

    // Function to initialize the YouTube Filter extension
    function initYouTubeFilter() {
        // Wait for the sidebar to load, then inject the Filters button
        waitForSidebarToLoad();
    }

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
        if (document.getElementById('custom_filters_button')) {
            return; // Button already exists, do nothing
        }

        const sidebar = document.querySelector(HOME_BUTTON_SELECTOR)?.parentElement;
        if (sidebar) {
            const buttonWrapper = document.createElement('div');
            buttonWrapper.style.display = 'flex';
            buttonWrapper.style.flexDirection = 'column';

            const newButton = document.createElement('button');
            newButton.id = 'custom_filters_button';
            newButton.textContent = NEW_BUTTON_TEXT;

            const computedStyle = window.getComputedStyle(sidebar);
            newButton.style.cssText = `
                background-color: ${computedStyle.backgroundColor};
                color: ${computedStyle.color};
                border: ${computedStyle.border};
                padding: ${computedStyle.padding};
                margin: ${computedStyle.margin};
                cursor: pointer;
                font-size: ${computedStyle.fontSize};
                font-weight: ${computedStyle.fontWeight};
                display: flex;
                align-items: center;
                margin-bottom: 10px;
            `;

            buttonWrapper.appendChild(newButton);
            sidebar.insertAdjacentElement('beforebegin', buttonWrapper);

            newButton.addEventListener('click', () => {
                injectFilterBar(buttonWrapper); // Show/hide the filter bar on button click
            });
        }
    }

    // Inject the filter bar into the YouTube page
    function injectFilterBar(buttonWrapper) {
        let filterBar = document.getElementById('yt-filter-bar');
        if (!filterBar) {
            filterBar = document.createElement('div');
            filterBar.id = 'yt-filter-bar';
            filterBar.style.cssText = `
                display: flex;
                flex-direction: column;
                background-color: #f1f1f1;
                padding: 10px;
                border-bottom: 1px solid #ccc;
                position: relative;
                z-index: 1000;
            `;

            filterBar.innerHTML = `
                <div>
                    <label for="ageFilter">Max Age (days):</label>
                    <input type="number" id="ageFilter" min="1" placeholder="e.g., 30">
                </div>
                <div>
                    <label for="viewFilter">Min Views:</label>
                    <input type="number" id="viewFilter" min="0" placeholder="e.g., 10000">
                </div>
                <div>
                    <button id="applyFilters">Apply Filters</button>
                    <button id="resetFilters" style="margin-left: 10px;">Reset</button>
                </div>
            `;

            buttonWrapper.appendChild(filterBar);

            document.getElementById('resetFilters').addEventListener('click', () => {
                document.getElementById('ageFilter').value = '';
                document.getElementById('viewFilter').value = '';
                currentMaxAge = null;
                currentMinViews = null;
                stopObservingDOMChanges(); // Stop observing when filters are cleared
                filterRecommendations(currentMaxAge, currentMinViews);
                filterBar.style.display = 'none';
            });

            document.getElementById('applyFilters').addEventListener('click', () => {
                const maxAge = document.getElementById('ageFilter').value;
                const minViews = document.getElementById('viewFilter').value;
                currentMaxAge = maxAge ? parseInt(maxAge) : null;
                currentMinViews = minViews ? parseInt(minViews) : null;

                if (currentMaxAge !== null || currentMinViews !== null) {
                    startObservingDOMChanges(); // Start observing only when filters are applied
                }

                filterRecommendations(currentMaxAge, currentMinViews);
            });
        } else {
            filterBar.style.display = filterBar.style.display === 'none' ? 'flex' : 'none';
        }
    }

    // Function to filter recommendations based on age and views
    function filterRecommendations(maxAge, minViews) {
        const videoItems = document.querySelectorAll('#dismissible');
        videoItems.forEach((item) => {
            const metadataLine = item.querySelector('#metadata-line');
            const viewsElement = metadataLine ? metadataLine.querySelector('span.inline-metadata-item:nth-of-type(1)') : null;
            const dateElement = metadataLine ? metadataLine.querySelector('span.inline-metadata-item:nth-of-type(2)') : null;

            if (viewsElement && dateElement) {
                const videoAgeInDays = parseVideoAge(dateElement.textContent);
                const videoViews = parseVideoViews(viewsElement.textContent);

                const parentContainer = item.closest('ytd-rich-item-renderer');
                if (parentContainer) {
                    if ((maxAge && videoAgeInDays > maxAge) || (minViews && videoViews < minViews)) {
                        parentContainer.style.display = 'none';
                    } else {
                        parentContainer.style.display = '';
                    }
                }
            }
        });
    }

    // Helper function to parse video age (in days)
    function parseVideoAge(ageText) {
        const days = { 'day': 1, 'week': 7, 'month': 30, 'year': 365 };
        let match = ageText.match(/(\d+)\s+(day|week|month|year)s?/);
        return match ? parseInt(match[1]) * days[match[2]] : 0;
    }

    // Helper function to parse views
    function parseVideoViews(viewsText) {
        if (viewsText.includes('K')) {
            return parseFloat(viewsText.replace('K', '').replace(',', '')) * 1000;
        } else if (viewsText.includes('M')) {
            return parseFloat(viewsText.replace('M', '').replace(',', '')) * 1000000;
        } else {
            return parseInt(viewsText.replace(',', ''));
        }
    }

    // Start observing DOM changes only when filters are applied
    function startObservingDOMChanges() {
        if (domObserver) return; // Prevent multiple observers

        domObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' || mutation.type === 'subtree') {
                    filterRecommendations(currentMaxAge, currentMinViews); // Apply filters to new elements
                }
            });
        });

        domObserver.observe(document.body, { childList: true, subtree: true });
    }

    // Stop observing DOM changes when filters are cleared
    function stopObservingDOMChanges() {
        if (domObserver) {
            domObserver.disconnect(); // Stop the observer
            domObserver = null; // Clear observer reference
        }
    }
}
