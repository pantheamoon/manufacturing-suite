// Email Invoice System for Netlify Functions
// Using Netlify's built-in email service or external SMTP
const { Client } = require('pg');

// Using fetch for external email API (SendGrid, Mailgun, etc.)
async function sendEmail(to, subject, html) {
    // Using SendGrid API (you'll need to set SENDGRID_API_KEY in Netlify env vars)
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            personalizations: [{
                to: [{ email: to }]
            }],
            from: { email: process.env.FROM_EMAIL || 'hello@starseednatural.com' },
            subject: subject,
            content: [{ type: 'text/html', value: html }]
        })
    });
    
    return response.ok;
}

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers };
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const { action, invoiceId, emailData } = JSON.parse(event.body);

        switch (action) {
            case 'send_invoice':
                return await sendInvoiceEmail(client, invoiceId, headers);
            
            case 'create_and_send':
                return await createAndSendInvoice(client, emailData, headers);
            
            default:
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Invalid action' })
                };
        }

    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: error.message,
                stack: error.stack 
            })
        };
    } finally {
        await client.end();
    }
};

async function sendInvoiceEmail(client, invoiceId, headers) {
    // Get invoice data
    const invoiceResult = await client.query(`
        SELECT i.*, c.company_name, c.contact_email, c.contact_phone
        FROM invoices i
        JOIN clients c ON i.client_id = c.id
        WHERE i.id = $1
    `, [invoiceId]);

    if (invoiceResult.rows.length === 0) {
        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Invoice not found' })
        };
    }

    const invoice = invoiceResult.rows[0];

    // Generate HTML invoice
    const htmlInvoice = generateInvoiceHTML(invoice);

    // Send email
    await sendEmail(invoice.contact_email, `Invoice ${invoice.invoice_number} - Star Seed Natural`, htmlInvoice);

    // Update invoice status
    await client.query(`
        UPDATE invoices 
        SET sent_via_email = true, 
            email_sent_date = NOW(),
            status = 'Sent'
        WHERE id = $1
    `, [invoiceId]);

    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
            success: true, 
            message: 'Invoice sent successfully',
            invoiceNumber: invoice.invoice_number
        })
    };
}

async function createAndSendInvoice(client, emailData, headers) {
    const { clientId, orderData, items, sendEmail = true } = emailData;

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`;

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const vatAmount = subtotal * 0.20; // 20% VAT
    const total = subtotal + vatAmount;

    // Create invoice
    const invoiceData = {
        id: generateUUID(),
        invoice_number: invoiceNumber,
        client_id: clientId,
        invoice_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        subtotal: subtotal,
        vat_rate: 20,
        vat_amount: vatAmount,
        total_amount: total,
        currency: 'GBP',
        status: sendEmail ? 'Sent' : 'Draft',
        sent_via_email: sendEmail,
        email_sent_date: sendEmail ? new Date().toISOString() : null,
        notes: orderData.notes || '',
        tenant_id: 'luxebeauty_001',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    // Insert invoice
    const columns = Object.keys(invoiceData);
    const values = Object.values(invoiceData);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

    await client.query(`
        INSERT INTO invoices (${columns.join(', ')})
        VALUES (${placeholders})
    `, values);

    if (sendEmail) {
        // Get client data for email
        const clientResult = await client.query('SELECT * FROM clients WHERE id = $1', [clientId]);
        const clientData = clientResult.rows[0];

        const invoice = { ...invoiceData, ...clientData };
        const htmlInvoice = generateInvoiceHTML(invoice, items);

        await sendEmail(clientData.contact_email, `Invoice ${invoiceNumber} - Star Seed Natural`, htmlInvoice);
    }

    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
            success: true,
            invoiceId: invoiceData.id,
            invoiceNumber: invoiceNumber,
            total: total,
            sent: sendEmail
        })
    };
}

function generateInvoiceHTML(invoice, items = []) {
    const itemsHTML = items.map(item => `
        <tr>
            <td>${item.description || item.name}</td>
            <td>${item.quantity}</td>
            <td>£${item.price.toFixed(2)}</td>
            <td>£${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
    `).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { background: #8a9f69; color: white; padding: 20px; text-align: center; }
            .invoice-details { margin: 20px 0; }
            .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .table th { background-color: #f3e2b0; }
            .totals { float: right; margin: 20px 0; }
            .total-row { font-weight: bold; font-size: 1.2em; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>STAR SEED NATURAL</h1>
            <p>Manufacturing Invoice</p>
        </div>
        
        <div class="invoice-details">
            <h2>Invoice ${invoice.invoice_number}</h2>
            <p><strong>Date:</strong> ${new Date(invoice.invoice_date).toLocaleDateString()}</p>
            <p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
            
            <h3>Bill To:</h3>
            <p>${invoice.company_name || invoice.contact_name}<br>
            ${invoice.contact_email}<br>
            ${invoice.contact_phone || ''}</p>
        </div>

        ${items.length > 0 ? `
        <table class="table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHTML}
            </tbody>
        </table>
        ` : ''}

        <div class="totals">
            <table>
                <tr><td>Subtotal:</td><td>£${invoice.subtotal.toFixed(2)}</td></tr>
                <tr><td>VAT (${invoice.vat_rate}%):</td><td>£${invoice.vat_amount.toFixed(2)}</td></tr>
                <tr class="total-row"><td>Total:</td><td>£${invoice.total_amount.toFixed(2)}</td></tr>
            </table>
        </div>

        <div class="footer">
            <p>Thank you for your business!</p>
            <p>Payment Terms: Net 30 days</p>
        </div>
    </body>
    </html>`;
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
