// A self-contained module for tracking user events
// This file should be placed in your "Realtime-Analytics/" directory (same as index.html)
const EventTracker = (() => {

    // --- CONFIGURATION ---
    // ✅ PASTE YOUR DEPLOYED CLOUD FUNCTION TRIGGER URLs HERE!
    // You MUST deploy a Cloud Function for EACH of these event types and update the URLs.
    const GCF_PAGE_VIEW_ENDPOINT = 'https://asia-south1-svaraflow.cloudfunctions.net/pageViewTracker'; // <--- UPDATE THIS
    const GCF_PURCHASE_ENDPOINT = 'YOUR_DEPLOYED_PURCHASE_CLOUD_FUNCTION_URL_HERE'; // <--- UPDATE THIS
    const GCF_VIEW_ITEM_ENDPOINT = 'https://asia-south1-svaraflow.cloudfunctions.net/viewItemTracker'; // <--- UPDATE THIS
    
    // NEW ENDPOINTS TO UPDATE (for other team members or your future work)
    const GCF_FIRST_VISIT_ENDPOINT = 'YOUR_DEPLOYED_FIRST_VISIT_CLOUD_FUNCTION_URL_HERE'; // <--- UPDATE THIS
    const GCF_SESSION_START_ENDPOINT = 'YOUR_DEPLOYED_SESSION_START_CLOUD_FUNCTION_URL_HERE'; // <--- UPDATE THIS
    const GCF_VIEW_PROMOTION_ENDPOINT = 'YOUR_DEPLOYED_VIEW_PROMOTION_CLOUD_FUNCTION_URL_HERE'; // <--- UPDATE THIS
    const GCF_CLICK_ENDPOINT = 'YOUR_DEPLOYED_CLICK_CLOUD_FUNCTION_URL_HERE'; // <--- UPDATE THIS
    const GCF_SCROLL_ENDPOINT = 'YOUR_DEPLOYED_SCROLL_CLOUD_FUNCTION_URL_HERE'; // <--- UPDATE THIS


    // --- DYNAMIC DATA COLLECTION FUNCTIONS ---

    // Creates a persistent random user ID
    function getUserId() {
        let userId = localStorage.getItem('userId');
        if (!userId) {
            userId = crypto.randomUUID();
            localStorage.setItem('userId', userId);
        }
        return userId;
    }
    
    // Uses a random number for the session ID
    function getSessionId() {
        let sessionId = sessionStorage.getItem('sessionId');
        if (!sessionId) {
            sessionId = String(Math.floor(Date.now() * Math.random()));
            sessionStorage.setItem('sessionId', sessionId);
        }
        return sessionId;
    }

    function getDeviceDetails() {
        const ua = navigator.userAgent;
        const details = {
            category: 'desktop',
            operating_system: 'Unknown',
            browser: 'Unknown',
            screen_resolution: `${window.screen.width}x${window.screen.height}`
        };
        if (ua.indexOf("Win") != -1) details.operating_system = "Windows";
        else if (ua.indexOf("Mac") != -1) details.operating_system = "Mac";
        else if (ua.indexOf("Linux") != -1) details.operating_system = "Linux";
        else if (ua.indexOf("Android") != -1) details.operating_system = "Android";
        else if (ua.indexOf("like Mac") != -1 || ua.indexOf("iPhone") != -1 || ua.indexOf("iPad") != -1) details.operating_system = "iOS";
        if (ua.indexOf("Edg/") != -1) details.browser = "Edge";
        else if (ua.indexOf("Chrome") != -1) details.browser = "Chrome";
        else if (ua.indexOf("Firefox") != -1) details.browser = "Firefox";
        else if (ua.indexOf("Safari") != -1 && !ua.includes("Chrome")) details.browser = "Safari";
        if (details.operating_system === 'Android' || details.operating_system === 'iOS' || /Mobi|Tablet|iPad/i.test(ua)) {
            details.category = /Mobi/.test(ua) ? 'mobile' : 'tablet';
        }
        return details;
    }

    // IMPORTANT: Temporarily returning dummy data to bypass ip-api.com 403 error.
    // For a production system, IP-based geolocation should be done server-side in your Cloud Function.
    async function getGeoDetails() {
        return { country: 'Unknown', region: 'Unknown', city: 'Unknown' };
    }
    
    // Smarter logic for detecting direct vs. referral traffic
    function getTrafficSourceDetails() {
        const params = new URLSearchParams(window.location.search);
        let source = params.get('utm_source');
        let medium = params.get('utm_medium');
        const campaign = params.get('utm_campaign') || '(not set)';
        const referrer = document.referrer;

        if (!source && referrer) {
            try {
                const referrerHost = new URL(referrer).hostname;
                // If the referrer is not the same as the current site, it's a true referral
                if (referrerHost !== window.location.hostname) {
                    source = referrerHost;
                    medium = 'referral';
                }
            } catch (e) {
                // Ignore invalid referrer URLs
            }
        }
        
        // If source is still not set, it's direct traffic
        if (!source) {
            source = '(direct)';
            medium = '(none)';
        }
        return { source, medium, campaign };
    }

    // --- CORE TRACKING FUNCTION ---
    async function trackEvent(eventName, eventParams = {}) { // eventParams ensures 'event_params: {}' is always sent
        const fullPayload = {
            event_name: eventName,
            event_timestamp: new Date().toISOString(),
            user_id: getUserId(),
            session_id: getSessionId(),
            page_location: window.location.href,
            page_title: document.title,
            device: getDeviceDetails(),
            geo: await getGeoDetails(), // This will now always be dummy data
            traffic_source: getTrafficSourceDetails(),
            event_params: eventParams // This will be sent as {} for page_view if no custom params are passed
        };

        console.log(`Sending Event: ${eventName}`, fullPayload); // More descriptive log

        let targetEndpoint;
        switch (eventName) {
            case 'page_view':
                targetEndpoint = GCF_PAGE_VIEW_ENDPOINT;
                break;
            case 'purchase':
                targetEndpoint = GCF_PURCHASE_ENDPOINT;
                break;
            case 'view_item':
                targetEndpoint = GCF_VIEW_ITEM_ENDPOINT;
                break;
            case 'first_visit': // NEW CASE
                targetEndpoint = GCF_FIRST_VISIT_ENDPOINT;
                break;
            case 'session_start': // NEW CASE
                targetEndpoint = GCF_SESSION_START_ENDPOINT;
                break;
            case 'view_promotion': // NEW CASE
                targetEndpoint = GCF_VIEW_PROMOTION_ENDPOINT;
                break;
            case 'click': // NEW CASE
                targetEndpoint = GCF_CLICK_ENDPOINT;
                break;
            case 'scroll': // NEW CASE
                targetEndpoint = GCF_SCROLL_ENDPOINT;
                break;
            default:
                console.warn(`No specific Cloud Function endpoint configured for unknown event: ${eventName}. Event not sent.`);
                return;
        }

        // Check for placeholder URLs before sending
        if (!targetEndpoint || !targetEndpoint.startsWith('https://') || targetEndpoint.includes('YOUR_DEPLOYED_')) {
            console.error(`Invalid or missing deployed Cloud Function URL for ${eventName}. Please update event-tracker.js.`);
            return;
        }

        // Use navigator.sendBeacon for reliable sending on page unload/navigation
        if (navigator.sendBeacon) {
            const blob = new Blob([JSON.stringify(fullPayload)], { type: 'application/json' });
            navigator.sendBeacon(targetEndpoint, blob);
        } else {
            // Fallback to fetch for browsers that don't support sendBeacon or for larger payloads
            fetch(targetEndpoint, {
                method: 'POST',
                body: JSON.stringify(fullPayload),
                headers: { 'Content-Type': 'application/json' },
                keepalive: true // Crucial for requests on page unload
            }).catch(error => {
                console.error(`Error sending ${eventName} event via fetch:`, error);
            });
        }
    }
    
    // --- INITIALIZATION & AUTOMATIC EVENT LISTENERS ---
    // Ensure the DOM is fully loaded before trying to access elements
    const init = () => {
        // Track page_view automatically on initial load
        trackEvent('page_view');

        // Initialize other automatic event tracking if their URLs are configured
        // Check for placeholder URLs before enabling automatic tracking
        if (!localStorage.getItem('first_visit_tracked') && !GCF_FIRST_VISIT_ENDPOINT.includes('YOUR_')) {
            trackEvent('first_visit');
            localStorage.setItem('first_visit_tracked', 'true');
        } else if (GCF_FIRST_VISIT_ENDPOINT.includes('YOUR_')) {
             console.warn("First visit tracking disabled: GCF_FIRST_VISIT_ENDPOINT is not configured.");
        }

        if (!sessionStorage.getItem('session_start_tracked') && !GCF_SESSION_START_ENDPOINT.includes('YOUR_')) {
            trackEvent('session_start');
            sessionStorage.setItem('session_start_tracked', 'true');
        } else if (GCF_SESSION_START_ENDPOINT.includes('YOUR_')) {
            console.warn("Session start tracking disabled: GCF_SESSION_START_ENDPOINT is not configured.");
        }

        // Attach listener for purchase button, check if it exists first.
        const purchaseBtn = document.getElementById('checkout-btn'); // Assuming checkout-btn is the purchase trigger
        if (purchaseBtn) {
            if (!GCF_PURCHASE_ENDPOINT.includes('YOUR_')) { // Only attach if purchase endpoint is configured
                purchaseBtn.addEventListener('click', () => trackEvent('purchase'));
            } else {
                console.warn("Purchase button found, but GCF_PURCHASE_ENDPOINT is not configured. Purchase events will not be sent.");
            }
        } else {
            console.warn("Purchase button with ID 'checkout-btn' not found. Purchase events will not be tracked via button click.");
        }
        
        // Add listeners for promotion clicks
        document.querySelectorAll('.promo-banner').forEach(banner => {
            if (!GCF_VIEW_PROMOTION_ENDPOINT.includes('YOUR_')) {
                banner.addEventListener('click', () => {
                    const promoId = banner.dataset.promoId || 'unknown_promo';
                    trackEvent('view_promotion', { promotion_id: promoId });
                });
            } else {
                console.warn("Promotion click tracking disabled: GCF_VIEW_PROMOTION_ENDPOINT is not configured.");
            }
        });
        
        // Add automatic click tracking
        if (!GCF_CLICK_ENDPOINT.includes('YOUR_')) {
            document.body.addEventListener('click', (e) => {
                const element = e.target.closest('button, a');
                if (!element) return;
                const clickParams = {
                    element_tag: element.tagName.toLowerCase(),
                    element_id: element.id || '(not set)',
                    element_class: element.className.split(' ')[0] || '(not set)',
                    element_text: element.innerText ? element.innerText.substring(0, 100) : '(not set)',
                    element_href: element.href || '(not set)'
                };
                trackEvent('click', clickParams);
            }, true);
        } else {
            console.warn("Click tracking disabled: GCF_CLICK_ENDPOINT is not configured.");
        }

        // Add automatic scroll tracking
        if (!GCF_SCROLL_ENDPOINT.includes('YOUR_')) {
            let scrollDepthsTracked = {};
            const trackScroll = () => {
                const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
                if (scrollableHeight <= 0) return;
                const scrollPercent = Math.round((window.scrollY / scrollableHeight) * 100);
                const depthsToTrack = [25, 50, 75, 90];
                depthsToTrack.forEach(depth => {
                    if (scrollPercent >= depth && !scrollDepthsTracked[depth]) {
                        trackEvent('scroll', { scroll_depth_percent: depth });
                        scrollDepthsTracked[depth] = true;
                    }
                });
            };
            const resetScrollTracker = () => { scrollDepthsTracked = {}; };
            window.addEventListener('hashchange', resetScrollTracker);
            window.addEventListener('scroll', trackScroll, { passive: true });
        } else {
            console.warn("Scroll tracking disabled: GCF_SCROLL_ENDPOINT is not configured.");
        }
    };

    // Public API of the EventTracker module
    return {
        init: init, // Expose the init function
        track: trackEvent // Expose the trackEvent function for manual triggers (e.g., in script.js for view_item)
    };
})();

// Automatically initialize EventTracker when the DOM content is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    EventTracker.init();
});