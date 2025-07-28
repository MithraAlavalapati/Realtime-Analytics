// A self-contained module for tracking user events
const EventTracker = (() => {

    // --- CONFIGURATION ---
    // ✅ PASTE YOUR CLOUD FUNCTION TRIGGER URLS HERE
    const cloudFunctionUrls = {
        first_visit: 'https://your-region-project.cloudfunctions.net/first_visit_function',
        session_start: 'https://your-region-project.cloudfunctions.net/session_start_function',
        page_view: 'https://your-region-project.cloudfunctions.net/page_view_function',
        view_item: 'https://your-region-project.cloudfunctions.net/view_item_function',
        view_promotion: 'https://your-region-project.cloudfunctions.net/view_promotion_function',
        click: 'https://your-region-project.cloudfunctions.net/click_function',
        scroll: 'https://your-region-project.cloudfunctions.net/scroll_function'
    };

   

    // --- CORE TRACKING FUNCTION ---
    /**
     * Sends event data to the specified backend Cloud Function.
     * @param {string} eventName - The name of the event to track.
     */
    const track = (eventName) => {
        const url = cloudFunctionUrls[eventName];
        if (!url || !url.startsWith('http')) {
            console.error(`Invalid or missing URL for event: ${eventName}`);
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
            traffic_source: getTrafficSource()
        };

        const payload = JSON.stringify(data);

        if (navigator.sendBeacon) {
            navigator.sendBeacon(url, payload);
        } else {
            fetch(url, {
                method: 'POST',
                body: payload,
                headers: { 'Content-Type': 'application/json' },
                keepalive: true
            });
        }
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

        document.body.addEventListener('click', (e) => {
            const element = e.target.closest('button, a');
            if (!element) return;
            track('click');
        }, true);

        let scrollDepthsTracked = {};
        const trackScroll = () => {
            const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
            if (scrollableHeight <= 0) return;
            
            const scrollPercent = Math.round((window.scrollY / scrollableHeight) * 100);
            const depthsToTrack = [25, 50, 75, 90];
            
            depthsToTrack.forEach(depth => {
                if (scrollPercent >= depth && !scrollDepthsTracked[depth]) {
                    track('scroll');
                    scrollDepthsTracked[depth] = true;
                }
            });
        };
        
        const resetScrollTracker = () => { scrollDepthsTracked = {}; };
        window.addEventListener('hashchange', resetScrollTracker);
        window.addEventListener('scroll', trackScroll, { passive: true });
    };

    return {
        init,
        track
    };
})();