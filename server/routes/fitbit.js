const express = require('express');
const router = express.Router();
const axios = require('axios');
const FitbitData = require('../models/FitbitData');

// 1. Redirect user to Fitbit Login — pass userId via state param
router.get('/auth', (req, res) => {
    const userId = req.query.userId;
    if (!userId) {
        return res.status(400).send('Missing userId. Please log in to the app first.');
    }
    const scope = 'heartrate profile';
    let redirectUri = (process.env.FITBIT_REDIRECT_URI || 'http://localhost:5000/api/fitbit/callback').trim();
    
    // Ensure no trailing slash if the dashboard doesn't have one
    if (redirectUri.endsWith('/')) {
        redirectUri = redirectUri.slice(0, -1);
    }
    const state = Buffer.from(userId).toString('base64'); // Encode userId securely as state
    const authUrl = `https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=${process.env.FITBIT_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
    
    // DEBUG: Log the generated URL for Render Logs
    console.log(`[FITBIT AUTH] Generated URL for User ${userId}:`);
    console.log(` - ClientID: ${process.env.FITBIT_CLIENT_ID}`);
    console.log(` - Redirect: ${redirectUri}`);
    console.log(` - State (base64): ${state}`);
    
    res.redirect(authUrl);
});

// Helper to Refresh Fitbit Token
const refreshFitbitToken = async (fitbitData) => {
    const authHeader = Buffer.from(`${process.env.FITBIT_CLIENT_ID}:${process.env.FITBIT_CLIENT_SECRET}`).toString('base64');
    
    try {
        const response = await axios.post('https://api.fitbit.com/oauth2/token', 
            new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: fitbitData.refreshToken,
            }).toString(), 
            {
                headers: {
                    'Authorization': `Basic ${authHeader}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        fitbitData.accessToken = response.data.access_token;
        fitbitData.refreshToken = response.data.refresh_token;
        fitbitData.lastSync = new Date();
        await fitbitData.save();
        
        console.log(`Fitbit token refreshed successfully for user: ${fitbitData.user}`);
        return response.data.access_token;
    } catch (error) {
        console.error('Fitbit Token Refresh Error:', error.response?.data || error.message);
        throw error;
    }
};

// 2. Handle the Callback and get the Access Token
router.get('/callback', async (req, res) => {
    const authorizationCode = req.query.code;
    const redirectUri = process.env.FITBIT_REDIRECT_URI || 'http://localhost:5000/api/fitbit/callback';
    
    // Create the Basic Auth header required by Fitbit
    const authHeader = Buffer.from(`${process.env.FITBIT_CLIENT_ID}:${process.env.FITBIT_CLIENT_SECRET}`).toString('base64');

    try {
        const response = await axios.post('https://api.fitbit.com/oauth2/token', 
            new URLSearchParams({
                client_id: process.env.FITBIT_CLIENT_ID,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
                code: authorizationCode,
            }).toString(), 
            {
                headers: {
                    'Authorization': `Basic ${authHeader}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        const accessToken = response.data.access_token;
        const refreshToken = response.data.refresh_token;

        // Decode the userId from the state parameter passed during /auth
        const internalUserId = Buffer.from(req.query.state || '', 'base64').toString('utf8');
        if (!internalUserId) {
            return res.status(400).send('Invalid state parameter. Could not identify user.');
        }

        let fitbitData = await FitbitData.findOne({ user: internalUserId }); 
        
        if (!fitbitData) {
            fitbitData = new FitbitData({
                user: internalUserId,
                accessToken: accessToken,
                refreshToken: refreshToken,
                lastSync: new Date(),
                heartRateLogs: []
            });
        } else {
            fitbitData.accessToken = accessToken;
            fitbitData.refreshToken = refreshToken;
            fitbitData.lastSync = new Date();
        }
        await fitbitData.save();
        
        // Redirect back to your Flutter mobile app via Deep Link
        res.redirect(`emotionalenergyos://fitbit-callback?fitbit_connected=true`);

    } catch (error) {
        console.error('Fitbit Auth Error:', error.response?.data || error.message);
        res.status(500).send('Authentication failed. Check your server console.');
    }
});

// Endpoint to fetch and persist live heart rate data (Upgraded to fetch real Fitbit API data)
router.get('/heart-rate/:userId', async (req, res) => {
  try {
    let fitbitData = await FitbitData.findOne({ user: req.params.userId });

    if (fitbitData && fitbitData.accessToken && fitbitData.accessToken !== 'mock-token') {
      let currentToken = fitbitData.accessToken;
      
      const fetchHeartRate = async (token) => {
        return axios.get('https://api.fitbit.com/1/user/-/activities/heart/date/today/1d/1sec.json', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      };

      try {
        let response;
        try {
          response = await fetchHeartRate(currentToken);
        } catch (err) {
          // If token is expired (401), try refreshing it
          if (err.response?.status === 401 && fitbitData.refreshToken) {
            console.log("Access token expired. Attempting to refresh...");
            currentToken = await refreshFitbitToken(fitbitData);
            response = await fetchHeartRate(currentToken); // Retry with fresh token
          } else {
            throw err;
          }
        }
        
        const dataset = response.data['activities-heart-intraday']?.dataset || [];
        
        // Map the real dataset to the expected format
        const realLogs = dataset.map(dp => ({
          time: dp.time,
          value: dp.value
        }));

        fitbitData.heartRateLogs = realLogs;
        fitbitData.lastSync = new Date();
        await fitbitData.save();

        return res.json({
          status: 'success',
          data: realLogs,
          currentBpm: realLogs.length > 0 ? realLogs[realLogs.length - 1].value : 0,
          message: 'Real heart rate data retrieved from Fitbit API.'
        });
      } catch (fitbitErr) {
        console.error("Fitbit Intraday fetch error:", fitbitErr.response?.data || fitbitErr.message);
        
        // If the refresh token is truly dead, clear it so the user can re-auth
        if (fitbitErr.response?.data?.errors?.some(e => e.errorType === 'invalid_grant')) {
            console.log("Token revoked or invalid. Clearing from database...");
            fitbitData.accessToken = null;
            fitbitData.refreshToken = null;
            await fitbitData.save();
        }
      }
    }

    // Fallback: Generate new mock logs if not connected to Fitbit or if fetch fails
    const newLogs = Array.from({ length: 24 }).map((_, i) => ({
      time: `${i < 10 ? '0' + i : i}:00`,
      value: Math.floor(Math.random() * (130 - 65 + 1) + 65)
    }));

    if (!fitbitData) {
      fitbitData = new FitbitData({
        user: req.params.userId,
        accessToken: 'mock-token',
        refreshToken: 'mock-refresh',
        lastSync: new Date(),
        heartRateLogs: newLogs
      });
    } else {
      fitbitData.heartRateLogs = newLogs; 
      fitbitData.lastSync = new Date();
    }

    await fitbitData.save();

    res.json({
      status: 'success',
      data: fitbitData.heartRateLogs,
      currentBpm: fitbitData.heartRateLogs[fitbitData.heartRateLogs.length - 1].value,
      message: 'Mock heart rate data (Fitbit not connected or API request failed).'
    });
  } catch (err) {
    console.error('Final sync error:', err);
    res.status(500).json({ error: 'Failed to sync Fitbit data' });
  }
});

// Debug route to verify parameters
router.get('/debug', (req, res) => {
    let redirectUri = (process.env.FITBIT_REDIRECT_URI || 'http://localhost:5000/api/fitbit/callback').trim();
    if (redirectUri.endsWith('/')) {
        redirectUri = redirectUri.slice(0, -1);
    }
    
    res.json({
        "Status": "Debugging Fitbit Config",
        "Registered_ClientID": process.env.FITBIT_CLIENT_ID,
        "Registered_RedirectURI": redirectUri,
        "Environment_Source": process.env.FITBIT_REDIRECT_URI ? "Render UI/Env" : "Fallback Default",
        "Tip": "Match the 'Registered_RedirectURI' string exactly in dev.fitbit.com"
    });
});

module.exports = router;
