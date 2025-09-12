import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// Supplier Management Route
app.get('/app/suppliers', async (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Supplier Management - Manufacturing Suite</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css">
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <style>
        body { font-family: 'Inter', sans-serif; }
        .rating-5 { @apply text-green-500; }
        .rating-4 { @apply text-blue-500; }
        .rating-3 { @apply text-yellow-500; }
        .rating-2 { @apply text-orange-500; }
        .rating-1 { @apply text-red-500; }
        .cert-organic { @apply bg-green-100 text-green-800; }
        .cert-kosher { @apply bg-blue-100 text-blue-800; }
        .cert-halal { @apply bg-purple-100 text-purple-800; }
        .cert-ecocert { @apply bg-indigo-100 text-indigo-800; }
        .cert-none { @apply bg-gray-100 text-gray-800; }
        .po-draft { @apply bg-gray-100 text-gray-800; }
        .po-sent { @apply bg-blue-100 text-blue-800; }
        .po-acknowledged { @apply bg-yellow-100 text-yellow-800; }
        .po-shipped { @apply bg-purple-100 text-purple-800; }
        .po-received { @apply bg-green-100 text-green-800; }
        .po-cancelled { @apply bg-red-100 text-red-800; }
      </style>
    </head>
    <body class="bg-gray-50">
      <!-- Header -->
      <header class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center py-4">
            <div class="flex items-center space-x-4">
              <a href="/" class="text-gray-600 hover:text-gray-900">
                <i class="fas fa-arrow-left"></i> Back to Dashboard
              </a>
              <h1 class="text-2xl font-bold text-gray-900">Supplier Management</h1>
            </div>
            <div class="flex items-center space-x-4">
              <span id="userInfo" class="text-gray-600"></span>
              <button onclick="logout()" class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                <i class="fas fa-sign-out-alt"></i> Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <!-- Loading State -->
        <div id="loading" class="text-center py-8">
          <i class="fas fa-spinner fa-spin text-3xl text-blue-600"></i>
          <p class="mt-2 text-gray-600">Loading supplier data...</p>
        </div>

        <!-- Main Content -->
        <div id="content" class="hidden">
          <!-- KPI Cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center">
                <div class="p-2 bg-blue-100 rounded-lg">
                  <i class="fas fa-truck text-blue-600 text-xl"></i>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">Active Suppliers</p>
                  <p id="activeSuppliers" class="text-2xl font-bold text-gray-900">0</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center">
                <div class="p-2 bg-green-100 rounded-lg">
                  <i class="fas fa-star text-green-600 text-xl"></i>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">Avg Quality Rating</p>
                  <p id="avgQualityRating" class="text-2xl font-bold text-gray-900">0.0</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center">
                <div class="p-2 bg-yellow-100 rounded-lg">
                  <i class="fas fa-clock text-yellow-600 text-xl"></i>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">Avg Delivery Days</p>
                  <p id="avgDeliveryDays" class="text-2xl font-bold text-gray-900">0</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center">
                <div class="p-2 bg-purple-100 rounded-lg">
                  <i class="fas fa-shopping-cart text-purple-600 text-xl"></i>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">Open POs</p>
                  <p id="openPOs" class="text-2xl font-bold text-gray-900">0</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Charts Section -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Supplier Performance Ratings</h3>
              <div style="height: 300px;">
                <canvas id="performanceChart"></canvas>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Purchase Order Status Distribution</h3>
              <div style="height: 300px;">
                <canvas id="poStatusChart"></canvas>
              </div>
            </div>
          </div>

          <!-- Filters -->
          <div class="bg-white rounded-lg shadow p-6 mb-6">
            <div class="flex flex-wrap items-center space-x-4 space-y-2">
              <div class="flex-1 min-w-64">
                <input type="text" id="searchInput" placeholder="Search suppliers..." 
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              </div>
              
              <select id="certificationFilter" class="px-4 py-2 border border-gray-300 rounded-lg">
                <option value="">All Certifications</option>
                <option value="organic">Organic</option>
                <option value="kosher">Kosher</option>
                <option value="halal">Halal</option>
                <option value="ecocert">EcoCert</option>
                <option value="none">No Certification</option>
              </select>

              <select id="ratingFilter" class="px-4 py-2 border border-gray-300 rounded-lg">
                <option value="">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
                <option value="2">2+ Stars</option>
              </select>

              <button onclick="exportSuppliers()" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                <i class="fas fa-download mr-2"></i>Export
              </button>
            </div>
          </div>

          <!-- Supplier Performance Alert -->
          <div id="performanceAlert" class="bg-red-50 border-l-4 border-red-400 p-4 mb-6 hidden">
            <div class="flex">
              <div class="flex-shrink-0">
                <i class="fas fa-exclamation-triangle text-red-400"></i>
              </div>
              <div class="ml-3">
                <p class="text-sm text-red-700">
                  <strong>Performance Alert:</strong> Some suppliers have declining performance metrics. Review recommended.
                </p>
              </div>
            </div>
          </div>

          <!-- Suppliers Table -->
          <div class="bg-white rounded-lg shadow">
            <div class="px-6 py-4 border-b border-gray-200">
              <div class="flex justify-between items-center">
                <h3 class="text-lg font-semibold text-gray-900">Supplier Directory</h3>
                <div class="flex space-x-2">
                  <button onclick="addSupplier()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    <i class="fas fa-plus mr-2"></i>Add Supplier
                  </button>
                  <button onclick="auditSuppliers()" class="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700">
                    <i class="fas fa-clipboard-check mr-2"></i>Schedule Audit
                  </button>
                </div>
              </div>
            </div>
            
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supplier
                      <i class="fas fa-sort ml-1 cursor-pointer" onclick="sortTable('name')"></i>
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Certification
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quality Rating
                      <i class="fas fa-sort ml-1 cursor-pointer" onclick="sortTable('quality')"></i>
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Delivery Performance
                      <i class="fas fa-sort ml-1 cursor-pointer" onclick="sortTable('delivery')"></i>
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost Rating
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders (12M)
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Audit
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody id="supplierTableBody" class="bg-white divide-y divide-gray-200">
                  <!-- Dynamic content will be loaded here -->
                </tbody>
              </table>
            </div>
          </div>

          <!-- Purchase Orders Section -->
          <div class="bg-white rounded-lg shadow mt-8">
            <div class="px-6 py-4 border-b border-gray-200">
              <div class="flex justify-between items-center">
                <h3 class="text-lg font-semibold text-gray-900">Recent Purchase Orders</h3>
                <button onclick="createPO()" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                  <i class="fas fa-plus mr-2"></i>New PO
                </button>
              </div>
            </div>
            
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO Number</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Date</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Date</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody id="poTableBody" class="bg-white divide-y divide-gray-200">
                  <!-- Dynamic content will be loaded here -->
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <script>
        let currentUser = null;
        let supplierData = [];
        let purchaseOrders = [];
        let filteredData = [];
        let performanceChart = null;
        let poStatusChart = null;
        let sortColumn = 'name';
        let sortDirection = 'asc';

        // Check authentication
        async function checkAuth() {
          try {
            const response = await fetch('/auth/me');
            if (response.ok) {
              const data = await response.json();
              if (data.success) {
                currentUser = data.data.user;
                document.getElementById('userInfo').textContent = 
                  currentUser.firstName + ' ' + currentUser.lastName + ' (' + currentUser.role + ')';
                await loadData();
              } else {
                window.location.href = '/';
              }
            } else {
              window.location.href = '/';
            }
          } catch (error) {
            window.location.href = '/';
          }
        }

        async function logout() {
          await fetch('/auth/logout', { method: 'POST' });
          window.location.href = '/';
        }

        async function loadData() {
          try {
            const response = await fetch('/api/suppliers');
            const data = await response.json();
            
            if (data.success) {
              supplierData = data.data;
              
              // Mock purchase orders data (in real app, this would be a separate API call)
              purchaseOrders = [
                { po_number: 'PO2024001', supplier_name: 'BioActive Ingredients Ltd', total_amount: 12750, status: 'received', order_date: '2024-01-10', requested_delivery_date: '2024-01-15' },
                { po_number: 'PO2024002', supplier_name: 'Essential Oils International', total_amount: 5680, status: 'shipped', order_date: '2024-02-15', requested_delivery_date: '2024-02-25' },
                { po_number: 'PO2024003', supplier_name: 'Pure Extracts Co', total_amount: 8450, status: 'sent', order_date: '2024-03-10', requested_delivery_date: '2024-03-20' },
                { po_number: 'PO2024004', supplier_name: 'Premium Packaging Solutions', total_amount: 15620, status: 'draft', order_date: '2024-03-15', requested_delivery_date: '2024-03-25' }
              ];
              
              updateKPIs();
              renderCharts();
              applyFilters();
              renderPurchaseOrders();
              
              document.getElementById('loading').classList.add('hidden');
              document.getElementById('content').classList.remove('hidden');
            } else {
              throw new Error(data.error || 'Failed to load data');
            }
          } catch (error) {
            alert('Error loading data: ' + error.message);
          }
        }

        function updateKPIs() {
          const activeCount = supplierData.filter(s => s.is_active).length;
          const avgQuality = supplierData.reduce((sum, s) => sum + s.quality_rating, 0) / supplierData.length;
          const avgDelivery = supplierData.reduce((sum, s) => sum + (s.avg_delivery_days || 0), 0) / supplierData.length;
          const openPOCount = purchaseOrders.filter(po => ['draft', 'sent', 'acknowledged', 'shipped'].includes(po.status)).length;

          document.getElementById('activeSuppliers').textContent = activeCount;
          document.getElementById('avgQualityRating').textContent = avgQuality.toFixed(1);
          document.getElementById('avgDeliveryDays').textContent = Math.round(avgDelivery);
          document.getElementById('openPOs').textContent = openPOCount;

          // Show performance alert if any suppliers have low ratings
          const lowPerformers = supplierData.filter(s => s.quality_rating < 3 || s.delivery_rating < 3);
          if (lowPerformers.length > 0) {
            document.getElementById('performanceAlert').classList.remove('hidden');
          }
        }

        function renderCharts() {
          // Supplier Performance Chart
          const ctx1 = document.getElementById('performanceChart').getContext('2d');
          if (performanceChart) performanceChart.destroy();
          
          performanceChart = new Chart(ctx1, {
            type: 'radar',
            data: {
              labels: supplierData.slice(0, 5).map(s => s.name.substring(0, 15)),
              datasets: [{
                label: 'Quality',
                data: supplierData.slice(0, 5).map(s => s.quality_rating),
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderColor: '#3B82F6',
                pointBackgroundColor: '#3B82F6'
              }, {
                label: 'Delivery',
                data: supplierData.slice(0, 5).map(s => s.delivery_rating),
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                borderColor: '#10B981',
                pointBackgroundColor: '#10B981'
              }, {
                label: 'Cost',
                data: supplierData.slice(0, 5).map(s => s.cost_rating),
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                borderColor: '#F59E0B',
                pointBackgroundColor: '#F59E0B'
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                r: {
                  beginAtZero: true,
                  max: 5
                }
              }
            }
          });

          // PO Status Chart
          const statusCounts = {};
          purchaseOrders.forEach(po => {
            statusCounts[po.status] = (statusCounts[po.status] || 0) + 1;
          });

          const ctx2 = document.getElementById('poStatusChart').getContext('2d');
          if (poStatusChart) poStatusChart.destroy();

          poStatusChart = new Chart(ctx2, {
            type: 'doughnut',
            data: {
              labels: Object.keys(statusCounts).map(status => 
                status.toUpperCase().replace('_', ' ')
              ),
              datasets: [{
                data: Object.values(statusCounts),
                backgroundColor: [
                  '#6B7280', // gray - draft
                  '#3B82F6', // blue - sent
                  '#F59E0B', // yellow - acknowledged
                  '#8B5CF6', // purple - shipped
                  '#10B981', // green - received
                  '#EF4444'  // red - cancelled
                ]
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom'
                }
              }
            }
          });
        }

        function applyFilters() {
          const searchTerm = document.getElementById('searchInput').value.toLowerCase();
          const certFilter = document.getElementById('certificationFilter').value;
          const ratingFilter = document.getElementById('ratingFilter').value;

          filteredData = supplierData.filter(supplier => {
            const matchesSearch = supplier.name.toLowerCase().includes(searchTerm) ||
                                supplier.code.toLowerCase().includes(searchTerm);
            const matchesCert = !certFilter || supplier.certification_type === certFilter;
            const matchesRating = !ratingFilter || supplier.quality_rating >= parseInt(ratingFilter);

            return matchesSearch && matchesCert && matchesRating;
          });

          renderSupplierTable();
        }

        function sortTable(column) {
          if (sortColumn === column) {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
          } else {
            sortColumn = column;
            sortDirection = 'asc';
          }

          filteredData.sort((a, b) => {
            let aVal, bVal;
            switch (column) {
              case 'name':
                aVal = a.name.toLowerCase();
                bVal = b.name.toLowerCase();
                break;
              case 'quality':
                aVal = a.quality_rating;
                bVal = b.quality_rating;
                break;
              case 'delivery':
                aVal = a.delivery_rating;
                bVal = b.delivery_rating;
                break;
              default:
                return 0;
            }

            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
          });

          renderSupplierTable();
        }

        function renderSupplierTable() {
          const tbody = document.getElementById('supplierTableBody');
          tbody.innerHTML = '';

          filteredData.forEach(supplier => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';

            // Generate star ratings
            const qualityStars = generateStarRating(supplier.quality_rating);
            const deliveryStars = generateStarRating(supplier.delivery_rating);
            const costStars = generateStarRating(supplier.cost_rating);

            row.innerHTML = \`
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">\${supplier.name}</div>
                <div class="text-sm text-gray-500">\${supplier.code} • \${supplier.contact_person || 'N/A'}</div>
                <div class="text-xs text-gray-400">\${supplier.email || 'No email'}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cert-\${supplier.certification_type}">
                  \${supplier.certification_type.toUpperCase()}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="rating-\${supplier.quality_rating}">\${qualityStars}</div>
                  <span class="ml-2 text-sm text-gray-600">(\${supplier.quality_rating}/5)</span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="rating-\${supplier.delivery_rating}">\${deliveryStars}</div>
                  <span class="ml-2 text-sm text-gray-600">(\${supplier.delivery_rating}/5)</span>
                </div>
                <div class="text-xs text-gray-500">\${supplier.avg_delivery_days || 0} days avg</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="rating-\${supplier.cost_rating}">\${costStars}</div>
                  <span class="ml-2 text-sm text-gray-600">(\${supplier.cost_rating}/5)</span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                \${supplier.total_orders || 0} orders
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                \${supplier.last_audit_date ? new Date(supplier.last_audit_date).toLocaleDateString() : 'Never'}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="viewSupplier('\${supplier.id}')" class="text-blue-600 hover:text-blue-900 mr-2" title="View Details">
                  <i class="fas fa-eye"></i>
                </button>
                <button onclick="editSupplier('\${supplier.id}')" class="text-green-600 hover:text-green-900 mr-2" title="Edit">
                  <i class="fas fa-edit"></i>
                </button>
                <button onclick="contactSupplier('\${supplier.id}')" class="text-purple-600 hover:text-purple-900 mr-2" title="Contact">
                  <i class="fas fa-envelope"></i>
                </button>
                <button onclick="auditSupplier('\${supplier.id}')" class="text-orange-600 hover:text-orange-900" title="Audit">
                  <i class="fas fa-clipboard-check"></i>
                </button>
              </td>
            \`;
            tbody.appendChild(row);
          });
        }

        function renderPurchaseOrders() {
          const tbody = document.getElementById('poTableBody');
          tbody.innerHTML = '';

          purchaseOrders.slice(0, 10).forEach(po => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';

            row.innerHTML = \`
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">\${po.po_number}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                \${po.supplier_name}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                $\${po.total_amount.toLocaleString()}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium po-\${po.status}">
                  \${po.status.toUpperCase().replace('_', ' ')}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                \${new Date(po.order_date).toLocaleDateString()}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                \${new Date(po.requested_delivery_date).toLocaleDateString()}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="viewPO('\${po.po_number}')" class="text-blue-600 hover:text-blue-900 mr-2" title="View PO">
                  <i class="fas fa-eye"></i>
                </button>
                <button onclick="trackPO('\${po.po_number}')" class="text-green-600 hover:text-green-900" title="Track Delivery">
                  <i class="fas fa-truck"></i>
                </button>
              </td>
            \`;
            tbody.appendChild(row);
          });
        }

        function generateStarRating(rating) {
          const fullStars = Math.floor(rating);
          const halfStar = rating % 1 >= 0.5;
          const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
          
          let stars = '';
          for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
          }
          if (halfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
          }
          for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
          }
          return stars;
        }

        function viewSupplier(supplierId) {
          const supplier = supplierData.find(s => s.id == supplierId);
          if (supplier) {
            alert(\`Supplier Details: \${supplier.name}\\n\\nCode: \${supplier.code}\\nContact: \${supplier.contact_person}\\nEmail: \${supplier.email}\\nRatings: Q:\${supplier.quality_rating} D:\${supplier.delivery_rating} C:\${supplier.cost_rating}\\n\\n(Full supplier profile coming soon)\`);
          }
        }

        function editSupplier(supplierId) {
          alert('Supplier editing interface coming soon...');
        }

        function contactSupplier(supplierId) {
          const supplier = supplierData.find(s => s.id == supplierId);
          if (supplier && supplier.email) {
            window.location.href = \`mailto:\${supplier.email}?subject=Inquiry from \${currentUser.firstName} \${currentUser.lastName}\`;
          } else {
            alert('No email address available for this supplier.');
          }
        }

        function auditSupplier(supplierId) {
          const supplier = supplierData.find(s => s.id == supplierId);
          if (supplier) {
            alert(\`Schedule Audit for: \${supplier.name}\\n\\nLast Audit: \${supplier.last_audit_date || 'Never'}\\nNext Audit Due: \${supplier.next_audit_date || 'Not Scheduled'}\\n\\n(Audit scheduling system coming soon)\`);
          }
        }

        function addSupplier() {
          alert('Add new supplier form coming soon...');
        }

        function auditSuppliers() {
          alert('Bulk audit scheduling coming soon...');
        }

        function createPO() {
          alert('Purchase order creation wizard coming soon...');
        }

        function viewPO(poNumber) {
          const po = purchaseOrders.find(p => p.po_number === poNumber);
          if (po) {
            alert(\`PO Details: \${po.po_number}\\n\\nSupplier: \${po.supplier_name}\\nAmount: $\${po.total_amount.toLocaleString()}\\nStatus: \${po.status}\\nDelivery: \${po.requested_delivery_date}\\n\\n(Full PO view coming soon)\`);
          }
        }

        function trackPO(poNumber) {
          alert(\`Tracking PO: \${poNumber}\\n\\nDelivery tracking integration coming soon...\\n\\n(Will integrate with supplier tracking APIs)\`);
        }

        function exportSuppliers() {
          const csvContent = "data:text/csv;charset=utf-8," + 
            "Code,Name,Contact,Email,Certification,Quality,Delivery,Cost,Orders,Last Audit\\n" +
            filteredData.map(supplier => 
              \`"\${supplier.code}","\${supplier.name}","\${supplier.contact_person || ''}","\${supplier.email || ''}","\${supplier.certification_type}",\${supplier.quality_rating},\${supplier.delivery_rating},\${supplier.cost_rating},\${supplier.total_orders || 0},"\${supplier.last_audit_date || ''}"\`
            ).join("\\n");

          const encodedUri = encodeURI(csvContent);
          const link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "suppliers_export.csv");
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }

        // Event listeners
        document.getElementById('searchInput').addEventListener('input', applyFilters);
        document.getElementById('certificationFilter').addEventListener('change', applyFilters);
        document.getElementById('ratingFilter').addEventListener('change', applyFilters);

        // Initialize the page
        checkAuth();
      </script>
    </body>
    </html>
  `);
});

export default app;