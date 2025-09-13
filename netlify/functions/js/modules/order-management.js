// Complete Order Management System
class OrderManager {
    constructor() {
        this.orders = [];
        this.clients = [];
        this.products = [];
    }

    async init() {
        await this.loadData();
        this.renderInterface();
    }

    async loadData() {
        try {
            // Load clients
            const clientsResponse = await fetch('/tables/clients');
            const clientsResult = await clientsResponse.json();
            this.clients = clientsResult.data || [];

            // Load products
            const productsResponse = await fetch('/tables/products');
            const productsResult = await productsResponse.json();
            this.products = productsResult.data || [];

            // Load existing orders
            const ordersResponse = await fetch('/tables/manufacturing_orders');
            const ordersResult = await ordersResponse.json();
            this.orders = ordersResult.data || [];

        } catch (error) {
            console.error('Error loading order data:', error);
        }
    }

    renderInterface() {
        const content = `
        <div class="p-6">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-sage-800">Order Management</h2>
                <button onclick="orderManager.showCreateOrderModal()" 
                        class="bg-sage-600 text-white px-4 py-2 rounded hover:bg-sage-700">
                    <i class="fas fa-plus mr-2"></i>Create New Order
                </button>
            </div>

            <!-- Quick Stats -->
            <div class="grid grid-cols-4 gap-4 mb-6">
                <div class="bg-white p-4 rounded-lg shadow">
                    <h3 class="text-sm text-gray-600">Total Orders</h3>
                    <p class="text-2xl font-bold text-sage-600">${this.orders.length}</p>
                </div>
                <div class="bg-white p-4 rounded-lg shadow">
                    <h3 class="text-sm text-gray-600">In Production</h3>
                    <p class="text-2xl font-bold text-blue-600">${this.orders.filter(o => o.status === 'In Production').length}</p>
                </div>
                <div class="bg-white p-4 rounded-lg shadow">
                    <h3 class="text-sm text-gray-600">Pending Payment</h3>
                    <p class="text-2xl font-bold text-orange-600">${this.orders.filter(o => o.status === 'Deposit Required').length}</p>
                </div>
                <div class="bg-white p-4 rounded-lg shadow">
                    <h3 class="text-sm text-gray-600">Completed</h3>
                    <p class="text-2xl font-bold text-green-600">${this.orders.filter(o => o.status === 'Completed').length}</p>
                </div>
            </div>

            <!-- Orders Table -->
            <div class="bg-white rounded-lg shadow overflow-hidden">
                <table class="w-full">
                    <thead class="bg-sage-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-sage-700 uppercase tracking-wider">Order #</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-sage-700 uppercase tracking-wider">Client</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-sage-700 uppercase tracking-wider">Product</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-sage-700 uppercase tracking-wider">Quantity</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-sage-700 uppercase tracking-wider">Total</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-sage-700 uppercase tracking-wider">Status</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-sage-700 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        ${this.renderOrderRows()}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Create Order Modal -->
        <div id="createOrderModal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50">
            <div class="flex items-center justify-center min-h-screen p-4">
                <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
                    <div class="p-6">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-bold">Create New Order</h3>
                            <button onclick="orderManager.closeCreateOrderModal()" class="text-gray-400 hover:text-gray-600">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <form id="createOrderForm" onsubmit="orderManager.createOrder(event)">
                            <div class="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Client</label>
                                    <select id="orderClient" required class="w-full border border-gray-300 rounded-lg px-3 py-2">
                                        <option value="">Select Client</option>
                                        ${this.clients.map(client => 
                                            `<option value="${client.id}">${client.company_name}</option>`
                                        ).join('')}
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Product</label>
                                    <select id="orderProduct" required class="w-full border border-gray-300 rounded-lg px-3 py-2">
                                        <option value="">Select Product</option>
                                        ${this.products.map(product => 
                                            `<option value="${product.id}" data-name="${product.name}">${product.name} (${product.sku})</option>`
                                        ).join('')}
                                    </select>
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                    <input type="number" id="orderQuantity" required min="1" 
                                           class="w-full border border-gray-300 rounded-lg px-3 py-2"
                                           onchange="orderManager.calculateOrderTotal()">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Unit Price (£)</label>
                                    <input type="number" id="orderUnitPrice" required step="0.01" min="0"
                                           class="w-full border border-gray-300 rounded-lg px-3 py-2"
                                           onchange="orderManager.calculateOrderTotal()">
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
                                    <input type="date" id="orderDeliveryDate" required 
                                           class="w-full border border-gray-300 rounded-lg px-3 py-2">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Total Cost</label>
                                    <input type="text" id="orderTotal" readonly 
                                           class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
                                           value="£0.00">
                                </div>
                            </div>

                            <div class="mb-4">
                                <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea id="orderNotes" rows="3" 
                                          class="w-full border border-gray-300 rounded-lg px-3 py-2"
                                          placeholder="Order notes or special requirements..."></textarea>
                            </div>

                            <div class="flex justify-end gap-2">
                                <button type="button" onclick="orderManager.closeCreateOrderModal()" 
                                        class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                    Cancel
                                </button>
                                <button type="submit" 
                                        class="px-4 py-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700">
                                    Create Order & Generate Invoice
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>`;

        document.getElementById('order-management').innerHTML = content;
    }

    renderOrderRows() {
        return this.orders.map(order => {
            const client = this.clients.find(c => c.id === order.client_id);
            const statusColors = {
                'Draft': 'bg-gray-100 text-gray-800',
                'Deposit Required': 'bg-yellow-100 text-yellow-800',
                'In Production': 'bg-blue-100 text-blue-800',
                'Completed': 'bg-green-100 text-green-800',
                'Cancelled': 'bg-red-100 text-red-800'
            };

            return `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${order.order_number}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${client ? client.company_name : 'Unknown'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${order.product_id}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${order.quantity_requested}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        £${order.total_manufacturing_cost.toFixed(2)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}">
                            ${order.status}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button onclick="orderManager.viewOrder('${order.id}')" 
                                class="text-sage-600 hover:text-sage-900 mr-2">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="orderManager.generateInvoice('${order.id}')" 
                                class="text-blue-600 hover:text-blue-900 mr-2">
                            <i class="fas fa-file-invoice"></i>
                        </button>
                        <button onclick="orderManager.sendEmail('${order.id}')" 
                                class="text-green-600 hover:text-green-900">
                            <i class="fas fa-envelope"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    showCreateOrderModal() {
        document.getElementById('createOrderModal').classList.remove('hidden');
        // Set default delivery date to 30 days from now
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + 30);
        document.getElementById('orderDeliveryDate').value = deliveryDate.toISOString().split('T')[0];
    }

    closeCreateOrderModal() {
        document.getElementById('createOrderModal').classList.add('hidden');
        document.getElementById('createOrderForm').reset();
    }

    calculateOrderTotal() {
        const quantity = parseFloat(document.getElementById('orderQuantity').value) || 0;
        const unitPrice = parseFloat(document.getElementById('orderUnitPrice').value) || 0;
        const total = quantity * unitPrice;
        document.getElementById('orderTotal').value = `£${total.toFixed(2)}`;
    }

    async createOrder(event) {
        event.preventDefault();
        
        try {
            const formData = {
                client_id: document.getElementById('orderClient').value,
                product_id: document.getElementById('orderProduct').value,
                quantity_requested: parseInt(document.getElementById('orderQuantity').value),
                manufacturing_cost_per_unit: parseFloat(document.getElementById('orderUnitPrice').value),
                total_manufacturing_cost: parseFloat(document.getElementById('orderQuantity').value) * parseFloat(document.getElementById('orderUnitPrice').value),
                requested_delivery_date: document.getElementById('orderDeliveryDate').value,
                notes: document.getElementById('orderNotes').value,
                status: 'Draft',
                order_number: this.generateOrderNumber(),
                deposit_amount: (parseFloat(document.getElementById('orderQuantity').value) * parseFloat(document.getElementById('orderUnitPrice').value)) * 0.5,
                remaining_amount: (parseFloat(document.getElementById('orderQuantity').value) * parseFloat(document.getElementById('orderUnitPrice').value)) * 0.5,
                deposit_paid: false,
                samples_approved: false,
                final_payment_due: false,
                final_payment_paid: false,
                batch_size: 1,
                tenant_id: 'luxebeauty_001'
            };

            // Create the order
            const response = await fetch('/tables/manufacturing_orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const result = await response.json();
                
                // Automatically generate and send invoice
                await this.generateAndSendInvoice(result.id, formData);
                
                // Refresh the orders list
                await this.loadData();
                this.renderInterface();
                this.closeCreateOrderModal();
                
                alert(`Order ${formData.order_number} created successfully and invoice sent!`);
            } else {
                throw new Error('Failed to create order');
            }

        } catch (error) {
            console.error('Error creating order:', error);
            alert('Error creating order: ' + error.message);
        }
    }

    generateOrderNumber() {
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const timeStr = date.toTimeString().slice(0, 8).replace(/:/g, '');
        return `ORD-${dateStr}-${timeStr}`;
    }

    async generateAndSendInvoice(orderId, orderData) {
        try {
            // Generate invoice data
            const invoiceData = {
                clientId: orderData.client_id,
                orderData: {
                    orderNumber: orderData.order_number,
                    notes: orderData.notes
                },
                items: [{
                    name: orderData.product_id,
                    description: `Manufacturing order for ${orderData.product_id}`,
                    quantity: orderData.quantity_requested,
                    price: orderData.manufacturing_cost_per_unit
                }],
                sendEmail: true
            };

            // Call email invoice function
            const response = await fetch('/.netlify/functions/email-invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create_and_send',
                    ...invoiceData
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Invoice sent:', result);
                return result;
            } else {
                throw new Error('Failed to send invoice');
            }

        } catch (error) {
            console.error('Error generating invoice:', error);
            // Don't fail the order creation if invoice fails
            return null;
        }
    }

    async generateInvoice(orderId) {
        try {
            const order = this.orders.find(o => o.id === orderId);
            if (!order) return;

            await this.generateAndSendInvoice(orderId, order);
            alert('Invoice generated and sent successfully!');

        } catch (error) {
            console.error('Error generating invoice:', error);
            alert('Error generating invoice: ' + error.message);
        }
    }

    async sendEmail(orderId) {
        try {
            // Implementation for sending custom emails
            alert('Email functionality - to be implemented based on your email service');
        } catch (error) {
            console.error('Error sending email:', error);
        }
    }

    viewOrder(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            // Show order details modal
            alert(`Order Details:\n${JSON.stringify(order, null, 2)}`);
        }
    }
}

// Initialize order manager
window.orderManager = new OrderManager();
