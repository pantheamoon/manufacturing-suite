// Netlify Function for Neon Database Access
// This handles all database operations for the Lush Labs Suite

const { Client } = require('pg');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  // Create a new client for each request to avoid connection reuse issues
  const client = new Client({
    connectionString: process.env.NETLIFY_DATABASE_URL || process.env.NETLIFY_DATABASE_URL_UNPOOLED || process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();

    const { path, httpMethod, body, queryStringParameters } = event;
    const pathParts = path.replace('/api/db/', '').replace('/.netlify/functions/db-query/', '').split('/');
    const tableName = pathParts[0];
    const recordId = pathParts[1];

    let result;

    switch (httpMethod) {
      case 'GET':
        if (recordId) {
          // Get single record
          result = await client.query(`SELECT * FROM ${tableName} WHERE id = $1`, [recordId]);
          result = result.rows[0] || null;
        } else {
          // Get all records with optional filtering
          let sql = `SELECT * FROM ${tableName} WHERE tenant_id = 'luxebeauty_001'`;
          const params = [];
          
          if (queryStringParameters) {
            Object.entries(queryStringParameters).forEach(([key, value]) => {
              if (key === 'product_id') {
                sql += ` AND product_id = $${params.length + 1}`;
                params.push(value);
              } else if (key === 'formulation_id') {
                sql += ` AND formulation_id = $${params.length + 1}`;
                params.push(value);
              } else if (key === 'search') {
                sql += ` AND name ILIKE $${params.length + 1}`;
                params.push(`%${value}%`);
              }
            });
          }
          
          sql += ' ORDER BY created_at DESC LIMIT 100';
          
          const queryResult = await client.query(sql, params);
          result = {
            data: queryResult.rows,
            total: queryResult.rows.length,
            table: tableName
          };
        }
        break;

      case 'POST':
        const insertData = JSON.parse(body);
        
        // Add system fields
        insertData.id = insertData.id || generateUUID();
        insertData.created_at = new Date().toISOString();
        insertData.updated_at = new Date().toISOString();
        insertData.tenant_id = insertData.tenant_id || 'luxebeauty_001';

        const columns = Object.keys(insertData);
        const values = Object.values(insertData);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        
        const insertSql = `
          INSERT INTO ${tableName} (${columns.join(', ')})
          VALUES (${placeholders})
          RETURNING *
        `;
        
        const insertResult = await client.query(insertSql, values);
        result = insertResult.rows[0];
        break;

      case 'PUT':
      case 'PATCH':
        const updateData = JSON.parse(body);
        updateData.updated_at = new Date().toISOString();
        
        const updateEntries = Object.entries(updateData);
        const setClause = updateEntries.map(([key], i) => `${key} = $${i + 2}`).join(', ');
        const updateValues = updateEntries.map(([, value]) => value);
        
        const updateSql = `
          UPDATE ${tableName}
          SET ${setClause}
          WHERE id = $1
          RETURNING *
        `;
        
        const updateResult = await client.query(updateSql, [recordId, ...updateValues]);
        result = updateResult.rows[0];
        break;

      case 'DELETE':
        await client.query(`DELETE FROM ${tableName} WHERE id = $1`, [recordId]);
        result = { success: true };
        break;

      default:
        throw new Error(`Unsupported method: ${httpMethod}`);
    }

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Database error:', error);
    
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: error.message,
        details: error.stack 
      })
    };
  } finally {
    await client.end();
  }
};

// Simple UUID generator
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
