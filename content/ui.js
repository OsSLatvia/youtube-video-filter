// ui.js - creates the filters button + filter bar and wires UI events
(function(ns) {
    ns.ui = ns.ui || {};

    ns.ui.createFiltersButtonUI = function() {
        if (ns.filtersButtonWrapper) return ns.filtersButtonWrapper;

        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';

        const newButton = document.createElement('button');
        newButton.id = 'custom_filters_button';
        newButton.textContent = ns.NEW_BUTTON_TEXT;
        newButton.classList.add('custom-filters-button');

        wrapper.appendChild(newButton);

        // create filter bar (hidden by default)
        const filterBar = document.createElement('div');
        filterBar.id = 'yt-filter-bar';
        filterBar.style.display = 'none';

        // --- build controls (same structure as your original code) ---
        // age
        const ageGroup = document.createElement('div');
        ageGroup.className = 'filter-group';
        ageGroup.id = 'ageFilterContainer';
        const ageLabel = document.createElement('label');
        ageLabel.htmlFor = 'ageFilter';
        ageLabel.textContent = 'Max Age (days):';
        const ageInput = document.createElement('input');
        ageInput.type = 'number';
        ageInput.id = 'ageFilter';
        ageInput.min = '1';
        ageInput.placeholder = 'e.g., 30';
        ageInput.value = ns.currentMaxAge || '';
        ageGroup.appendChild(ageLabel);
        ageGroup.appendChild(ageInput);

        // views min
        const viewGroup = document.createElement('div');
        viewGroup.className = 'filter-group';
        const viewLabel = document.createElement('label');
        viewLabel.htmlFor = 'viewFilter';
        viewLabel.textContent = 'Min Views:';
        const viewInput = document.createElement('input');
        viewInput.type = 'number';
        viewInput.id = 'viewFilter';
        viewInput.min = '0';
        viewInput.placeholder = 'e.g., 10000';
        viewInput.value = ns.currentMinViews || '';
        viewGroup.appendChild(viewLabel);
        viewGroup.appendChild(viewInput);

        // max views
        const maxViewGroup = document.createElement('div');
        maxViewGroup.className = 'filter-group';
        const maxViewLabel = document.createElement('label');
        maxViewLabel.htmlFor = 'maxViewFilter';
        maxViewLabel.textContent = 'Max Views:';
        const maxViewInput = document.createElement('input');
        maxViewInput.type = 'number';
        maxViewInput.id = 'maxViewFilter';
        maxViewInput.min = '0';
        maxViewInput.placeholder = 'e.g., 10000';
        maxViewInput.value = ns.currentMaxViews || '';
        maxViewGroup.appendChild(maxViewLabel);
        maxViewGroup.appendChild(maxViewInput);

        // min length
        const lengthMinGroup = document.createElement('div');
        lengthMinGroup.className = 'filter-group';
        const lengthMinLabel = document.createElement('label');
        lengthMinLabel.htmlFor = 'lengthMinFilter';
        lengthMinLabel.textContent = 'Min Length (minutes):';
        const lengthMinInput = document.createElement('input');
        lengthMinInput.type = 'number';
        lengthMinInput.id = 'lengthMinFilter';
        lengthMinInput.min = '0';
        lengthMinInput.placeholder = 'e.g., 5';
        lengthMinInput.value = ns.currentMinLength || '';
        lengthMinGroup.appendChild(lengthMinLabel);
        lengthMinGroup.appendChild(lengthMinInput);

        // max length
        const lengthMaxGroup = document.createElement('div');
        lengthMaxGroup.className = 'filter-group';
        const lengthMaxLabel = document.createElement('label');
        lengthMaxLabel.htmlFor = 'lengthMaxFilter';
        lengthMaxLabel.textContent = 'Max Length (minutes):';
        const lengthMaxInput = document.createElement('input');
        lengthMaxInput.type = 'number';
        lengthMaxInput.id = 'lengthMaxFilter';
        lengthMaxInput.min = '0';
        lengthMaxInput.placeholder = 'e.g., 60';
        lengthMaxInput.value = ns.currentMaxLength || '';
        lengthMaxGroup.appendChild(lengthMaxLabel);
        lengthMaxGroup.appendChild(lengthMaxInput);

        // checkboxes: livestreams, playlists, watched, blacklisted, repeat
        function makeCheckbox(id, labelText, checked) {
            const group = document.createElement('div');
            group.className = 'filter-group checkbox-group';
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.id = id;
            input.style.marginRight = '5px';
            input.checked = !!checked;
            const label = document.createElement('label');
            label.htmlFor = id;
            label.style.marginRight = '15px';
            label.textContent = labelText;
            group.appendChild(input);
            group.appendChild(label);
            return group;
        }

        const livestreamsGroup = makeCheckbox('filterLivestreams', 'Remove Livestreams', ns.currentLivestreams);
        const playlistsGroup = makeCheckbox('filterPlaylists', 'Remove Playlists', ns.currentPlaylists);
        const watchedGroup = makeCheckbox('filterWatchedVideos', 'Remove Watched Videos', ns.currentWatchedVideos);
        const blacklistedGroup = makeCheckbox('filterBlacklistedWords', 'Filter Blacklisted Words', ns.currentBlacklistedWords);
        const repeatGroup = makeCheckbox('filterRepeatRecommendation', 'Filter Repeat Recommendations', ns.currentRepeatRecommendation);

        // buttons
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'filter-group';
        const applyOnceButton = document.createElement('button');
        applyOnceButton.id = 'applyOnceFilters';
        applyOnceButton.textContent = 'Apply Filters Once';
        const applyButton = document.createElement('button');
        applyButton.id = 'applyFilters';
        applyButton.textContent = 'Save Filters';
        const resetButton = document.createElement('button');
        resetButton.id = 'resetFilters';
        resetButton.textContent = 'Reset';
        resetButton.style.marginLeft = '10px';

        buttonGroup.appendChild(applyOnceButton);
        buttonGroup.appendChild(applyButton);
        buttonGroup.appendChild(resetButton);

        // assemble
        filterBar.appendChild(ageGroup);
        filterBar.appendChild(viewGroup);
        filterBar.appendChild(maxViewGroup);
        filterBar.appendChild(lengthMinGroup);
        filterBar.appendChild(lengthMaxGroup);
        filterBar.appendChild(livestreamsGroup);
        filterBar.appendChild(playlistsGroup);
        filterBar.appendChild(watchedGroup);
        filterBar.appendChild(blacklistedGroup);
        filterBar.appendChild(repeatGroup);
        filterBar.appendChild(buttonGroup);

        wrapper.appendChild(filterBar);

        // store references
        ns.filtersButtonWrapper = wrapper;
        ns.buttonUI = wrapper;
        ns.maxAgeField = ageGroup;

        // wire basic events (will call functions that should be defined in other modules)
        newButton.addEventListener('click', () => {
            const fb = document.getElementById('yt-filter-bar');
            ns.utils.toggleElementVisibility(fb);
        });

        resetButton.addEventListener('click', () => {
            if (ns.loadStoredFilters) ns.loadStoredFilters();
            if (ns.ui.setInputFieldsToCurrentValuesSafe) ns.ui.setInputFieldsToCurrentValuesSafe();
            if (ns.applyOnceFilters) ns.applyOnceFilters();
        });

        applyButton.addEventListener('click', () => {
            if (ns.applyFilters) ns.applyFilters(true);
        });

        applyOnceButton.addEventListener('click', () => {
            if (ns.applyOnceFilters) ns.applyOnceFilters();
        });

        return wrapper;
    };

    ns.ui.injectFiltersButton = function() {
        const sidebar = document.querySelector(ns.HOME_BUTTON_SELECTOR)?.parentElement;
        if (!sidebar) return;
        if (document.getElementById('custom_filters_button')) return;

        const ui = ns.ui.createFiltersButtonUI();
        sidebar.insertAdjacentElement('beforebegin', ui);
        ns.maxAgeField = document.getElementById('ageFilterContainer');
        if (ns.ui.setInputFieldsToCurrentValuesSafe) ns.ui.setInputFieldsToCurrentValuesSafe();
        ns.utils.updateMaxAgeFieldVisibility(window.location.pathname);
    };

    ns.ui.setInputFieldsToCurrentValuesSafe = function() {
        const filterButton = document.getElementById('custom_filters_button');
        if (!filterButton) return;
        ns.ui.setInputFieldsToCurrentValues();
    };

    ns.ui.setInputFieldsToCurrentValues = function() {
        const el = (id) => document.getElementById(id);
        el('ageFilter').value = ns.currentMaxAge ? parseInt(ns.currentMaxAge) : '';
        el('viewFilter').value = ns.currentMinViews ? parseInt(ns.currentMinViews) : '';
        el('maxViewFilter').value = ns.currentMaxViews ? parseInt(ns.currentMaxViews) : '';
        el('lengthMinFilter').value = ns.currentMinLength ? parseFloat(ns.currentMinLength) : '';
        el('lengthMaxFilter').value = ns.currentMaxLength ? parseFloat(ns.currentMaxLength) : '';
        el('filterLivestreams').checked = (ns.currentLivestreams === true);
        el('filterPlaylists').checked = (ns.currentPlaylists === true);
        el('filterWatchedVideos').checked = (ns.currentWatchedVideos === true);
        el('filterBlacklistedWords').checked = (ns.currentBlacklistedWords === true);
        el('filterRepeatRecommendation').checked = (ns.currentRepeatRecommendation === true);
    };

})(YTFilter);
