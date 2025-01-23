const express = require("express");
const fetch = require("node-fetch");
const app = express();
const port = 3000;

// Add CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

const API_KEY = "QzWZa4SReQh-AZoOlLMUAr_xNBg2bYyHQJURpsWDVUJG";
const SCORING_URL = "https://eu-de.ml.cloud.ibm.com/ml/v4/deployments/748955ec-6e6e-4cf2-871f-8bb3ca153335/predictions?version=2021-05-01";

app.use(express.json());

// Add token endpoint with better error handling
app.get('/get-token', async (req, res) => {
    try {
        console.log('Attempting to fetch token from IBM...');
        const tokenResponse = await fetch("https://iam.cloud.ibm.com/identity/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json"
            },
            body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${API_KEY}`
        });

        console.log('Token response status:', tokenResponse.status);
        
        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('IBM API Error:', errorText);
            return res.status(500).json({ 
                error: "Failed to fetch token", 
                details: errorText 
            });
        }

        const tokenData = await tokenResponse.json();
        console.log('Token successfully retrieved');
        res.json({ token: tokenData.access_token });
    } catch (error) {
        console.error('Detailed token error:', error);
        res.status(500).json({ 
            error: "Failed to fetch token", 
            message: error.message 
        });
    }
});

// Add a root endpoint
app.get('/', (req, res) => {
    res.send('Server is running');
});

// Endpoint to handle scoring requests
app.post("/recommend", async (req, res) => {
    try {
        // Get token from request headers
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            console.log('No token provided in request');
            return res.status(401).json({ error: "No token provided" });
        }

        console.log('Making scoring request to:', SCORING_URL);
        console.log('Request payload:', JSON.stringify(req.body, null, 2));

        const scoringResponse = await fetch(SCORING_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(req.body)
        });

        if (!scoringResponse.ok) {
            const errorText = await scoringResponse.text();
            console.error('Scoring API Error:', errorText);
            return res.status(500).json({ 
                error: "Failed to fetch recommendations",
                details: errorText
            });
        }

        const resultData = await scoringResponse.json();
        console.log('Successful prediction result:', resultData);
        res.json(resultData);
    } catch (error) {
        console.error('Detailed scoring error:', error);
        res.status(500).json({ 
            error: "Failed to fetch recommendations",
            message: error.message 
        });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});