const { BigQuery } = require('@google-cloud/bigquery');

// --- CONFIGURATION ---
// These are hardcoded as per your last provided working version.
// For production, consider using environment variables set during deployment
// like process.env.BQ_PROJECT_ID, etc.
const BQ_PROJECT_ID = 'svaraflow';
const BQ_DATASET_ID = 'test_realtime_events';
const BQ_TABLE_ID = 'events';


const bigquery = new BigQuery({ projectId: BQ_PROJECT_ID });

// Reusable function to insert data
async function insertIntoBigQuery(eventData) {
  eventData.ingestion_timestamp = new Date().toISOString();
  try {
    await bigquery.dataset(BQ_DATASET_ID).table(BQ_TABLE_ID).insert(eventData);
    console.log(`Successfully processed event: ${eventData.event_name}`);
  } catch (error) {
    console.error(`ERROR inserting ${eventData.event_name} into BigQuery:`, error);
    if (error.response && error.response.insertErrors) {
        console.error('BigQuery insert errors detail:');
        error.response.insertErrors.forEach(err => {
            console.error('  Row error:', JSON.stringify(err.errors));
            console.error('  Failed row:', JSON.stringify(err.row));
        });
    }
    throw error; // Re-throw to indicate failure
  }
}

// Reusable function to set all required CORS headers
function setCorsHeaders(res) {
    res.set('Access-Control-Allow-Origin', 'http://127.0.0.1:5500'); // Explicitly allow your local dev server
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Allow-Credentials', 'true'); // Allows sending cookies etc.
}

// --- CLOUD FUNCTION 1: Page View Tracker ---
exports.pageViewTracker = async (req, res) => {
    setCorsHeaders(res);
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    try {
        let eventData = req.body; // Get the incoming data from frontend

        // --- IMPORTANT: REMOVING client_ip and event_params for current schema ---
        // As per your request, these fields are deleted from the payload BEFORE sending to BigQuery,
        // assuming your BigQuery schema does NOT have them and works for other team members this way.
        // If you add these fields to your BigQuery schema later, remove these `delete` lines.
        delete eventData.client_ip;
        delete eventData.event_params;
        // --- END REMOVAL ---

        eventData.event_name = 'page_view'; // Ensure event_name is correct for this function
        await insertIntoBigQuery(eventData);
        res.status(200).send('Page view ingested.');
    } catch (error) {
        console.error('ERROR in pageViewTracker:', error);
        res.status(500).send('An error occurred.');
    }
};

// --- CLOUD FUNCTION 2: Purchase Tracker (Example for other team members) ---
// This function is provided as a template for other team members to expand upon.
// It also deletes client_ip and event_params.
exports.purchaseTracker = async (req, res) => {
    setCorsHeaders(res);
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    try {
        let eventData = req.body; // Get the incoming data from frontend

        // --- IMPORTANT: REMOVING client_ip and event_params for current schema ---
        delete eventData.client_ip;
        delete eventData.event_params;
        // --- END REMOVAL ---
        
        eventData.event_name = 'purchase'; // Ensure event_name is correct for this function
        // Other team members would add purchase-specific logic here (e.g., validate items, add transaction_id)
        await insertIntoBigQuery(eventData);
        res.status(200).send('Purchase ingested.');
    } catch (error) {
        console.error('ERROR in purchaseTracker:', error);
        res.status(500).send('An error occurred.');
    }
};

// --- Placeholders for other Cloud Functions (for team members to implement) ---
// Team members can copy and modify the structure of pageViewTracker/purchaseTracker
// for their specific events (e.g., first_visit, session_start, click, scroll, view_item, view_promotion).
/*
exports.firstVisitTracker = async (req, res) => {
    // setCorsHeaders(res); ...
    // try { let eventData = req.body; delete eventData.client_ip; delete eventData.event_params; eventData.event_name = 'first_visit'; await insertIntoBigQuery(eventData); res.status(200).send('First visit ingested.'); } catch (error) { console.error('ERROR in firstVisitTracker:', error); res.status(500).send('An error occurred.'); }
};

exports.sessionStartTracker = async (req, res) => {
    // setCorsHeaders(res); ...
    // try { let eventData = req.body; delete eventData.client_ip; delete eventData.event_params; eventData.event_name = 'session_start'; await insertIntoBigQuery(eventData); res.status(200).send('Session start ingested.'); } catch (error) { console.error('ERROR in sessionStartTracker:', error); res.status(500).send('An error occurred.'); }
};

// ... and so on for clickTracker, scrollTracker, viewItemTracker, viewPromotionTracker
*/