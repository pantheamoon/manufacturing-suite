import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// EBR Dashboard Route
app.get('/app/ebr', async (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Electronic Batch Records - Manufacturing Suite</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css">
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <style>
        body { font-family: 'Inter', sans-serif; }
        .status-planned { @apply bg-blue-100 text-blue-800; }
        .status-in_progress { @apply bg-yellow-100 text-yellow-800; }
        .status-quality_hold { @apply bg-red-100 text-red-800; }
        .status-approved { @apply bg-green-100 text-green-800; }
        .status-rejected { @apply bg-red-100 text-red-800; }
        .status-shipped { @apply bg-gray-100 text-gray-800; }
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
              <h1 class="text-2xl font-bold text-gray-900">Electronic Batch Records</h1>
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
          <p class="mt-2 text-gray-600">Loading batch records...</p>
        </div>

        <!-- Main Content -->
        <div id="content" class="hidden">
          <!-- Stats Cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center">
                <div class="p-2 bg-blue-100 rounded-lg">
                  <i class="fas fa-flask text-blue-600 text-xl"></i>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">Active Batches</p>
                  <p id="activeBatches" class="text-2xl font-bold text-gray-900">0</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center">
                <div class="p-2 bg-green-100 rounded-lg">
                  <i class="fas fa-check-circle text-green-600 text-xl"></i>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">Completed Today</p>
                  <p id="completedToday" class="text-2xl font-bold text-gray-900">0</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center">
                <div class="p-2 bg-yellow-100 rounded-lg">
                  <i class="fas fa-exclamation-triangle text-yellow-600 text-xl"></i>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">Quality Hold</p>
                  <p id="qualityHold" class="text-2xl font-bold text-gray-900">0</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center">
                <div class="p-2 bg-purple-100 rounded-lg">
                  <i class="fas fa-chart-line text-purple-600 text-xl"></i>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">Efficiency</p>
                  <p id="efficiency" class="text-2xl font-bold text-gray-900">0%</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Batch Status Chart -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Batch Status Distribution</h3>
              <div style="height: 300px;">
                <canvas id="statusChart"></canvas>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Production Timeline</h3>
              <div style="height: 300px;">
                <canvas id="timelineChart"></canvas>
              </div>
            </div>
          </div>

          <!-- Batch Records Table -->
          <div class="bg-white rounded-lg shadow">
            <div class="px-6 py-4 border-b border-gray-200">
              <div class="flex justify-between items-center">
                <h3 class="text-lg font-semibold text-gray-900">Recent Batch Records</h3>
                <button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  <i class="fas fa-plus mr-2"></i>New Batch
                </button>
              </div>
            </div>
            
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch Number</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Production Line</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operator</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody id="batchTableBody" class="bg-white divide-y divide-gray-200">
                  <!-- Dynamic content will be loaded here -->
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <script>
        let currentUser = null;
        let batchData = [];
        let statusChart = null;
        let timelineChart = null;

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
            // Load batch data
            const response = await fetch('/api/batches');
            const data = await response.json();
            
            if (data.success) {
              batchData = data.data;
              updateStats();
              renderCharts();
              renderBatchTable();
              
              document.getElementById('loading').classList.add('hidden');
              document.getElementById('content').classList.remove('hidden');
            } else {
              throw new Error(data.error || 'Failed to load data');
            }
          } catch (error) {
            alert('Error loading data: ' + error.message);
          }
        }

        function updateStats() {
          const activeBatches = batchData.filter(b => b.status === 'in_progress').length;
          const completedToday = batchData.filter(b => 
            b.status === 'approved' && 
            new Date(b.actual_end_date).toDateString() === new Date().toDateString()
          ).length;
          const qualityHold = batchData.filter(b => b.status === 'quality_hold').length;
          
          // Calculate efficiency (completed vs planned)
          const completedBatches = batchData.filter(b => b.status === 'approved').length;
          const totalBatches = batchData.length;
          const efficiency = totalBatches > 0 ? Math.round((completedBatches / totalBatches) * 100) : 0;

          document.getElementById('activeBatches').textContent = activeBatches;
          document.getElementById('completedToday').textContent = completedToday;
          document.getElementById('qualityHold').textContent = qualityHold;
          document.getElementById('efficiency').textContent = efficiency + '%';
        }

        function renderCharts() {
          // Status Distribution Chart
          const statusCounts = {};
          batchData.forEach(batch => {
            statusCounts[batch.status] = (statusCounts[batch.status] || 0) + 1;
          });

          const ctx1 = document.getElementById('statusChart').getContext('2d');
          if (statusChart) statusChart.destroy();
          
          statusChart = new Chart(ctx1, {
            type: 'doughnut',
            data: {
              labels: Object.keys(statusCounts).map(status => 
                status.replace('_', ' ').toUpperCase()
              ),
              datasets: [{
                data: Object.values(statusCounts),
                backgroundColor: [
                  '#3B82F6', // blue
                  '#F59E0B', // yellow
                  '#EF4444', // red
                  '#10B981', // green
                  '#8B5CF6', // purple
                  '#6B7280'  // gray
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

          // Timeline Chart (batches over time)
          const timelineData = {};
          batchData.forEach(batch => {
            const date = new Date(batch.created_at).toLocaleDateString();
            timelineData[date] = (timelineData[date] || 0) + 1;
          });

          const sortedDates = Object.keys(timelineData).sort();
          const ctx2 = document.getElementById('timelineChart').getContext('2d');
          if (timelineChart) timelineChart.destroy();

          timelineChart = new Chart(ctx2, {
            type: 'line',
            data: {
              labels: sortedDates,
              datasets: [{
                label: 'Batches Created',
                data: sortedDates.map(date => timelineData[date]),
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true
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

        function renderBatchTable() {
          const tbody = document.getElementById('batchTableBody');
          tbody.innerHTML = '';

          batchData.slice(0, 20).forEach(batch => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            
            // Calculate progress based on steps completed
            const progress = batch.status === 'approved' ? 100 : 
                           batch.status === 'in_progress' ? 60 :
                           batch.status === 'quality_hold' ? 80 :
                           batch.status === 'planned' ? 0 : 50;

            row.innerHTML = \`
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">\${batch.batch_number}</div>
                <div class="text-sm text-gray-500">\${new Date(batch.created_at).toLocaleDateString()}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">\${batch.product_name}</div>
                <div class="text-sm text-gray-500">\${batch.product_sku}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                \${batch.production_line_name || 'Not Assigned'}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium status-\${batch.status}">
                  \${batch.status.replace('_', ' ').toUpperCase()}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-1 bg-gray-200 rounded-full h-2">
                    <div class="bg-blue-600 h-2 rounded-full" style="width: \${progress}%"></div>
                  </div>
                  <span class="ml-2 text-sm text-gray-600">\${progress}%</span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                \${batch.operator_name || 'Not Assigned'}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="viewBatch('\${batch.id}')" class="text-blue-600 hover:text-blue-900 mr-2">
                  <i class="fas fa-eye"></i>
                </button>
                <button onclick="editBatch('\${batch.id}')" class="text-green-600 hover:text-green-900">
                  <i class="fas fa-edit"></i>
                </button>
              </td>
            \`;
            tbody.appendChild(row);
          });
        }

        function viewBatch(batchId) {
          const batch = batchData.find(b => b.id == batchId);
          if (batch) {
            alert(\`Batch Details: \${batch.batch_number}\\n\\nProduct: \${batch.product_name}\\nStatus: \${batch.status}\\nQuantity: \${batch.planned_quantity}L\\n\\n(Full batch view coming soon)\`);
          }
        }

        function editBatch(batchId) {
          alert('Batch editing interface coming soon...');
        }

        // Initialize the page
        checkAuth();
      </script>
    </body>
    </html>
  `);
});

export default app;