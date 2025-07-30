// A self-contained module for tracking user events
const EventTracker = (() => {

    // --- CONFIGURATION ---
    const cloudFunctionUrls = {
        first_visit: 'http://127.0.0.1:8081',//'https://asia-south1-svaraflow.cloudfunctions.net/process_first_visit',// // Points to your first_visit_function
        session_start: 'http://127.0.0.1:8089', // Placeholder
        view_item: 'http://127.0.0.1:8083',     // Your local view_item_tracker URL
        view_promotion: 'http://127.0.0.1:8084', // New: Your local view_promotion_tracker URL
        click:  'http://127.0.0.1:8080',//'https://asia-south1-svaraflow.cloudfunctions.net/track_ecommerce_event',//,//              // CORRECTED: Removed leading space
        scroll: 'http://127.0.0.1:8088',             // Placeholder
        page_view: 'http://127.0.0.1:8082',//'https://asia-south1-svaraflow.cloudfunctions.net/page_view_tracker',  // Your local page_view_tracker URL
        // Corrected 'zooming' to 'Zooming' for consistency with process_zooming.py
        Zooming: 'http://127.0.0.1:8085', // New: Your local zooming_tracker URL
        User_Reviews: 'http://127.0.0.1:8086', // New: Your local submit_review_tracker URL
        // Corrected 'view_reviews' to 'View_User_Reviews' for consistency with script.js and process_view_user_reviews.py
        View_User_Reviews: 'http://127.0.0.1:8087', // New: Your local view_reviews_tracker URL
        // Corrected 'view_product_details' to 'View_Product_Details' for consistency with process_view_product_details.py
        View_Product_Details: 'http://127.0.0.1:8090', // This is for the "Show All Details" button click
        // Added Session_Time for consistency with process_session_time.py (though not triggered by script.js)
        Session_Time: 'http://127.0.0.1:8091', // New: Your local session_time_tracker URL (placeholder, needs definition in script.js to be used)
    };

    // --- Helper Functions for User/Session Management & Device Data ---
    const getOrCreateUserId = () => {
        let userId = localStorage.getItem('user_id');
        if (!userId) {
            userId = 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('user_id', userId);
        }
        return userId;
    };

    const getOrCreateSessionId = () => {
        let sessionId = sessionStorage.getItem('session_id');
        if (!sessionId) {
            sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('session_id', sessionId);
        }
        return sessionId;
    };

    const getDeviceData = () => {
        const userAgent = navigator.userAgent;
        let category = 'desktop';
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
            category = 'tablet';
        } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
            category = 'mobile';
        }

        return {
            category: category,
            operating_system: navigator.platform,
            browser: getBrowserName(userAgent),
            screen_resolution: `${window.screen.width}x${window.screen.height}`
        };
    };

    const getBrowserName = (userAgent) => {
        if (userAgent.indexOf("Firefox") > -1) return "Firefox";
        if (userAgent.indexOf("Safari") > -1) return "Safari";
        if (userAgent.indexOf("Chrome") > -1) return "Chrome";
        if (userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident") > -1) return "IE";
        if (userAgent.indexOf("Edge") > -1) return "Edge";
        if (userAgent.indexOf("Opera") > -1 || userAgent.indexOf("OPR") > -1) return "Opera";
        return "Unknown";
    };

    const getGeoData = () => {
        return {
            country: 'IN',
            region: 'KA',
            city: 'Bengaluru'
        };
    };

    const getTrafficSource = () => {
        const referrer = document.referrer;
        let source = 'direct';
        let medium = '(none)';
        let campaign = '(not set)';

        if (referrer) {
            try {
                const url = new URL(referrer);
                source = url.hostname;
                medium = 'referral';
            } catch (e) {
                source = referrer;
                medium = 'referral';
            }
        }

        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('utm_source')) source = urlParams.get('utm_source');
        if (urlParams.has('utm_medium')) medium = urlParams.get('utm_medium');
        if (urlParams.has('utm_campaign')) campaign = urlParams.get('utm_campaign');

        return { source, medium, campaign };
    };

    // --- CORE TRACKING FUNCTION ---
    /**
     * Sends event data to the specified backend Cloud Function.
     * @param {string} eventName - The name of the event to track.
     * @param {object} [eventParams={}] - Optional additional parameters specific to the event.
     * These will now be merged directly into the top-level event payload.
     */
    const track = (eventName, eventParams = {}) => {
        const url = cloudFunctionUrls[eventName];
        if (!url || !url.startsWith('http')) {
            console.warn(`[EventTracker] Not tracking event '${eventName}' as its URL is not configured for sending.`);
            return;
        }

        const data = {
            event_name: eventName,
            event_timestamp: new Date().toISOString(),
            user_id: getOrCreateUserId(),
            session_id: getOrCreateSessionId(),
            page_location: window.location.href,
            page_title: document.title,
            device: getDeviceData(),
            geo: getGeoData(),
            traffic_source: getTrafficSource(),
            // Merge event-specific parameters directly into the top-level data object
            ...eventParams
        };

        const payload = JSON.stringify(data);

        // --- Debugging additions ---
        console.log(`[EventTracker] Preparing to send event: ${eventName}`);
        console.log(`[EventTracker] Target URL: ${url}`);
        console.log(`[EventTracker] Payload (JSON string):`, payload);
        console.log(`[EventTracker] Payload (Parsed Object):`, data);
        // --- End Debugging additions ---

        fetch(url, {
            method: 'POST',
            body: payload,
            headers: { 'Content-Type': 'application/json' },
            keepalive: true
        })
        .then(response => {
            console.log(`[EventTracker] Fetch response status for ${eventName}:`, response.status);
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(`HTTP error! status: ${response.status}, body: ${text}`);
                });
            }
            return response.text();
        })
        .then(responseText => {
            console.log(`[EventTracker] Fetch response body for ${eventName}:`, responseText);
        })
        .catch(error => {
            console.error(`[EventTracker] Error sending event ${eventName}:`, error);
        });
        console.log(`Tracked Event: ${eventName}`, data);
    };

    // --- INITIALIZATION & AUTOMATIC EVENTS ---
    const init = () => {
        if (!localStorage.getItem('first_visit_tracked')) {
            track('first_visit');
            localStorage.setItem('first_visit_tracked', 'true');
        }

        if (!sessionStorage.getItem('session_start_tracked')) {
            track('session_start');
            sessionStorage.setItem('session_start_tracked', 'true');
        }

        // Track initial page view when the tracker initializes
        track('page_view');

        document.body.addEventListener('click', (e) => {
            const element = e.target.closest('button, a, input[type="submit"], [role="button"], [onclick]');
            if (!element) return;
            track('click'); // Click event remains generic, no specific params in BigQuery for it
        }, true);

        let scrollDepthsTracked = {};
        const trackScroll = () => {
            const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
            if (scrollableHeight <= 0) return;

            const scrollPercent = Math.round((window.scrollY / scrollableHeight) * 100);
            const depthsToTrack = [25, 50, 75, 90];

            depthsToTrack.forEach(depth => {
                if (scrollPercent >= depth && !scrollDepthsTracked[depth]) {
                    // Pass scroll_depth_percentage directly to match BQ schema
                    track('scroll', { scroll_depth_percentage: depth });
                    scrollDepthsTracked[depth] = true;
                }
            });
        };

        const resetScrollTracker = () => { scrollDepthsTracked = {}; };
        window.addEventListener('hashchange', resetScrollTracker);
        window.addEventListener('scroll', trackScroll, { passive: true });

        // Event listener for zooming (e.g., Ctrl/Cmd + scroll)
        window.addEventListener('wheel', (e) => {
            if (e.ctrlKey || e.metaKey) { // Check for Ctrl (Windows/Linux) or Cmd (macOS) key
                const zoomDirection = e.deltaY < 0 ? 'zoom_in' : 'zoom_out';
                // Pass zoom_level directly to match BQ schema. If zoom_direction needed, add field to BQ.
                track('Zooming', { zoom_level: e.deltaY }); // Changed to 'Zooming'
            }
        }, { passive: true });
    };

    return {
        init,
        track
    };
})();

// Call EventTracker.init() directly here to ensure it runs as soon as the script is loaded.
EventTracker.init();