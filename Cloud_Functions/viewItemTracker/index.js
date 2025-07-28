// This file must be named index.js and placed inside the viewItemTracker/ sub-folder.

const { BigQuery } = require('@google-cloud/bigquery');

// --- CONFIGURATION ---
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
    throw error;
  }
}

// Reusable function to set all required CORS headers
function setCorsHeaders(res) {
    res.set('Access-Control-Allow-Origin', 'http://127.0.0.1:5500');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Allow-Credentials', 'true');
}

// --- CLOUD FUNCTION: View Item Tracker ---
// This function must be named 'viewItemTracker' as per the --entry-point flag
exports.viewItemTracker = async (req, res) => {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    try {
        let eventData = req.body;
        // --- IMPORTANT: REMOVING client_ip and event_params for current schema ---
        delete eventData.client_ip;
        delete eventData.event_params;
        // --- END REMOVAL ---
        eventData.event_name = 'view_item'; // Ensure event_name is correct for this function
        await insertIntoBigQuery(eventData);
        res.status(200).send('View item event ingested.');
    } catch (error) {
        console.error('ERROR in viewItemTracker:', error);
        res.status(500).send('An error occurred.');
    }
};