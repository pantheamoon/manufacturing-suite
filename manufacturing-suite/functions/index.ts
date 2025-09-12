import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';

type Bindings = {
  DB: D1Database;
  JWT_SECRET?: string;
};

type Variables = {
  user?: {
    id: number;
    email: string;
    role: string;
    tenant_id: number;
  };
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// CORS middleware
app.use('*', cors({
  origin: ['*'], // In production, specify exact domains
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// JWT Secret (use environment variable in production)
const JWT_SECRET = 'manufacturing-secret-key-change-in-production';

// Helper function to hash passwords (simple implementation for demo)
async function hashPassword(password: string): Promise<string> {
  // In production, use bcrypt or similar
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'salt');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Helper function to verify passwords
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const newHash = await hashPassword(password);
  return newHash === hash;
}

// JWT middleware for protected routes
const authMiddleware = jwt({
  secret: JWT_SECRET,
  cookie: 'auth_token'
});

// User info middleware to populate user data
app.use('/api/*', async (c, next) => {
  const token = getCookie(c, 'auth_token');
  if (token) {
    try {
      const payload = await jwt({
        secret: JWT_SECRET
      }).verify(token, JWT_SECRET);
      
      if (payload && typeof payload === 'object' && 'userId' in payload) {
        const userId = payload.userId as number;
        const user = await c.env.DB.prepare(
          'SELECT id, email, role, tenant_id FROM users WHERE id = ? AND is_active = 1'
        ).bind(userId).first() as any;
        
        if (user) {
          c.set('user', user);
        }
      }
    } catch (error) {
      // Invalid token, continue without user
    }
  }
  await next();
});

// Health check endpoint
app.get('/api/health', async (c) => {
  try {
    const result = await c.env.DB.prepare("SELECT 1 as test").first();
    return c.json({
      success: true,
      data: { 
        status: 'healthy', 
        database: 'connected',
        timestamp: new Date().toISOString() 
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Database connection failed',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Authentication routes
app.post('/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ success: false, error: 'Email and password required' }, 400);
    }

    const user = await c.env.DB.prepare(
      'SELECT id, email, password_hash, first_name, last_name, role, tenant_id FROM users WHERE email = ? AND is_active = 1'
    ).bind(email).first() as any;

    if (!user) {
      return c.json({ success: false, error: 'Invalid credentials' }, 401);
    }

    // For demo purposes, accept both hashed and plain password 'password123'
    const isValidPassword = password === 'password123' || await verifyPassword(password, user.password_hash);
    
    if (!isValidPassword) {
      return c.json({ success: false, error: 'Invalid credentials' }, 401);
    }

    // Create JWT token
    const token = await jwt({ secret: JWT_SECRET }).sign({
      userId: user.id,
      email: user.email,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    });

    // Set secure cookie
    setCookie(c, 'auth_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      maxAge: 24 * 60 * 60 // 24 hours
    });

    // Update last login
    await c.env.DB.prepare(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(user.id).run();

    return c.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          tenantId: user.tenant_id
        }
      }
    });
  } catch (error) {
    return c.json({ success: false, error: 'Login failed' }, 500);
  }
});

app.post('/auth/logout', (c) => {
  deleteCookie(c, 'auth_token');
  return c.json({ success: true, message: 'Logged out successfully' });
});

app.get('/auth/me', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, error: 'Not authenticated' }, 401);
  }
  
  return c.json({
    success: true,
    data: { user }
  });
});

// Dashboard data endpoints
app.get('/api/dashboard/stats', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }

  try {
    // Get batch statistics
    const batchStats = await c.env.DB.prepare(`
      SELECT 
        status,
        COUNT(*) as count
      FROM batch_records 
      WHERE tenant_id = ?
      GROUP BY status
    `).bind(user.tenant_id).all();

    // Get low stock alerts
    const lowStockItems = await c.env.DB.prepare(`
      SELECT 
        rm.name,
        SUM(il.quantity_available) as total_stock,
        rm.reorder_point
      FROM raw_materials rm
      LEFT JOIN inventory_lots il ON rm.id = il.raw_material_id
      WHERE rm.tenant_id = ? AND il.quality_status = 'approved'
      GROUP BY rm.id, rm.name, rm.reorder_point
      HAVING total_stock < rm.reorder_point
      ORDER BY (total_stock / rm.reorder_point) ASC
      LIMIT 5
    `).bind(user.tenant_id).all();

    // Get upcoming expiries
    const expiringItems = await c.env.DB.prepare(`
      SELECT 
        rm.name,
        il.lot_number,
        il.quantity_available,
        il.expiry_date
      FROM inventory_lots il
      JOIN raw_materials rm ON il.raw_material_id = rm.id
      WHERE il.tenant_id = ? 
        AND il.quality_status = 'approved'
        AND il.expiry_date <= date('now', '+30 days')
      ORDER BY il.expiry_date ASC
      LIMIT 10
    `).bind(user.tenant_id).all();

    // Get production line status
    const productionLines = await c.env.DB.prepare(`
      SELECT name, status FROM production_lines WHERE tenant_id = ?
    `).bind(user.tenant_id).all();

    return c.json({
      success: true,
      data: {
        batchStats: batchStats.results,
        lowStockItems: lowStockItems.results,
        expiringItems: expiringItems.results,
        productionLines: productionLines.results,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch dashboard data' }, 500);
  }
});

// Batch Records API
app.get('/api/batches', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }

  try {
    const batches = await c.env.DB.prepare(`
      SELECT 
        br.*,
        p.name as product_name,
        p.sku as product_sku,
        pl.name as production_line_name,
        u1.first_name || ' ' || u1.last_name as operator_name,
        u2.first_name || ' ' || u2.last_name as supervisor_name
      FROM batch_records br
      JOIN products p ON br.product_id = p.id
      LEFT JOIN production_lines pl ON br.production_line_id = pl.id
      LEFT JOIN users u1 ON br.operator_id = u1.id
      LEFT JOIN users u2 ON br.supervisor_id = u2.id
      WHERE br.tenant_id = ?
      ORDER BY br.created_at DESC
      LIMIT 50
    `).bind(user.tenant_id).all();

    return c.json({
      success: true,
      data: batches.results
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch batches' }, 500);
  }
});

// Inventory API (FEFO - First Expired First Out)
app.get('/api/inventory', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }

  try {
    const inventory = await c.env.DB.prepare(`
      SELECT 
        rm.id,
        rm.sku,
        rm.name,
        rm.category,
        rm.unit_of_measure,
        rm.reorder_point,
        SUM(il.quantity_available) as total_stock,
        MIN(il.expiry_date) as earliest_expiry,
        COUNT(il.id) as lot_count
      FROM raw_materials rm
      LEFT JOIN inventory_lots il ON rm.id = il.raw_material_id AND il.quality_status = 'approved'
      WHERE rm.tenant_id = ? AND rm.is_active = 1
      GROUP BY rm.id
      ORDER BY rm.name
    `).bind(user.tenant_id).all();

    return c.json({
      success: true,
      data: inventory.results
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch inventory' }, 500);
  }
});

// Production Planning API
app.get('/api/production/schedule', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }

  try {
    const schedule = await c.env.DB.prepare(`
      SELECT 
        ps.*,
        pl.name as line_name,
        pl.code as line_code,
        pl.capacity_liters_per_hour,
        br.batch_number,
        p.name as product_name
      FROM production_schedule ps
      JOIN production_lines pl ON ps.production_line_id = pl.id
      LEFT JOIN batch_records br ON ps.batch_id = br.id
      LEFT JOIN products p ON br.product_id = p.id
      WHERE ps.tenant_id = ? 
        AND ps.schedule_date >= date('now')
      ORDER BY ps.schedule_date, ps.planned_start_time
    `).bind(user.tenant_id).all();

    return c.json({
      success: true,
      data: schedule.results
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch production schedule' }, 500);
  }
});

// Suppliers API
app.get('/api/suppliers', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }

  try {
    const suppliers = await c.env.DB.prepare(`
      SELECT 
        s.*,
        COUNT(DISTINCT po.id) as total_orders,
        AVG(CASE WHEN po.status = 'received' THEN 
          julianday(po.actual_delivery_date) - julianday(po.requested_delivery_date)
        END) as avg_delivery_days
      FROM suppliers s
      LEFT JOIN purchase_orders po ON s.id = po.supplier_id 
        AND po.created_at >= date('now', '-1 year')
      WHERE s.tenant_id = ? AND s.is_active = 1
      GROUP BY s.id
      ORDER BY s.quality_rating DESC, s.name
    `).bind(user.tenant_id).all();

    return c.json({
      success: true,
      data: suppliers.results
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch suppliers' }, 500);
  }
});

// Root route - Main application
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Manufacturing Operations Suite</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css">
      <style>
        body { font-family: 'Inter', sans-serif; }
      </style>
    </head>
    <body class="bg-gray-50">
      <div id="app">
        <div class="min-h-screen flex items-center justify-center">
          <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
            <div class="text-center mb-8">
              <h1 class="text-3xl font-bold text-gray-900 mb-2">Manufacturing Suite</h1>
              <p class="text-gray-600">Cosmetics & Beauty Production Management</p>
            </div>
            
            <div id="loginForm" class="space-y-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input type="email" id="email" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter your email">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input type="password" id="password" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter your password">
              </div>
              
              <button onclick="login()" class="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-200 font-medium">
                Sign In
              </button>
            </div>
            
            <div id="dashboard" class="hidden">
              <div class="text-center mb-6">
                <h2 class="text-2xl font-bold text-gray-900">Welcome Back!</h2>
                <p id="userInfo" class="text-gray-600"></p>
              </div>
              
              <div class="grid grid-cols-1 gap-4">
                <button onclick="showModule('ebr')" class="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition duration-200">
                  <i class="fas fa-clipboard-list mr-2"></i>
                  Electronic Batch Records
                </button>
                
                <button onclick="showModule('inventory')" class="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition duration-200">
                  <i class="fas fa-boxes mr-2"></i>
                  FEFO Inventory Management
                </button>
                
                <button onclick="showModule('production')" class="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition duration-200">
                  <i class="fas fa-industry mr-2"></i>
                  Production Planning
                </button>
                
                <button onclick="showModule('suppliers')" class="bg-orange-600 text-white p-4 rounded-lg hover:bg-orange-700 transition duration-200">
                  <i class="fas fa-truck mr-2"></i>
                  Supplier Management
                </button>
                
                <button onclick="logout()" class="bg-gray-600 text-white p-4 rounded-lg hover:bg-gray-700 transition duration-200">
                  <i class="fas fa-sign-out-alt mr-2"></i>
                  Logout
                </button>
              </div>
            </div>
            
            <div class="mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 class="font-semibold text-blue-900 mb-2">Demo Credentials:</h3>
              <div class="text-sm text-blue-800 space-y-1">
                <p><strong>Admin:</strong> admin@luxebeauty.com / password123</p>
                <p><strong>Production:</strong> production@luxebeauty.com / password123</p>
                <p><strong>Quality:</strong> quality@luxebeauty.com / password123</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <script>
        let currentUser = null;

        // Check if user is already logged in
        async function checkAuth() {
          try {
            const response = await fetch('/auth/me');
            if (response.ok) {
              const data = await response.json();
              if (data.success) {
                currentUser = data.data.user;
                showDashboard();
              }
            }
          } catch (error) {
            console.log('Not authenticated');
          }
        }

        async function login() {
          const email = document.getElementById('email').value;
          const password = document.getElementById('password').value;
          
          if (!email || !password) {
            alert('Please enter both email and password');
            return;
          }

          try {
            const response = await fetch('/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            
            if (data.success) {
              currentUser = data.data.user;
              showDashboard();
            } else {
              alert(data.error || 'Login failed');
            }
          } catch (error) {
            alert('Login error: ' + error.message);
          }
        }

        async function logout() {
          try {
            await fetch('/auth/logout', { method: 'POST' });
            currentUser = null;
            showLogin();
          } catch (error) {
            console.error('Logout error:', error);
          }
        }

        function showLogin() {
          document.getElementById('loginForm').classList.remove('hidden');
          document.getElementById('dashboard').classList.add('hidden');
        }

        function showDashboard() {
          document.getElementById('loginForm').classList.add('hidden');
          document.getElementById('dashboard').classList.remove('hidden');
          document.getElementById('userInfo').textContent = 
            currentUser.firstName + ' ' + currentUser.lastName + ' (' + currentUser.role + ')';
        }

        function showModule(module) {
          const moduleUrls = {
            'ebr': '/app/ebr',
            'inventory': '/app/inventory', 
            'production': '/app/production',
            'suppliers': '/app/suppliers'
          };
          
          if (moduleUrls[module]) {
            window.location.href = moduleUrls[module];
          }
        }

        // Handle Enter key for login
        document.addEventListener('keypress', function(e) {
          if (e.key === 'Enter' && !document.getElementById('loginForm').classList.contains('hidden')) {
            login();
          }
        });

        // Check authentication on page load
        checkAuth();
      </script>
    </body>
    </html>
  `);
});

export default app;