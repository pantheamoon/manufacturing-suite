// Cloudflare Pages Function for Database API
export async function onRequestGet(context) {
  const { params, request } = context;
  const table = params.table;
  
  // Mock data that matches your interface expectations
  const mockData = {
    products: [
      {
        id: 'prod-1',
        name: 'Forest Cream 20ml',
        sku: 'SSN-FC-20',
        current_stock: 45,
        minimum_stock: 10,
        unit_cost: 25.50,
        selling_price: 89.99,
        category: 'Skincare',
        created_at: new Date().toISOString()
      },
      {
        id: 'prod-2', 
        name: 'Moon Cream 50ml',
        sku: 'SSN-MC-50',
        current_stock: 23,
        minimum_stock: 15,
        unit_cost: 35.75,
        selling_price: 124.99,
        category: 'Skincare',
        created_at: new Date().toISOString()
      },
      {
        id: 'prod-3',
        name: 'Star Serum 12ml', 
        sku: 'SSN-SS-12',
        current_stock: 67,
        minimum_stock: 20,
        unit_cost: 18.25,
        selling_price: 65.00,
        category: 'Serums',
        created_at: new Date().toISOString()
      }
    ],
    clients: [
      {
        id: 'client-1',
        company_name: 'Star Seed Natural',
        contact_name: 'Ed Johnson',
        email: 'ed@starseednatural.com',
        phone: '+44 20 1234 5678',
        address: '123 Natural Way, London, SW1A 1AA',
        billing_address: '123 Natural Way, London, SW1A 1AA',
        tenant_id: 'luxebeauty_001',
        created_at: new Date().toISOString()
      },
      {
        id: 'client-2',
        company_name: 'Luxe Beauty Co',
        contact_name: 'Sarah Wilson',
        email: 'sarah@luxebeauty.com', 
        phone: '+44 20 9876 5432',
        address: '456 Beauty Street, Manchester, M1 1AA',
        billing_address: '456 Beauty Street, Manchester, M1 1AA',
        tenant_id: 'luxebeauty_001',
        created_at: new Date().toISOString()
      }
    ],
    manufacturing_orders: [
      {
        id: 'order-1',
        order_number: 'ORD-20250113-143022',
        client_id: 'client-1',
        product_id: 'prod-1',
        quantity_requested: 100,
        manufacturing_cost_per_unit: 25.50,
        total_manufacturing_cost: 2550.00,
        status: 'In Production',
        deposit_amount: 1275.00,
        remaining_amount: 1275.00,
        requested_delivery_date: '2025-02-15',
        notes: 'Sample production order',
        tenant_id: 'luxebeauty_001',
        created_at: new Date().toISOString()
      },
      {
        id: 'order-2',
        order_number: 'ORD-20250112-091533',
        client_id: 'client-2', 
        product_id: 'prod-2',
        quantity_requested: 50,
        manufacturing_cost_per_unit: 35.75,
        total_manufacturing_cost: 1787.50,
        status: 'Completed',
        deposit_amount: 893.75,
        remaining_amount: 893.75,
        requested_delivery_date: '2025-01-30',
        notes: 'Completed production run',
        tenant_id: 'luxebeauty_001',
        created_at: new Date().toISOString()
      }
    ],
    product_formulations: [
      {
        id: 'form-1',
        formulation_name: 'Forest Cream Base Formula',
        product_id: 'prod-1',
        batch_size_kg: 5.0,
        tenant_id: 'luxebeauty_001',
        created_at: new Date().toISOString()
      },
      {
        id: 'form-2',
        formulation_name: 'Moon Cream Advanced Formula',
        product_id: 'prod-2', 
        batch_size_kg: 3.0,
        tenant_id: 'luxebeauty_001',
        created_at: new Date().toISOString()
      }
    ],
    batch_calculations: [
      {
        id: 'batch-1',
        batch_number: 'F13012025',
        formulation_id: 'form-1',
        requested_batch_size_kg: 5.0,
        total_cost: 127.50,
        status: 'Calculated',
        tenant_id: 'luxebeauty_001',
        created_at: new Date().toISOString()
      }
    ]
  };
  
  const data = mockData[table] || [];
  
  return new Response(JSON.stringify({
    success: true,
    data: data,
    total: data.length,
    page: 1,
    limit: 100,
    table: table
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

export async function onRequestPost(context) {
  const { params, request } = context;
  const table = params.table;
  
  try {
    const data = await request.json();
    
    // Add system fields for created records
    const newRecord = {
      ...data,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    return new Response(JSON.stringify({
      success: true,
      data: newRecord,
      table: table
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      table: table
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// Handle OPTIONS for CORS
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}

function generateId() {
  return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}
