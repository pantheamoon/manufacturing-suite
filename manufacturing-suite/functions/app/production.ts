import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// Production Planning Route
app.get('/app/production', async (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Production Planning - Manufacturing Suite</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css">
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/date-fns@2.29.3/index.min.js"></script>
      <style>
        body { font-family: 'Inter', sans-serif; }
        .line-available { @apply bg-green-100 text-green-800 border-green-200; }
        .line-in_use { @apply bg-blue-100 text-blue-800 border-blue-200; }
        .line-maintenance { @apply bg-yellow-100 text-yellow-800 border-yellow-200; }
        .line-down { @apply bg-red-100 text-red-800 border-red-200; }
        .schedule-grid { 
          display: grid; 
          grid-template-columns: 150px repeat(24, 1fr);
          gap: 1px;
          background-color: #e5e7eb;
        }
        .schedule-header { @apply bg-gray-600 text-white text-xs p-1 text-center font-medium; }
        .schedule-line { @apply bg-white text-sm p-2 font-medium; }
        .schedule-slot { @apply bg-gray-50 text-xs p-1 border min-h-8 cursor-pointer hover:bg-gray-100; }
        .schedule-occupied { @apply bg-blue-200 text-blue-900 border-blue-300; }
        .schedule-maintenance { @apply bg-yellow-200 text-yellow-900 border-yellow-300; }
        .priority-high { @apply bg-red-100 text-red-800; }
        .priority-medium { @apply bg-yellow-100 text-yellow-800; }
        .priority-low { @apply bg-green-100 text-green-800; }
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
              <h1 class="text-2xl font-bold text-gray-900">Production Planning</h1>
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
          <p class="mt-2 text-gray-600">Loading production data...</p>
        </div>

        <!-- Main Content -->
        <div id="content" class="hidden">
          <!-- Production Lines Overview -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div id="lineA" class="bg-white rounded-lg shadow p-6 border-l-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-semibold text-gray-900">Line A</h3>
                  <p class="text-sm text-gray-600">150 L/hr capacity</p>
                  <p id="lineAStatus" class="text-sm font-medium mt-2">Available</p>
                </div>
                <div class="p-3 bg-gray-100 rounded-full">
                  <i class="fas fa-industry text-gray-600 text-xl"></i>
                </div>
              </div>
              <div class="mt-4">
                <div class="text-xs text-gray-500">Current Batch</div>
                <div id="lineABatch" class="text-sm font-medium">None</div>
              </div>
            </div>

            <div id="lineB" class="bg-white rounded-lg shadow p-6 border-l-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-semibold text-gray-900">Line B</h3>
                  <p class="text-sm text-gray-600">120 L/hr capacity</p>
                  <p id="lineBStatus" class="text-sm font-medium mt-2">Available</p>
                </div>
                <div class="p-3 bg-gray-100 rounded-full">
                  <i class="fas fa-industry text-gray-600 text-xl"></i>
                </div>
              </div>
              <div class="mt-4">
                <div class="text-xs text-gray-500">Current Batch</div>
                <div id="lineBBatch" class="text-sm font-medium">None</div>
              </div>
            </div>

            <div id="lineC" class="bg-white rounded-lg shadow p-6 border-l-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-semibold text-gray-900">Line C</h3>
                  <p class="text-sm text-gray-600">100 L/hr capacity</p>
                  <p id="lineCStatus" class="text-sm font-medium mt-2">Maintenance</p>
                </div>
                <div class="p-3 bg-gray-100 rounded-full">
                  <i class="fas fa-industry text-gray-600 text-xl"></i>
                </div>
              </div>
              <div class="mt-4">
                <div class="text-xs text-gray-500">Next Maintenance</div>
                <div id="lineCMaint" class="text-sm font-medium">In Progress</div>
              </div>
            </div>

            <div id="linePilot" class="bg-white rounded-lg shadow p-6 border-l-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-semibold text-gray-900">Pilot Line</h3>
                  <p class="text-sm text-gray-600">25 L/hr capacity</p>
                  <p id="linePilotStatus" class="text-sm font-medium mt-2">Available</p>
                </div>
                <div class="p-3 bg-gray-100 rounded-full">
                  <i class="fas fa-flask text-gray-600 text-xl"></i>
                </div>
              </div>
              <div class="mt-4">
                <div class="text-xs text-gray-500">R&D Batches</div>
                <div id="linePilotBatch" class="text-sm font-medium">Available</div>
              </div>
            </div>
          </div>

          <!-- OEE Dashboard -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Overall Equipment Effectiveness (OEE)</h3>
              <div style="height: 300px;">
                <canvas id="oeeChart"></canvas>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Production Capacity Utilization</h3>
              <div style="height: 300px;">
                <canvas id="capacityChart"></canvas>
              </div>
            </div>
          </div>

          <!-- Schedule Controls -->
          <div class="bg-white rounded-lg shadow p-6 mb-6">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-semibold text-gray-900">Production Schedule</h3>
              <div class="flex space-x-2">
                <input type="date" id="scheduleDate" class="px-3 py-2 border border-gray-300 rounded-lg">
                <button onclick="prevDay()" class="bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600">
                  <i class="fas fa-chevron-left"></i>
                </button>
                <button onclick="nextDay()" class="bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600">
                  <i class="fas fa-chevron-right"></i>
                </button>
                <button onclick="scheduleBatch()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  <i class="fas fa-plus mr-2"></i>Schedule Batch
                </button>
              </div>
            </div>

            <!-- Gantt Chart Style Schedule -->
            <div class="overflow-x-auto">
              <div class="schedule-grid">
                <div class="schedule-header">Line / Time</div>
                <!-- Hour headers -->
                <script>
                  for (let hour = 0; hour < 24; hour++) {
                    document.write(\`<div class="schedule-header">\${hour.toString().padStart(2, '0')}:00</div>\`);
                  }
                </script>
                
                <!-- Line A -->
                <div class="schedule-line">Line A</div>
                <div id="lineA-schedule" class="contents">
                  <!-- Schedule slots will be generated by JavaScript -->
                </div>
                
                <!-- Line B -->
                <div class="schedule-line">Line B</div>
                <div id="lineB-schedule" class="contents">
                  <!-- Schedule slots will be generated by JavaScript -->
                </div>
                
                <!-- Line C -->
                <div class="schedule-line">Line C</div>
                <div id="lineC-schedule" class="contents">
                  <!-- Schedule slots will be generated by JavaScript -->
                </div>
                
                <!-- Pilot Line -->
                <div class="schedule-line">Pilot</div>
                <div id="linePilot-schedule" class="contents">
                  <!-- Schedule slots will be generated by JavaScript -->
                </div>
              </div>
            </div>
          </div>

          <!-- Batch Queue -->
          <div class="bg-white rounded-lg shadow">
            <div class="px-6 py-4 border-b border-gray-200">
              <div class="flex justify-between items-center">
                <h3 class="text-lg font-semibold text-gray-900">Batch Queue & Priorities</h3>
                <select id="queueFilter" class="px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="">All Batches</option>
                  <option value="planned">Planned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>
            </div>
            
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Batch Number
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scheduled Time
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned Line
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody id="queueTableBody" class="bg-white divide-y divide-gray-200">
                  <!-- Dynamic content will be loaded here -->
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <script>
        let currentUser = null;
        let productionLines = [];
        let scheduleData = [];
        let batchQueue = [];
        let currentDate = new Date();
        let oeeChart = null;
        let capacityChart = null;

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
            // Load production schedule data
            const response = await fetch('/api/production/schedule');
            const data = await response.json();
            
            if (data.success) {
              scheduleData = data.data;
              
              // Load batch queue data
              const batchResponse = await fetch('/api/batches');
              const batchData = await batchResponse.json();
              
              if (batchData.success) {
                batchQueue = batchData.data.filter(batch => 
                  ['planned', 'in_progress'].includes(batch.status)
                );
                
                updateProductionLines();
                renderSchedule();
                renderCharts();
                renderBatchQueue();
                
                document.getElementById('loading').classList.add('hidden');
                document.getElementById('content').classList.remove('hidden');
              }
            } else {
              throw new Error(data.error || 'Failed to load data');
            }
          } catch (error) {
            alert('Error loading data: ' + error.message);
          }
        }

        function updateProductionLines() {
          // Mock production line data with current status
          const lines = [
            { 
              id: 'A', 
              name: 'Line A', 
              status: 'available', 
              capacity: 150, 
              currentBatch: null,
              efficiency: 85 
            },
            { 
              id: 'B', 
              name: 'Line B', 
              status: 'in_use', 
              capacity: 120, 
              currentBatch: 'BATCH002',
              efficiency: 92 
            },
            { 
              id: 'C', 
              name: 'Line C', 
              status: 'maintenance', 
              capacity: 100, 
              currentBatch: null,
              efficiency: 0 
            },
            { 
              id: 'Pilot', 
              name: 'Pilot Line', 
              status: 'available', 
              capacity: 25, 
              currentBatch: null,
              efficiency: 78 
            }
          ];

          lines.forEach(line => {
            const lineElement = document.getElementById(\`line\${line.id}\`);
            const statusElement = document.getElementById(\`line\${line.id}Status\`);
            const batchElement = document.getElementById(\`line\${line.id}Batch\`);
            
            // Update line card styling
            lineElement.className = lineElement.className.replace(/line-\\w+/g, '') + \` line-\${line.status}\`;
            
            // Update status text
            statusElement.textContent = line.status.charAt(0).toUpperCase() + line.status.slice(1).replace('_', ' ');
            
            // Update current batch info
            if (line.currentBatch) {
              batchElement.textContent = line.currentBatch;
            } else if (line.status === 'maintenance') {
              batchElement.textContent = 'Under Maintenance';
            } else {
              batchElement.textContent = 'Available';
            }
          });

          productionLines = lines;
        }

        function renderSchedule() {
          // Set current date in date picker
          document.getElementById('scheduleDate').valueAsDate = currentDate;
          
          // Clear existing schedule slots
          ['lineA', 'lineB', 'lineC', 'linePilot'].forEach(lineId => {
            const container = document.getElementById(\`\${lineId}-schedule\`);
            container.innerHTML = '';
            
            // Generate 24 hour slots for each line
            for (let hour = 0; hour < 24; hour++) {
              const slot = document.createElement('div');
              slot.className = 'schedule-slot';
              slot.setAttribute('data-line', lineId);
              slot.setAttribute('data-hour', hour);
              slot.onclick = () => selectTimeSlot(lineId, hour);
              
              // Check if this slot has a scheduled batch
              const scheduledItem = scheduleData.find(item => {
                const itemDate = new Date(item.schedule_date);
                const itemHour = new Date(item.planned_start_time).getHours();
                return itemDate.toDateString() === currentDate.toDateString() &&
                       item.line_code === lineId.toUpperCase().replace('LINE', 'LINE_') &&
                       itemHour === hour;
              });
              
              if (scheduledItem) {
                slot.className += ' schedule-occupied';
                slot.textContent = scheduledItem.batch_number || 'Scheduled';
                slot.title = \`\${scheduledItem.product_name} - \${scheduledItem.batch_number}\`;
              } else if (lineId === 'lineC' && hour >= 8 && hour <= 16) {
                slot.className += ' schedule-maintenance';
                slot.textContent = 'Maint.';
                slot.title = 'Maintenance Schedule';
              }
              
              container.appendChild(slot);
            }
          });
        }

        function renderCharts() {
          // OEE Chart
          const ctx1 = document.getElementById('oeeChart').getContext('2d');
          if (oeeChart) oeeChart.destroy();
          
          const oeeData = productionLines.map(line => line.efficiency);
          const lineNames = productionLines.map(line => line.name);
          
          oeeChart = new Chart(ctx1, {
            type: 'bar',
            data: {
              labels: lineNames,
              datasets: [{
                label: 'OEE (%)',
                data: oeeData,
                backgroundColor: [
                  '#10B981', // green
                  '#3B82F6', // blue  
                  '#EF4444', // red
                  '#8B5CF6'  // purple
                ],
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100
                }
              },
              plugins: {
                legend: {
                  display: false
                }
              }
            }
          });

          // Capacity Utilization Chart
          const ctx2 = document.getElementById('capacityChart').getContext('2d');
          if (capacityChart) capacityChart.destroy();
          
          capacityChart = new Chart(ctx2, {
            type: 'doughnut',
            data: {
              labels: ['Utilized', 'Available'],
              datasets: [{
                data: [75, 25], // Mock data - 75% utilized
                backgroundColor: ['#3B82F6', '#E5E7EB'],
                borderWidth: 0
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

        function renderBatchQueue() {
          const tbody = document.getElementById('queueTableBody');
          tbody.innerHTML = '';

          // Sort batches by priority and date
          const sortedQueue = [...batchQueue].sort((a, b) => {
            const priorityA = getPriorityValue(a.priority || 5);
            const priorityB = getPriorityValue(b.priority || 5);
            if (priorityA !== priorityB) return priorityB - priorityA;
            return new Date(a.planned_start_date) - new Date(b.planned_start_date);
          });

          sortedQueue.slice(0, 20).forEach(batch => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            
            const priority = batch.priority || 5;
            const priorityClass = priority >= 8 ? 'priority-high' : 
                                 priority >= 5 ? 'priority-medium' : 'priority-low';

            row.innerHTML = \`
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium \${priorityClass}">
                  Priority \${priority}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">\${batch.batch_number}</div>
                <div class="text-sm text-gray-500">\${new Date(batch.created_at).toLocaleDateString()}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">\${batch.product_name}</div>
                <div class="text-sm text-gray-500">\${batch.product_sku}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                \${batch.planned_quantity}L
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                \${batch.planned_start_date ? new Date(batch.planned_start_date).toLocaleString() : 'Not Scheduled'}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                \${batch.production_line_name || 'Not Assigned'}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium status-\${batch.status}">
                  \${batch.status.toUpperCase().replace('_', ' ')}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="scheduleBatchDialog('\${batch.id}')" class="text-blue-600 hover:text-blue-900 mr-2" title="Schedule">
                  <i class="fas fa-calendar-plus"></i>
                </button>
                <button onclick="optimizeBatch('\${batch.id}')" class="text-green-600 hover:text-green-900 mr-2" title="Optimize">
                  <i class="fas fa-magic"></i>
                </button>
                <button onclick="viewBatchDetails('\${batch.id}')" class="text-gray-600 hover:text-gray-900" title="Details">
                  <i class="fas fa-eye"></i>
                </button>
              </td>
            \`;
            tbody.appendChild(row);
          });
        }

        function getPriorityValue(priority) {
          return typeof priority === 'number' ? priority : 5;
        }

        function selectTimeSlot(lineId, hour) {
          const slot = document.querySelector(\`[data-line="\${lineId}"][data-hour="\${hour}"]\`);
          if (slot.classList.contains('schedule-occupied') || slot.classList.contains('schedule-maintenance')) {
            return; // Can't select occupied slots
          }
          
          // Clear previous selections
          document.querySelectorAll('.schedule-slot').forEach(s => s.classList.remove('border-blue-500', 'border-2'));
          
          // Highlight selected slot
          slot.classList.add('border-blue-500', 'border-2');
          
          // Store selection for batch scheduling
          window.selectedSlot = { lineId, hour };
        }

        function prevDay() {
          currentDate.setDate(currentDate.getDate() - 1);
          renderSchedule();
        }

        function nextDay() {
          currentDate.setDate(currentDate.getDate() + 1);
          renderSchedule();
        }

        function scheduleBatch() {
          if (!window.selectedSlot) {
            alert('Please select a time slot first by clicking on the schedule grid.');
            return;
          }
          
          const availableBatches = batchQueue.filter(b => b.status === 'planned');
          if (availableBatches.length === 0) {
            alert('No planned batches available for scheduling.');
            return;
          }
          
          const batchList = availableBatches.map(b => \`\${b.batch_number} - \${b.product_name}\`).join('\\n');
          const batchNumber = prompt(\`Select batch to schedule at \${window.selectedSlot.lineId} \${window.selectedSlot.hour}:00:\\n\\n\${batchList}\\n\\nEnter batch number:\`);
          
          if (batchNumber) {
            alert(\`Scheduled \${batchNumber} on \${window.selectedSlot.lineId} at \${window.selectedSlot.hour}:00\\n\\n(Full scheduling integration coming soon)\`);
            // In a real implementation, this would update the database
            renderSchedule();
          }
        }

        function scheduleBatchDialog(batchId) {
          const batch = batchQueue.find(b => b.id == batchId);
          if (batch) {
            alert(\`Schedule Batch: \${batch.batch_number}\\n\\nProduct: \${batch.product_name}\\nQuantity: \${batch.planned_quantity}L\\n\\nSelect a time slot on the schedule grid and use the Schedule Batch button.\\n\\n(Advanced scheduling dialog coming soon)\`);
          }
        }

        function optimizeBatch(batchId) {
          const batch = batchQueue.find(b => b.id == batchId);
          if (batch) {
            // Mock optimization suggestions
            const suggestions = [
              'Optimal Line: Line A (highest efficiency for this product type)',
              'Suggested Time: 08:00 (during peak efficiency hours)', 
              'Material Availability: All materials in stock',
              'Estimated Duration: 6.5 hours',
              'Resource Conflicts: None detected'
            ];
            
            alert(\`AI Optimization for \${batch.batch_number}:\\n\\n\${suggestions.join('\\n')}\\n\\n(Full AI optimization coming soon)\`);
          }
        }

        function viewBatchDetails(batchId) {
          const batch = batchQueue.find(b => b.id == batchId);
          if (batch) {
            alert(\`Batch Details: \${batch.batch_number}\\n\\nProduct: \${batch.product_name}\\nQuantity: \${batch.planned_quantity}L\\nStatus: \${batch.status}\\nCreated: \${new Date(batch.created_at).toLocaleString()}\\n\\n(Full details view coming soon)\`);
          }
        }

        // Date picker change handler
        document.getElementById('scheduleDate').addEventListener('change', function(e) {
          currentDate = new Date(e.target.value);
          renderSchedule();
        });

        // Queue filter handler
        document.getElementById('queueFilter').addEventListener('change', function(e) {
          const filter = e.target.value;
          if (filter) {
            const filtered = batchQueue.filter(batch => batch.status === filter);
            // Re-render table with filtered data (simplified for demo)
          }
          renderBatchQueue();
        });

        // Initialize the page
        checkAuth();
      </script>
    </body>
    </html>
  `);
});

export default app;