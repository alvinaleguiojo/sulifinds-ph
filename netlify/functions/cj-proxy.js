// ============================================
// SuliFinds PH — CJDropshipping API Proxy
// Auto-authenticates and caches access token
// ============================================

const CJ_EMAIL = 'CJ3562391@cjdropshipping.com';
const CJ_API_KEY = '713c14fa427c485aa6f436e4092ac46d';
const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1';

// Cache token in memory
let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry - 300000) {
    return cachedToken;
  }
  console.log('Fetching new CJ access token...');
  const res = await fetch(`${CJ_BASE}/authentication/getAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: CJ_EMAIL, password: CJ_API_KEY }),
  });
  const data = await res.json();
  console.log('Auth response:', JSON.stringify(data));
  if (data.result && data.data && data.data.accessToken) {
    cachedToken = data.data.accessToken;
    tokenExpiry = Date.now() + (14 * 24 * 60 * 60 * 1000);
    return cachedToken;
  }
  throw new Error(`Auth failed: ${data.message || JSON.stringify(data)}`);
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const params = event.queryStringParameters || {};
    const path = params.path;

    if (!path) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing path' }) };
    }

    const token = await getAccessToken();

    const otherParams = Object.entries(params)
      .filter(([k]) => k !== 'path')
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');

    const fullUrl = `${CJ_BASE}${path}${otherParams ? '?' + otherParams : ''}`;
    console.log('Fetching:', fullUrl);

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: { 'CJ-Access-Token': token, 'Content-Type': 'application/json' },
    });

    const data = await response.json();
    console.log('CJ response code:', data.code);

    // Token expired — refresh and retry
    if (data.code === 1600001) {
      console.log('Token expired, refreshing...');
      cachedToken = null;
      tokenExpiry = 0;
      const newToken = await getAccessToken();
      const retry = await fetch(fullUrl, {
        method: 'GET',
        headers: { 'CJ-Access-Token': newToken, 'Content-Type': 'application/json' },
      });
      return { statusCode: 200, headers, body: JSON.stringify(await retry.json()) };
    }

    return { statusCode: 200, headers, body: JSON.stringify(data) };

  } catch (error) {
    console.error('Proxy error:', error.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
