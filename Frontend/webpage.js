// This file contains the core logic and data for the website.

// --- EventTracker Module (Content from event-tracker.js) ---
const EventTracker = (() => {

    // --- CONFIGURATION ---
    const cloudFunctionUrls = {
        details_of_product: 'https://asia-south1-svaraflow.cloudfunctions.net/process_details_of_product_event',
        first_visit: ' https://asia-south1-svaraflow.cloudfunctions.net/process_first_store_visit_event',
        product_image_zoom: 'https://asia-south1-svaraflow.cloudfunctions.net/process_product_image_zoom_event',
        product_image_view: ' https://asia-south1-svaraflow.cloudfunctions.net/process_product_image_view_event',
        session_time: 'https://asia-south1-svaraflow.cloudfunctions.net/process_session_time_event',
        store_visit: 'https://asia-south1-svaraflow.cloudfunctions.net/process_store_visit_event',
        user_reviews: 'https://asia-south1-svaraflow.cloudfunctions.net/process_user_reviews_event',
        view_page: ' https://asia-south1-svaraflow.cloudfunctions.net/process_view_page_event',
        view_product: 'https://asia-south1-svaraflow.cloudfunctions.net/process_view_product_event',
        view_user_reviews: 'https://asia-south1-svaraflow.cloudfunctions.net/process_view_user_reviews_event',
        scroll_hover_event: ' https://asia-south1-svaraflow.cloudfunctions.net/process_scroll_hover_event',
        product_hover_event: ' https://asia-south1-svaraflow.cloudfunctions.net/process_scroll_hover_event',
        item_click: ' https://asia-south1-svaraflow.cloudfunctions.net/track_item_time_event',
        item_time_realtime: ' https://asia-south1-svaraflow.cloudfunctions.net/track_item_time_event',
        item_time_final: ' https://asia-south1-svaraflow.cloudfunctions.net/track_item_time_event',

    };

    // Centralized mapping for stores to seller IDs
    const SELLER_ID_MAP = {
        'Trendy Threads': 'trendy-threads-seller',
        'Tech Emporium': 'tech-emporium-seller',
        'The Book Nook': 'book-nook-seller',
        'Active Zone': 'active-zone-seller',
        'General Promotions': 'general-promotions',
    };

    // Centralized mapping for general sections to their store/seller context
    const SECTION_TO_STORE_NAME_MAP = { // Renamed for clarity
        'Hot Promotions': 'General Promotions',
        'Shop by Store': 'General Promotions',
        'Shop by Category': 'General Promotions',
        'Featured Products': 'General Promotions',
    };

    // A reverse map to get the store_name from the seller_id (for internal use if needed)
    const REVERSE_SELLER_ID_MAP = {};
    for (const storeName in SELLER_ID_MAP) {
        REVERSE_SELLER_ID_MAP[SELLER_ID_MAP[storeName]] = storeName;
    }

    let currentUserId = null;
    let pageStartTime = Date.now();
    let storePageStartTime = null;

    const getOrCreateUserId = () => {
        if (currentUserId) {
            return currentUserId;
        }
        let userId = sessionStorage.getItem('user_id');
        if (userId) {
            currentUserId = userId;
            return userId;
        }
        userId = 'anon-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('user_id', userId);
        currentUserId = userId;
        return userId;
    };

    const getOrCreateSessionId = () => {
        let sessionId = sessionStorage.getItem(`session_id_${currentUserId}`);
        if (!sessionId) {
            sessionId = 'session-' + currentUserId + '-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
            sessionStorage.setItem(`session_id_${currentUserId}`, sessionId);
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
            os: navigator.platform,
            browser: getBrowserName(userAgent)
        };
    };

    const getBrowserName = (userAgent) => {
        if (userAgent.indexOf("Firefox") > -1) return "Firefox";
        if (userAgent.indexOf("Edg") > -1) return "Edge";
        if (userAgent.indexOf("Chrome") > -1) return "Chrome";
        if (userAgent.indexOf("Safari") > -1) return "Safari";
        if (userAgent.indexOf("Opera") > -1 || userAgent.indexOf("OPR") > -1) return "Opera";
        if (userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident") > -1) return "IE";
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
        return {
            source,
            medium
        };
    };

    const track = (eventName, specificPayload = {}) => {
        const url = cloudFunctionUrls[eventName];
        if (!url || url.includes('YOUR_PROJECT_ID')) {
            console.warn(`[EventTracker] Not tracking event '${eventName}'. Please configure your Cloud Function URL in the cloudFunctionUrls object.`);
            console.log(`[EventTracker] Payload that would have been sent:`, specificPayload);
            return;
        }

        const commonPayload = {
            event_name: eventName,
            event_timestamp: new Date().toISOString(),
            ingestion_timestamp: new Date().toISOString(),
            user_id: getOrCreateUserId(),
            session_id: getOrCreateSessionId(),
            page_location: window.location.href,
            page_title: document.title,
            device: getDeviceData(),
            geo: getGeoData(),
            traffic_source: getTrafficSource(),
            seller_id: specificPayload.seller_id || null, // Common payload gets seller_id from specificPayload
            store_name: specificPayload.store_name || null, // Common payload gets store_name from specificPayload
        };

        const pageDurationSeconds = Math.round((Date.now() - pageStartTime) / 1000);

        const finalPayload = { ...commonPayload
        }; // Start with commonPayload

        // --- Apply event-specific payload based on schema ---
        if (eventName === 'details_of_product') {
            if (specificPayload.item) {
                finalPayload.item = {
                    item_id: specificPayload.item.item_id,
                    item_name: specificPayload.item.item_name,
                    item_category: specificPayload.item.item_category,
                    price: specificPayload.item.price,
                    item_brand: specificPayload.item.item_brand,
                    item_variant: specificPayload.item.item_variant
                };
            } else {
                console.error(`[EventTracker] Missing 'item' for ${eventName}`);
                return;
            }
            finalPayload.page_duration_seconds = pageDurationSeconds;
        } else if (eventName === 'first_store_visit') {
            if (!specificPayload.store_name || !specificPayload.seller_id) {
                console.error(`[EventTracker] Missing required 'store_name' or 'seller_id' for ${eventName}`);
                return;
            }
            finalPayload.store_name = specificPayload.store_name;
            finalPayload.seller_id = specificPayload.seller_id;
            finalPayload.page_referrer = document.referrer;
        } else if (eventName === 'product_image_view') {
            if (specificPayload.item && specificPayload.image_details) {
                finalPayload.item = {
                    item_id: specificPayload.item.item_id,
                    item_name: specificPayload.item.item_name,
                    item_category: specificPayload.item.item_category,
                    price: specificPayload.item.price
                };
                finalPayload.image_details = {
                    image_url: specificPayload.image_details.image_url,
                    image_position: specificPayload.image_details.image_position
                };
            } else {
                console.error(`[EventTracker] Missing required 'item' or 'image_details' for ${eventName}`);
                return;
            }
            finalPayload.page_duration_seconds = pageDurationSeconds;
        } else if (eventName === 'product_image_zoom') {
            if (specificPayload.zoom_level === undefined || specificPayload.zoom_level === null || !specificPayload.item || !specificPayload.image_details) {
                console.error(`[EventTracker] Missing required fields for ${eventName}`);
                return;
            }
            finalPayload.zoom_level = specificPayload.zoom_level;
            finalPayload.zoom_duration_seconds = specificPayload.zoom_duration_seconds || null;
            finalPayload.item = {
                item_id: specificPayload.item.item_id,
                item_name: specificPayload.item.item_name,
            };
            finalPayload.image_details = {
                image_url: specificPayload.image_details.image_url,
                image_position: specificPayload.image_details.image_position
            };
        } else if (eventName === 'session_time') {
            // Updated to ensure seller_id and store_name are not null
            if (!specificPayload.seller_id || !specificPayload.store_name) {
                console.warn(`[EventTracker] Dropping session_time event due to missing seller_id or store_name.`);
                return;
            }
            finalPayload.session_duration = specificPayload.session_duration || null;
            finalPayload.seller_id = specificPayload.seller_id;
            finalPayload.store_name = specificPayload.store_name;
            finalPayload.user_id = getOrCreateUserId();
            finalPayload.session_id = getOrCreateSessionId();
        } else if (eventName === 'store_visit') {
            if (!specificPayload.store_name || !specificPayload.seller_id) {
                console.error(`[EventTracker] Missing required 'store_name' or 'seller_id' for ${eventName}`);
                return;
            }
            finalPayload.store_name = specificPayload.store_name;
            finalPayload.seller_id = specificPayload.seller_id;
            finalPayload.page_duration_seconds = specificPayload.page_duration_seconds || null;
        } else if (eventName === 'user_reviews') {
            if (!specificPayload.item || !specificPayload.review) {
                console.error(`[EventTracker] Missing required 'item' or 'review' for ${eventName}`);
                return;
            }
            finalPayload.item = {
                item_id: specificPayload.item.item_id,
                item_name: specificPayload.item.item_name,
                item_category: specificPayload.item.item_category,
                price: specificPayload.item.price,
            };
            finalPayload.review = {
                review_id: specificPayload.review.review_id,
                rating: parseInt(specificPayload.review.rating),
                review_text: specificPayload.review.review_text,
                review_images_count: specificPayload.review.review_images_count,
                reviewer_name: specificPayload.review.reviewer_name
            };
            finalPayload.page_duration_seconds = pageDurationSeconds;
        } else if (eventName === 'view_page') {
            finalPayload.page_duration_seconds = pageDurationSeconds;
            finalPayload.scroll_depth_percentage = specificPayload.scroll_depth_percentage || null;
            finalPayload.page_referrer = document.referrer;
        } else if (eventName === 'view_product') {
            if (specificPayload.item) {
                finalPayload.item = {
                    item_id: specificPayload.item.item_id,
                    item_name: specificPayload.item.item_name,
                    item_brand: specificPayload.item.item_brand,
                    item_category: specificPayload.item.item_category,
                    price: specificPayload.item.price
                };
            } else {
                console.error(`[EventTracker] Missing 'item' for ${eventName}`);
                return;
            }
            finalPayload.page_duration_seconds = pageDurationSeconds;
        } else if (eventName === 'scroll_hover_event') {
            // Build the payload specifically for the new event, merging with common payload
            // This logic is now a simple copy of the specific payload, as seller_id and store_name
            // are already in commonPayload from the initial specificPayload
            finalPayload.section_name = specificPayload.section_name;
            finalPayload.event_type = specificPayload.event_type;
            finalPayload.scroll_depth_pct = specificPayload.scroll_depth_pct;
            finalPayload.referrer_url = document.referrer;
            finalPayload.utm_campaign = specificPayload.utm_campaign;
            finalPayload.utm_source = specificPayload.utm_source;
            finalPayload.utm_medium = specificPayload.utm_medium;
            finalPayload.device_type = getDeviceData().category;
            finalPayload.browser_name = getDeviceData().browser;
            finalPayload.os_type = getDeviceData().os;
            finalPayload.timestamp_utc = new Date().toISOString();
        } else if (eventName === 'product_hover_event') {
            // Build the payload for product hover, using a similar pattern
            finalPayload.section_name = specificPayload.section_name;
            finalPayload.event_type = specificPayload.event_type;
            finalPayload.referrer_url = document.referrer;
            finalPayload.utm_campaign = specificPayload.utm_campaign;
            finalPayload.utm_source = specificPayload.utm_source;
            finalPayload.utm_medium = specificPayload.utm_medium;
            finalPayload.device_type = getDeviceData().category;
            finalPayload.browser_name = getDeviceData().browser;
            finalPayload.os_type = getDeviceData().os;
            finalPayload.timestamp_utc = new Date().toISOString();
            if (specificPayload.item_name) {
                finalPayload.item_name = specificPayload.item_name;
            }
            if (specificPayload.item_category) {
                finalPayload.item_category = specificPayload.item_category;
            }
        } else if (eventName === 'view_promotion') {
            if (specificPayload.promotion) {
                finalPayload.promotion = {
                    promotion_id: specificPayload.promotion.promotion_id,
                    promotion_name: specificPayload.promotion.promotion_name,
                    creative_name: specificPayload.promotion.creative_name
                };
            } else {
                console.error(`[EventTracker] Missing 'promotion' for ${eventName}`);
                return;
            }
            if (specificPayload.creative_slot === undefined || specificPayload.creative_slot === null) {
                console.error(`[EventTracker] Missing required 'creative_slot' for ${eventName}`);
                return;
            }
            finalPayload.creative_slot = specificPayload.creative_slot;
            finalPayload.page_duration_seconds = pageDurationSeconds;
        } else if (eventName === 'view_user_reviews') {
            if (specificPayload.item) {
                finalPayload.item = {
                    item_id: specificPayload.item.item_id,
                    item_name: specificPayload.item.item_name,
                    item_category: specificPayload.item.item_category,
                    price: specificPayload.item.price
                };
            } else {
                console.error(`[EventTracker] Missing 'item' for ${eventName}`);
                return;
            }
            finalPayload.viewed_reviews_count = specificPayload.viewed_reviews_count || null;
            finalPayload.page_duration_seconds = pageDurationSeconds;
            finalPayload.reviews_scroll_depth_percentage = specificPayload.reviews_scroll_depth_percentage || null;
            finalPayload.review_sort_order = specificPayload.review_sort_order || null;
        } else if (eventName === 'item_click' || eventName === 'item_time_realtime' || eventName === 'item_time_final') {
            // This is the new, shared logic for item_time events based on your schema
            finalPayload.item_id = specificPayload.item_id;
            finalPayload.duration_on_item = specificPayload.duration_on_item || null;
            finalPayload.engagement_level = specificPayload.engagement_level;
        }
        // For 'click' and 'session_start', commonPayload is sufficient as per your provided schemas.

        const payload = JSON.stringify(finalPayload);
        console.log(`[EventTracker] Preparing to send event: ${eventName}`);
        console.log(`[EventTracker] Target URL: ${url}`);
        console.log(`[EventTracker] Payload (JSON string):`, payload);
        console.log(`[EventTracker] Payload (Parsed Object):`, finalPayload);
        fetch(url, {
                method: 'POST',
                body: payload,
                headers: {
                    'Content-Type': 'application/json'
                },
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
        console.log(`[EventTracker] Fired Event: ${eventName}`);
    };

    // New function to track a user's first visit to a specific store
    const trackFirstStoreVisit = (storeName) => {
        const userId = getOrCreateUserId();
        const storeVisitKey = `first_store_visit_tracked_for_${userId}_${storeName}`;
        if (!sessionStorage.getItem(storeVisitKey)) {
            const sellerId = SELLER_ID_MAP[storeName];
            if (sellerId) {
                track('first_store_visit', {
                    store_name: storeName,
                    seller_id: sellerId
                });
                sessionStorage.setItem(storeVisitKey, 'true');
            } else {
                console.warn(`[EventTracker] No seller_id found for store: ${storeName}`);
            }
        }
    };


    const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
    let inactivityTimer;
    let lastActivityTime;
    const resetInactivityTimer = () => {
        clearTimeout(inactivityTimer);
        lastActivityTime = Date.now();
        sessionStorage.setItem(`session_last_activity_${currentUserId}`, lastActivityTime);
        inactivityTimer = setTimeout(endCurrentSession, SESSION_TIMEOUT_MS);
    };

    const endCurrentSession = () => {
        if (!currentUserId || !sessionStorage.getItem(`session_id_${currentUserId}`)) {
            return;
        }
        const sessionStartTimeMs = parseInt(sessionStorage.getItem(`session_start_time_${currentUserId}`) || Date.now());
        const sessionDurationSeconds = Math.round((Date.now() - sessionStartTimeMs) / 1000);

        const {
            seller_id,
            store_name
        } = getEventContext();

        // UPDATED: Only track session_time if seller_id and store_name are present.
        if (seller_id && store_name) {
            track('session_time', {
                session_duration: sessionDurationSeconds,
                seller_id: seller_id,
                store_name: store_name
            });
        } else {
            console.warn('[EventTracker] Session ended without a valid store context. Skipping session_time event.');
        }

        sessionStorage.removeItem(`session_id_${currentUserId}`);
        sessionStorage.removeItem(`session_start_time_${currentUserId}`);
        sessionStorage.removeItem(`session_last_activity_${currentUserId}`);
    };

    const startNewSession = () => {
        const newSessionId = 'session-' + currentUserId + '-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        sessionStorage.setItem(`session_id_${currentUserId}`, newSessionId);
        sessionStorage.setItem(`session_start_time_${currentUserId}`, Date.now());
        track('session_start');
        resetInactivityTimer();
    };
    const init = () => {
        getOrCreateUserId();
        const lastActivity = parseInt(sessionStorage.getItem(`session_last_activity_${currentUserId}`) || 0);
        const now = Date.now();
        if (now - lastActivity > SESSION_TIMEOUT_MS) {
            startNewSession();
        } else {
            resetInactivityTimer();
        }

        ['mousemove', 'mousedown', 'keydown', 'touchstart'].forEach(event => {
            window.addEventListener(event, resetInactivityTimer, {
                passive: true
            });
        });

        const resetScrollTracker = () => {
            pageStartTime = Date.now();
        };
        window.addEventListener('hashchange', resetScrollTracker);
        window.addEventListener('beforeunload', EventTracker._endCurrentSessionInternal);
    };

    const setUserId = (newUserId) => {
        if (typeof newUserId === 'string' && newUserId.trim() !== '') {
            const oldUserId = currentUserId;
            currentUserId = newUserId;
            sessionStorage.setItem('user_id', newUserId);
            if (oldUserId !== newUserId) {
                // The original 'first_visit' logic is still here, but now it fires on a new user ID being set.
                const firstVisitKey = `first_visit_tracked_for_${newUserId}`;
                if (!sessionStorage.getItem(firstVisitKey)) {
                    track('first_visit');
                    sessionStorage.setItem(firstVisitKey, 'true');
                }
            }
        } else {
            console.warn("[EventTracker] Invalid user ID provided to setUserId:", newUserId);
        }
    };

    const clearUserId = () => {
        currentUserId = null;
        sessionStorage.removeItem('user_id');
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key.startsWith('first_visit_tracked_for_') || key.startsWith('first_store_visit_tracked_for_')) {
                sessionStorage.removeItem(key);
            }
        }
    };

    const getPageDuration = () => {
        return Math.round((Date.now() - pageStartTime) / 1000);
    };

    // Helper function to get the current store context from the URL hash
    const getEventContext = () => {
        const hash = window.location.hash.substring(1);
        const context = {
            seller_id: null,
            store_name: null
        };

        if (hash.startsWith('store=')) {
            const storeName = decodeURIComponent(hash.split('=')[1]);
            context.store_name = storeName;
            context.seller_id = SELLER_ID_MAP[storeName] || null;
        } else if (hash.startsWith('product=')) {
            const productId = hash.split('=')[1];
            const product = products.find(p => p.id === productId);
            if (product) {
                context.store_name = product.store;
                context.seller_id = SELLER_ID_MAP[product.store] || null;
            }
        }
        return context;
    };

    return {
        init,
        track,
        setUserId,
        clearUserId,
        getSellerId: (storeName) => SELLER_ID_MAP[storeName] || null,
        _endCurrentSessionInternal: endCurrentSession,
        getPageDuration,
        trackFirstStoreVisit,
        getEventContext,
        SELLER_ID_MAP, // Expose for external use in observer
        SECTION_TO_STORE_NAME_MAP, // Expose for external use in observer
        REVERSE_SELLER_ID_MAP // Expose for external use in observer
    };
})();

// MOCK PRODUCT DATA
const products = [
    { id: 'bn002', name: 'Atomic Habits', category: 'Books', store: 'The Book Nook', price: 22.5, image: 'https://placehold.co/600x400/5f4b8b/fff?text=Atomic+Habits', moreImages: ['https://placehold.co/600x400/5f4b8b/fff?text=Book+-+Spine', 'https://placehold.co/600x400/5f4b8b/fff?text=Book+-+Author'], description: 'An easy & proven way to build good habits & break bad ones.', brand: 'Avery', variant: 'Paperback' },
    { id: 'bn005', name: 'The Midnight Library', category: 'Books', store: 'The Book Nook', price: 17.5, image: 'https://placehold.co/600x400/7a9e9f/fff?text=Midnight+Library', moreImages: ['https://placehold.co/600x400/7a9e9f/fff?text=Book+-+Shelf', 'https://placehold.co/600x400/7a9e9f/fff?text=Book+-+Quotes'], description: 'A heartwarming and philosophical tale about life choices.', brand: 'Viking', variant: 'Hardcover' },
    { id: 'bn010', name: 'The Alchemist', category: 'Books', store: 'The Book Nook', price: 13.0, image: 'https://placehold.co/600x400/d2a33f/fff?text=The+Alchemist', moreImages: ['https://placehold.co/600x400/d2a33f/fff?text=Book+-+Spine', 'https://placehold.co/600x400/d2a33f/fff?text=Book+-+Pages'], description: 'An allegorical novel about a shepherd boy who journeys to find treasure.', brand: 'HarperOne', variant: 'Paperback' },
    { id: 'bn007', name: 'Educated', category: 'Books', store: 'The Book Nook', price: 18.0, image: 'https://placehold.co/600x400/d4a373/333?text=Educated+Memoir', moreImages: ['https://placehold.co/600x400/d4a373/333?text=Book+-+Spine', 'https://placehold.co/600x400/d4a373/333?text=Book+-+Pages'], description: 'A memoir of a young girl who pursued knowledge despite a tyrannical father.', brand: 'Random House', variant: 'Paperback' },
    { id: 'bn003', name: 'Where the Crawdads Sing', category: 'Books', store: 'The Book Nook', price: 16.0, image: 'https://placehold.co/600x400/e0b686/fff?text=Crawdads+Sing', moreImages: ['https://placehold.co/600x400/e0b686/fff?text=Book+-+Landscape', 'https://placehold.co/600x400/e0b686/fff?text=Book+-+Pages'], description: 'A captivating mystery and coming-of-age story.', brand: 'G.P. Putnam\'s Sons', variant: 'Paperback' },
    { id: 'bn009', name: 'The Great Gatsby', category: 'Books', store: 'The Book Nook', price: 12.0, image: 'https://placehold.co/600x400/4c6767/fff?text=Gatsby+Novel', moreImages: ['https://placehold.co/600x400/4c6767/fff?text=Book+-+Quote', 'https://placehold.co/600x400/4c6767/fff?text=Book+-+Back'], description: 'A classic novel of the Jazz Age, love, and the American Dream.', brand: 'Scribner', variant: 'Paperback' },
    { id: 'bn001', name: 'The Silent Patient', category: 'Books', store: 'The Book Nook', price: 15.0, image: 'https://placehold.co/600x400/4a4e69/fff?text=The+Silent+Patient', moreImages: ['https://placehold.co/600x400/4a4e69/fff?text=Book+-+Cover', 'https://placehold.co/600x400/4a4e69/fff?text=Book+-+Back'], description: 'A shocking psychological thriller with a brilliant twist.', brand: 'Celadon Books', variant: 'Hardcover' },
    { id: 'bn008', name: 'Sapiens: A Brief History of Humankind', category: 'Books', store: 'The Book Nook', price: 25.0, image: 'https://placehold.co/600x400/c77dff/fff?text=Sapiens+Book', moreImages: ['https://placehold.co/600x400/c77dff/fff?text=Book+-+Cover', 'https://placehold.co/600x400/c77dff/fff?text=Book+-+Charts'], description: 'A sweeping history of Homo sapiens from the Stone Age to the present.', brand: 'Harper Perennial', variant: 'Paperback' },
    { id: 'bn006', name: 'Becoming', category: 'Books', store: 'The Book Nook', price: 20.0, image: 'https://placehold.co/600x400/5e503f/fff?text=Becoming+Memoir', moreImages: ['https://placehold.co/600x400/5e503f/fff?text=Book+-+Author', 'https://placehold.co/600x400/5e503f/fff?text=Book+-+Dedication'], description: 'Michelle Obama\'s intimate, powerful, and inspiring memoir.', brand: 'Crown', variant: 'Hardcover' },
    { id: 'bn004', name: 'Dune', category: 'Books', store: 'The Book Nook', price: 14.0, image: 'https://placehold.co/600x400/2a2a2a/fff?text=Dune+Novel', moreImages: ['https://placehold.co/600x400/2a2a2a/fff?text=Book+-+Cover', 'https://placehold.co/600x400/2a2a2a/fff?text=Book+-+Back'], description: 'The seminal science fiction epic of a desert planet and its messiah.', brand: 'Ace Books', variant: 'Paperback' },

    { id: 'f010', name: 'Running Shorts', category: 'Fashion', store: 'Trendy Threads', price: 29.0, image: 'https://placehold.co/600x400/1e2a44/fff?text=Running+Shorts', moreImages: ['https://placehold.co/600x400/1e2a44/fff?text=Shorts+-+Waistband', 'https://placehold.co/600x400/1e2a44/fff?text=Shorts+-+Detail'], description: 'Lightweight and breathable shorts for your runs.', brand: 'ActiveFit', variant: 'Black-M' },
    { id: 'f001', name: 'Elegant Evening Dress', category: 'Fashion', store: 'Trendy Threads', price: 89.99, image: 'https://placehold.co/600x400/a55447/fff?text=Elegant+Dress', moreImages: ['https://placehold.co/600x400/a55447/fff?text=Dress+-+Front', 'https://placehold.co/600x400/a55447/fff?text=Dress+-+Back'], description: 'A stunning dress perfect for evening events. Made from high-quality silk blend.', brand: 'Glamourous Attire', variant: 'Blue-Large' },
    { id: 'f006', name: 'Sporty Sneakers', category: 'Fashion', store: 'Trendy Threads', price: 65.0, image: 'https://placehold.co/600x400/586f7c/fff?text=Sporty+Sneakers', moreImages: ['https://placehold.co/600x400/586f7c/fff?text=Sneakers+-+Side', 'https://placehold.co/600x400/586f7c/fff?text=Sneakers+-+Sole'], description: 'Comfortable and stylish sneakers for everyday wear.', brand: 'StrideFoot', variant: 'Black-Size9' },
    { id: 'f007', name: 'Leather Crossbody Bag', category: 'Fashion', store: 'Trendy Threads', price: 120.0, image: 'https://placehold.co/600x400/9b7e77/fff?text=Crossbody+Bag', moreImages: ['https://placehold.co/600x400/9b7e77/fff?text=Bag+-+Open', 'https://placehold.co/600x400/9b7e77/fff?text=Bag+-+Strap'], description: 'A chic and practical leather bag with adjustable strap.', brand: 'Elegance Carry', variant: 'Brown' },
    { id: 'f003', name: 'High-Waisted Denim Jeans', category: 'Fashion', store: 'Trendy Threads', price: 49.99, image: 'https://placehold.co/600x400/3d5162/fff?text=Denim+Jeans', moreImages: ['https://placehold.co/600x400/3d5162/fff?text=Jeans+-+Texture', 'https://placehold.co/600x400/3d5162/fff?text=Jeans+-+Fit'], description: 'Classic high-waisted denim jeans with a modern fit. Durable and stylish.', brand: 'Denim Dreams', variant: 'Blue-Size28' },
    { id: 'f002', name: 'Mens Slim Fit Shirt', category: 'Fashion', store: 'Trendy Threads', price: 34.99, image: 'https://placehold.co/600x400/6f594e/fff?text=Slim+Fit+Shirt', moreImages: ['https://placehold.co/600x400/6f594e/fff?text=Shirt+-+Detail', 'https://placehold.co/600x400/6f594e/fff?text=Shirt+-+Model'], description: 'A crisp, slim-fit shirt made from 100% breathable cotton. Ideal for work or casual wear.', brand: 'Gentleman\'s Choice', variant: 'White-Medium' },
    { id: 'f005', name: 'Womens Floral Blouse', category: 'Fashion', store: 'Trendy Threads', price: 27.5, image: 'https://placehold.co/600x400/f08080/fff?text=Floral+Blouse', moreImages: ['https://placehold.co/600x400/f08080/fff?text=Blouse+-+Detail', 'https://placehold.co/600x400/f08080/fff?text=Blouse+-+Model'], description: 'A beautiful floral blouse perfect for spring and summer.', brand: 'BloomWear', variant: 'Multi-color-S' },
    { id: 'f009', name: 'Aviator Sunglasses', category: 'Fashion', store: 'Trendy Threads', price: 25.0, image: 'https://placehold.co/600x400/f3c623/333?text=Aviator+Sunglasses', moreImages: ['https://placehold.co/600x400/f3c623/333?text=Sunglasses+-+Case', 'https://placehold.co/600x400/f3c623/333?text=Sunglasses+-+Side'], description: 'Classic aviator sunglasses with UV protection.', brand: 'VisionPro', variant: 'Gold Frame' },
    { id: 'f004', name: 'Classic Summer Hat', category: 'Fashion', store: 'Trendy Threads', price: 18.0, image: 'https://placehold.co/600x400/e8d5b5/333?text=Summer+Hat', moreImages: ['https://placehold.co/600x400/e8d5b5/333?text=Hat+-+Side', 'https://placehold.co/600x400/e8d5b5/333?text=Hat+-+Top'], description: 'Protect yourself from the sun with this timeless and fashionable summer hat.', brand: 'SunShield', variant: 'Straw-Beige' },
    { id: 'f008', name: 'Cozy Knit Sweater', category: 'Fashion', store: 'Trendy Threads', price: 55.0, image: 'https://placehold.co/600x400/4c4c4c/fff?text=Knit+Sweater', moreImages: ['https://placehold.co/600x400/4c4c4c/fff?text=Sweater+-+Texture', 'https://placehold.co/600x400/4c4c4c/fff?text=Sweater+-+Fit'], description: 'Soft and warm knit sweater, perfect for chilly evenings.', brand: 'WarmWeave', variant: 'Grey-L' },
    { id: 'te010', name: 'Mesh Wi-Fi System', category: 'Mobiles/Computers', store: 'Tech Emporium', price: 199.0, image: 'https://placehold.co/600x400/333333/fff?text=Mesh+WiFi', moreImages: ['https://placehold.co/600x400/333333/fff?text=WiFi+-+Back', 'https://placehold.co/600x400/333333/fff?text=WiFi+-+Lights'], description: 'Eliminate dead zones with seamless whole-home Wi-Fi coverage.', brand: 'HomeNet', variant: '3-Pack' },
    { id: 'te001', name: 'Flagship Smartphone Pro', category: 'Mobiles/Computers', store: 'Tech Emporium', price: 999.0, image: 'https://placehold.co/600x400/2f5d62/fff?text=Smartphone', moreImages: ['https://placehold.co/600x400/2f5d62/fff?text=Phone+-+Screen', 'https://placehold.co/600x400/2f5d62/fff?text=Phone+-+Camera'], description: 'The latest flagship smartphone with a stunning display and pro-grade camera system.', brand: 'ApexTech', variant: 'Midnight Black-512GB' },
    { id: 'te008', name: 'Smartwatch Series X', category: 'Mobiles/Computers', store: 'Tech Emporium', price: 299.0, image: 'https://placehold.co/600x400/4c4b63/fff?text=Smartwatch', moreImages: ['https://placehold.co/600x400/4c4b63/fff?text=Smartwatch+-+Face', 'https://placehold.co/600x400/4c4b63/fff?text=Smartwatch+-+Strap'], description: 'Stay connected and track your fitness with this advanced smartwatch.', brand: 'HealthTech', variant: 'Midnight Blue' },
    { id: 'te006', name: '4K UHD Monitor', category: 'Mobiles/Computers', store: 'Tech Emporium', price: 350.0, image: 'https://placehold.co/600x400/8d8d8d/fff?text=4K+Monitor', moreImages: ['https://placehold.co/600x400/8d8d8d/fff?text=Monitor+-+Screen', 'https://placehold.co/600x400/8d8d8d/fff?text=Monitor+-+Ports'], description: 'Stunning 4K resolution monitor for crystal-clear visuals.', brand: 'VividDisplay', variant: '27-inch' },
    { id: 'te003', name: 'Noise-Cancelling Headphones', category: 'Mobiles/Computers', store: 'Tech Emporium', price: 149.0, image: 'https://placehold.co/600x400/525252/fff?text=Headphones', moreImages: ['https://placehold.co/600x400/525252/fff?text=Headphones+-+Side', 'https://placehold.co/600x400/525252/fff?text=Headphones+-+Padded'], description: 'Immerse yourself in sound with these top-tier noise-cancelling headphones.', brand: 'SoundScape', variant: 'Matte Black' },
    { id: 'te009', name: 'Webcam Pro HD', category: 'Mobiles/Computers', store: 'Tech Emporium', price: 75.0, image: 'https://placehold.co/600x400/30475e/fff?text=Webcam', moreImages: ['https://placehold.co/600x400/30475e/fff?text=Webcam+-+Mounted', 'https://placehold.co/600x400/30475e/fff?text=Webcam+-+USB'], description: 'High-definition webcam for clear video calls and streaming.', brand: 'StreamCam', variant: '1080p' },
    { id: 'te002', name: 'Ultra-Thin Laptop Air', category: 'Mobiles/Computers', store: 'Tech Emporium', price: 1350.0, image: 'https://placehold.co/600x400/94b0da/333?text=Laptop', moreImages: ['https://placehold.co/600x400/94b0da/333?text=Laptop+-+Open', 'https://placehold.co/600x400/94b0da/333?text=Laptop+-+Keyboard'], description: 'Incredibly light and powerful, this laptop is perfect for professionals on the go.', brand: 'FeatherLight', variant: 'Silver-16GB RAM' },
    { id: 'te005', name: 'Wireless Ergonomic Mouse', category: 'Mobiles/Computers', store: 'Tech Emporium', price: 45.0, image: 'https://placehold.co/600x400/b8b8b8/333?text=Wireless+Mouse', moreImages: ['https://placehold.co/600x400/b8b8b8/333?text=Mouse+-+Detail', 'https://placehold.co/600x400/b8b8b8/333?text=Mouse+-+Side'], description: 'Comfortable and precise wireless mouse for extended use.', brand: 'ErgoGlide', variant: 'Graphite' },
    { id: 'te007', name: 'Portable SSD 1TB', category: 'Mobiles/Computers', store: 'Tech Emporium', price: 110.0, image: 'https://placehold.co/600x400/007bff/fff?text=Portable+SSD', moreImages: ['https://placehold.co/600x400/007bff/fff?text=SSD+-+Compact', 'https://placehold.co/600x400/007bff/fff?text=SSD+-+USB+C'], description: 'Fast and compact external solid-state drive for all your data.', brand: 'SpeedyStore', variant: 'USB-C' },
    { id: 'te004', name: 'Gaming Desktop PC', category: 'Mobiles/Computers', store: 'Tech Emporium', price: 1800.0, image: 'https://placehold.co/600x400/1f4a4d/fff?text=Gaming+PC', moreImages: ['https://placehold.co/600x400/1f4a4d/fff?text=PC+-+RGB+Case', 'https://placehold.co/600x400/1f4a4d/fff?text=PC+-+Setup'], description: 'High-performance gaming PC for an unparalleled gaming experience.', brand: 'GamerForge', variant: 'RTX 4070-16GB RAM' },

    { id: 'az002', name: 'Resistance Band Set', category: 'Sports', store: 'Active Zone', price: 18.0, image: 'https://placehold.co/600x400/94d2bd/333?text=Resistance+Bands', moreImages: ['https://placehold.co/600x400/94d2bd/333?text=Bands+-+Colors', 'https://placehold.co/600x400/94d2bd/333?text=Bands+-+Set'], description: 'Versatile resistance bands for full-body workouts.', brand: 'FitFlex', variant: 'Light-Heavy' },
    { id: 'az005', name: 'Fitness Tracker Watch', category: 'Sports', store: 'Active Zone', price: 80.0, image: 'https://placehold.co/600x400/386641/fff?text=Fitness+Tracker', moreImages: ['https://placehold.co/600x400/386641/fff?text=Tracker+-+Watchface', 'https://placehold.co/600x400/386641/fff?text=Tracker+-+Band'], description: 'Monitor heart rate, steps, and sleep with this advanced tracker.', brand: 'PacePro', variant: 'Black' },
    { id: 'az010', name: 'Swimming Goggles Anti-Fog', category: 'Sports', store: 'Active Zone', price: 15.0, image: 'https://placehold.co/600x400/3a0ca3/fff?text=Swim+Goggles', moreImages: ['https://placehold.co/600x400/3a0ca3/fff?text=Goggles+-+Front', 'https://placehold.co/600x400/3a0ca3/fff?text=Goggles+-+Strap'], description: 'Comfortable and anti-fog goggles for clear underwater vision.', brand: 'DiveClear', variant: 'Blue' },
    { id: 'az004', name: 'Dumbbell Set Adjustable', category: 'Sports', store: 'Active Zone', price: 120.0, image: 'https://placehold.co/600x400/7678ed/fff?text=Dumbbell+Set', moreImages: ['https://placehold.co/600x400/7678ed/fff?text=Dumbbell+-+Weight', 'https://placehold.co/600x400/7678ed/fff?text=Dumbbell+-+Handle'], description: 'Space-saving adjustable dumbbells for various weights.', brand: 'IronFit', variant: '5-50lbs' },
    { id: 'az003', name: 'Smart Jump Rope', category: 'Sports', store: 'Active Zone', price: 35.0, image: 'https://placehold.co/600x400/1b4332/fff?text=Smart+Jump+Rope', moreImages: ['https://placehold.co/600x400/1b4332/fff?text=Rope+-+Handle', 'https://placehold.co/600x400/1b4332/fff?text=Rope+-+Display'], description: 'Track your jumps and calories with this smart jump rope.', brand: 'LeapMetric', variant: 'Digital' },
    { id: 'az007', name: 'Basketball Official Size', category: 'Sports', store: 'Active Zone', price: 30.0, image: 'https://placehold.co/600x400/e9d8a6/333?text=Basketball', moreImages: ['https://placehold.co/600x400/e9d8a6/333?text=Ball+-+Texture', 'https://placehold.co/600x400/e9d8a6/333?text=Ball+-+Bounce'], description: 'Durable basketball for indoor and outdoor play.', brand: 'HoopStar', variant: 'Size 7' },
    { id: 'az001', name: 'Yoga Mat Premium', category: 'Sports', store: 'Active Zone', price: 25.0, image: 'https://placehold.co/600x400/52b788/fff?text=Yoga+Mat', moreImages: ['https://placehold.co/600x400/52b788/fff?text=Mat+-+Rolled', 'https://placehold.co/600x400/52b788/fff?text=Mat+-+Texture'], description: 'Durable and comfortable yoga mat for all your fitness needs.', brand: 'ZenFlow', variant: '6mm-Blue' },
    { id: 'az009', name: 'Tennis Racket Graphite', category: 'Sports', store: 'Active Zone', price: 90.0, image: 'https://placehold.co/600x400/ef233c/fff?text=Tennis+Racket', moreImages: ['https://placehold.co/600x400/ef233c/fff?text=Racket+-+Grip', 'https://placehold.co/600x400/ef233c/fff?text=Racket+-+Strings'], description: 'Lightweight graphite racket for enhanced power and control.', brand: 'SmashPro', variant: 'Grip 2' },
    { id: 'az008', name: 'Soccer Ball Training', category: 'Sports', store: 'Active Zone', price: 22.0, image: 'https://placehold.co/600x400/1a759f/fff?text=Soccer+Ball', moreImages: ['https://placehold.co/600x400/1a759f/fff?text=Ball+-+Close+Up', 'https://placehold.co/600x400/1a759f/fff?text=Ball+-+Flight'], description: 'High-quality soccer ball for practice and casual games.', brand: 'KickMaster', variant: 'Size 5' },
    { id: 'az006', name: 'Cycling Helmet Aerodynamic', category: 'Sports', store: 'Active Zone', price: 60.0, image: 'https://placehold.co/600x400/fca311/333?text=Cycling+Helmet', moreImages: ['https://placehold.co/600x400/fca311/333?text=Helmet+-+Side', 'https://placehold.co/600x400/fca311/333?text=Helmet+-+Vents'], description: 'Lightweight and aerodynamic helmet for road cycling.', brand: 'AeroRide', variant: 'White-M' },
];

// MOCK STORE DATA
const stores = [
    { id: 'trendy-threads', name: 'Trendy Threads', image: 'https://placehold.co/600x400/a55447/fff?text=Trendy+Threads' },
    { id: 'tech-emporium', name: 'Tech Emporium', image: 'https://placehold.co/600x400/2f5d62/fff?text=Tech+Emporium' },
    { id: 'the-book-nook', name: 'The Book Nook', image: 'https://placehold.co/600x400/4a4e69/fff?text=The+Book+Nook' },
    { id: 'active-zone', name: 'Active Zone', image: 'https://placehold.co/600x400/52b788/fff?text=Active+Zone' },
];

// MOCK CATEGORY DATA
const categories = [
    { name: 'Fashion' },
    { name: 'Mobiles/Computers' },
    { name: 'Books' },
    { name: 'Sports' }
];

// --- Global State & DOM Elements ---
let cartItems = [];
let currentPage = 'main';
const mainPage = document.getElementById('main-page');
const storesPage = document.getElementById('stores-page');
const categoryPage = document.getElementById('category-page');
const cartPage = document.getElementById('cart-page');
const productDetailPage = document.getElementById('product-detail-page');
const cartIconMain = document.getElementById('cart-icon');
const cartCountMain = document.getElementById('cart-count');
const cartIconCategory = document.getElementById('cart-icon-category');
const cartCountCategory = document.getElementById('cart-count-category');
const cartIconDetail = document.getElementById('cart-icon-detail');
const cartCountDetail = document.getElementById('cart-count-detail');
const cartIconStore = document.getElementById('cart-icon-store');
const cartCountStore = document.getElementById('cart-count-store');
const storesContainer = document.getElementById('stores-container');
const categoriesContainer = document.getElementById('categories-container');
const productList = document.getElementById('product-list');
const backToMainBtnCategory = document.getElementById('back-to-main-btn-category');
const backToMainBtnCart = document.getElementById('back-to-main-btn-cart');
const backFromDetailBtn = document.getElementById('back-from-detail-btn');
const productDetailImage = document.getElementById('product-image');
const productDetailName = document.getElementById('product-name');
const productDetailCategory = document.getElementById('product-category');
const productDetailDescription = document.getElementById('product-description');
const productDetailPrice = document.getElementById('product-price');
const detailAddToCartBtn = document.getElementById('detail-add-to-cart-btn');
const toggleDetailsBtn = document.getElementById('toggle-details-btn');
const allDetailsSection = document.getElementById('all-details-section');
const reviewsDisplayArea = document.getElementById('reviews-display-area');
const reviewRatingSelect = document.getElementById('review-rating');
const reviewTextarea = document.getElementById('review-text');
const submitReviewBtn = document.getElementById('submit-review-btn');
const viewReviewsBtn = document.getElementById('view-reviews-btn');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartTotalSpan = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');
const emptyCartMessage = document.getElementById('empty-cart-message');
const cartSummary = document.getElementById('cart-summary');
const categoryPageTitle = document.getElementById('category-page-title');
const storePageTitle = document.getElementById('store-page-title');
const backToMainBtnStore = document.getElementById('back-to-main-btn-store');

let productDetailStartTime = null;
let highInterestTimer = null; // New global timer for high-interest event
const HIGH_INTEREST_THRESHOLD_MS = 40 * 1000; // 40 seconds
let storePageStartTime = null;

// Image viewer elements
const imageViewer = document.getElementById('image-viewer');
const sliderWrapper = document.getElementById('slider-images-wrapper');
const sliderPrevBtn = document.getElementById('slider-prev-btn');
const sliderNextBtn = document.getElementById('slider-next-btn');
let currentImageIndex = 0;
let currentImageUrls = [];
let zoomStartTime = null;


function showImageViewer(imageUrls, startIndex = 0) {
    currentImageUrls = imageUrls;
    currentImageIndex = startIndex;

    if (sliderWrapper) {
        sliderWrapper.innerHTML = '';
        imageUrls.forEach((url, index) => {
            const img = document.createElement('img');
            img.src = url;
            img.alt = `Product image ${index + 1}`;
            img.className = 'slider-image max-w-full max-h-[90vh] object-contain';
            if (sliderWrapper) {
                sliderWrapper.appendChild(img);
            }
        });
        updateSliderPosition();
    }

    if (imageViewer) {
        imageViewer.classList.add('visible');
    }
    document.body.style.overflow = 'hidden';

    if (imageUrls.length > 1) {
        if (sliderPrevBtn) sliderPrevBtn.classList.remove('hidden');
        if (sliderNextBtn) sliderNextBtn.classList.remove('hidden');
    } else {
        if (sliderPrevBtn) sliderPrevBtn.classList.add('hidden');
        if (sliderNextBtn) sliderNextBtn.classList.add('hidden');
    }
    const activePageElement = document.querySelector('#product-detail-page:not(.hidden)');
    if (activePageElement) {
        const productId = window.location.hash.split('=')[1];
        const product = products.find(p => p.id === productId);
        if (product) {
            zoomStartTime = Date.now();
            EventTracker.track('product_image_zoom', {
                seller_id: EventTracker.getSellerId(product.store),
                store_name: product.store,
                zoom_level: 1,
                item: {
                    item_id: product.id,
                    item_name: product.name,
                },
                image_details: {
                    image_url: imageUrls[startIndex],
                    image_position: startIndex + 1,
                },
            });
        }
    }
}

function hideImageViewer() {
    if (zoomStartTime) {
        const zoomDurationSeconds = Math.round((Date.now() - zoomStartTime) / 1000);
        const productId = window.location.hash.split('=')[1];
        const product = products.find(p => p.id === productId);
        if (product) {
            EventTracker.track('product_image_zoom', {
                seller_id: EventTracker.getSellerId(product.store),
                store_name: product.store,
                zoom_level: 1,
                zoom_duration_seconds: zoomDurationSeconds,
                item: {
                    item_id: product.id,
                    item_name: product.name,
                },
                image_details: {
                    image_url: currentImageUrls[currentImageIndex],
                    image_position: currentImageIndex + 1,
                },
            });
        }
        zoomStartTime = null;
    }
    imageViewer.classList.remove('visible');
    document.body.style.overflow = 'auto';
}


// --- UPDATED showNextImage function to track image views ---
function showNextImage() {
    if (currentImageUrls.length <= 1) return;
    currentImageIndex = (currentImageIndex + 1) % currentImageUrls.length;
    updateSliderPosition();

    const productId = window.location.hash.split('=')[1];
    const product = products.find(p => p.id === productId);
    if (product) {
        EventTracker.track('product_image_view', {
            seller_id: EventTracker.getSellerId(product.store),
            store_name: product.store,
            item: {
                item_id: product.id,
                item_name: product.name,
                item_category: product.category,
                price: product.price
            },
            image_details: {
                image_url: currentImageUrls[currentImageIndex],
                image_position: currentImageIndex + 1
            }
        });
    }
}

// --- UPDATED showPrevImage function to track image views ---
function showPrevImage() {
    if (currentImageUrls.length <= 1) return;
    currentImageIndex = (currentImageIndex - 1 + currentImageUrls.length) % currentImageUrls.length;
    updateSliderPosition();

    const productId = window.location.hash.split('=')[1];
    const product = products.find(p => p.id === productId);
    if (product) {
        EventTracker.track('product_image_view', {
            seller_id: EventTracker.getSellerId(product.store),
            store_name: product.store,
            item: {
                item_id: product.id,
                item_name: product.name,
                item_category: product.category,
                price: product.price
            },
            image_details: {
                image_url: currentImageUrls[currentImageIndex],
                image_position: currentImageIndex + 1
            }
        });
    }
}


function updateSliderPosition() {
    const images = sliderWrapper.querySelectorAll('.slider-image');
    images.forEach((img, index) => {
        img.style.display = index === currentImageIndex ? 'block' : 'none';
    });
}


function hideAllPages() {
    mainPage.classList.add('hidden');
    storesPage.classList.add('hidden');
    categoryPage.classList.add('hidden');
    cartPage.classList.add('hidden');
    productDetailPage.classList.add('hidden');
}

function showPage(pageName, options = {}) {
    // Before hiding the current page, check if it was a store page and track the duration
    if (currentPage === 'store' && storePageStartTime) {
        const storeDurationSeconds = Math.round((Date.now() - storePageStartTime) / 1000);
        const storeName = window.location.hash.substring(1).split('=')[1];
        if (storeName) {
            EventTracker.track('store_visit', {
                store_name: decodeURIComponent(storeName),
                seller_id: EventTracker.getSellerId(decodeURIComponent(storeName)),
                page_duration_seconds: storeDurationSeconds,
            });
        }
    }
    storePageStartTime = null; // Reset the timer

    hideAllPages();
    currentPage = pageName;

    let newHash = '';
    let sellerId = null;
    let storeName = null;
    if (pageName === 'store' && options.storeName) {
        newHash = `store=${encodeURIComponent(options.storeName)}`;
        storePageStartTime = Date.now(); // Start the timer for the new store page
        storeName = options.storeName;
        sellerId = EventTracker.getSellerId(storeName); // Track the new event here
    } else if (pageName === 'category' && options.category) {
        newHash = `category=${encodeURIComponent(options.category)}`;
    } else if (pageName === 'product-detail' && options.productId) {
        newHash = `product=${options.productId}`;
        const product = products.find(p => p.id === options.productId);
        if (product) {
            storeName = product.store;
            sellerId = EventTracker.getSellerId(storeName);
        }
    } else if (pageName === 'cart') {
        newHash = 'cart';
    } else if (pageName === 'main') {
        newHash = '';
    }

    if (window.location.hash.substring(1) !== newHash) {
        window.location.hash = newHash;
    }

    EventTracker.track('view_page', {
        seller_id: sellerId,
        store_name: storeName
    });
    switch (pageName) {
        case 'main':
            mainPage.classList.remove('hidden');
            renderStores();
            renderCategories();
            // Filter products to ensure they have a category and store
            const filteredProducts = products.filter(p => p.category && p.store);
            renderProducts(filteredProducts, productList);
            updateCartCounts();
            setupObserversForCurrentPage(); // Call here for the main page
            break;
        case 'store':
            storesPage.classList.remove('hidden');
            const storeProducts = products.filter(p => p.store === options.storeName);
            storePageTitle.textContent = options.storeName;
            const storeProductList = document.getElementById('store-product-list');
            if (storeProductList) { // Add null check for robustness
                storeProductList.dataset.section = options.storeName; // Set section name to store name
            }
            renderProducts(storeProducts, document.getElementById('store-product-list'));
            updateCartCounts();
            // Track store visit
            EventTracker.track('store_visit', {
                store_name: options.storeName,
                seller_id: EventTracker.getSellerId(options.storeName),
            });
            setupObserversForCurrentPage(); // Call here for the store page
            break;
        case 'category':
            categoryPage.classList.remove('hidden');
            const productsByCategory = products.filter(p => p.category === options.category);
            categoryPageTitle.textContent = options.category;
            const categoryProductList = document.getElementById('category-product-list');
            if (categoryProductList) {
                categoryProductList.dataset.section = options.category; // Set section name to category name
            }
            renderProducts(productsByCategory, categoryProductList);
            updateCartCounts();
            setupObserversForCurrentPage(); // Call here for the category page
            break;
        case 'cart':
            cartPage.classList.remove('hidden');
            renderCart();
            updateCartCounts();
            setupObserversForCurrentPage(); // Call here for the cart page (if it has observable elements)
            break;
        case 'product-detail':
            productDetailPage.classList.remove('hidden');
            renderProductDetail(options.productId);
            updateCartCounts();
            setupObserversForCurrentPage(); // Call here for the product detail page
            break;
        default:
            showPage('main');
    }
}

function renderStores() {
    storesContainer.innerHTML = '';
    stores.forEach(store => {
        const card = document.createElement('a');
        card.href = `#store=${encodeURIComponent(store.name)}`;
        card.className = 'store-card';
        card.innerHTML = `<h3 class="z-10">${store.name}</h3>`;
        storesContainer.appendChild(card);
    });
}

function renderProducts(productsToRender, container) {
    container.innerHTML = '';
    if (productsToRender.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center col-span-full">No products found.</p>';
        return;
    }

    productsToRender.slice(0, 10).forEach((product, index) => {
        const isBestSeller = index < 4;
        const productCard = document.createElement('a');
        productCard.href = `#product=${product.id}`;
        productCard.className = 'product-card block';
        // ADDED: attributes to pass product details for tracking
        productCard.dataset.productName = product.name;
        productCard.dataset.sellerId = EventTracker.getSellerId(product.store);
        productCard.dataset.productCategory = product.category;

        // NEW: Add click event listener to track the item_click event
        productCard.addEventListener('click', () => {
            const clickedProduct = products.find(p => p.id === product.id);
            if (clickedProduct) {
                EventTracker.track('item_click', {
                    seller_id: EventTracker.getSellerId(clickedProduct.store),
                    store_name: clickedProduct.store,
                    item_id: clickedProduct.id,
                    engagement_level: 'click'
                });
            }
        });

        productCard.innerHTML = `
            ${isBestSeller ? '<span class="best-seller-tag">Best Seller</span>' : ''}
            <img src="${product.image}" alt="${product.name}">
            <div class="product-card-body">
                <p class="category">${product.category}</p>
                <h3 class="h-12 overflow-hidden">${product.name}</h3>
                <p class="price">$${product.price.toFixed(2)}</p>
            </div>
        `;
        container.appendChild(productCard);
    });
}
function renderProductDetail(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) {
        productDetailPage.innerHTML = '<p class="text-red-500 text-center">Product not found.</p>';
        return;
    }

    const sellerId = EventTracker.getSellerId(product.store);

    EventTracker.track('view_product', {
        seller_id: sellerId,
        store_name: product.store,
        item: {
            item_id: product.id,
            item_name: product.name,
            price: product.price,
            item_category: product.category,
            item_brand: product.brand,
            item_variant: product.variant,
        }
    });

    // NEW: Track an image view event for the first image when the page loads
    EventTracker.track('product_image_view', {
        seller_id: sellerId,
        store_name: product.store,
        item: {
            item_id: product.id,
            item_name: product.name,
            item_category: product.category,
            price: product.price
        },
        image_details: {
            image_url: product.image,
            image_position: 1
        }
    });

    // Clear any existing timer before starting a new one
    if (highInterestTimer) {
        clearTimeout(highInterestTimer);
    }

    productDetailStartTime = Date.now();

    // Start a timer for the high-interest notification
    const HIGH_INTEREST_THRESHOLD_MS = 40 * 1000;
    highInterestTimer = setTimeout(() => {
        const product = products.find(p => p.id === productId);
        if (product) {
            EventTracker.track('item_time_realtime', {
                seller_id: sellerId,
                store_name: product.store,
                item_id: product.id,
                duration_on_item: HIGH_INTEREST_THRESHOLD_MS / 1000,
                engagement_level: 'high_realtime'
            });
        }
    }, HIGH_INTEREST_THRESHOLD_MS);

    productDetailImage.src = product.image;
    productDetailImage.alt = product.name;
    productDetailName.textContent = product.name;
    productDetailCategory.textContent = product.category;
    productDetailDescription.textContent = product.description;
    productDetailPrice.textContent = product.price.toFixed(2);
    detailAddToCartBtn.dataset.productId = product.id;

    const thumbnailGallery = document.getElementById('thumbnail-gallery');
    thumbnailGallery.innerHTML = '';
    const allImages = [product.image, ...(product.moreImages || [])];
    allImages.forEach((imgUrl, index) => {
        const img = document.createElement('img');
        img.src = imgUrl;
        img.alt = `${product.name} - Image ${index + 1}`;
        img.className = 'cursor-pointer';
        if (index === 0) {
            img.classList.add('active');
        }
        img.addEventListener('click', () => {
            productDetailImage.src = imgUrl;
            document.querySelectorAll('#thumbnail-gallery img').forEach(i => i.classList.remove('active'));
            img.classList.add('active');

            // NEW: Track image view when a thumbnail is clicked
            EventTracker.track('product_image_view', {
                seller_id: sellerId,
                store_name: product.store,
                item: {
                    item_id: product.id,
                    item_name: product.name,
                    item_category: product.category,
                    price: product.price
                },
                image_details: {
                    image_url: imgUrl,
                    image_position: index + 1
                }
            });
        });
        thumbnailGallery.appendChild(img);
    });

    document.getElementById('product-image').addEventListener('click', () => showImageViewer(allImages, 0));
    thumbnailGallery.querySelectorAll('img').forEach((img, index) => {
        img.addEventListener('click', () => showImageViewer(allImages, index)); // Pass index here
    });

    const existingReviewsSection = document.getElementById('reviews-section');
    if (existingReviewsSection) existingReviewsSection.remove();

    renderReviewSection(productId);

    // Default Product Details
    const defaultDetails = `
        <h5 class="text-xl font-bold mb-4">Product Details</h5>
        <p><strong>Brand:</strong> ${product.brand || 'N/A'}</p>
        <p><strong>Category:</strong> ${product.category || 'N/A'}</p>
        <p><strong>Delivery:</strong> Estimated delivery in 3-5 business days.</p>
        <p><strong>Quantity:</strong> Limited stock available. Buy now!</p>
        <p><strong>Highlights:</strong> High-quality materials, modern design, eco-friendly production.</p>
        <p><strong>Important Note:</strong> Colors may vary slightly due to lighting conditions.</p>
    `;

    // All Product Details including default ones
    const allDetails = `
        <h5 class="text-xl font-bold mb-4">Product Specifications</h5>
        <p><strong>Brand:</strong> ${product.brand || 'N/A'}</p>
        <p><strong>Category:</strong> ${product.category || 'N/A'}</p>
        <p><strong>Delivery:</strong> Estimated delivery in 3-5 business days.</p>
        <p><strong>Quantity:</strong> Limited stock available. Buy now!</p>
        <p><strong>Highlights:</strong> High-quality materials, modern design, eco-friendly production.</p>
        <p><strong>Important Note:</strong> Colors may vary slightly due to lighting conditions.</p>
        <p><strong>Product ID:</strong> ${product.id}</p>
        <p><strong>Variant:</strong> ${product.variant || 'N/A'}</p>
        <p><strong>Description:</strong> ${product.description || 'N/A'}</p>
    `;

    const allDetailsSection = document.getElementById('all-details-section');
    allDetailsSection.innerHTML = defaultDetails;
    allDetailsSection.classList.remove('hidden'); // Show default details by default
    toggleDetailsBtn.textContent = 'Show All Details';

    toggleDetailsBtn.onclick = () => {
        const isShowingAll = toggleDetailsBtn.textContent === 'Hide Details';
        if (!isShowingAll) {
            allDetailsSection.innerHTML = allDetails;
            toggleDetailsBtn.textContent = 'Hide Details';
            EventTracker.track('details_of_product', {
                seller_id: sellerId,
                store_name: product.store,
                item: {
                    item_id: product.id,
                    item_name: product.name,
                    item_category: product.category,
                    price: product.price,
                    item_brand: product.brand,
                    item_variant: product.variant,
                },
            });
        } else {
            allDetailsSection.innerHTML = defaultDetails;
            toggleDetailsBtn.textContent = 'Show All Details';
        }
    };

    // Re-render the reviews section with default view
    renderReviewSection(productId, 'default');

    detailAddToCartBtn.onclick = (event) => {
        const id = event.target.dataset.productId;
        addToCart(id);
    };
}

function renderReviewSection(productId, mode = 'default') {
    const reviewsSectionHtml = `
        <div id="reviews-section" class="mt-8">
            <h3 class="text-4xl font-bold mb-4">Customer Reviews</h3>
            <div id="reviews-display-area" class="space-y-4 mb-6"></div>
            <button id="view-reviews-btn" class="btn btn-secondary text-xl">View All Reviews</button>
            <h4 class="text-3xl font-bold mt-8 mb-4">Submit Your Review</h4>
            <div class="flex items-center mb-4">
                <label for="review-rating" class="mr-2">Rating:</label>
                <select id="review-rating" class="form-control w-auto">
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                </select>
            </div>
            <textarea id="review-text" class="form-control" rows="4" placeholder="Write your review here..."></textarea>
            <button id="submit-review-btn" class="btn btn-primary text-xl mt-4">Submit Review</button>
        </div>
    `;
    const reviewsSection = document.querySelector('#product-detail-page .main-content #reviews-section');
    if (reviewsSection) {
        reviewsSection.remove();
    }
    document.querySelector('#product-detail-page .main-content').insertAdjacentHTML('beforeend', reviewsSectionHtml);

    document.getElementById('submit-review-btn').addEventListener('click', () => {
        const rating = document.getElementById('review-rating').value;
        const reviewText = document.getElementById('review-text').value.trim();
        submitReview(productId, rating, reviewText);
    });

    const viewReviewsButton = document.getElementById('view-reviews-btn');
    viewReviewsButton.addEventListener('click', () => {
        if (viewReviewsButton.textContent === 'View All Reviews') {
            renderAllReviews(productId);
            viewReviewsButton.textContent = 'View Few Reviews';
        } else {
            renderReviews(productId, 'default');
            viewReviewsButton.textContent = 'View All Reviews';
        }
    });

    // Render the initial set of reviews based on mode
    renderReviews(productId, mode);
}

function submitReview(productId, rating, reviewText) {
    if (reviewText === "") {
        alertMessage("Please write your review before submitting.");
        return;
    }
    const product = products.find(p => p.id === productId);
    if (!product) {
        console.error('Product not found for review submission.');
        return;
    }

    const reviewId = 'review-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const sellerId = EventTracker.getSellerId(product.store);

    EventTracker.track('user_reviews', {
        seller_id: sellerId,
        store_name: product.store,
        page_duration_seconds: EventTracker.getPageDuration(),
        item: {
            item_id: product.id,
            item_name: product.name,
            item_category: product.category,
            price: product.price,
        },
        review: {
            review_id: reviewId,
            rating: parseInt(rating),
            review_text: reviewText,
            reviewer_name: 'Anonymous User',
            review_images_count: 0,
        }
    });

    alertMessage('Review submitted! (Demo)');
    document.getElementById('review-rating').value = '5';
    document.getElementById('review-text').value = '';
}

function renderReviews(productId, mode = 'default') {
    const mockReviews = [{
        user: 'Alice',
        rating: 5,
        text: 'Absolutely love this product! Highly recommend.',
        timestamp: '2025-07-20',
        image: 'https://placehold.co/100x100/52b788/fff?text=Review+1'
    }, {
        user: 'Bob',
        rating: 4,
        text: 'Good quality, met my expectations.',
        timestamp: '2025-07-22',
        image: 'https://placehold.co/100x100/e0b686/fff?text=Review+2'
    }, {
        user: 'Charlie',
        rating: 5,
        text: 'The best purchase I have made this year!',
        timestamp: '2025-07-23',
        image: 'https://placehold.co/100x100/f08080/fff?text=Review+3'
    }, {
        user: 'Diana',
        rating: 3,
        text: 'It’s alright, but I expected more for the price.',
        timestamp: '2025-07-25',
        image: 'https://placehold.co/100x100/9b7e77/fff?text=Review+4'
    }, ];

    const reviewsDisplayArea = document.getElementById('reviews-display-area');
    if (!reviewsDisplayArea) return;
    reviewsDisplayArea.innerHTML = '';

    let reviewsToRender = [];
    if (mode === 'default') {
        reviewsToRender = mockReviews.slice(0, 2);
    } else {
        reviewsToRender = mockReviews;
    }

    if (reviewsToRender.length > 0) {
        reviewsToRender.forEach(review => {
            const reviewDiv = document.createElement('div');
            reviewDiv.className = 'review-div bg-white p-4 rounded-md shadow-sm border border-gray-200';
            reviewDiv.innerHTML = `
                <div class="flex items-center mb-2">
                    <span class="font-semibold text-[#a55447] mr-2 text-xl">${review.user}</span>
                    <span class="text-yellow-500 text-lg">${'⭐'.repeat(review.rating)}</span>
                </div>
                <p class="text-gray-700 text-lg mb-2">${review.text}</p>
                ${review.image ? `<img src="${review.image}" alt="Review image" class="w-24 h-24 object-cover rounded-md mt-2 cursor-pointer review-image-click">` : ''}
                <p class="text-gray-500 text-base text-right">Reviewed on ${review.timestamp}</p>
            `;
            reviewsDisplayArea.appendChild(reviewDiv);
        });

        reviewsDisplayArea.querySelectorAll('.review-image-click').forEach(img => {
            img.addEventListener('click', () => {
                showImageViewer([img.src]);
            });
        });
    } else {
        reviewsDisplayArea.innerHTML = '<p class="text-gray-500">No reviews yet. Be the first to review!</p>';
    }
}

function renderAllReviews(productId) {
    const mockReviews = [{
        user: 'Alice',
        rating: 5,
        text: 'Absolutely love this product! Highly recommend.',
        timestamp: '2025-07-20',
        image: 'https://placehold.co/100x100/52b788/fff?text=Review+1'
    }, {
        user: 'Bob',
        rating: 4,
        text: 'Good quality, met my expectations.',
        timestamp: '2025-07-22',
        image: 'https://placehold.co/100x100/e0b686/fff?text=Review+2'
    }, {
        user: 'Charlie',
        rating: 5,
        text: 'The best purchase I have made this year!',
        timestamp: '2025-07-23',
        image: 'https://placehold.co/100x100/f08080/fff?text=Review+3'
    }, {
        user: 'Diana',
        rating: 3,
        text: 'It’s alright, but I expected more for the price.',
        timestamp: '2025-07-25',
        image: 'https://placehold.co/100x100/9b7e77/fff?text=Review+4'
    }, ];

    const product = products.find(p => p.id === productId);
    if (!product) {
        console.error('Product not found for review tracking.');
        return;
    }

    const sellerId = EventTracker.getSellerId(product.store);

    EventTracker.track('view_user_reviews', {
        seller_id: sellerId,
        store_name: product.store,
        viewed_reviews_count: mockReviews.length,
        item: {
            item_id: product.id,
            item_name: product.name,
            item_category: product.category,
            price: product.price
        },
    });

    renderReviews(productId, 'all');
}

function renderCategories() {
    categoriesContainer.innerHTML = '';
    categories.forEach(category => {
        const card = document.createElement('a');
        card.href = `#category=${encodeURIComponent(category.name)}`;
        card.className = 'category-card';
        card.innerHTML = `<h3 class="text-lg font-semibold">${category.name}</h3>`;
        categoriesContainer.appendChild(card);
    });
}

function addToCart(productId) {
    const existingItem = cartItems.find(item => item.productId === productId);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cartItems.push({
            productId: productId,
            quantity: 1
        });
    }
    updateCartCounts();
    alertMessage('Product added to cart!');
}

function updateCartCounts() {
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const counts = [cartCountMain, cartCountCategory, cartCountStore, cartCountDetail];
    counts.forEach(countEl => {
        if (totalItems > 0) {
            countEl.textContent = totalItems;
            countEl.classList.remove('hidden');
        } else {
            countEl.classList.add('hidden');
        }
    });
}

function renderCart() {
    cartItemsContainer.innerHTML = '';
    let total = 0;
    if (cartItems.length === 0) {
        emptyCartMessage.classList.remove('hidden');
        cartSummary.classList.add('hidden');
        return;
    } else {
        emptyCartMessage.classList.add('hidden');
        cartSummary.classList.remove('hidden');
    }

    cartItems.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            const itemTotal = product.price * item.quantity;
            total += itemTotal;
            const cartItemDiv = document.createElement('div');
            cartItemDiv.className = 'flex items-center justify-between bg-white p-4 rounded-lg shadow-sm';
            cartItemDiv.innerHTML = `
                <div class="flex items-center">
                    <img src="${product.image}" alt="${product.name}" class="w-16 h-16 object-cover rounded-md mr-4">
                    <div>
                        <h3 class="text-lg font-semibold">${product.name}</h3>
                        <p class="text-gray-600">Quantity: ${item.quantity}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-lg font-bold text-[#a55447]">$${itemTotal.toFixed(2)}</p>
                        <button class="remove-from-cart-btn text-red-500 hover:text-red-700 text-sm mt-1" data-product-id="${product.id}">Remove</button>
                    </div>
                </div>
            `;
            cartItemsContainer.appendChild(cartItemDiv);
        }
    });
    cartTotalSpan.textContent = total.toFixed(2);
    cartItemsContainer.querySelectorAll('.remove-from-cart-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.target.dataset.productId;
            removeItemFromCart(productId);
        });
    });
}

function alertMessage(message) {
    const messageBox = document.createElement('div');
    messageBox.className = 'fixed bottom-5 right-5 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-transform duration-300 transform translate-x-full';
    messageBox.textContent = message;
    document.body.appendChild(messageBox);
    setTimeout(() => {
        messageBox.classList.remove('translate-x-full');
    }, 50);
    setTimeout(() => {
        messageBox.classList.add('translate-x-full');
        messageBox.addEventListener('transitionend', () => messageBox.remove());
    }, 3000);
}

function removeItemFromCart(productId) {
    cartItems = cartItems.filter(item => {
        if (item.productId === productId) {
            const product = products.find(p => p.id === productId);
            if (product) {
                EventTracker.track('remove_from_cart', {
                    item: {
                        item_id: product.id,
                        item_name: product.name,
                        item_category: product.category,
                        price: product.price,
                        quantity: item.quantity
                    }
                });
            }
            return false;
        }
        return true;
    });
    updateCartCounts();
    renderCart();
    alertMessage('Item removed from cart.');
}

// Add this new helper function inside your EventTracker module
const getEventContext = () => {
    const hash = window.location.hash.substring(1);
    const context = {
        seller_id: null,
        store_name: null
    };

    if (hash.startsWith('store=')) {
        const storeName = decodeURIComponent(hash.split('=')[1]);
        context.store_name = storeName;
        context.seller_id = EventTracker.SELLER_ID_MAP[storeName] || null;
    } else if (hash.startsWith('product=')) {
        const productId = hash.split('=')[1];
        const product = products.find(p => p.id === productId);
        if (product) {
            context.store_name = product.store;
            context.seller_id = EventTracker.SELLER_ID_MAP[product.store] || null;
        }
    }
    return context;
};

function handleHashChange() {
    const hash = window.location.hash.substring(1);
    if (hash.startsWith('store=')) {
        const storeName = decodeURIComponent(hash.split('=')[1]);
        showPage('store', {
            storeName
        });
    } else if (hash.startsWith('category=')) {
        const category = decodeURIComponent(hash.split('=')[1]);
        showPage('category', {
            category
        });
    } else if (hash.startsWith('product=')) {
        const productId = hash.split('=')[1];
        showPage('product-detail', {
            productId
        });
    } else if (hash === 'cart') {
        showPage('cart');
    } else {
        showPage('main');
    }
}

// Global variables for the observer to manage timers
let hoverTimer = null;
let lastHoveredSection = null;

// Define the single IntersectionObserver
const productAndSectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const element = entry.target; // The element that became visible/invisible
        const sectionName = element.dataset.section;
        const productName = element.dataset.productName;
        const sellerIdFromProduct = element.dataset.sellerId;
        const productCategory = element.dataset.productCategory;

        if (entry.isIntersecting) {
            if (productName && sellerIdFromProduct && productCategory) {
                // It's a product card, instantly send a product_hover_event
                const storeNameFromProduct = EventTracker.REVERSE_SELLER_ID_MAP[sellerIdFromProduct];
                EventTracker.track('product_hover_event', {
                    item_name: productName,
                    seller_id: sellerIdFromProduct,
                    store_name: storeNameFromProduct, // Explicitly pass store_name
                    item_category: productCategory,
                    event_type: 'hover', // Explicitly define event_type for consistency
                });
            } else if (sectionName) {
                // It's a general section, start a timer for a delayed scroll_hover_event
                hoverTimer = setTimeout(() => {
                    const scrollDepth = Math.round((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100);

                    // Get the seller and store name from the centralized SECTION_TO_STORE_NAME_MAP
                    const storeNameForSection = EventTracker.SECTION_TO_STORE_NAME_MAP[sectionName] || sectionName;
                    const sellerIdForSection = EventTracker.SELLER_ID_MAP[storeNameForSection];

                    EventTracker.track('scroll_hover_event', {
                        section_name: sectionName,
                        event_type: 'hover',
                        scroll_depth_pct: scrollDepth,
                        seller_id: sellerIdForSection,
                        store_name: storeNameForSection
                    });
                    lastHoveredSection = sectionName;
                }, 3000); // 3 seconds to simulate a "hover"
            }
        } else {
            // Element is no longer visible, clear the timer
            if (hoverTimer) {
                clearTimeout(hoverTimer);
                hoverTimer = null;
            }
        }
    });
}, {
    threshold: 0.5 // Trigger when 50% of the element is visible
});

// Function to attach the observer to all relevant elements on the current page
function setupObserversForCurrentPage() {
    // Disconnect all previous observations to prevent duplicate events
    // This is important because elements might be re-rendered without being removed
    // from the DOM first, leading to multiple observers on the same element.
    productAndSectionObserver.disconnect();

    // Observe all elements that have either data-section or data-product-name
    document.querySelectorAll('[data-section], [data-product-name]').forEach(element => {
        productAndSectionObserver.observe(element);
    });
}


document.addEventListener('DOMContentLoaded', () => {
    EventTracker.setUserId('anon-user');
    EventTracker.init();

    // --- Event Listeners ---
    // Cart icons
    [cartIconMain, cartIconCategory, cartIconDetail, cartIconStore].forEach(icon => {
        icon.addEventListener('click', () => showPage('cart'));
    });

    // Back buttons
    backToMainBtnCategory.addEventListener('click', () => window.location.hash = '');
    backToMainBtnCart.addEventListener('click', () => window.location.hash = '');
    backFromDetailBtn.addEventListener('click', () => {
        // Clear the high-interest timer to prevent it from firing after the user leaves
        if (highInterestTimer) {
            clearTimeout(highInterestTimer);
            highInterestTimer = null;
        }

        if (productDetailStartTime) {
            const pageDurationSeconds = Math.round((Date.now() - productDetailStartTime) / 1000);
            const productId = window.location.hash.split('=')[1];
            const product = products.find(p => p.id === productId);

            if (product) {
                const engagementLevel = pageDurationSeconds >= 40 ? 'high_final' : 'low_final';

                // NEW: Send the final duration event to BigQuery
                EventTracker.track('item_time_final', {
                    seller_id: EventTracker.getSellerId(product.store),
                    store_name: product.store,
                    item_id: product.id,
                    duration_on_item: pageDurationSeconds,
                    engagement_level: engagementLevel
                });
            }
        }
        window.history.back();
    });
    backToMainBtnStore.addEventListener('click', () => window.location.hash = '');

    // Checkout button
    checkoutBtn.addEventListener('click', () => {
        if (cartItems.length > 0) {
            alertMessage('Proceeding to checkout! (This is a demo)');
            cartItems = [];
            updateCartCounts();
            renderCart();
        } else {
            alertMessage('Your cart is empty!');
        }
    });

    // Promotion banner listeners
    document.querySelectorAll('.promo-grid a').forEach(banner => {
        banner.addEventListener('click', () => {
            const promotionId = banner.dataset.promotionId || banner.alt;
            const promotionName = banner.dataset.promotionName || null;
            const creativeSlot = banner.dataset.creativeSlot || null;
            EventTracker.track('view_promotion', {
                promotion: {
                    promotion_id: promotionId,
                    promotion_name: promotionName,
                    creative_name: creativeSlot
                },
                creative_slot: creativeSlot
            });
        });
    });

    // Browser navigation listeners
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);

    // Image viewer listeners
    document.getElementById('image-viewer-close-btn').addEventListener('click', hideImageViewer);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && imageViewer.classList.contains('visible')) {
            hideImageViewer();
        }
        if (e.key === 'ArrowRight' && imageViewer.classList.contains('visible')) {
            showNextImage();
        }
        if (e.key === 'ArrowLeft' && imageViewer.classList.contains('visible')) {
            showPrevImage();
        }
    });
    sliderNextBtn.addEventListener('click', showNextImage);
    sliderPrevBtn.addEventListener('click', showPrevImage);

    // Initial call to set up observers for the main page content
    // This replaces your previous separate observer declarations and observations
    setupObserversForCurrentPage();

    handleHashChange(); // This will call showPage, which in turn calls setupObserversForCurrentPage
});