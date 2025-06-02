<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gaza - Every Confirmed Death Since Oct 7th 2023</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: 'Inter', sans-serif; }
        .victim-item {
            opacity: 0;
            transform: translateY(-20px); 
            transition: opacity 1.2s ease-out, transform 1.2s ease-out; 
        }
        .victim-item.revealed {
            opacity: 1;
            transform: translateY(0);
        }
        #message-box-container {
            transition: opacity 0.5s ease-in-out;
            opacity: 0; display: none;
            position: fixed; bottom: 10px; left: 50%;
            transform: translateX(-50%); z-index: 1000; 
        }
        
        #victims-area {
            position: relative; 
            overflow: hidden; 
        }

        #victims-area::before { /* Top fade */
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0; 
            width: 100%;
            height: 60px; 
            background: linear-gradient(to bottom, rgba(17, 24, 39, 1) 20%, rgba(17, 24, 39, 0) 100%);
            z-index: 10; 
            pointer-events: none; 
        }

        #victims-area::after { /* Bottom fade */
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0; 
            width: 100%;
            height: 60px; 
            background: linear-gradient(to top, rgba(17, 24, 39, 1) 20%, rgba(17, 24, 39, 0) 100%);
            z-index: 10; 
            pointer-events: none;
        }

        /* Updated Sticker Styles - initially hidden */
        #stats-sticker {
            position: fixed;
            top: 50%;
            right: 20px; 
            transform: translateY(-50%);
            background-color: rgba(248, 113, 113, 0.9); 
            color: #FFFFFF; 
            width: 160px;  
            height: 160px; 
            border-radius: 50%; 
            box-shadow: 0 6px 15px rgba(0,0,0,0.4); 
            z-index: 1000;
            display: none;  /* Changed to none to hide it by default */
            align-items: center; 
            justify-content: center; 
            text-align: center;
            font-size: 0.875rem; 
            font-weight: bold; 
            border: 2px solid rgba(239, 68, 68, 0.9); 
            padding: 10px; 
            box-sizing: border-box; 
        }
        #sticker-text-content {
            opacity: 1;
            transition: opacity 1.0s ease-in-out; 
            max-width: 90%; 
        }
        #sticker-text-content.fading-out {
            opacity: 0;
        }
    </style>
</head>
<body class="bg-gray-900 text-gray-100 flex flex-col items-center min-h-screen p-2 sm:p-4">
    <div id="app-container" class="w-full max-w-3xl mx-auto flex flex-col h-full flex-grow">
        <header class="text-center py-4 sm:py-6">
            <h1 class="text-3xl sm:text-4xl font-bold text-red-400">Gaza - Every Confirmed Death Since Oct 7th 2023</h1>
        </header>

        <div id="loading-indicator" class="text-center py-10 flex-grow flex flex-col justify-center items-center">
            <p id="loading-text" class="text-lg sm:text-xl sr-only">Loading live data, please wait...</p> 
            <div class="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-t-2 border-gray-100 mx-auto mt-4"></div>
        </div>

    
        <main id="victims-area" class="flex-grow p-3 sm:p-6 rounded-lg h-[calc(100vh-220px)] sm:h-[calc(100vh-240px)] min-h-[250px] sm:min-h-[300px]" style="display:none;">
            <ul id="victim-list" class="space-y-3"></ul>
        </main>

        <div id="message-box-container"></div>

       
        <footer id="app-footer" class="mt-8 pt-6 pb-4 text-center text-xs text-gray-500 border-t border-gray-700">
            <p>Data sourced from <a href="https://data.techforpalestine.org/docs/api/killed-in-gaza" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline">Tech For Palestine - Killed in Gaza API</a>.</p>
        </footer>
    </div>

    
    <div id="stats-sticker"> 
        <p id="sticker-text-content">Loading stats...</p>
    </div>

    <script>
        console.log("Script started (Live Data - Batched Page Loading - With Stats Sticker Hidden).");
        
        let allVictimsFlatList = []; 
        let overallVictimIndex = 0;  
        
        const normalItemAddIntervalMs = 2500; 
        const fastItemAddIntervalMs = 300;   
        let currentItemAddIntervalMs = normalItemAddIntervalMs; 

        const normalScrollSpeedPxPerSecond = 20; 
        const fastScrollSpeedPxPerSecond = 100; 
        
        let currentTranslationY = 0; 
        let lastTimestamp = 0;       

        let itemAddTimeoutId = null; 
        let animationFrameId = null; 
        let isDataLoaded = false;
        let isSpaceBarDown = false; 

        const PAGES_PER_BATCH = 200; 
        const BACKGROUND_FETCH_THRESHOLD = 20; 
        let nextBatchToFetch_HighestPage = 0; 
        let isFetchingNextBatch = false;

        const loadingIndicator = document.getElementById('loading-indicator');
        const loadingText = document.getElementById('loading-text');
        const victimsArea = document.getElementById('victims-area');
        const victimListUl = document.getElementById('victim-list');
        const messageBoxContainer = document.getElementById('message-box-container');
        const appFooter = document.getElementById('app-footer'); 
        const statsSticker = document.getElementById('stats-sticker');
        const stickerTextContent = document.getElementById('sticker-text-content');

        let stickerStats = [];
        let currentStickerStatIndex = 0;
        let stickerIntervalId = null;

        window.addEventListener('DOMContentLoaded', () => {
            console.log("DOMContentLoaded event fired.");
            if (loadingText) loadingText.textContent = ""; 
            setupEventListeners();
            fetchAndDisplayInitialData(); 
            fetchAndUpdateTimestampAndSticker(); 
        });

        function setupEventListeners() {
            document.addEventListener('keydown', handleKeyDown);
            document.addEventListener('keyup', handleKeyUp);
        }

        async function fetchAndUpdateTimestampAndSticker() {
            const summaryApiUrl = 'https://data.techforpalestine.org/api/v3/summary.json';
            console.log(`fetchAndUpdateTimestampAndSticker: Fetching from ${summaryApiUrl}`);
            let updateText = "Data last updated: Could not retrieve."; 

            try {
                const response = await fetch(summaryApiUrl);
                if (response.ok) {
                    const summaryData = await response.json();
                    
                    if (summaryData && summaryData.gaza && summaryData.gaza.last_update && String(summaryData.gaza.last_update).trim() !== "") {
                        updateText = `Data last updated: ${summaryData.gaza.last_update}`;
                    } else {
                        updateText = "Data last updated: Timestamp not available in API response.";
                        console.warn("fetchAndUpdateTimestampAndSticker: 'gaza.last_update' field not found or is empty.");
                    }

                    // Sticker data is still prepared, but the sticker itself is hidden by CSS
                    if (summaryData && summaryData.gaza) {
                        const gazaData = summaryData.gaza;
                        stickerStats = [
                            { label: "Total confirmed deaths", value: gazaData.killed?.total },
                            { label: "Total child deaths", value: gazaData.killed?.children },
                            { label: "Total medic deaths", value: gazaData.killed?.medical },
                            { label: "Total journalist deaths", value: gazaData.killed?.press },
                            { label: "Total confirmed injuries", value: gazaData.injured?.total }
                        ];
                        // No need to change statsSticker.style.display here if it's hidden by default in CSS
                        startStickerCycle(); 
                    } else {
                         if (stickerTextContent) stickerTextContent.textContent = "Stats not available.";
                         console.warn("fetchAndUpdateTimestampAndSticker: 'gaza' object not found in summary data for sticker.");
                    }

                } else {
                    updateText = `Data last updated: API error (Status ${response.status}).`;
                    if (stickerTextContent) stickerTextContent.textContent = "Stats API error.";
                    console.error(`fetchAndUpdateTimestampAndSticker: HTTP error! Status: ${response.status}`);
                }
            } catch (error) {
                console.error("fetchAndUpdateTimestampAndSticker: Error fetching or parsing summary data:", error);
                if (stickerTextContent) stickerTextContent.textContent = "Error loading stats.";
            }

            if (appFooter) {
                let lastUpdateP = appFooter.querySelector('.data-last-updated-text');
                if (!lastUpdateP) { 
                    lastUpdateP = document.createElement('p');
                    lastUpdateP.className = 'mt-1 data-last-updated-text'; 
                    appFooter.appendChild(lastUpdateP);
                }
                lastUpdateP.textContent = updateText;
            }
        }

        function startStickerCycle() {
            if (stickerIntervalId) clearInterval(stickerIntervalId);
            if (stickerStats.length === 0) return;

            // Update text content even if sticker is hidden, so it's ready if shown later
            updateStickerText(); 
            currentStickerStatIndex = (currentStickerStatIndex + 1) % stickerStats.length; 

            stickerIntervalId = setInterval(() => {
                if (stickerTextContent) { // Check if element exists
                    stickerTextContent.classList.add('fading-out');
                    setTimeout(() => {
                        updateStickerText();
                        stickerTextContent.classList.remove('fading-out');
                        currentStickerStatIndex = (currentStickerStatIndex + 1) % stickerStats.length;
                    }, 1000); 
                }
            }, 6000); 
        }

        function updateStickerText() {
            if (!stickerTextContent || stickerStats.length === 0) return;
            const stat = stickerStats[currentStickerStatIndex];
            const value = (stat.value !== null && stat.value !== undefined) ? Number(stat.value).toLocaleString() : "N/A";
            stickerTextContent.textContent = `${stat.label}: ${value}`;
        }


        function handleKeyDown(event) {
            if (event.key === ' ' || event.code === 'Space') {
                event.preventDefault(); 
                if (!isDataLoaded || (overallVictimIndex >= allVictimsFlatList.length && victimListUl.children.length === 0 && nextBatchToFetch_HighestPage < 1) ) return; 
                if (!isSpaceBarDown) { 
                    isSpaceBarDown = true;
                    currentItemAddIntervalMs = fastItemAddIntervalMs;
                    showAppMessage("Speed increased", "info", 1000);
                    if (itemAddTimeoutId) {
                        clearTimeout(itemAddTimeoutId);
                        if (overallVictimIndex < allVictimsFlatList.length) {
                             scheduleNextVictimAddition(true); 
                        } else { 
                            itemAddTimeoutId = setTimeout(() => scheduleNextVictimAddition(true), currentItemAddIntervalMs);
                        }
                    }
                }
            }
        }

        function handleKeyUp(event) {
            if (event.key === ' ' || event.code === 'Space') {
                event.preventDefault();
                if (!isDataLoaded) return;
                if (isSpaceBarDown) { 
                    isSpaceBarDown = false;
                    currentItemAddIntervalMs = normalItemAddIntervalMs;
                    showAppMessage("Speed returned to normal", "info", 1000);
                    if (itemAddTimeoutId) { 
                        clearTimeout(itemAddTimeoutId);
                        itemAddTimeoutId = setTimeout(() => scheduleNextVictimAddition(false), currentItemAddIntervalMs);
                    }
                }
            }
        }
        
        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        }

        async function determineTotalPages() {
            let low = 1;
            let high = 1000; 
            let lastKnownGoodPage = 0;
            const baseApiUrl = 'https://data.techforpalestine.org/api/v2/killed-in-gaza/page-';
            console.log(`determineTotalPages: Starting binary search for total pages between ${low} and ${high}.`);

            while (low <= high) {
                let mid = Math.floor(low + (high - low) / 2); 
                if (mid === 0) mid = 1;
                const checkApiUrl = `${baseApiUrl}${mid}.json`;
                console.log(`determineTotalPages: Checking ${checkApiUrl}`);
                try {
                    const checkResponse = await fetch(checkApiUrl);
                    if (checkResponse.status === 404) high = mid - 1; 
                    else if (!checkResponse.ok) high = mid - 1; 
                    else {
                        const checkPageData = await checkResponse.json();
                        if (Array.isArray(checkPageData) && checkPageData.length > 0) {
                            lastKnownGoodPage = mid; low = mid + 1; 
                        } else high = mid - 1; 
                    }
                } catch (error) {
                    console.error(`determineTotalPages: Network or parsing error checking page ${mid}:`, error);
                    high = mid - 1; 
                }
            }
            console.log(`determineTotalPages: Binary search complete. Last known good page: ${lastKnownGoodPage}`);
            return lastKnownGoodPage; 
        }

        async function fetchSinglePageData(pageNumber) {
            const apiUrl = `https://data.techforpalestine.org/api/v2/killed-in-gaza/page-${pageNumber}.json`;
            console.log(`fetchSinglePageData: Fetching from ${apiUrl}`);
            try {
                const response = await fetch(apiUrl);
                if (!response.ok) {
                    console.warn(`fetchSinglePageData: HTTP error for ${apiUrl}! Status: ${response.status}.`);
                    return null; 
                }
                const pageData = await response.json();
                if (Array.isArray(pageData)) {
                    console.log(`fetchSinglePageData: Fetched ${pageData.length} records from page ${pageNumber}.`);
                    return pageData;
                } else {
                    console.warn(`fetchSinglePageData: Page ${pageNumber} returned invalid data format.`);
                    return null;
                }
            } catch (error) {
                console.error(`fetchSinglePageData: Error fetching or parsing page ${pageNumber} (${apiUrl}):`, error);
                return null;
            }
        }

        async function tryFetchAndProcessBatch() {
            if (isFetchingNextBatch || nextBatchToFetch_HighestPage < 1) {
                console.log("tryFetchAndProcessBatch: Already fetching or no more pages to fetch.");
                return false; 
            }
            isFetchingNextBatch = true;
            const currentBatchTargetHighestPage = nextBatchToFetch_HighestPage;
            const startPageForThisBatch = Math.max(1, currentBatchTargetHighestPage - PAGES_PER_BATCH + 1);
            let batchDataAccumulator = []; 
            console.log(`tryFetchAndProcessBatch: Attempting to fetch batch of pages from ${startPageForThisBatch} to ${currentBatchTargetHighestPage}.`);
            for (let p = currentBatchTargetHighestPage; p >= startPageForThisBatch; p--) {
                const pageContent = await fetchSinglePageData(p);
                if (pageContent) batchDataAccumulator.push(...pageContent);
                else console.warn(`tryFetchAndProcessBatch: Failed to fetch or got empty data for page ${p} within batch.`);
            }
            if (batchDataAccumulator.length > 0) {
                allVictimsFlatList.push(...batchDataAccumulator); 
                shuffleArray(allVictimsFlatList); 
                console.log(`tryFetchAndProcessBatch: Added and re-shuffled batch. Total items now: ${allVictimsFlatList.length}`);
                nextBatchToFetch_HighestPage = startPageForThisBatch - 1; 
            } else {
                console.log(`tryFetchAndProcessBatch: No data found for batch ending at page ${currentBatchTargetHighestPage}.`);
                nextBatchToFetch_HighestPage = startPageForThisBatch - 1;
            }
            isFetchingNextBatch = false;
            return batchDataAccumulator.length > 0; 
        }

        async function fetchAndDisplayInitialData() {
            console.log("fetchAndDisplayInitialData: Starting.");
            loadingIndicator.style.display = 'flex'; 
            if (loadingText) loadingText.textContent = ""; 
            victimsArea.style.display = 'none';
            clearAppMessage();
            const totalPages = await determineTotalPages();
            if (totalPages <= 0) {
                showAppMessage("Could not determine API page count or no data available.", "error", 7000);
                loadingIndicator.style.display = 'none'; return;
            }
            nextBatchToFetch_HighestPage = totalPages; 
            const initialBatchSuccess = await tryFetchAndProcessBatch();
            loadingIndicator.style.display = 'none'; 
            if (initialBatchSuccess && allVictimsFlatList.length > 0) {
                isDataLoaded = true;
                victimsArea.style.display = 'block';
                console.log("fetchAndDisplayInitialData: Initial data loaded. Starting display.");
                scheduleNextVictimAddition(false); 
                animationFrameId = requestAnimationFrame(animateStream); 
            } else {
                showAppMessage("No data loaded from the initial API pages.", "info", 5000);
                console.warn("fetchAndDisplayInitialData: Failed to load sufficient initial data.");
            }
        }
        
        function scheduleNextVictimAddition(isFastMode = false) {
            clearTimeout(itemAddTimeoutId); 
            const itemsRemainingInQueue = allVictimsFlatList.length - overallVictimIndex;
            if (isDataLoaded && !isFetchingNextBatch && itemsRemainingInQueue < BACKGROUND_FETCH_THRESHOLD && overallVictimIndex > 0 && nextBatchToFetch_HighestPage >= 1 ) {
                console.log(`Nearing end of current data buffer. Attempting to fetch next batch (pages ending around ${nextBatchToFetch_HighestPage}).`);
                tryFetchAndProcessBatch(); 
            }
            if (overallVictimIndex < allVictimsFlatList.length) {
                const victim = allVictimsFlatList[overallVictimIndex];
                displayVictim(victim);
                overallVictimIndex++;
                itemAddTimeoutId = setTimeout(() => scheduleNextVictimAddition(isSpaceBarDown), currentItemAddIntervalMs);
            } else if (victimListUl.children.length === 0 && nextBatchToFetch_HighestPage < 1 && !isFetchingNextBatch) {
                console.log("All records processed and scrolled off. No more pages to fetch.");
                showAppMessage("All records have been displayed.", "info");
                if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }
            } else {
                 itemAddTimeoutId = setTimeout(() => scheduleNextVictimAddition(isSpaceBarDown), currentItemAddIntervalMs);
            }
        }
        
        function animateStream(timestamp) {
            if (!isDataLoaded && victimListUl.children.length === 0) { 
                animationFrameId = requestAnimationFrame(animateStream); return;
            }
            if (lastTimestamp === 0) lastTimestamp = timestamp;
            const deltaTime = (timestamp - lastTimestamp) / 1000; 
            lastTimestamp = timestamp;
            const currentScrollSpeed = isSpaceBarDown ? fastScrollSpeedPxPerSecond : normalScrollSpeedPxPerSecond;
            if (victimListUl.children.length > 0 || overallVictimIndex < allVictimsFlatList.length) {
                 currentTranslationY += currentScrollSpeed * deltaTime;
            }
            victimListUl.style.transform = `translateY(${currentTranslationY}px)`;
            const listItems = victimListUl.children;
            if (listItems.length > 0) {
                const lastItem = listItems[listItems.length - 1];
                const itemVisualTop = lastItem.offsetTop + currentTranslationY; 
                if (itemVisualTop > victimsArea.clientHeight) victimListUl.removeChild(lastItem);
            }
            if (overallVictimIndex >= allVictimsFlatList.length && victimListUl.children.length === 0 && nextBatchToFetch_HighestPage < 1 && !isFetchingNextBatch) {
                 if (animationFrameId) { 
                    console.log("Animation stopped: All items displayed and scrolled off. No more pages.");
                    showAppMessage("All records have been displayed.", "info");
                    cancelAnimationFrame(animationFrameId); animationFrameId = null;
                    if(itemAddTimeoutId) clearTimeout(itemAddTimeoutId);
                }
                return; 
            }
            animationFrameId = requestAnimationFrame(animateStream);
        }

        function displayVictim(victim) {
            const li = document.createElement('li');
            li.className = 'victim-item p-3 bg-gray-700 rounded-md shadow'; 
            const enName = victim.en_name || "";
            const arName = victim.name || "";
            let combinedNameStr = "";
            if (enName && arName) combinedNameStr = `${enName} / ${arName}`;
            else if (enName) combinedNameStr = enName;
            else if (arName) combinedNameStr = arName;
            else combinedNameStr = "Name not available";
            let detailsParts = [];
            if (victim.age !== null && victim.age !== undefined && String(victim.age).trim() !== "") {
                detailsParts.push(`${victim.age} years old`);
            }
            if (victim.sex) {
                const sexLower = String(victim.sex).toLowerCase();
                if (sexLower === "male" || sexLower === "m") detailsParts.push("Male");
                else if (sexLower === "female" || sexLower === "f") detailsParts.push("Female");
            }
            if (victim.dob && typeof victim.dob === 'string' && victim.dob.trim() !== "") {
                 if (/^\d{4}-\d{2}-\d{2}$/.test(victim.dob.trim())) detailsParts.push(`Born: ${victim.dob.trim()}`);
                 else { 
                    detailsParts.push(`Born: ${victim.dob.trim()}`); 
                    console.warn(`Victim ${victim.id || combinedNameStr} has a DOB in an unexpected format: ${victim.dob}`);
                 }
            }
            const detailsString = detailsParts.join(', ');
            li.innerHTML = `
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div class="flex-grow mb-1 sm:mb-0">
                        <p class="font-semibold text-base sm:text-lg text-red-300">${combinedNameStr}</p>
                        ${detailsString ? `<p class="text-xs sm:text-sm text-gray-300">${detailsString}</p>` : ''}
                    </div>
                </div>`;
            const previousScrollHeight = victimListUl.scrollHeight;
            victimListUl.prepend(li); 
            li.offsetHeight; 
            const newScrollHeight = victimListUl.scrollHeight;
            const heightAddedByNewItem = newScrollHeight - previousScrollHeight;
            currentTranslationY -= heightAddedByNewItem;
            victimListUl.style.transform = `translateY(${currentTranslationY}px)`;
            requestAnimationFrame(() => { requestAnimationFrame(() => { li.classList.add('revealed'); }); });
        }

        let messageTimeoutId = null;
        function showAppMessage(text, type = 'info', duration = null) {
            if (messageTimeoutId) clearTimeout(messageTimeoutId);
            if (!messageBoxContainer) return;
            messageBoxContainer.innerHTML = `<p class="px-3 py-2 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm text-white shadow-lg"></p>`;
            const messageP = messageBoxContainer.querySelector('p');
            if (!messageP) return;
            messageP.textContent = text;
            messageP.classList.remove('bg-red-600', 'bg-green-600', 'bg-blue-700');
            if (type === 'error') messageP.classList.add('bg-red-600');
            else if (type === 'success') messageP.classList.add('bg-green-600');
            else messageP.classList.add('bg-blue-700');
            messageBoxContainer.style.display = 'block';
            requestAnimationFrame(() => { messageBoxContainer.style.opacity = '1'; });
            if (duration) messageTimeoutId = setTimeout(hideAppMessage, duration);
        }
        function hideAppMessage() {
            if (!messageBoxContainer) return;
            messageBoxContainer.style.opacity = '0';
            setTimeout(() => {
                if (messageBoxContainer && messageBoxContainer.style.opacity === '0') {
                     messageBoxContainer.style.display = 'none';
                }
            }, 500); 
        }
        function clearAppMessage() {
             if (messageTimeoutId) clearTimeout(messageTimeoutId);
             if(messageBoxContainer) {
                messageBoxContainer.style.opacity = '0';
                messageBoxContainer.style.display = 'none';
                messageBoxContainer.innerHTML = '';
             }
        }
    </script>
</body>
</html>
