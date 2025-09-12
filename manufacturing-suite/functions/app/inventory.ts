import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// FEFO Inventory Management Route
app.get('/app/inventory', async (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>FEFO Inventory Management - Manufacturing Suite</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css">
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <style>
        body { font-family: 'Inter', sans-serif; }
        .low-stock { @apply bg-red-50 border-red-200; }
        .expiring-soon { @apply bg-yellow-50 border-yellow-200; }
        .adequate-stock { @apply bg-green-50 border-green-200; }
        .category-active { @apply bg-blue-100 text-blue-800; }
        .category-base { @apply bg-green-100 text-green-800; }
        .category-preservative { @apply bg-purple-100 text-purple-800; }
        .category-fragrance { @apply bg-pink-100 text-pink-800; }
        .category-colorant { @apply bg-indigo-100 text-indigo-800; }
        .category-packaging { @apply bg-gray-100 text-gray-800; }
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
              <h1 class="text-2xl font-bold text-gray-900">FEFO Inventory Management</h1>
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
          <p class="mt-2 text-gray-600">Loading inventory data...</p>
        </div>

        <!-- Main Content -->
        <div id="content" class="hidden">
          <!-- Stats Cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center">
                <div class="p-2 bg-blue-100 rounded-lg">
                  <i class="fas fa-boxes text-blue-600 text-xl"></i>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">Total SKUs</p>
                  <p id="totalSkus" class="text-2xl font-bold text-gray-900">0</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center">
                <div class="p-2 bg-red-100 rounded-lg">
                  <i class="fas fa-exclamation-triangle text-red-600 text-xl"></i>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">Low Stock Items</p>
                  <p id="lowStockCount" class="text-2xl font-bold text-gray-900">0</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center">
                <div class="p-2 bg-yellow-100 rounded-lg">
                  <i class="fas fa-clock text-yellow-600 text-xl"></i>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">Expiring Soon</p>
                  <p id="expiringSoon" class="text-2xl font-bold text-gray-900">0</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center">
                <div class="p-2 bg-green-100 rounded-lg">
                  <i class="fas fa-dollar-sign text-green-600 text-xl"></i>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">Inventory Value</p>
                  <p id="inventoryValue" class="text-2xl font-bold text-gray-900">$0</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Charts Section -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Inventory by Category</h3>
              <div style="height: 300px;">
                <canvas id="categoryChart"></canvas>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Stock Levels vs Reorder Points</h3>
              <div style="height: 300px;">
                <canvas id="stockChart"></canvas>
              </div>
            </div>
          </div>

          <!-- Filters and Search -->
          <div class="bg-white rounded-lg shadow p-6 mb-6">
            <div class="flex flex-wrap items-center space-x-4 space-y-2">
              <div class="flex-1 min-w-64">
                <input type="text" id="searchInput" placeholder="Search materials..." 
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              </div>
              
              <select id="categoryFilter" class="px-4 py-2 border border-gray-300 rounded-lg">
                <option value="">All Categories</option>
                <option value="active">Active Ingredients</option>
                <option value="base">Base Materials</option>
                <option value="preservative">Preservatives</option>
                <option value="fragrance">Fragrances</option>
                <option value="colorant">Colorants</option>
                <option value="packaging">Packaging</option>
              </select>

              <select id="statusFilter" class="px-4 py-2 border border-gray-300 rounded-lg">
                <option value="">All Status</option>
                <option value="low_stock">Low Stock</option>
                <option value="expiring">Expiring Soon</option>
                <option value="adequate">Adequate Stock</option>
              </select>

              <button onclick="exportInventory()" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                <i class="fas fa-download mr-2"></i>Export
              </button>
            </div>
          </div>

          <!-- FEFO Priority Alert -->
          <div id="fefoAlert" class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 hidden">
            <div class="flex">
              <div class="flex-shrink-0">
                <i class="fas fa-exclamation-triangle text-yellow-400"></i>
              </div>
              <div class="ml-3">
                <p class="text-sm text-yellow-700">
                  <strong>FEFO Alert:</strong> The following items should be used first due to earlier expiry dates.
                </p>
              </div>
            </div>
          </div>

          <!-- Inventory Table -->
          <div class="bg-white rounded-lg shadow">
            <div class="px-6 py-4 border-b border-gray-200">
              <div class="flex justify-between items-center">
                <h3 class="text-lg font-semibold text-gray-900">Raw Materials Inventory (FEFO Sorted)</h3>
                <div class="flex space-x-2">
                  <button onclick="addStock()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    <i class="fas fa-plus mr-2"></i>Add Stock
                  </button>
                  <button onclick="adjustStock()" class="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700">
                    <i class="fas fa-edit mr-2"></i>Adjust Stock
                  </button>
                </div>
              </div>
            </div>
            
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Material
                      <i class="fas fa-sort ml-1 cursor-pointer" onclick="sortTable('name')"></i>
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Stock
                      <i class="fas fa-sort ml-1 cursor-pointer" onclick="sortTable('stock')"></i>
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reorder Point
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Earliest Expiry
                      <i class="fas fa-sort ml-1 cursor-pointer" onclick="sortTable('expiry')"></i>
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      FEFO Priority
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody id="inventoryTableBody" class="bg-white divide-y divide-gray-200">
                  <!-- Dynamic content will be loaded here -->
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <script>
        let currentUser = null;
        let inventoryData = [];
        let filteredData = [];
        let categoryChart = null;
        let stockChart = null;
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
            const response = await fetch('/api/inventory');
            const data = await response.json();
            
            if (data.success) {
              inventoryData = data.data;
              processInventoryData();
              updateStats();
              renderCharts();
              applyFilters();
              
              document.getElementById('loading').classList.add('hidden');
              document.getElementById('content').classList.remove('hidden');
            } else {
              throw new Error(data.error || 'Failed to load data');
            }
          } catch (error) {
            alert('Error loading data: ' + error.message);
          }
        }

        function processInventoryData() {
          // Calculate FEFO priorities and stock status
          inventoryData.forEach(item => {
            // Stock status
            const stockRatio = item.total_stock / item.reorder_point;
            if (stockRatio <= 1) {
              item.stockStatus = 'low_stock';
            } else if (item.earliest_expiry && new Date(item.earliest_expiry) <= new Date(Date.now() + 30*24*60*60*1000)) {
              item.stockStatus = 'expiring';
            } else {
              item.stockStatus = 'adequate';
            }

            // FEFO Priority (days until expiry)
            if (item.earliest_expiry) {
              const daysUntilExpiry = Math.ceil((new Date(item.earliest_expiry) - new Date()) / (1000*60*60*24));
              item.fefo_priority = daysUntilExpiry;
              if (daysUntilExpiry <= 7) {
                item.fefo_urgency = 'critical';
              } else if (daysUntilExpiry <= 30) {
                item.fefo_urgency = 'high';
              } else if (daysUntilExpiry <= 90) {
                item.fefo_urgency = 'medium';
              } else {
                item.fefo_urgency = 'low';
              }
            } else {
              item.fefo_priority = 999;
              item.fefo_urgency = 'none';
            }
          });

          // Sort by FEFO priority by default
          inventoryData.sort((a, b) => a.fefo_priority - b.fefo_priority);
        }

        function updateStats() {
          const totalSkus = inventoryData.length;
          const lowStockCount = inventoryData.filter(item => item.stockStatus === 'low_stock').length;
          const expiringSoon = inventoryData.filter(item => item.stockStatus === 'expiring').length;
          
          // Calculate total inventory value (approximate)
          const totalValue = inventoryData.reduce((sum, item) => {
            return sum + (item.total_stock || 0) * 10; // Assuming average cost of $10 per unit
          }, 0);

          document.getElementById('totalSkus').textContent = totalSkus;
          document.getElementById('lowStockCount').textContent = lowStockCount;
          document.getElementById('expiringSoon').textContent = expiringSoon;
          document.getElementById('inventoryValue').textContent = '$' + totalValue.toLocaleString();

          // Show FEFO alert if there are critical items
          const criticalItems = inventoryData.filter(item => item.fefo_urgency === 'critical');
          if (criticalItems.length > 0) {
            document.getElementById('fefoAlert').classList.remove('hidden');
          }
        }

        function renderCharts() {
          // Category Distribution Chart
          const categoryCounts = {};
          inventoryData.forEach(item => {
            categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
          });

          const ctx1 = document.getElementById('categoryChart').getContext('2d');
          if (categoryChart) categoryChart.destroy();
          
          categoryChart = new Chart(ctx1, {
            type: 'doughnut',
            data: {
              labels: Object.keys(categoryCounts).map(cat => 
                cat.charAt(0).toUpperCase() + cat.slice(1)
              ),
              datasets: [{
                data: Object.values(categoryCounts),
                backgroundColor: [
                  '#3B82F6', // blue - active
                  '#10B981', // green - base
                  '#8B5CF6', // purple - preservative
                  '#EC4899', // pink - fragrance
                  '#6366F1', // indigo - colorant
                  '#6B7280'  // gray - packaging
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

          // Stock Levels Chart
          const stockData = inventoryData.slice(0, 10).map(item => ({
            label: item.name.substring(0, 20) + (item.name.length > 20 ? '...' : ''),
            current: item.total_stock || 0,
            reorder: item.reorder_point || 0
          }));

          const ctx2 = document.getElementById('stockChart').getContext('2d');
          if (stockChart) stockChart.destroy();

          stockChart = new Chart(ctx2, {
            type: 'bar',
            data: {
              labels: stockData.map(item => item.label),
              datasets: [{
                label: 'Current Stock',
                data: stockData.map(item => item.current),
                backgroundColor: '#3B82F6'
              }, {
                label: 'Reorder Point',
                data: stockData.map(item => item.reorder),
                backgroundColor: '#EF4444'
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }
          });
        }

        function applyFilters() {
          const searchTerm = document.getElementById('searchInput').value.toLowerCase();
          const categoryFilter = document.getElementById('categoryFilter').value;
          const statusFilter = document.getElementById('statusFilter').value;

          filteredData = inventoryData.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm) ||
                                item.sku.toLowerCase().includes(searchTerm);
            const matchesCategory = !categoryFilter || item.category === categoryFilter;
            const matchesStatus = !statusFilter || item.stockStatus === statusFilter;

            return matchesSearch && matchesCategory && matchesStatus;
          });

          renderInventoryTable();
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
              case 'stock':
                aVal = a.total_stock || 0;
                bVal = b.total_stock || 0;
                break;
              case 'expiry':
                aVal = a.fefo_priority;
                bVal = b.fefo_priority;
                break;
              default:
                return 0;
            }

            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
          });

          renderInventoryTable();
        }

        function renderInventoryTable() {
          const tbody = document.getElementById('inventoryTableBody');
          tbody.innerHTML = '';

          filteredData.forEach(item => {
            const row = document.createElement('tr');
            
            // Determine row styling based on stock status
            let rowClass = 'hover:bg-gray-50';
            if (item.stockStatus === 'low_stock') {
              rowClass += ' low-stock';
            } else if (item.stockStatus === 'expiring') {
              rowClass += ' expiring-soon';
            } else {
              rowClass += ' adequate-stock';
            }
            row.className = rowClass;

            // FEFO Priority display
            let fefoDisplay = '';
            if (item.fefo_urgency === 'critical') {
              fefoDisplay = \`<span class="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                <i class="fas fa-exclamation-triangle mr-1"></i>CRITICAL (\${item.fefo_priority}d)
              </span>\`;
            } else if (item.fefo_urgency === 'high') {
              fefoDisplay = \`<span class="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                HIGH (\${item.fefo_priority}d)
              </span>\`;
            } else if (item.fefo_urgency === 'medium') {
              fefoDisplay = \`<span class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                MEDIUM (\${item.fefo_priority}d)
              </span>\`;
            } else if (item.fefo_urgency === 'low') {
              fefoDisplay = \`<span class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                LOW (\${item.fefo_priority}d)
              </span>\`;
            } else {
              fefoDisplay = '<span class="text-gray-500">No Expiry</span>';
            }

            row.innerHTML = \`
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">\${item.name}</div>
                <div class="text-sm text-gray-500">\${item.sku}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium category-\${item.category}">
                  \${item.category}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">
                  \${(item.total_stock || 0).toFixed(1)} \${item.unit_of_measure}
                </div>
                <div class="text-xs text-gray-500">\${item.lot_count || 0} lots</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                \${item.reorder_point} \${item.unit_of_measure}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                \${item.earliest_expiry ? new Date(item.earliest_expiry).toLocaleDateString() : 'N/A'}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                \${fefoDisplay}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="viewLots('\${item.id}')" class="text-blue-600 hover:text-blue-900 mr-2" title="View Lots">
                  <i class="fas fa-eye"></i>
                </button>
                <button onclick="consume('\${item.id}')" class="text-green-600 hover:text-green-900 mr-2" title="Consume Stock">
                  <i class="fas fa-minus-circle"></i>
                </button>
                <button onclick="addStock('\${item.id}')" class="text-purple-600 hover:text-purple-900" title="Add Stock">
                  <i class="fas fa-plus-circle"></i>
                </button>
              </td>
            \`;
            tbody.appendChild(row);
          });
        }

        function viewLots(materialId) {
          alert('Lot details view coming soon...');
        }

        function consume(materialId) {
          const material = inventoryData.find(m => m.id == materialId);
          if (material) {
            const amount = prompt(\`How much \${material.name} to consume? (Available: \${material.total_stock} \${material.unit_of_measure})\`);
            if (amount && parseFloat(amount) > 0) {
              alert(\`Consumed \${amount} \${material.unit_of_measure} of \${material.name}. \\n\\nFEFO logic will automatically select from earliest expiry lots.\\n\\n(Integration with production system coming soon)\`);
            }
          }
        }

        function addStock(materialId = null) {
          if (materialId) {
            const material = inventoryData.find(m => m.id == materialId);
            alert(\`Add stock for: \${material.name}\\n\\nStock receiving interface coming soon...\`);
          } else {
            alert('General stock receiving interface coming soon...');
          }
        }

        function adjustStock() {
          alert('Stock adjustment interface coming soon...');
        }

        function exportInventory() {
          const csvContent = "data:text/csv;charset=utf-8," + 
            "SKU,Name,Category,Current Stock,Unit,Reorder Point,Earliest Expiry,FEFO Priority\\n" +
            filteredData.map(item => 
              \`"\${item.sku}","\${item.name}","\${item.category}",\${item.total_stock || 0},"\${item.unit_of_measure}",\${item.reorder_point},"\${item.earliest_expiry || ''}",\${item.fefo_priority}\`
            ).join("\\n");

          const encodedUri = encodeURI(csvContent);
          const link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "inventory_export.csv");
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }

        // Event listeners
        document.getElementById('searchInput').addEventListener('input', applyFilters);
        document.getElementById('categoryFilter').addEventListener('change', applyFilters);
        document.getElementById('statusFilter').addEventListener('change', applyFilters);

        // Initialize the page
        checkAuth();
      </script>
    </body>
    </html>
  `);
});

export default app;