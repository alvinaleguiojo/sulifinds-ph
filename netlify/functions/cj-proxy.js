const CJ_ACCESS_TOKEN = '713c14fa427c485aa6f436e4092ac46d';
const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1';

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
    const otherParams = Object.entries(params)
      .filter(([k]) => k !== 'path')
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');
    const fullUrl = `${CJ_BASE}${path}${otherParams ? '?' + otherParams : ''}`;
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'CJ-Access-Token': CJ_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
