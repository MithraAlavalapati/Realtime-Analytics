// This file contains the core logic and data for the website.

// --- EventTracker Module (Content from event-tracker.js) ---
const EventTracker = (() => {

    // --- CONFIGURATION ---
    const cloudFunctionUrls = {
        details_of_product: 'https://asia-south1-svaraflow.cloudfunctions.net/process_details_of_product_event',
        product_image_zoom: 'https://asia-south1-svaraflow.cloudfunctions.net/process_product_image_zoom_event',
        product_image_view: 'https://asia-south1-svaraflow.cloudfunctions.net/process_product_image_view_event',
        session_time: 'https://asia-south1-svaraflow.cloudfunctions.net/process_session_time_event',
        store_visit: 'https://asia-south1-svaraflow.cloudfunctions.net/process_store_visit_event',
        user_reviews: 'https://asia-south1-svaraflow.cloudfunctions.net/process_user_reviews_event',
        view_page: 'https://asia-south1-svaraflow.cloudfunctions.net/process_view_page_event',
        view_product: 'https://asia-south1-svaraflow.cloudfunctions.net/process_view_product_event',
        view_user_reviews: 'https://asia-south1-svaraflow.cloudfunctions.net/process_view_user_reviews_event',
        scroll_hover_event: 'https://asia-south1-svaraflow.cloudfunctions.net/process_scroll_hover_event',
        product_hover_event: 'https://asia-south1-svaraflow.cloudfunctions.net/process_scroll_hover_event',
        item_click: 'https://asia-south1-svaraflow.cloudfunctions.net/track_item_time_event',
        item_time_realtime: 'https://asia-south1-svaraflow.cloudfunctions.net/track_item_time_event',
        item_time_final: 'https://asia-south1-svaraflow.cloudfunctions.net/track_item_time_event',
        add_to_cart: 'https://asia-south1-svaraflow.cloudfunctions.net/process_add_to_cart_event',
        remove_from_cart: 'https://asia-south1-svaraflow.cloudfunctions.net/process_remove_from_cart_event',
        begin_checkout: 'https://asia-south1-svaraflow.cloudfunctions.net/process_begin_checkout_event',
        first_visit: 'https://asia-south1-svaraflow.cloudfunctions.net/process_first_visit_event',
        session_start: 'https://asia-south1-svaraflow.cloudfunctions.net/process_session_start_event',
        view_promotion: 'https://asia-south1-svaraflow.cloudfunctions.net/process_view_promotion_event',
        first_store_visit: 'https://asia-south1-svaraflow.cloudfunctions.net/process_first_store_visit_event',
        // NEW Wishlist Events
        add_to_wishlist: 'https://asia-south1-svaraflow.cloudfunctions.net/process_add_to_wishlist_event',
        remove_from_wishlist: 'https://asia-south1-svaraflow.cloudfunctions.net/process_remove_from_wishlist_event',
        // New Checkout Events
        add_shipping_info: 'https://asia-south1-svaraflow.cloudfunctions.net/process_add_shipping_info',
        add_payment_info: 'https://asia-south1-svaraflow.cloudfunctions.net/process_add_payment_info',
        purchase: 'https://asia-south1-svaraflow.cloudfunctions.net/process_purchase_event'
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
        'Flash Sales': 'General Promotions' // NEW: Added flash sales
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
            seller_id: specificPayload.seller_id || null,
            store_name: specificPayload.store_name || null,
        };

        const pageDurationSeconds = Math.round((Date.now() - pageStartTime) / 1000);

        const finalPayload = { ...commonPayload
        };

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
                reviewer_name: 'Anonymous User',
                review_images_count: 0,
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
            finalPayload.item_id = specificPayload.item_id;
            finalPayload.duration_on_item = specificPayload.duration_on_item || null;
            finalPayload.engagement_level = specificPayload.engagement_level;
        } else if (eventName === 'add_to_wishlist' || eventName === 'remove_from_wishlist' || eventName === 'add_to_cart' || eventName === 'remove_from_cart') {
            if (specificPayload.item) {
                finalPayload.item = {
                    item_id: specificPayload.item.item_id,
                    item_name: specificPayload.item.item_name,
                    item_category: specificPayload.item.item_category,
                    price: specificPayload.item.price,
                };
            }
        } else if (eventName === 'add_shipping_info') {
            finalPayload.shipping_details = specificPayload.shipping_details;
        } else if (eventName === 'add_payment_info') {
            finalPayload.payment_details = specificPayload.payment_details;
        } else if (eventName === 'purchase') {
            finalPayload.transaction_id = specificPayload.transaction_id;
            finalPayload.value = specificPayload.value;
            finalPayload.currency = specificPayload.currency;
            finalPayload.items = specificPayload.items;
        }

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
        } else if (hash.startsWith('promotion=')) {
            const storeName = decodeURIComponent(hash.split('=')[1]);
            context.store_name = storeName;
            context.seller_id = SELLER_ID_MAP[storeName] || null;
        } else if (hash.startsWith('category=')) {
            const category = decodeURIComponent(hash.split('=')[1]);
            context.store_name = 'General Promotions';
            context.seller_id = SELLER_ID_MAP['General Promotions'];
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
        SELLER_ID_MAP,
        SECTION_TO_STORE_NAME_MAP,
        REVERSE_SELLER_ID_MAP
    };
})();

// MOCK PRODUCT DATA
const products = [
    { id: 'bn002', name: 'Atomic Habits', category: 'Books', store: 'The Book Nook', price: 22.5, brand: 'Avery', variant: 'Paperback', stock: 10, image: 'https://i1.sndcdn.com/artworks-yrIbiixVohkQgzgq-afLB3w-t1080x1080.jpg', moreImages: ['https://images-na.ssl-images-amazon.com/images/I/51-n2jY1qjL._SX331_BO1,204,203,200_.jpg', 'https://images-na.ssl-images-amazon.com/images/I/41T-m3d9uDL._SX331_BO1,204,203,200_.jpg', 'https://images-na.ssl-images-amazon.com/images/I/41-y3bC-wYL._SX331_BO1,204,203,200_.jpg'], description: 'An easy & proven way to build good habits & break bad ones.' },
    { id: 'bn005', name: 'The Midnight Library', category: 'Books', store: 'The Book Nook', price: 17.5, brand: 'Viking', variant: 'Hardcover', stock: 0, image: 'https://www.theindianbookstore.in/cdn/shop/products/the-midnight-library-the-no-1-sunday-times-bestseller-and-worldwide-phenomenon.jpg?v=1664821147', moreImages: ['https://images-na.ssl-images-amazon.com/images/I/51wX-p861dL._SX331_BO1,204,203,200_.jpg', 'https://images-na.ssl-images-amazon.com/images/I/51S4H+RzQfL._SX331_BO1,204,203,200_.jpg', 'https://images-na.ssl-images-amazon.com/images/I/51-O-G+E-lL._SX331_BO1,204,203,200_.jpg'], description: 'A heartwarming and philosophical tale about life choices.' },
    { id: 'bn010', name: 'The Alchemist', category: 'Books', store: 'The Book Nook', price: 13.0, brand: 'HarperOne', variant: 'Paperback', stock: 5, image: 'https://images.meesho.com/images/products/137168101/wqzub_512.webp', moreImages: ['https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1483412266i/865.jpg'], description: 'An allegorical novel about a shepherd boy who journeys to find treasure.' },
    { id: 'bn007', name: 'Educated', category: 'Books', store: 'The Book Nook', price: 18.0, brand: 'Random House', variant: 'Paperback', stock: 2, image: 'https://upload.wikimedia.org/wikipedia/en/1/1f/Educated_%28Tara_Westover%29.png', moreImages: ['https://images-na.ssl-images-amazon.com/images/I/51f8GvX5lmL._SX331_BO1,204,203,200_.jpg', 'https://images-na.ssl-images-amazon.com/images/I/41-z-g6t+QL._SX331_BO1,204,203,200_.jpg', 'https://images-na.ssl-images-amazon.com/images/I/51z-r-w6+PL._SX331_BO1,204,203,200_.jpg'], description: 'A memoir of a young girl who pursued knowledge despite a tyrannical father.' },
    { id: 'bn003', name: 'Where the Crawdads Sing', category: 'Books', store: 'The Book Nook', price: 16.0, brand: 'G.P. Putnam\'s Sons', variant: 'Paperback', stock: 15, image: 'https://images.blinkist.io/images/books/63cfc463c68d9c0009893b4a/1_1/470.jpg', moreImages: ['https://images-na.ssl-images-amazon.com/images/I/51F8S-Q5g2L._SX331_BO1,204,203,200_.jpg', 'https://images-na.ssl-images-amazon.com/images/I/51v1v-n6d6L._SX331_BO1,204,203,200_.jpg', 'https://images-na.ssl-images-amazon.com/images/I/51z-r-w6+PL._SX331_BO1,204,203,200_.jpg'], description: 'A captivating mystery and coming-of-age story.' },
    { id: 'bn009', name: 'The Great Gatsby', category: 'Books', store: 'The Book Nook', price: 12.0, brand: 'Scribner', variant: 'Paperback', stock: 20, image: 'https://thecommononline.org/wp-content/uploads/2013/06/Screen-Shot-2017-05-31-at-2.19.46-PM.png', moreImages: ['https://images-na.ssl-images-amazon.com/images/I/51N-N1g6iZL._SX331_BO1,204,203,200_.jpg', 'https://images-na.ssl-images-amazon.com/images/I/41n-k-g6-uL._SX331_BO1,204,203,200_.jpg', 'https://images-na.ssl-images-amazon.com/images/I/51s-s3d9uDL._SX331_BO1,204,203,200_.jpg'], description: 'A classic novel of the Jazz Age, love, and the American Dream.' },
    { id: 'bn001', name: 'The Silent Patient', category: 'Books', store: 'The Book Nook', price: 15.0, brand: 'Celadon Books', variant: 'Hardcover', stock: 1, image: 'https://images.meesho.com/images/products/137168101/wqzub_512.webp?width=512', moreImages: ['https://images-na.ssl-images-amazon.com/images/I/51-X2cK8eDL._SX331_BO1,204,203,200_.jpg', 'https://images-na.ssl-images-amazon.com/images/I/51-m-g6uNL._SX331_BO1,204,203,200_.jpg', 'https://images-na.ssl-images-amazon.com/images/I/51O-g6-uDL._SX331_BO1,204,203,200_.jpg'], description: 'A shocking psychological thriller with a brilliant twist.' },
    { id: 'bn008', name: 'Sapiens: A Brief History of Humankind', category: 'Books', store: 'The Book Nook', price: 25.0, brand: 'Harper Perennial', variant: 'Paperback', stock: 3, image: 'https://images.gatesnotes.com/12514eb8-7b51-008e-41a9-512542cf683b/34796cf4-4adb-4c61-a8e3-1d283a9e3936/Sapiens-A-Brief-History-of-Humankind_1500px_by_1500px-001.jpg?w=1400&h=900&fit=clip&fm=jpg&q=75', moreImages: ['https://images-na.ssl-images-amazon.com/images/I/51-U-y-t3CL._SX331_BO1,204,203,200_.jpg', 'https://images-na.ssl-images-amazon.com/images/I/51n-g6-uNL._SX331_BO1,204,203,200_.jpg', 'https://images-na.ssl-images-amazon.com/images/I/51n-g6-uDL._SX331_BO1,204,203,200_.jpg'], description: 'A sweeping history of Homo sapiens from the Stone Age to the present.' },
    { id: 'bn006', name: 'Becoming', category: 'Books', store: 'The Book Nook', price: 20.0, brand: 'Crown', variant: 'Hardcover', stock: 4, image: 'https://d28hgpri8am2if.cloudfront.net/book_images/onix/cvr9781524855673/becoming-9781524855673_hr.jpg', moreImages: ['https://d28hgpri8am2if.cloudfront.net/book_images/onix/cvr9781524855673/becoming-9781524855673_hr.jpg'], description: 'Michelle Obama\'s intimate, powerful, and inspiring memoir.' },
    { id: 'bn004', name: 'Dune', category: 'Books', store: 'The Book Nook', price: 14.0, brand: 'Ace Books', variant: 'Paperback', stock: 8, image: 'https://www.crossword.in/cdn/shop/files/dune-paperback-herbert-frank-bk0059146-40488735670489.jpg?v=1746605301', moreImages: ['https://www.crossword.in/cdn/shop/files/dune-paperback-herbert-frank-bk0059146-40488735670489.jpg?v=1746605301'], description: 'The seminal science fiction epic of a desert planet and its messiah.' },

    // Existing products...
    { id: 'f010', name: 'Running Shorts', category: 'Fashion', store: 'Trendy Threads', price: 29.0, brand: 'ActiveFit', variant: 'Black-M', bestseller: true, stock: 12, image: 'https://rukminim2.flixcart.com/image/704/844/kyxb9u80/short/a/l/i/m-mens-cycling-shorts-never-lose-original-imagbfz6xry8dksf.jpeg?q=20&crop=false', moreImages: ['https://rukminim2.flixcart.com/image/704/844/kyxb9u80/short/a/l/i/m-mens-cycling-shorts-never-lose-original-imagbfz6xry8dksf.jpeg?q=20&crop=false'], description: 'Lightweight and breathable shorts for your runs.' },
    { id: 'f001', name: 'Elegant Evening Dress', category: 'Fashion', store: 'Trendy Threads', price: 89.99, brand: 'Glamourous Attire', variant: 'Blue-Large', bestseller: true, stock: 3, image: 'https://5.imimg.com/data5/SELLER/Default/2022/12/XQ/FK/NC/123524965/whatsapp-image-2022-12-06-at-09-59-11-4--500x500.jpeg', moreImages: ['https://5.imimg.com/data5/SELLER/Default/2022/12/XQ/FK/NC/123524965/whatsapp-image-2022-12-06-at-09-59-11-4--500x500.jpeg'], description: 'A stunning dress perfect for evening events. Made from high-quality silk blend.', variants: [
        { name: 'Blue', color_hex: '#3b82f6', image: 'https://5.imimg.com/data5/SELLER/Default/2022/12/XQ/FK/NC/123524965/whatsapp-image-2022-12-06-at-09-59-11-4--500x500.jpeg' },
        { name: 'Red', color_hex: '#ef4444', image: 'https://placehold.co/600x400/ef4444/fff?text=Red+Dress' }
    ]},
    { id: 'f006', name: 'Sporty Sneakers', category: 'Fashion', store: 'Trendy Threads', price: 65.0, brand: 'StrideFoot', variant: 'Black-Size9', bestseller: true, stock: 0, image: 'https://img.freepik.com/free-photo/close-up-futuristic-sneakers_23-2151005731.jpg?semt=ais_hybrid&w=740', moreImages: ['https://img.freepik.com/free-photo/close-up-futuristic-sneakers_23-2151005731.jpg?semt=ais_hybrid&w=740'], description: 'Comfortable and stylish sneakers for everyday wear.' },
    { id: 'f007', name: 'Leather Crossbody Bag', category: 'Fashion', store: 'Trendy Threads', price: 120.0, brand: 'Elegance Carry', variant: 'Brown', stock: 7, image: 'https://m.media-amazon.com/images/I/71zLvGlvgXL._UY1000_.jpg', moreImages: ['https://m.media-amazon.com/images/I/71zLvGlvgXL._UY1000_.jpg'], description: 'A chic and practical leather bag with adjustable strap.' },
    { id: 'f003', name: 'High-Waisted Denim Jeans', category: 'Fashion', store: 'Trendy Threads', price: 49.99, brand: 'Denim Dreams', variant: 'Blue-Size28', stock: 15, image: 'https://www.liveabout.com/thmb/VHXCJRh1AA6kXTW_9QkEVX7QaxY=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/Highwaistedjeansstreetstylewoman-GettyImages-christianvierig-5b4f3fddc9e77c00373484db.jpg', moreImages: ['https://www.liveabout.com/thmb/VHXCJRh1AA6kXTW_9QkEVX7QaxY=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/Highwaistedjeansstreetstylewoman-GettyImages-christianvierig-5b4f3fddc9e77c00373484db.jpg'], description: 'Classic high-waisted denim jeans with a modern fit. Durable and stylish.' },
    { id: 'f002', name: 'Mens Slim Fit Shirt', category: 'Fashion', store: 'Trendy Threads', price: 34.99, brand: 'Gentleman\'s Choice', variant: 'White-Medium', stock: 20, image: 'https://i.ebayimg.com/00/s/MTE4M1gxNjAw/z/DQYAAOSwEppUPn5L/$_57.JPG?set_id=880000500F', moreImages: ['https://i.ebayimg.com/00/s/MTE4M1gxNjAw/z/DQYAAOSwEppUPn5L/$_57.JPG?set_id=880000500F'], description: 'A crisp, slim-fit shirt made from 100% breathable cotton. Ideal for work or casual wear.' },
    { id: 'f005', name: 'Womens Floral Blouse', category: 'Fashion', store: 'Trendy Threads', price: 27.5, brand: 'BloomWear', variant: 'Multi-color-S', stock: 9, image: 'https://images.meesho.com/images/products/442798890/06uqe_512.jpg', moreImages: ['https://images.meesho.com/images/products/442798890/06uqe_512.jpg'], description: 'A beautiful floral blouse perfect for spring and summer.' },
    { id: 'f009', name: 'Aviator Sunglasses', category: 'Fashion', store: 'Trendy Threads', price: 25.0, brand: 'VisionPro', variant: 'Gold Frame', stock: 18, image: 'https://m.media-amazon.com/images/I/81QiBoFaIkL._UY350_.jpg', moreImages: ['https://m.media-amazon.com/images/I/81QiBoFaIkL._UY350_.jpg'], description: 'Classic aviator sunglasses with UV protection.' },
    { id: 'f004', name: 'Classic Summer Hat', category: 'Fashion', store: 'Trendy Threads', price: 18.0, brand: 'SunShield', variant: 'Straw-Beige', stock: 6, image: 'https://m.media-amazon.com/images/I/81Q7H+IQ6dL._UY350_.jpg', moreImages: ['https://m.media-amazon.com/images/I/81Q7H+IQ6dL._UY350_.jpg'], description: 'Protect yourself from the sun with this timeless and fashionable summer hat.' },
    { id: 'f008', name: 'Cozy Knit Sweater', category: 'Fashion', store: 'Trendy Threads', price: 55.0, brand: 'WarmWeave', variant: 'Grey-L', stock: 11, image: 'https://images.stockcake.com/public/8/8/c/88cd3260-1389-4876-a238-708c0c0428c7_large/cozy-autumn-sweater-stockcake.jpg', moreImages: ['https://images.stockcake.com/public/8/8/c/88cd3260-1389-4876-a238-708c0c0428c7_large/cozy-autumn-sweater-stockcake.jpg'], description: 'Soft and warm knit sweater, perfect for chilly evenings.' },
    { id: 'te010', name: 'Mesh Wi-Fi System', category: 'Mobiles/Computers', store: 'Tech Emporium', price: 199.0, brand: 'HomeNet', variant: '3-Pack', stock: 5, image: 'https://hips.hearstapps.com/hmg-prod/images/mesh-wifi-system-003-1668701622.jpg', moreImages: ['https://hips.hearstapps.com/hmg-prod/images/mesh-wifi-system-003-1668701622.jpg'], description: 'Eliminate dead zones with seamless whole-home Wi-Fi coverage.' },
    { id: 'te001', name: 'Flagship Smartphone Pro', category: 'Mobiles/Computers', store: 'Tech Emporium', price: 999.0, brand: 'ApexTech', variant: 'Midnight Black-512GB', bestseller: true, stock: 2, image: 'https://blogassets.airtel.in/wp-content/uploads/2024/12/x.jpeg', moreImages: ['https://blogassets.airtel.in/wp-content/uploads/2024/12/x.jpeg'], description: 'The latest flagship smartphone with a stunning display and pro-grade camera system.', variants: [
        { name: 'Midnight Black', color_hex: '#111827', image: 'https://blogassets.airtel.in/wp-content/uploads/2024/12/x.jpeg' },
        { name: 'Starlight', color_hex: '#f5f5f4', image: 'https://placehold.co/600x400/f5f5f4/111?text=Starlight+Phone' }
    ]},
    { id: 'te008', name: 'Smartwatch Series X', category: 'Mobiles/Computers', store: 'Tech Emporium', price: 299.0, brand: 'HealthTech', variant: 'Midnight Blue', stock: 8, image: 'https://images.augustman.com/wp-content/uploads/sites/6/2024/04/26150506/apple-watch-m.jpg', moreImages: ['https://images.augustman.com/wp-content/uploads/sites/6/2024/04/26150506/apple-watch-m.jpg'], description: 'Stay connected and track your fitness with this advanced smartwatch.' },
    { id: 'te006', name: '4K UHD Monitor', category: 'Mobiles/Computers', store: 'Tech Emporium', price: 350.0, brand: 'VividDisplay', variant: '27-inch', stock: 10, image: 'https://cdn.mos.cms.futurecdn.net/Xfrg9rFfFY5EHpZf6n789e.jpg', moreImages: ['https://cdn.mos.cms.futurecdn.net/Xfrg9rFfFY5EHpZf6n789e.jpg'], description: 'Stunning 4K resolution monitor for crystal-clear visuals.' },
    { id: 'te003', name: 'Noise-Cancelling Headphones', category: 'Mobiles/Computers', store: 'Tech Emporium', price: 149.0, brand: 'SoundScape', variant: 'Matte Black', bestseller: true, stock: 12, image: 'https://cdn.thewirecutter.com/wp-content/media/2023/09/noise-cancelling-headphone-2048px-0876.jpg', moreImages: ['https://cdn.thewirecutter.com/wp-content/media/2023/09/noise-cancelling-headphone-2048px-0876.jpg'], description: 'Immerse yourself in sound with these top-tier noise-cancelling headphones.' },
    { id: 'te009', name: 'Webcam Pro HD', category: 'Mobiles/Computers', store: 'Tech Emporium', price: 75.0, brand: 'StreamCam', variant: '1080p', stock: 0, image: 'https://i.insider.com/60624b0967187800184ad326?width=1200&format=jpeg', moreImages: ['https://i.insider.com/60624b0967187800184ad326?width=1200&format=jpeg'], description: 'High-definition webcam for clear video calls and streaming.' },
    { id: 'te002', name: 'Ultra-Thin Laptop Air', category: 'Mobiles/Computers', store: 'Tech Emporium', price: 1350.0, brand: 'FeatherLight', variant: 'Silver-16GB RAM', bestseller: true, stock: 4, image: 'https://images-cdn.ubuy.co.in/674fb0864a81cc38b05896f7-eoocoo-ultra-thin-armor-compatible.jpg', moreImages: ['https://images-cdn.ubuy.co.in/674fb0864a81cc38b05896f7-eoocoo-ultra-thin-armor-compatible.jpg'], description: 'Incredibly light and powerful, this laptop is perfect for professionals on the go.' },
    { id: 'te005', name: 'Wireless Ergonomic Mouse', category: 'Mobiles/Computers', store: 'Tech Emporium', price: 45.0, brand: 'ErgoGlide', variant: 'Graphite', stock: 7, image: 'https://www.ugreenindia.com/cdn/shop/files/ugreen-vertical-ergonomic-mouse-wireless-bluetooth-5024g-with-5-buttons-10001600020004000-dpi-prevention-of-mouse-arm-compatible-with-pclaptoptablet-black-25444-7039710.jpg?v=1751207989&width=1500', moreImages: ['https://www.ugreenindia.com/cdn/shop/files/ugreen-vertical-ergonomic-mouse-wireless-bluetooth-5024g-with-5-buttons-10001600020004000-dpi-prevention-of-mouse-arm-compatible-with-pclaptoptablet-black-25444-7039710.jpg?v=1751207989&width=1500'], description: 'Comfortable and precise wireless mouse for extended use.' },
    { id: 'te007', name: 'Portable SSD 1TB', category: 'Mobiles/Computers', store: 'Tech Emporium', price: 110.0, brand: 'SpeedyStore', variant: 'USB-C', stock: 15, image: 'https://5.imimg.com/data5/SELLER/Default/2023/12/370337137/CW/AJ/HI/186011026/sandisk-1tb-extreme-portable-ssd-1050mb-s-r-1000mb-s-w-upto-2-meter-drop-protection.jpg', moreImages: ['https://5.imimg.com/data5/SELLER/Default/2023/12/370337137/CW/AJ/HI/186011026/sandisk-1tb-extreme-portable-ssd-1050mb-s-r-1000mb-s-w-upto-2-meter-drop-protection.jpg'], description: 'Fast and compact external solid-state drive for all your data.' },
    { id: 'te004', name: 'Gaming Desktop PC', category: 'Mobiles/Computers', store: 'Tech Emporium', price: 1800.0, brand: 'GamerForge', variant: 'RTX 4070-16GB RAM', stock: 1, image: 'https://i.insider.com/6542a12836d588dc55c866e9?width=800&format=jpeg&auto=webp', moreImages: ['https://i.insider.com/6542a12836d588dc55c866e9?width=800&format=jpeg&auto=webp'], description: 'High-performance gaming PC for an unparalleled gaming experience.' },

    { id: 'az002', name: 'Resistance Band Set', category: 'Sports', store: 'Active Zone', price: 18.0, brand: 'FitFlex', variant: 'Light-Heavy', stock: 10, image: 'https://nwscdn.com/media/catalog/product/cache/h900xw900/r/e/resitance-band-main-image_1.jpg', moreImages: ['https://nwscdn.com/media/catalog/product/cache/h900xw900/r/e/resitance-band-main-image_1.jpg'], description: 'Versatile resistance bands for full-body workouts.' },
    { id: 'az005', name: 'Fitness Tracker Watch', category: 'Sports', store: 'Active Zone', price: 80.0, brand: 'PacePro', variant: 'Black', stock: 5, image: 'https://cdn.mos.cms.futurecdn.net/v2/t:0,l:437,cw:1125,ch:1125,q:80,w:1125/Pk5ydxYo6ty2Q4SX9vznP6.jpg', moreImages: ['https://cdn.mos.cms.futurecdn.net/v2/t:0,l:437,cw:1125,ch:1125,q:80,w:1125/Pk5ydxYo6ty2Q4SX9vznP6.jpg'], description: 'Monitor heart rate, steps, and sleep with this advanced tracker.' },
    { id: 'az010', name: 'Swimming Goggles Anti-Fog', category: 'Sports', store: 'Active Zone', price: 15.0, brand: 'DiveClear', variant: 'Blue', stock: 12, image: 'https://firstlens.in/cdn/shop/files/First-Lens-Customised-Powered-Swimming-Goggle-013-6.png?v=1755274847&width=1080', moreImages: ['https://firstlens.in/cdn/shop/files/First-Lens-Customised-Powered-Swimming-Goggle-013-6.png?v=1755274847&width=1080'], description: 'Comfortable and anti-fog goggles for clear underwater vision.' },
    { id: 'az004', name: 'Dumbbell Set Adjustable', category: 'Sports', store: 'Active Zone', price: 120.0, brand: 'IronFit', variant: '5-50lbs', stock: 3, image: 'https://store.cosco.in/cdn/shop/products/Untitleddesign_2_a34ed48f-95d9-4cb4-8be4-6a625bee1329.jpg?v=1731586838', moreImages: ['https://store.cosco.in/cdn/shop/products/Untitleddesign_2_a34ed48f-95d9-4cb4-8be4-6a625bee1329.jpg?v=1731586838'], description: 'Space-saving adjustable dumbbells for various weights.' },
    { id: 'az003', name: 'Smart Jump Rope', category: 'Sports', store: 'Active Zone', price: 35.0, brand: 'LeapMetric', variant: 'Digital', stock: 0, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRef5KRn9D60m_ol5KcOVJPVHJEknm0JffqBQ&s', moreImages: ['https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRef5KRn9D60m_ol5KcOVJPVHJEknm0JffqBQ&s'], description: 'Track your jumps and calories with this smart jump rope.' },
    { id: 'az007', name: 'Basketball Official Size', category: 'Sports', store: 'Active Zone', price: 30.0, brand: 'HoopStar', variant: 'Size 7', stock: 15, image: 'https://fieldinsider.com/wp-content/uploads/2022/10/nba-basketball-size-1-1024x1024.jpeg', moreImages: ['https://fieldinsider.com/wp-content/uploads/2022/10/nba-basketball-size-1-1024x1024.jpeg'], description: 'Durable basketball for indoor and outdoor play.' },
    { id: 'az001', name: 'Yoga Mat Premium', category: 'Sports', store: 'Active Zone', price: 25.0, brand: 'ZenFlow', variant: '6mm-Blue', stock: 20, image: 'https://www.kapoormats.com/wp-content/uploads/2024/06/Yoya-Mats.jpg', moreImages: ['https://www.kapoormats.com/wp-content/uploads/2024/06/Yoya-Mats.jpg'], description: 'Durable and comfortable yoga mat for all your fitness needs.' },
    { id: 'az009', name: 'Tennis Racket Graphite', category: 'Sports', store: 'Active Zone', price: 90.0, brand: 'SmashPro', variant: 'Grip 2', stock: 7, image: 'https://img.tennis-warehouse.com/reviews/PG100-1.jpg', moreImages: ['https://img.tennis-warehouse.com/reviews/PG100-1.jpg'], description: 'Lightweight graphite racket for enhanced power and control.' },
    { id: 'az008', name: 'Soccer Ball Training', category: 'Sports', store: 'Active Zone', price: 22.0, brand: 'KickMaster', variant: 'Size 5', stock: 10, image: 'https://nwscdn.com/media/catalog/product/cache/h900xw900/t/r/training-ball-swatch_1.jpg', moreImages: ['https://nwscdn.com/media/catalog/product/cache/h900xw900/t/r/training-ball-swatch_1.jpg'], description: 'High-quality soccer ball for practice and casual games.' },
    { id: 'az006', name: 'Cycling Helmet Aerodynamic', category: 'Sports', store: 'Active Zone', price: 60.0, brand: 'AeroRide', variant: 'White-M', stock: 1, image: 'https://i.redd.it/full-face-aero-helmet-should-this-be-the-new-standard-v0-bfqg8ntyrg7c1.jpg?width=1080&format=pjpg&auto=webp&s=86c140d88d872cb882c0ba9b9d29767186514406', moreImages: ['https://i.redd.it/full-face-aero-helmet-should-this-be-the-new-standard-v0-bfqg8ntyrg7c1.jpg?width=1080&format=pjpg&auto=webp&s=86c140d88d872cb882c0ba9b9d29767186514406'], description: 'Lightweight and aerodynamic helmet for road cycling.' }
];

const stores = [{
    id: 'trendy-threads',
    name: 'Trendy Threads',
    image: 'https://placehold.co/600x400/a55447/fff?text=Trendy+Threads'
}, {
    id: 'tech-emporium',
    name: 'Tech Emporium',
    image: 'https://placehold.co/600x400/2f5d62/fff?text=Tech+Emporium'
}, {
    id: 'the-book-nook',
    name: 'The Book Nook',
    image: 'https://placehold.co/600x400/4a4e69/fff?text=The+Book+Nook'
}, {
    id: 'active-zone',
    name: 'Active Zone',
    image: 'https://placehold.co/600x400/52b788/fff?text=Active+Zone'
}];

const categories = [{
    name: 'Fashion'
}, {
    name: 'Mobiles/Computers'
}, {
    name: 'Books'
}, {
    name: 'Sports'
}];

const allProductReviews = JSON.parse(localStorage.getItem('allProductReviews')) || {
    'bn002': [{
        user: 'Alice',
        userImage: 'https://placehold.co/40x40/52b788/fff?text=A',
        isPinned: true,
        timeAgo: '7 years ago',
        rating: 5,
        text: 'Absolutely love this product! Highly recommend.',
        likes: 493,
        replies: 84
    }, {
        user: 'Prashanthpaka',
        userImage: 'https://placehold.co/40x40/e0b686/fff?text=P',
        isPinned: false,
        timeAgo: '7 years ago',
        rating: 4,
        text: 'Dsp meeru devudu saami avaraina album lo 1 or 2 songs best music istharu but meeru album totally hit Eka jigelu raani artheyy....superb mali nirupincharu item songs king ani.keka ali the best dsp gaaru and rangasthalam combo making a superb hit all the best',
        likes: 18,
        replies: 0
    }],
    'f001': [{
        user: 'Jane Doe',
        userImage: 'https://placehold.co/40x40/64748b/fff?text=J',
        isPinned: false,
        timeAgo: '2 months ago',
        rating: 5,
        text: 'This dress is so beautiful! Perfect for a night out.',
        likes: 12,
        replies: 2
    }],
    'te001': [{
        user: 'Tech Enthusiast',
        userImage: 'https://placehold.co/40x40/1f2937/fff?text=T',
        isPinned: true,
        timeAgo: '1 month ago',
        rating: 5,
        text: 'Incredible phone! The camera is a game changer.',
        likes: 50,
        replies: 5
    }],
    'f010': [{
        user: 'Active User',
        userImage: 'https://placehold.co/40x40/4b5563/fff?text=A',
        isPinned: false,
        timeAgo: '1 week ago',
        rating: 4,
        text: 'Great shorts, very comfortable for my daily runs.',
        likes: 3,
        replies: 0
    }]
};

let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
let wishlistItems = JSON.parse(localStorage.getItem('wishlistItems')) || [];
let compareList = JSON.parse(localStorage.getItem('compareList')) || [];
let currentPage = 'main';

const mainPage = document.getElementById('main-page');
const promotionsPage = document.getElementById('promotions-page');
const storesPage = document.getElementById('stores-page');
const categoryPage = document.getElementById('category-page');
const cartPage = document.getElementById('cart-page');
const productDetailPage = document.getElementById('product-detail-page');
const accountPage = document.getElementById('account-page');

const searchIconBtn = document.getElementById('search-icon-btn');
const searchOverlay = document.getElementById('search-overlay');
const searchInput = document.getElementById('search-input');
const searchResultsContainer = document.getElementById('search-results-container');
const searchCloseBtn = document.getElementById('search-close-btn');

const cartIconMain = document.getElementById('cart-icon');
const cartCountMain = document.getElementById('cart-count');
const cartIconCategory = document.getElementById('cart-icon-category');
const cartCountCategory = document.getElementById('cart-count-category');
const cartIconDetail = document.getElementById('cart-icon-detail');
const cartCountDetail = document.getElementById('cart-count-detail');
const cartIconStore = document.getElementById('cart-icon-store');
const cartCountStore = document.getElementById('cart-count-store');
const cartIconPromo = document.getElementById('cart-icon-promo');
const cartCountPromo = document.getElementById('cart-count-promo');
const cartIconAccount = document.getElementById('cart-icon-account');
const cartCountAccount = document.getElementById('cart-count-account');

const wishlistIcon = document.getElementById('wishlist-icon');
const wishlistCount = document.getElementById('wishlist-count');

const storesContainer = document.getElementById('stores-container');
const categoriesContainer = document.getElementById('categories-container');
const productList = document.getElementById('product-list');
const wishlistItemsContainer = document.getElementById('wishlist-items-container');

const backToMainBtnCategory = document.getElementById('back-to-main-btn-category');
const backToMainBtnCart = document.getElementById('back-to-main-btn-cart');
const backFromDetailBtn = document.getElementById('back-from-detail-btn');
const backToMainBtnStore = document.getElementById('back-to-main-btn-store');
const backToMainBtnPromo = document.getElementById('back-to-main-btn-promo');
const backToMainBtnAccount = document.getElementById('back-to-main-btn-account');

const productDetailImage = document.getElementById('product-image');
const productDetailName = document.getElementById('product-name');
const productDetailCategory = document.getElementById('product-category');
const productDetailDescription = document.getElementById('product-description');
const productDetailPrice = document.getElementById('product-price');
const detailAddToCartBtn = document.getElementById('detail-add-to-cart-btn');
const addToWishlistBtn = document.getElementById('add-to-wishlist-btn');
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
const promoPageTitle = document.getElementById('promo-page-title');

let productDetailStartTime = null;
let highInterestTimer = null;
const HIGH_INTEREST_THRESHOLD_MS = 40 * 1000;
let storePageStartTime = null;

const imageViewer = document.getElementById('image-viewer');
const sliderWrapper = document.getElementById('slider-images-wrapper');
const sliderPrevBtn = document.getElementById('slider-prev-btn');
const sliderNextBtn = document.getElementById('slider-next-btn');
let currentImageIndex = 0;
let currentImageUrls = [];
let zoomStartTime = null;

// New elements for enhanced product page
const productVariantsContainer = document.getElementById('product-variants-container');
const stockAvailabilityEl = document.getElementById('stock-availability');

// New elements for Product Comparison feature
const compareBtnContainer = document.createElement('div');
compareBtnContainer.id = 'compare-btn-container';
compareBtnContainer.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 p-2 bg-gray-800 text-white rounded-full shadow-lg hidden z-50';
compareBtnContainer.innerHTML = '<button id="compare-modal-toggle" class="px-4 py-2 text-sm font-semibold rounded-full bg-blue-600 hover:bg-blue-700">Compare (<span id="compare-count">0</span>)</button>';
document.body.appendChild(compareBtnContainer);

const compareModal = document.createElement('div');
compareModal.id = 'compare-modal';
compareModal.className = 'fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center hidden z-[10000]';
compareModal.innerHTML = `
    <div class="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-[90%] max-h-[90vh] overflow-y-auto relative">
        <button id="close-compare-modal" class="absolute top-4 right-4 text-gray-500 text-2xl hover:text-gray-800">
            <i class="fas fa-times"></i>
        </button>
        <h3 class="text-2xl font-bold mb-4">Product Comparison</h3>
        <div id="compare-table-container"></div>
    </div>
`;
document.body.appendChild(compareModal);

// New function to handle Google Sign-In
function handleCredentialResponse(response) {
    console.log("Encoded JWT ID token: " + response.credential);
    // You would send this JWT to your backend for verification and user creation/login.
    // For this demo, we'll just log it.
    alert('Signed in with Google! (Demo)');
}

function startCountdownTimer(endTime, elementId) {
    const timerElement = document.getElementById(elementId);
    if (!timerElement) return;
    const countdown = setInterval(() => {
        const now = new Date().getTime();
        const distance = endTime - now;
        if (distance < 0) {
            clearInterval(countdown);
            timerElement.innerHTML = "EXPIRED";
            return;
        }
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        timerElement.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }, 1000);
}

function renderMegaMenu() {
    const megaMenu = document.getElementById('mega-menu');
    if (!megaMenu) return;

    megaMenu.innerHTML = `
        <div class="grid grid-cols-2 gap-4">
            ${categories.map(cat => `
                <a href="#category=${encodeURIComponent(cat.name)}" class="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 transition-colors duration-200">
                    <span class="font-medium text-lg">${cat.name}</span>
                </a>
            `).join('')}
        </div>
    `;
}

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
    promotionsPage.classList.add('hidden');
    storesPage.classList.add('hidden');
    categoryPage.classList.add('hidden');
    cartPage.classList.add('hidden');
    productDetailPage.classList.add('hidden');
    accountPage.classList.add('hidden');
}

function showPage(pageName, options = {}) {
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
    storePageStartTime = null;
    hideAllPages();
    currentPage = pageName;
    let newHash = '';
    let sellerId = null;
    let storeName = null;
    if (pageName === 'promotion' && options.storeName) {
        newHash = `promotion=${encodeURIComponent(options.storeName)}`;
        storeName = options.storeName;
        sellerId = EventTracker.getSellerId(storeName);
        promotionsPage.classList.remove('hidden');
        promoPageTitle.textContent = `${storeName} Best Sellers`;
        const promoProducts = products.filter(p => p.store === storeName && p.bestseller);
        const promoProductList = document.getElementById('promo-product-list');
        if (promoProductList) {
            promoProductList.dataset.section = 'Hot Promotions';
        }
        renderProducts(promoProducts, promoProductList);
        updateCartCounts();
        updateWishlistCount();
        EventTracker.track('store_visit', {
            store_name: storeName,
            seller_id: sellerId,
        });
        setupObserversForCurrentPage();
    } else if (pageName === 'store' && options.storeName) {
        newHash = `store=${encodeURIComponent(options.storeName)}`;
        storeName = options.storeName;
        sellerId = EventTracker.getSellerId(storeName);
        storesPage.classList.remove('hidden');
        storePageTitle.textContent = options.storeName;
        const storeProducts = products.filter(p => p.store === storeName);
        const storeProductList = document.getElementById('store-product-list');
        if (storeProductList) {
            storeProductList.dataset.section = options.storeName;
        }
        renderProducts(storeProducts, storeProductList);
        updateCartCounts();
        updateWishlistCount();
        EventTracker.track('store_visit', {
            store_name: options.storeName,
            seller_id: EventTracker.getSellerId(options.storeName),
        });
        setupObserversForCurrentPage();
    } else if (pageName === 'category' && options.category) {
        newHash = `category=${encodeURIComponent(options.category)}`;
        categoryPage.classList.remove('hidden');
        const productsByCategory = products.filter(p => p.category === options.category);
        categoryPageTitle.textContent = options.category;
        const categoryProductList = document.getElementById('category-product-list');
        if (categoryProductList) {
            categoryProductList.dataset.section = options.category;
        }
        renderProducts(productsByCategory, categoryProductList);
        updateCartCounts();
        updateWishlistCount();
        setupObserversForCurrentPage();
    } else if (pageName === 'product-detail' && options.productId) {
        newHash = `product=${options.productId}`;
        productDetailPage.classList.remove('hidden');
        renderProductDetail(options.productId);
        updateCartCounts();
        updateWishlistCount();
        setupObserversForCurrentPage();
    } else if (pageName === 'cart') {
        newHash = 'cart';
        cartPage.classList.remove('hidden');
        renderCart();
        updateCartCounts();
        updateWishlistCount();
        setupObserversForCurrentPage();
    } else if (pageName === 'account') {
        newHash = 'account';
        accountPage.classList.remove('hidden');
        renderWishlist();
        updateCartCounts();
        updateWishlistCount();
        setupObserversForCurrentPage();
    } else {
        newHash = '';
        mainPage.classList.remove('hidden');
        renderStores();
        renderCategories();
        const filteredProducts = products.filter(p => p.category && p.store);
        renderProducts(filteredProducts, productList);
        updateCartCounts();
        updateWishlistCount();
        setupObserversForCurrentPage();
    }
    if (window.location.hash.substring(1) !== newHash) {
        window.location.hash = newHash;
    }
    EventTracker.track('view_page', {
        seller_id: sellerId,
        store_name: storeName
    });
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
    productsToRender.forEach((product, index) => {
        const isBestSeller = product.bestseller || (index < 4 && container.id === 'promo-product-list');
        const productCard = document.createElement('a');
        productCard.href = `#product=${product.id}`;
        productCard.className = 'product-card block';
        productCard.dataset.productName = product.name;
        productCard.dataset.sellerId = EventTracker.getSellerId(product.store);
        productCard.dataset.productCategory = product.category;
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
                <button class="add-to-compare-btn text-xs text-blue-500 mt-2 hover:underline" data-product-id="${product.id}">Add to Compare</button>
            </div>
        `;
        container.appendChild(productCard);
    });

    document.querySelectorAll('.add-to-compare-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const productId = event.target.dataset.productId;
            toggleCompareProduct(productId, event.target);
        });
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
    if (highInterestTimer) {
        clearTimeout(highInterestTimer);
    }
    productDetailStartTime = Date.now();
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
    addToWishlistBtn.dataset.productId = product.id;
    const allImages = [product.image, ...(product.moreImages || [])];
    const thumbnailGallery = document.getElementById('thumbnail-gallery');
    thumbnailGallery.innerHTML = '';
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
        img.addEventListener('click', () => showImageViewer(allImages, index));
    });
    const existingReviewsSection = document.getElementById('reviews-section');
    if (existingReviewsSection) existingReviewsSection.remove();
    renderReviewSection(productId);
    const defaultDetails = `
        <h5 class="text-xl font-bold mb-4">Product Details</h5>
        <p><strong>Brand:</strong> ${product.brand || 'N/A'}</p>
        <p><strong>Category:</strong> ${product.category || 'N/A'}</p>
        <p><strong>Delivery:</strong> Estimated delivery in 3-5 business days.</p>
        <p><strong>Quantity:</strong> Limited stock available.</p>
        <p><strong>Highlights:</strong> High-quality materials, modern design, eco-friendly production.</p>
        <p><strong>Important Note:</strong> Colors may vary slightly due to lighting conditions.</p>
    `;
    const allDetails = `
        <h5 class="text-xl font-bold mb-4">Product Specifications</h5>
        <p><strong>Brand:</strong> ${product.brand || 'N/A'}</p>
        <p><strong>Category:</strong> ${product.category || 'N/A'}</p>
        <p><strong>Delivery:</strong> Estimated delivery in 3-5 business days.</p>
        <p><strong>Quantity:</strong> Limited stock available.</p>
        <p><strong>Highlights:</strong> High-quality materials, modern design, eco-friendly production.</p>
        <p><strong>Important Note:</strong> Colors may vary slightly due to lighting conditions.</p>
        <p><strong>Product ID:</strong> ${product.id}</p>
        <p><strong>Variant:</strong> ${product.variant || 'N/A'}</p>
        <p><strong>Description:</strong> ${product.description || 'N/A'}</p>
    `;
    const allDetailsSection = document.getElementById('all-details-section');
    allDetailsSection.innerHTML = defaultDetails;
    allDetailsSection.classList.remove('hidden');
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
    renderReviewSection(productId, 'default');
    renderRecommendations(product); // New function call

    // Handle Product Variants
    productVariantsContainer.innerHTML = '';
    if (product.variants && product.variants.length > 0) {
        const variantsHtml = product.variants.map(v => `
            <button class="variant-selector w-8 h-8 rounded-full border-2 border-transparent hover:border-gray-500 transition-all" 
                    style="background-color: ${v.color_hex};"
                    data-image-url="${v.image}"
                    title="${v.name}">
            </button>
        `).join('');
        productVariantsContainer.innerHTML = `<strong>Color:</strong> ${variantsHtml}`;

        document.querySelectorAll('.variant-selector').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const newImage = e.target.dataset.imageUrl;
                productDetailImage.src = newImage;
            });
        });
    }

    // Handle Stock Availability
    if (stockAvailabilityEl) {
        if (product.stock > 0) {
            stockAvailabilityEl.innerHTML = `<span class="text-green-600 font-semibold">In Stock (${product.stock} left)</span>`;
            detailAddToCartBtn.disabled = false;
            detailAddToCartBtn.textContent = 'Add to Cart';
        } else {
            stockAvailabilityEl.innerHTML = `<span class="text-red-600 font-semibold">Out of Stock</span>`;
            detailAddToCartBtn.disabled = true;
            detailAddToCartBtn.textContent = 'Out of Stock';
        }
    }
    
    // Add to cart event listener
    detailAddToCartBtn.onclick = (event) => {
        const id = event.target.dataset.productId;
        const productToAdd = products.find(p => p.id === id);
        if (productToAdd) {
            addToCart(productToAdd);
        }
    };
    addToWishlistBtn.onclick = (event) => {
        const id = event.target.dataset.productId;
        const productToAdd = products.find(p => p.id === id);
        if (productToAdd) {
            addToWishlist(productToAdd);
        }
    };
}

function renderRecommendations(currentProduct) {
    const recommendationsContainer = document.getElementById('recommended-products-container');
    if (!recommendationsContainer) return;
    const relevantProducts = products.filter(p => 
        (p.category === currentProduct.category || p.store === currentProduct.store) && p.id !== currentProduct.id
    ).slice(0, 4);
    if (relevantProducts.length === 0) {
        recommendationsContainer.innerHTML = '';
        return;
    }
    recommendationsContainer.innerHTML = `
        <h3 class="text-2xl font-bold mb-4 mt-8">You Might Also Like</h3>
        <div class="product-grid"></div>
    `;
    const grid = recommendationsContainer.querySelector('.product-grid');
    renderProducts(relevantProducts, grid);
}


function renderReviewSection(productId, mode = 'default') {
    const reviewsForProduct = allProductReviews[productId] || [];
    const reviewsSectionHtml = `
        <div id="reviews-section" class="mt-8">
            <h3 class="text-4xl font-bold mb-4">
                <span id="review-count">${reviewsForProduct.length}</span> Comments
                <div class="sort-by-container inline-block ml-4 text-base font-normal">
                    <label for="sort-reviews">Sort by</label>
                    <select id="sort-reviews" class="form-control w-auto inline-block">
                        <option value="top">Top</option>
                        <option value="newest">Newest</option>
                    </select>
                </div>
            </h3>
            <div id="review-submit-section" class="flex items-start mb-6">
                <div class="user-profile-icon w-10 h-10 mr-4 rounded-full bg-gray-300 flex-shrink-0"></div>
                <div class="flex-grow">
                    <textarea id="review-text" class="form-control" rows="1" placeholder="Add a public comment..."></textarea>
                    <div class="flex justify-end mt-2">
                        <button id="cancel-review-btn" class="btn btn-secondary mr-2">Cancel</button>
                        <button id="submit-review-btn" class="btn btn-primary">Comment</button>
                    </div>
                </div>
            </div>
            <div id="reviews-display-area" class="space-y-4 mb-6"></div>
        </div>
    `;
    const reviewsSection = document.querySelector('#product-detail-page .main-content #reviews-section');
    if (reviewsSection) {
        reviewsSection.remove();
    }
    document.querySelector('#product-detail-page .main-content').insertAdjacentHTML('beforeend', reviewsSectionHtml);
    document.getElementById('submit-review-btn').addEventListener('click', () => {
        const reviewText = document.getElementById('review-text').value.trim();
        if (reviewText) {
            submitReview(productId, 5, reviewText);
        } else {
            alertMessage("Please write your review before submitting.");
        }
    });
    document.getElementById('cancel-review-btn').addEventListener('click', () => {
        document.getElementById('review-text').value = '';
    });
    document.getElementById('sort-reviews').addEventListener('change', (e) => {
        renderReviews(productId, e.target.value);
    });
    renderReviews(productId, 'top');
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
    const newReview = {
        user: 'New User',
        userImage: 'https://placehold.co/40x40/ccc/fff?text=U',
        isPinned: false,
        timeAgo: 'Just now',
        rating: parseInt(rating),
        text: reviewText,
        likes: 0,
        replies: 0,
        timestamp: Date.now()
    };
    if (!allProductReviews[productId]) {
        allProductReviews[productId] = [];
    }
    allProductReviews[productId].push(newReview);
    localStorage.setItem('allProductReviews', JSON.stringify(allProductReviews));
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
    document.getElementById('review-text').value = '';
    renderReviewSection(productId);
}

function renderReviews(productId, sortOrder = 'top') {
    let reviewsToRender = allProductReviews[productId] || [];
    const reviewsDisplayArea = document.getElementById('reviews-display-area');
    if (!reviewsDisplayArea) return;
    reviewsDisplayArea.innerHTML = '';
    document.getElementById('review-count').textContent = reviewsToRender.length;
    if (sortOrder === 'newest') {
        reviewsToRender.sort((a, b) => b.timestamp - a.timestamp);
    } else {
        reviewsToRender.sort((a, b) => (b.isPinned - a.isPinned) || (b.likes - a.likes));
    }
    if (reviewsToRender.length > 0) {
        reviewsToRender.forEach(review => {
            const reviewDiv = document.createElement('div');
            reviewDiv.className = 'review-div bg-white p-4 rounded-md shadow-sm border border-gray-200';
            reviewDiv.innerHTML = `
                <div class="flex items-start mb-2">
                    <img src="${review.userImage}" alt="${review.user}" class="w-10 h-10 rounded-full mr-4">
                    <div>
                        <div class="flex items-center">
                            <span class="font-semibold text-base">${review.user}</span>
                            <span class="text-gray-500 text-xs ml-2">${review.timeAgo}</span>
                            ${review.isPinned ? '<span class="text-xs ml-2 px-2 py-0.5 rounded-full bg-gray-200 font-bold pinned-tag">Pinned</span>' : ''}
                        </div>
                        <p class="text-gray-700 text-lg mb-2">${review.text}</p>
                        <div class="flex items-center space-x-4 text-gray-500">
                            <button class="flex items-center space-x-1 hover:text-blue-500">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-thumbs-up"><path d="M7 10v12h11c1.1 0 2-0.9 2-2V8l-6-6H7a2 2 0 0 0-2 2v8"/><path d="M10 10v6l-3-3"/><path d="M5 2c-1.1 0-2 0.9-2 2v6c0 1.1 0.9 2 2 2h2V2H5z"/></svg>
                                <span>${review.likes}</span>
                            </button>
                            <button class="flex items-center space-x-1 hover:text-blue-500">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-thumbs-down"><path d="M17 14V2H6c-1.1 0-2 0.9-2 2v8l6 6h11a2 2 0 0 0 2-2v-6"/><path d="M14 14v-6l3 3"/><path d="M19 22c1.1 0 2-0.9 2-2v-6c0-1.1-0.9-2-2-2h-2V22h2z"/></svg>
                            </button>
                            <button class="text-sm font-semibold hover:text-blue-500">Reply</button>
                        </div>
                    </div>
                </div>
            `;
            reviewsDisplayArea.appendChild(reviewDiv);
        });
    } else {
        reviewsDisplayArea.innerHTML = '<p class="text-gray-500">No reviews yet. Be the first to review!</p>';
    }
}


function renderAllReviews(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) {
        console.error('Product not found for review tracking.');
        return;
    }
    const sellerId = EventTracker.getSellerId(product.store);
    const reviewsForProduct = allProductReviews[productId] || [];
    EventTracker.track('view_user_reviews', {
        seller_id: sellerId,
        store_name: product.store,
        viewed_reviews_count: reviewsForProduct.length,
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

function addToCart(product) {
    const existingItem = cartItems.find(item => item.productId === product.id);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cartItems.push({
            ...product,
            productId: product.id,
            quantity: 1
        });
    }
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    updateCartCounts();
    alertMessage('Product added to cart!');
}

function addToWishlist(product) {
    const existingItem = wishlistItems.find(item => item.id === product.id);
    if (!existingItem) {
        wishlistItems.push(product);
        localStorage.setItem('wishlistItems', JSON.stringify(wishlistItems));
        updateWishlistCount();
        alertMessage('Product added to wishlist!');
    } else {
        alertMessage('Product is already in your wishlist.');
    }
}

function removeFromWishlist(productId) {
    wishlistItems = wishlistItems.filter(item => item.id !== productId);
    localStorage.setItem('wishlistItems', JSON.stringify(wishlistItems));
    updateWishlistCount();
    renderWishlist();
    alertMessage('Product removed from wishlist.');
}

function updateCartCounts() {
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const counts = [cartCountMain, cartCountCategory, cartCountStore, cartCountDetail, cartCountPromo, cartCountAccount];
    counts.forEach(countEl => {
        if (totalItems > 0) {
            countEl.textContent = totalItems;
            countEl.classList.remove('hidden');
        } else {
            countEl.classList.add('hidden');
        }
    });
}

function updateWishlistCount() {
    const totalItems = wishlistItems.length;
    const countEl = wishlistCount;
    if (totalItems > 0) {
        countEl.textContent = totalItems;
        countEl.classList.remove('hidden');
    } else {
        countEl.classList.add('hidden');
    }
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
                        <div class="flex items-center mt-2">
                            <button class="quantity-btn decrease-quantity text-gray-600 hover:text-gray-800" data-product-id="${product.id}">-</button>
                            <span class="mx-2">${item.quantity}</span>
                            <button class="quantity-btn increase-quantity text-gray-600 hover:text-gray-800" data-product-id="${product.id}">+</button>
                        </div>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-lg font-bold text-[#a55447]">$${itemTotal.toFixed(2)}</p>
                    <button class="remove-from-cart-btn text-red-500 hover:text-red-700 text-sm mt-1" data-product-id="${product.id}">Remove</button>
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
    cartItemsContainer.querySelectorAll('.increase-quantity').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.target.dataset.productId;
            changeQuantity(productId, 1);
        });
    });
    cartItemsContainer.querySelectorAll('.decrease-quantity').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.target.dataset.productId;
            changeQuantity(productId, -1);
        });
    });
}

function renderWishlist() {
    wishlistItemsContainer.innerHTML = '';
    if (wishlistItems.length === 0) {
        wishlistItemsContainer.innerHTML = `<p class="text-gray-500 text-center col-span-full">Your wishlist is empty.</p>`;
        return;
    }
    wishlistItems.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card block';
        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <div class="product-card-body">
                <h3 class="h-12 overflow-hidden">${product.name}</h3>
                <p class="price">$${product.price.toFixed(2)}</p>
                <button class="btn btn-secondary mt-4 add-to-cart-from-wishlist-btn" data-product-id="${product.id}">Add to Cart</button>
                <button class="btn btn-secondary mt-2 remove-from-wishlist-btn" data-product-id="${product.id}">Remove</button>
            </div>
        `;
        wishlistItemsContainer.appendChild(productCard);
    });
    wishlistItemsContainer.querySelectorAll('.add-to-cart-from-wishlist-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.target.dataset.productId;
            const productToAdd = products.find(p => p.id === productId);
            if (productToAdd) {
                addToCart(productToAdd);
            }
        });
    });
    wishlistItemsContainer.querySelectorAll('.remove-from-wishlist-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.target.dataset.productId;
            removeFromWishlist(productId);
        });
    });
}

function changeQuantity(productId, amount) {
    const item = cartItems.find(item => item.productId === productId);
    if (item) {
        item.quantity += amount;
        if (item.quantity <= 0) {
            removeItemFromCart(productId);
        } else {
            localStorage.setItem('cartItems', JSON.stringify(cartItems));
            updateCartCounts();
            renderCart();
        }
    }
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
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    updateCartCounts();
    renderCart();
    alertMessage('Item removed from cart.');
}

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
    } else if (hash.startsWith('promotion=')) {
        const storeName = decodeURIComponent(hash.split('=')[1]);
        context.store_name = storeName;
        context.seller_id = EventTracker.SELLER_ID_MAP[storeName] || null;
    } else if (hash.startsWith('category=')) {
        const category = decodeURIComponent(hash.split('=')[1]);
        context.store_name = 'General Promotions';
        context.seller_id = EventTracker.SELLER_ID_MAP['General Promotions'];
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
    if (hash.startsWith('promotion=')) {
        const storeName = decodeURIComponent(hash.split('=')[1]);
        showPage('promotion', {
            storeName
        });
    } else if (hash.startsWith('store=')) {
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
    } else if (hash === 'account') {
        showPage('account');
    } else {
        showPage('main');
    }
}
let hoverTimer = null;
let lastHoveredSection = null;
const productAndSectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const element = entry.target;
        const sectionName = element.dataset.section;
        const productName = element.dataset.productName;
        const sellerIdFromProduct = element.dataset.sellerId;
        const productCategory = element.dataset.productCategory;
        if (entry.isIntersecting) {
            if (productName && sellerIdFromProduct && productCategory) {
                const storeNameFromProduct = EventTracker.REVERSE_SELLER_ID_MAP[sellerIdFromProduct];
                EventTracker.track('product_hover_event', {
                    item_name: productName,
                    seller_id: sellerIdFromProduct,
                    store_name: storeNameFromProduct,
                    item_category: productCategory,
                    event_type: 'hover',
                });
            } else if (sectionName) {
                hoverTimer = setTimeout(() => {
                    const scrollDepth = Math.round((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100);
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
                }, 3000);
            }
        } else {
            if (hoverTimer) {
                clearTimeout(hoverTimer);
                hoverTimer = null;
            }
        }
    });
}, {
    threshold: 0.5
});

function setupObserversForCurrentPage() {
    productAndSectionObserver.disconnect();
    document.querySelectorAll('[data-section], [data-product-name]').forEach(element => {
        productAndSectionObserver.observe(element);
    });
}

function renderSearchResults(query) {
    const queryLower = query.toLowerCase();
    const filteredProducts = products.filter(product => {
        return product.name.toLowerCase().includes(queryLower) ||
            product.category.toLowerCase().includes(queryLower) ||
            product.store.toLowerCase().includes(queryLower);
    });
    const searchResultsContainer = document.getElementById('search-results-container');
    searchResultsContainer.innerHTML = '';
    if (query.trim() === '') {
        const initialMessage = document.createElement('p');
        initialMessage.className = 'text-gray-500 text-center col-span-full';
        initialMessage.textContent = 'Start typing to search for products...';
        searchResultsContainer.appendChild(initialMessage);
        return;
    }
    if (filteredProducts.length > 0) {
        filteredProducts.forEach(product => {
            const productCard = document.createElement('a');
            productCard.href = `#product=${product.id}`;
            productCard.className = 'product-card search-result-card block';
            productCard.innerHTML = `
                <img src="${product.image}" alt="${product.name}">
                <div class="product-card-body">
                    <p class="category">${product.category}</p>
                    <h3 class="h-12 overflow-hidden">${product.name}</h3>
                    <p class="price">$${product.price.toFixed(2)}</p>
                    <button class="add-to-compare-btn text-xs text-blue-500 mt-2 hover:underline" data-product-id="${product.id}">Add to Compare</button>
                </div>
            `;
            productCard.addEventListener('click', (e) => {
                e.preventDefault();
                showProductDetailPage(product);
                searchOverlay.classList.add('hidden');
            });
            searchResultsContainer.appendChild(productCard);
        });
    } else {
        const noResultsMessage = document.createElement('p');
        noResultsMessage.className = 'text-red-500 text-center col-span-full';
        noResultsMessage.textContent = 'No products found matching your search.';
        searchResultsContainer.appendChild(noResultsMessage);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    EventTracker.setUserId('anon-user');
    EventTracker.init();
    document.getElementById('profile-icon').addEventListener('click', () => {
        window.location.hash = 'account';
    });
    document.getElementById('wishlist-icon').addEventListener('click', () => {
        window.location.hash = 'account';
    });
    [cartIconMain, cartIconCategory, cartIconStore, cartIconDetail, cartIconPromo, cartIconAccount].forEach(icon => {
        icon.addEventListener('click', () => showPage('cart'));
    });
    backToMainBtnCategory.addEventListener('click', () => window.location.hash = '');
    backToMainBtnCart.addEventListener('click', () => window.location.hash = '');
    backFromDetailBtn.addEventListener('click', () => {
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
    backToMainBtnPromo.addEventListener('click', () => window.location.hash = '');
    backToMainBtnAccount.addEventListener('click', () => window.location.hash = '');
    checkoutBtn.addEventListener('click', () => {
        if (cartItems.length > 0) {
            alertMessage('Proceeding to checkout! (This is a demo)');
            cartItems = [];
            localStorage.setItem('cartItems', JSON.stringify(cartItems));
            updateCartCounts();
            updateWishlistCount();
            renderCart();
        } else {
            alertMessage('Your cart is empty!');
        }
    });
    document.querySelectorAll('.promo-grid a').forEach(banner => {
        banner.addEventListener('click', (event) => {
            event.preventDefault();
            const promotionId = banner.dataset.promotionId || banner.alt;
            const promotionName = banner.dataset.promotionName || null;
            const creativeSlot = banner.dataset.creativeSlot || null;
            const storeName = banner.dataset.storeName;
            if (storeName) {
                window.location.hash = `promotion=${encodeURIComponent(storeName)}`;
            }
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
    searchIconBtn.addEventListener('click', () => {
        searchOverlay.classList.remove('hidden');
        searchInput.focus();
        renderSearchResults('');
    });
    searchCloseBtn.addEventListener('click', () => {
        searchOverlay.classList.add('hidden');
        searchInput.value = '';
        searchResultsContainer.innerHTML = '';
    });
    searchInput.addEventListener('keyup', (e) => {
        renderSearchResults(e.target.value);
    });
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    document.getElementById('image-viewer-close-btn').addEventListener('click', hideImageViewer);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && imageViewer.classList.contains('visible')) {
            hideImageViewer();
        }
        if (e.key === 'Escape' && searchOverlay.classList.contains('hidden') === false) {
            searchOverlay.classList.add('hidden');
            searchInput.value = '';
            searchResultsContainer.innerHTML = '';
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
    setupObserversForCurrentPage();
    handleHashChange();

    // Call new functions
    renderMegaMenu();
    const saleEndTime = new Date().getTime() + 86400000;
    startCountdownTimer(saleEndTime, 'flash-sale-timer');

    // Chatbot logic
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbotWindow = document.getElementById('chatbot-window');
    const chatbotClose = document.getElementById('chatbot-close');
    const chatbotMessages = document.getElementById('chatbot-messages');
    const chatbotInput = document.getElementById('chatbot-input');

    // Toggle Chatbot Visibility
    chatbotToggle.addEventListener('click', () => {
        chatbotWindow.classList.toggle('hidden');
        if (!chatbotWindow.classList.contains('hidden')) {
            chatbotInput.focus();
        }
    });

    // Close Chatbot Window
    chatbotClose.addEventListener('click', () => {
        chatbotWindow.classList.add('hidden');
    });

    // Handle User Input and Bot Responses
    chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && chatbotInput.value.trim() !== '') {
            const userMessage = chatbotInput.value.trim();
            displayMessage(userMessage, 'user');
            chatbotInput.value = '';
            getBotResponse(userMessage);
        }
    });

    // Function to display messages in the chat window
    function displayMessage(message, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `p-2 rounded-lg max-w-[80%] ${sender === 'user' ? 'bg-[#34495e] text-white ml-auto' : 'bg-gray-200 text-gray-800 mr-auto'}`;
        messageDiv.textContent = message;
        chatbotMessages.appendChild(messageDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight; // Auto-scroll to bottom
    }

    // Function to get a canned bot response
    function getBotResponse(userMessage) {
        const msg = userMessage.toLowerCase();
        let response = "I'm sorry, I don't understand that. Please ask about products, orders, or delivery.";

        if (msg.includes("hello") || msg.includes("hi")) {
            response = "Hi there! How can I help you today?";
        } else if (msg.includes("delivery") || msg.includes("shipping")) {
            response = "We offer standard delivery in 3-5 business days. You can check your order status in your account.";
        } else if (msg.includes("track my order") || msg.includes("order status")) {
            response = "Please provide your order number and I can look up the status for you.";
        } else if (msg.includes("return") || msg.includes("refund")) {
            response = "You can initiate a return within 30 days of purchase. Please visit our returns page for more information.";
        } else if (msg.includes("product") && msg.includes("recommend")) {
            response = "You can find our featured and best-selling products on the homepage!";
        } else if (msg.includes("thanks") || msg.includes("thank you")) {
            response = "You're welcome! Feel free to ask if you need anything else.";
        }

        setTimeout(() => {
            displayMessage(response, 'bot');
        }, 500); // Simulate a slight delay for the bot response
    }
});