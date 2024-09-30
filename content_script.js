const NEW_BUTTON_TEXT = 'Filters'; // Text for the new button
const HOME_BUTTON_SELECTOR = 'ytd-guide-section-renderer.style-scope:nth-child(1) > div:nth-child(2) > ytd-guide-entry-renderer:nth-child(1) > a:nth-child(1)'; // Updated selector for the Home button

// Ensure the script runs only on YouTube
if (window.location.hostname === 'www.youtube.com') {
    // Immediately call initYouTubeFilter
    initYouTubeFilter();

    // Variables to hold current filter values
    let currentMaxAge = null;
    let currentMinViews = null;
    let currentMinLength = null; // New variable for min video length in minutes
    let currentMaxLength = null; // New variable for max video length in minutes

    // Global iteration counter to track the last filtered video
    let lastProcessedIndex = 0;

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
            newButton.classList.add('custom-filters-button');
            const computedStyle = window.getComputedStyle(sidebar);

            buttonWrapper.appendChild(newButton);
            sidebar.insertAdjacentElement('beforebegin', buttonWrapper);

            newButton.addEventListener('click', () => {
                injectFilterBar(buttonWrapper); // Show/hide the filter bar on button click
            });
        }
    }

    // Inject the filter bar into the YouTube page
// Inject the filter bar into the YouTube page
function injectFilterBar(buttonWrapper) {
    let filterBar = document.getElementById('yt-filter-bar');
    if (!filterBar) {
        filterBar = document.createElement('div');
        filterBar.id = 'yt-filter-bar';

        filterBar.innerHTML = `
            <div class="filter-group">
                <label for="ageFilter">Max Age (days):</label>
                <input type="number" id="ageFilter" min="1" placeholder="e.g., 30">
            </div>
            <div class="filter-group">
                <label for="viewFilter">Min Views:</label>
                <input type="number" id="viewFilter" min="0" placeholder="e.g., 10000">
            </div>
            <div class="filter-group">
                <label for="lengthMinFilter">Min Length (minutes):</label>
                <input type="number" id="lengthMinFilter" min="0" placeholder="e.g., 5">
            </div>
            <div class="filter-group">
                <label for="lengthMaxFilter">Max Length (minutes):</label>
                <input type="number" id="lengthMaxFilter" min="0" placeholder="e.g., 60">
            </div>
            <div class="filter-group checkbox-group">
                <input type="checkbox" id="filterLivestreams" style="margin-right: 5px;">
                <label for="filterLivestreams" style="margin-right: 15px;">Remove Livestreams</label>
            </div>
            <div class="filter-group checkbox-group">
                <input type="checkbox" id="filterPlaylists" style="margin-right: 5px;">
                <label for="filterPlaylists" style="margin-right: 15px;">Remove Playlists</label>
            </div>
            <div class="filter-group">
                <button id="applyFilters">Apply Filters</button>
                <button id="resetFilters" style="margin-left: 10px;">Reset</button>
            </div>
        `;

        buttonWrapper.appendChild(filterBar);

        document.getElementById('resetFilters').addEventListener('click', () => {
            document.getElementById('ageFilter').value = '';
            document.getElementById('viewFilter').value = '';
            document.getElementById('lengthMinFilter').value = '';
            document.getElementById('lengthMaxFilter').value = '';
            document.getElementById('filterLivestreams').checked = false;
            document.getElementById('filterPlaylists').checked = false;
            currentMaxAge = null;
            currentMinViews = null;
            currentMinLength = null;
            currentMaxLength = null;
            lastProcessedIndex = 0; // Reset the counter
            stopObservingDOMChanges(); // Stop observing when filters are cleared
            filterRecommendations(currentMaxAge, currentMinViews, currentMinLength, currentMaxLength);
            filterBar.style.display = 'none';
        });

        document.getElementById('applyFilters').addEventListener('click', () => {
            const maxAge = document.getElementById('ageFilter').value;
            const minViews = document.getElementById('viewFilter').value;
            const minLength = document.getElementById('lengthMinFilter').value;
            const maxLength = document.getElementById('lengthMaxFilter').value;
            const filterLivestreams = document.getElementById('filterLivestreams').checked;
            const filterPlaylists = document.getElementById('filterPlaylists').checked;

            currentMaxAge = maxAge ? parseInt(maxAge) : null;
            currentMinViews = minViews ? parseInt(minViews) : null;
            currentMinLength = minLength ? parseFloat(minLength) : null; // Convert to minutes
            currentMaxLength = maxLength ? parseFloat(maxLength) : null; // Convert to minutes

            lastProcessedIndex = 0; // Reset the counter
            if (currentMaxAge !== null || currentMinViews !== null || currentMinLength !== null || currentMaxLength !== null || filterLivestreams || filterPlaylists) {
                startObservingDOMChanges(); // Start observing only when filters are applied
            }

            filterRecommendations(currentMaxAge, currentMinViews, currentMinLength, currentMaxLength, filterLivestreams, filterPlaylists);
        });
    } else {
        filterBar.style.display = filterBar.style.display === 'none' ? 'flex' : 'none';
    }
}


    // Function to filter recommendations based on age, views, and video length
    function filterRecommendations(maxAge, minViews, minLength, maxLength, removeLivestreams, removePlaylists) {
        const videoItems = document.querySelectorAll('#dismissible'); // All video items
        // Only process videos starting from the last processed index
        for (let i = lastProcessedIndex; i < videoItems.length; i++) {
            const item = videoItems[i];
            const metadataLine = item.querySelector('#metadata-line');
            const viewsElement = metadataLine ? metadataLine.querySelector('span.inline-metadata-item:nth-of-type(1)') : null;
            const dateElement = metadataLine ? metadataLine.querySelector('span.inline-metadata-item:nth-of-type(2)') : null;
            const timeElement = item.querySelector('ytd-thumbnail-overlay-time-status-renderer #text');

            // Check if it's a livestream
            const liveBadge = item.querySelector('.badge-style-type-live-now-alternate');

            // Check for "Mix" playlist label
            const playlistLabel = item.querySelector('ytd-thumbnail-overlay-bottom-panel-renderer yt-formatted-string');

            // Skip this item if it's a livestream and the checkbox is checked
            if (liveBadge) {
                if (removeLivestreams){
                    const parentContainer = item.closest('ytd-rich-item-renderer');
                    if (parentContainer) {
                        parentContainer.style.display = 'none'; // Hide livestreams
                    }
                }
                else {
                    const parentContainer = item.closest('ytd-rich-item-renderer');
                    if (parentContainer) {
                        parentContainer.style.display = ''; // Hide livestreams
                    }
                }
                continue;
            }
            // Check if the item is a playlist (Mix) and the checkbox is checked
            if (playlistLabel && playlistLabel.textContent.trim() === 'Mix') {
                const parentContainer = item.closest('ytd-rich-item-renderer');
                if (removePlaylists) {
                    if (parentContainer) {
                        parentContainer.style.display = 'none'; // Hide playlists
                    }
                } else {
                    if (parentContainer) {
                        parentContainer.style.display = ''; // Show playlists
                    }
                }
                continue; // Skip further processing for playlists
            }

            if (viewsElement && dateElement && timeElement) {
                const videoAgeInDays = parseVideoAge(dateElement.textContent);
                const videoViews = parseVideoViews(viewsElement.textContent);
                const videoLengthInMinutes = parseVideoLength(timeElement.textContent);
                // console.log("timeElement: " + timeElement.textContent.trim() + "  -  video in minutes: " + videoLengthInMinutes);
                const parentContainer = item.closest('ytd-rich-item-renderer');
                if (parentContainer) {
                    if ((maxAge && videoAgeInDays > maxAge) || 
                        (minViews && videoViews < minViews) || 
                        (minLength && videoLengthInMinutes < minLength) || 
                        (maxLength && videoLengthInMinutes > maxLength)) {
                        parentContainer.style.display = 'none';
                    } else {
                        parentContainer.style.display = '';
                    }
                }
            }
        }
        // Update the counter after processing all new videos
        lastProcessedIndex = videoItems.length;
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
    if (domObserver) return; // Prevent multiple observers

    domObserver = new MutationObserver((mutations) => {
        let dismissibleCount = 0; // Initialize a counter for added #dismissible nodes

        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Loop through added nodes
                mutation.addedNodes.forEach((node) => {
                    // Check if the node is an element and matches the #dismissible selector
                    if (node.nodeType === Node.ELEMENT_NODE && node.matches('#dismissible')) {
                        dismissibleCount++; // Increment the count for #dismissible nodes
                    }
                });

                // If any #dismissible nodes were added, filter the recommendations
                if (dismissibleCount > 0) {
                    filterRecommendations(currentMaxAge, currentMinViews, currentMinLength, currentMaxLength, 
                                          document.getElementById('filterLivestreams').checked, 
                                          document.getElementById('filterPlaylists').checked);
                }
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
