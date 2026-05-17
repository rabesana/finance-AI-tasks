require('dotenv').config();

const appId = process.env.APP_ID;
const appSecret = process.env.APP_SECRET;
const tableUrl = process.env.TABLE_URL
const tokenUrl = process.env.TOKEN_URL;

// Helper to handle fetch JSON response
async function fetchJSON(url, options) {
  const res = await fetch(url, options);
  const data = await res.json();
  if (data.code !== 0) {
    throw new Error(JSON.stringify(data));
  }
  return data;
}

// Get Lark tenant access token
async function getTenantAccessToken(url, id, secret) {
  const data = await fetchJSON(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: id,
      app_secret: secret
    })
  });
  return data.tenant_access_token;
}

// Query table records (basic list)
async function queryTableRecords(url, token) {
  const data = await fetchJSON(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });

  return data.data.items;
}

// Query table with filter
async function searchRecords(url, token) {
  const data = await fetchJSON(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      filter: {
        conjunction: 'and',
        conditions: [
          { field_name: 'Status', operator: 'is', value: ['Done'] }
        ]
      },
      page_size: 10
    })
  });

  return data.data.items;
}

// Main
async function main() {
  try {
    console.log('Getting access token...');
    const token = await getTenantAccessToken(tokenUrl, appId, appSecret);

    console.log('Querying table records...');
    const records = await queryTableRecords(tableUrl, token);

    console.log('\nRecords:\n');
    records.forEach(record => {
      console.log('Record ID:', record.record_id);
      console.log('Fields:', record.fields);
      console.log('--------------------------');
    });

    console.log('Searching for Done records...');
    const doneRecords = await searchRecords(tableUrl, token);
    console.log(doneRecords.map(r => r.fields));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();