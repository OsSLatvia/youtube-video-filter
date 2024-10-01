const NEW_BUTTON_TEXT = 'Filters'; // Text for the new button
const HOME_BUTTON_SELECTOR = 'ytd-guide-section-renderer.style-scope:nth-child(1) > div:nth-child(2) > ytd-guide-entry-renderer:nth-child(1) > a:nth-child(1)'; // Updated selector for the Home button

// Ensure the script runs only on YouTube
if (window.location.hostname === 'www.youtube.com') {
    let lastPath = window.location.pathname;
    // Variables to hold current filter values
    let areFiltersSet = false;
    let currentMaxAge = null;
    let currentMinViews = null;
    let currentMinLength = null; 
    let currentMaxLength = null; 
    let currentLivestreams = null;
    let currentPlaylists = null;
    if (window.location.pathname == '/') {
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
        const storedMinLength = localStorage.getItem('ytMinLength');
        const storedMaxLength = localStorage.getItem('ytMaxLength');
        const storedLivestreams = localStorage.getItem('ytRemoveLivestreams');
        const storedPlaylists = localStorage.getItem('ytRemovePlaylists');
        if (storedMaxAge) currentMaxAge = parseInt(storedMaxAge);
        if (storedMinViews) currentMinViews = parseInt(storedMinViews);
        if (storedMinLength) currentMinLength = parseFloat(storedMinLength);
        if (storedMaxLength) currentMaxLength = parseFloat(storedMaxLength);

        // Set the currentLivestreams and currentPlaylists only if stored as 'true'
        currentLivestreams = storedLivestreams === 'true';  // Default to false if not stored
        currentPlaylists = storedPlaylists === 'true';  // Default to false if not stored
    }

    function saveFilters() {
        localStorage.setItem('ytMaxAge', currentMaxAge);
        localStorage.setItem('ytMinViews', currentMinViews);
        localStorage.setItem('ytMinLength', currentMinLength);
        localStorage.setItem('ytMaxLength', currentMaxLength);
        localStorage.setItem('ytRemoveLivestreams', currentLivestreams);
        localStorage.setItem('ytRemovePlaylists', currentPlaylists);
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
            // const computedStyle = window.getComputedStyle(sidebar);
            buttonWrapper.appendChild(newButton);
            sidebar.insertAdjacentElement('beforebegin', buttonWrapper);
            
            injectFilterBar(buttonWrapper); // create the filter bar 
            newButton.addEventListener('click', () => {
                let filterBar = document.getElementById('yt-filter-bar');
                toggleElementVisibility(filterBar);
            });

        }
    }

    // Inject the filter bar into the YouTube page
    function injectFilterBar(buttonWrapper) {
            filterBar = document.createElement('div');
            filterBar.id = 'yt-filter-bar';
            filterBar.style.display = 'none';

            filterBar.innerHTML = `
            <div class="filter-group" id="ageFilterContainer">
                <label for="ageFilter">Max Age (days):</label>
                <input type="number" id="ageFilter" min="1" placeholder="e.g., 30" value="${currentMaxAge || ''}">
            </div>
            <div class="filter-group">
                <label for="viewFilter">Min Views:</label>
                <input type="number" id="viewFilter" min="0" placeholder="e.g., 10000" value="${currentMinViews || ''}">
            </div>
            <div class="filter-group">
                <label for="lengthMinFilter">Min Length (minutes):</label>
                <input type="number" id="lengthMinFilter" min="0" placeholder="e.g., 5" value="${currentMinLength || ''}">
            </div>
            <div class="filter-group">
                <label for="lengthMaxFilter">Max Length (minutes):</label>
                <input type="number" id="lengthMaxFilter" min="0" placeholder="e.g., 60" value="${currentMaxLength || ''}">
            </div>
            <div class="filter-group checkbox-group">
                <input type="checkbox" id="filterLivestreams" style="margin-right: 5px;" ${currentLivestreams ? 'checked' : ''}>
                <label for="filterLivestreams" style="margin-right: 15px;">Remove Livestreams</label>
            </div>
            <div class="filter-group checkbox-group">
                <input type="checkbox" id="filterPlaylists" style="margin-right: 5px;" ${currentPlaylists ? 'checked' : ''}>
                <label for="filterPlaylists" style="margin-right: 15px;">Remove Playlists</label>
            </div>
            <div class="filter-group">
                <button id="applyFilters">Apply Filters</button>
                <button id="resetFilters" style="margin-left: 10px;">Reset</button>
            </div>
        `;

            buttonWrapper.appendChild(filterBar);
            if ((currentMaxAge !== null && window.location.pathname == '/') || currentMinViews !== null || currentMinLength !== null || currentMaxLength !== null || currentLivestreams || currentPlaylists) {
                areFiltersSet = true;
            }
            else{
                areFiltersSet = false;
            }
            startObservingDOMChanges();
            applyFilters();
            

            document.getElementById('resetFilters').addEventListener('click', resetFilters);

            document.getElementById('applyFilters').addEventListener('click', applyFilters);
    }

    function findAllVideos(dom){
        let videoItems = dom.querySelectorAll('#dismissible'); // All video items
        return videoItems;
    }
    function findAllMutationVideos(mutations) {
        let videoItems = [];
    
        mutations.forEach(mutation => {
            // Check if there are added nodes
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach(node => {
                    // Ensure the node is an element and has the ID 'dismissible'
                    if (node.nodeType === 1 && node.id === 'dismissible') {
                        videoItems.push(node);
                    }
                });
            }
        });
        return videoItems;
    }


    function checkAndCallFilters(videos, currentMaxAge, currentMinViews, currentMinLength, currentMaxLength, currentLivestreams, currentPlaylists){
        let allVideos = videos
        filterRecommendations(allVideos, currentMaxAge, currentMinViews, currentMinLength, currentMaxLength, currentLivestreams, currentPlaylists);

    }
    // Function to filter recommendations based on age, views, and video length
    function filterRecommendations(videoItems, maxAge, minViews, minLength, maxLength, removeLivestreams, removePlaylists) {
        
        // let videoItems = findAllVideos();
        let hiddenVideos=0;
        let shownVideos=0;
        // Only process videos starting from the last processed index
        for (let i = 0; i < videoItems.length; i++) {
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
                        hiddenVideos= hiddenVideos + hideElement(parentContainer);
                        // parentContainer.style.display = 'none'; // Hide livestreams
                    }
                }
                else {
                    const parentContainer = item.closest('ytd-rich-item-renderer');
                    if (parentContainer) {
                        shownVideos= shownVideos + showElement(parentContainer);
                        // parentContainer.style.display = ''; // Hide livestreams
                    }
                }
                continue;
            }
            // Check if the item is a playlist (Mix) and the checkbox is checked
            if (playlistLabel) {
                const parentContainer = item.closest('ytd-rich-item-renderer');
                if (removePlaylists) {
                    if (parentContainer) {
                        hiddenVideos= hiddenVideos + hideElement(parentContainer);
                        // parentContainer.style.display = 'none'; // Hide playlists
                    }
                } else {
                    if (parentContainer) {
                        shownVideos= shownVideos + showElement(parentContainer);
                        // parentContainer.style.display = ''; // Show playlists
                    }
                }
                continue; // Skip further processing for playlists
            }

            if (viewsElement && dateElement && timeElement) {
                const videoAgeInDays = parseVideoAge(dateElement.textContent);
                const videoViews = parseVideoViews(viewsElement.textContent);
                const videoLengthInMinutes = parseVideoLength(timeElement.textContent);
                const parentContainer = item.closest('ytd-rich-item-renderer');
                if (parentContainer) {
                    if ((maxAge && videoAgeInDays > maxAge) || 
                        (minViews && videoViews < minViews) || 
                        (minLength && videoLengthInMinutes < minLength) || 
                        (maxLength && videoLengthInMinutes > maxLength)) {
                            hiddenVideos= hiddenVideos + hideElement(parentContainer);
                            // parentContainer.style.display = 'none';
                    } 
                    else {
                        shownVideos= shownVideos + showElement(parentContainer);
                        // parentContainer.style.display = '';
                    }
                }
            }
            
        }
        // Update the counter after processing all new videos
        // lastProcessedIndex = videoItems.length;
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
        
        // Prevent multiple observers if already observing
        if (domObserver) return; 
        
        let maxAgeField = document.getElementById('ageFilterContainer'); 
        // Create a new MutationObserver instance
        domObserver = new MutationObserver((mutations) => {
            // Check if the path has changed
            let newDismissibleCount= 0;
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && node.id === 'dismissible') {
                        newDismissibleCount++;
                    }
                });
            });
            

                if (window.location.pathname !== '/') { //if not on home tab
                    if (lastPath !=window.location.pathname){
                        // resetProcessedIndex(); 
                        // lastProcessedIndex = 0;
                        resetFilters();
                        lastPath = window.location.pathname;
                    }
                    hideElement(maxAgeField);
                    // maxAgeField.style.display = 'none'// Hide the age filter container
                    if (areFiltersSet && newDismissibleCount>0){
                        checkAndCallFilters(findAllMutationVideos(mutations), null, currentMinViews, currentMinLength, currentMaxLength, currentLivestreams, currentPlaylists);
                    }
                }
                else {//if on home tab
                    if (lastPath !=window.location.pathname){
                        showElement(maxAgeField);
                        // maxAgeField.style.display = '' // Show the age filter container
                        lastPath = window.location.pathname;
                        // resetProcessedIndex();
                        // lastProcessedIndex = 0;
                        loadStoredFilters();
                        setInputFieldsToStoredValues();
                        applyFilters();
                        if ((currentMaxAge !== null && window.location.pathname == '/') || currentMinViews !== null || currentMinLength !== null || currentMaxLength !== null || currentLivestreams || currentPlaylists) {
                            areFiltersSet = true;
                        }
                        else{
                            areFiltersSet = false;
                        }
                    }
                    
                    // Call the filter recommendations function
                    if (areFiltersSet && newDismissibleCount>0){
                        checkAndCallFilters(findAllMutationVideos(mutations), currentMaxAge, currentMinViews, currentMinLength, currentMaxLength, currentLivestreams, currentPlaylists);
                    }
                }
            
        });
        
        // Start observing the body for changes
        domObserver.observe(document.body, { childList: true, subtree: true });
    }
    function setInputFieldsToStoredValues() {
        const storedMaxAge = localStorage.getItem('ytMaxAge');
        const storedMinViews = localStorage.getItem('ytMinViews');
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

        document.getElementById('filterLivestreams').checked = (storedLivestreams === 'true');
        document.getElementById('filterPlaylists').checked = (storedPlaylists === 'true');

    }
    // Function to reset all filters
    function resetFilters() {
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
        currentLivestreams = null;
        currentPlaylists = null;
        // resetProcessedIndex();
        // lastProcessedIndex = 0; // Reset the counter
        areFiltersSet = false;

        if (window.location.pathname === '/') {
            localStorage.clear(); // Clear saved filter settings if on home
        }
        checkAndCallFilters(findAllVideos(document), currentMaxAge, currentMinViews, currentMinLength, currentMaxLength, currentLivestreams, currentPlaylists);
    }

    // Function to apply filters
    function applyFilters() {
        // resetProcessedIndex() 
        // lastProcessedIndex = 0; // Reset the counter
        const maxAge = document.getElementById('ageFilter').value;
        const minViews = document.getElementById('viewFilter').value;
        const minLength = document.getElementById('lengthMinFilter').value;
        const maxLength = document.getElementById('lengthMaxFilter').value;
        const filterLivestreams = document.getElementById('filterLivestreams').checked;
        const filterPlaylists = document.getElementById('filterPlaylists').checked;

        currentMaxAge = maxAge ? parseInt(maxAge) : null;
        currentMinViews = minViews ? parseInt(minViews) : null;
        currentMinLength = minLength ? parseFloat(minLength) : null;
        currentMaxLength = maxLength ? parseFloat(maxLength) : null;
        currentLivestreams = filterLivestreams;
        currentPlaylists = filterPlaylists;

        if (window.location.pathname === '/') {
            saveFilters(); // Save filter options to localStorage only on home tab
        }
        

        // Check if filters are set
        areFiltersSet = (currentMaxAge !== null && window.location.pathname === '/') || currentMinViews !== null || currentMinLength !== null || currentMaxLength !== null || currentLivestreams || currentPlaylists;
        startObservingDOMChanges(); // Start observing changes

        // Call filter recommendations function here if needed
        checkAndCallFilters(findAllVideos(document), currentMaxAge, currentMinViews, currentMinLength, currentMaxLength, currentLivestreams, currentPlaylists);
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
    // function resetProcessedIndex() {
    //     lastProcessedIndex = 0;
    // }


    
    // Stop observing DOM changes when filters are cleared
    function stopObservingDOMChanges() {
        if (domObserver) {
            domObserver.disconnect(); // Stop the observer
            domObserver = null; // Clear observer reference
        }
    }
}
