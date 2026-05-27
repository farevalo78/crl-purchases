const API_BASE = 'http://localhost:3000/api';

// Show/Hide Sections
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
    });
    document.getElementById(sectionId).classList.remove('hidden');
}

// Drag and Drop
function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('drag-over');
}

function handleDragLeave(event) {
    event.currentTarget.classList.remove('drag-over');
}

function handleDropOrder(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        document.getElementById('orderFile').files = files;
        uploadOrder({ target: { files: files } });
    }
}

function handleDropInvoice(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        document.getElementById('invoiceFile').files = files;
        uploadInvoice({ target: { files: files } });
    }
}

// Upload Order
async function uploadOrder(event) {
    const files = event.target.files || event.dataTransfer.files;
    const file = files[0];
    if (!file) return;

    // Validar que sea PDF
    if (file.type !== 'application/pdf') {
        alert('❌ Por favor carga un archivo PDF');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    const statusDiv = document.getElementById('uploadStatus');
    const statusContent = statusDiv.querySelector('.status-content');
    statusDiv.classList.remove('hidden');
    statusContent.innerHTML = '<p class="loading">⏳ Procesando archivo PDF...</p>';

    try {
        const response = await fetch(`${API_BASE}/upload-order`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            statusContent.innerHTML = `
                <div class="success">
                    <h3>✅ ¡Exitoso!</h3>
                    <p>${data.message}</p>
                    <div class="extracted-data">
                        <h4>Datos Extraídos:</h4>
                        <p><strong>Order #:</strong> ${data.data.order_number || 'No encontrado'}</p>
                        <p><strong>Order Date:</strong> ${data.data.order_date || 'No encontrado'}</p>
                        <p><strong>Material:</strong> ${data.data.material || 'No encontrado'}</p>
                        <p><strong>Description:</strong> ${data.data.description || 'No encontrado'}</p>
                        <p><strong>Quantity Total:</strong> ${data.data.quantity_total || 'No encontrado'}</p>
                        <p><strong>PO#:</strong> ${data.data.po_number || 'No encontrado'}</p>
                    </div>
                </div>
            `;
        } else {
            statusContent.innerHTML = `<div class="error"><h3>❌ Error</h3><p>${data.error}</p></div>`;
        }
    } catch (error) {
        statusContent.innerHTML = `<div class="error"><h3>❌ Error</h3><p>${error.message}</p></div>`;
    }
}

// Upload Invoice
async function uploadInvoice(event) {
    const files = event.target.files || event.dataTransfer.files;
    const file = files[0];
    if (!file) return;

    // Validar que sea PDF
    if (file.type !== 'application/pdf') {
        alert('❌ Por favor carga un archivo PDF');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    const statusDiv = document.getElementById('invoiceStatus');
    const statusContent = statusDiv.querySelector('.status-content');
    statusDiv.classList.remove('hidden');
    statusContent.innerHTML = '<p class="loading">⏳ Procesando archivo PDF...</p>';

    try {
        const response = await fetch(`${API_BASE}/upload-invoice`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            statusContent.innerHTML = `
                <div class="success">
                    <h3>✅ ¡Exitoso!</h3>
                    <p>${data.message}</p>
                    <div class="extracted-data">
                        <h4>Datos Extraídos:</h4>
                        <p><strong>Sales Order:</strong> ${data.data.sales_order || 'No encontrado'}</p>
                        <p><strong>Date Shipped:</strong> ${data.data.date_shipped || 'No encontrado'}</p>
                        <p><strong>Customer PO:</strong> ${data.data.customer_po || 'No encontrado'}</p>
                        <p><strong>Product Number:</strong> ${data.data.product_number || 'No encontrado'}</p>
                        <p><strong>Product Description:</strong> ${data.data.product_description || 'No encontrado'}</p>
                        <p><strong>Quantity Shipped:</strong> ${data.data.quantity_shipped || 'No encontrado'}</p>
                        <p><strong>Quantity Order:</strong> ${data.data.quantity_ordered || 'No encontrado'}</p>
                        <p><strong>Extension:</strong> $${parseFloat(data.data.extension || 0).toFixed(2)}</p>
                    </div>
                </div>
            `;
        } else {
            statusContent.innerHTML = `<div class="error"><h3>❌ Error</h3><p>${data.error}</p></div>`;
        }
    } catch (error) {
        statusContent.innerHTML = `<div class="error"><h3>❌ Error</h3><p>${error.message}</p></div>`;
    }
}

// Print Orders
async function showPrintOrders() {
    showSection('printOrders');
    try {
        const response = await fetch(`${API_BASE}/orders`);
        const orders = await response.json();

        if (orders.length === 0) {
            document.getElementById('ordersTable').innerHTML = '<p class="no-data">No hay órdenes cargadas</p>';
            return;
        }

        let html = '<table class="data-table"><thead><tr>';
        const headers = ['Order #', 'Order Date', 'Material', 'Description', 'Quantity Total', 'PO#', 'Cargado'];
        headers.forEach(h => html += `<th>${h}</th>`);
        html += '</tr></thead><tbody>';

        orders.forEach(order => {
            html += `
                <tr>
                    <td><strong>${order.order_number}</strong></td>
                    <td>${order.order_date || 'N/A'}</td>
                    <td>${order.material || 'N/A'}</td>
                    <td>${order.description || 'N/A'}</td>
                    <td>${order.quantity_total || 'N/A'}</td>
                    <td>${order.po_number || 'N/A'}</td>
                    <td>${new Date(order.created_at).toLocaleDateString()}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        document.getElementById('ordersTable').innerHTML = html;
    } catch (error) {
        document.getElementById('ordersTable').innerHTML = `<p class="error">Error: ${error.message}</p>`;
    }
}

// Print Invoices
async function showPrintInvoices() {
    showSection('printInvoices');
    try {
        const response = await fetch(`${API_BASE}/invoices`);
        const invoices = await response.json();

        if (invoices.length === 0) {
            document.getElementById('invoicesTable').innerHTML = '<p class="no-data">No hay facturas cargadas</p>';
            return;
        }

        let html = '<table class="data-table"><thead><tr>';
        const headers = ['Sales Order', 'Date Shipped', 'Customer PO', 'Product #', 'Description', 'Qty Shipped', 'Qty Ordered', 'Extension'];
        headers.forEach(h => html += `<th>${h}</th>`);
        html += '</tr></thead><tbody>';

        invoices.forEach(inv => {
            html += `
                <tr>
                    <td><strong>${inv.sales_order}</strong></td>
                    <td>${inv.date_shipped || 'N/A'}</td>
                    <td>${inv.customer_po || 'N/A'}</td>
                    <td>${inv.product_number || 'N/A'}</td>
                    <td>${inv.product_description || 'N/A'}</td>
                    <td>${inv.quantity_shipped || 'N/A'}</td>
                    <td>${inv.quantity_ordered || 'N/A'}</td>
                    <td>$${parseFloat(inv.extension || 0).toFixed(2)}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        document.getElementById('invoicesTable').innerHTML = html;
    } catch (error) {
        document.getElementById('invoicesTable').innerHTML = `<p class="error">Error: ${error.message}</p>`;
    }
}

// Analyze Order
async function showAnalyzeOrders() {
    showSection('analyzeOrders');
    document.getElementById('analysisResult').classList.add('hidden');
}

async function analyzeOrder() {
    const orderNumber = document.getElementById('orderSearch').value.trim();
    if (!orderNumber) {
        alert('Por favor ingresa un Order #');
        return;
    }

    const resultDiv = document.getElementById('analysisResult');
    resultDiv.innerHTML = '<p class="loading">⏳ Analizando...</p>';
    resultDiv.classList.remove('hidden');

    try {
        const response = await fetch(`${API_BASE}/analyze-order/${orderNumber}`);
        
        if (!response.ok) {
            resultDiv.innerHTML = '<div class="error"><h3>❌ Orden no encontrada</h3><p>No existe una orden con el número: ' + orderNumber + '</p></div>';
            return;
        }

        const analysis = await response.json();

        let html = `
            <div class="analysis-card">
                <h3>📋 Reporte de Análisis de Orden</h3>
                
                <div class="analysis-section">
                    <h4>📦 Detalles de la Orden</h4>
                    <p><strong>Order #:</strong> ${analysis.order.order_number}</p>
                    <p><strong>Order Date:</strong> ${analysis.order.order_date || 'N/A'}</p>
                    <p><strong>Material:</strong> ${analysis.order.material || 'N/A'}</p>
                    <p><strong>Description:</strong> ${analysis.order.description || 'N/A'}</p>
                    <p><strong>Quantity Ordered:</strong> ${analysis.order.quantity_total}</p>
                    <p><strong>PO #:</strong> ${analysis.order.po_number || 'N/A'}</p>
                </div>

                <div class="analysis-section status-${analysis.status === 'Invoice Retrieved' ? 'success' : 'error'}">
                    <h4>📄 Estado de Factura</h4>
                    <p class="status-message"><strong>${analysis.status}</strong></p>
                </div>
        `;

        if (analysis.invoices.length > 0) {
            html += `
                <div class="analysis-section">
                    <h4>✓ Facturas Encontradas (${analysis.invoices.length})</h4>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Date Shipped</th>
                                <th>Qty Shipped</th>
                                <th>Extension</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            analysis.invoices.forEach(inv => {
                html += `
                    <tr>
                        <td>${inv.date_shipped || 'N/A'}</td>
                        <td>${inv.quantity_shipped}</td>
                        <td>$${parseFloat(inv.extension || 0).toFixed(2)}</td>
                    </tr>
                `;
            });

            html += `
                        </tbody>
                    </table>
                    
                    <div class="summary">
                        <p><strong>Total Quantity Shipped:</strong> ${analysis.invoicedQuantity}</p>
                        <p><strong>Total Extension Amount:</strong> $${analysis.totalInvoiced.toFixed(2)}</p>
                        <p><strong>Remaining Quantity:</strong> ${analysis.totalOrdered - analysis.invoicedQuantity}</p>
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="analysis-section error-message">
                    <p><strong>⚠️ No invoices found for this order</strong></p>
                </div>
            `;
        }

        html += `
                <div class="action-buttons">
                    <button class="btn btn-download" onclick="downloadAnalysisPDF('${analysis.order.order_number}')">📥 Descargar Reporte PDF</button>
                </div>
            </div>
        `;

        resultDiv.innerHTML = html;
    } catch (error) {
        resultDiv.innerHTML = `<div class="error"><h3>❌ Error</h3><p>${error.message}</p></div>`;
    }
}

// Download PDF
async function downloadPDF(type) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    try {
        const element = type === 'orders' ? document.getElementById('ordersTable') : document.getElementById('invoicesTable');
        const canvas = await html2canvas(element, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        
        const imgWidth = 190;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        doc.addPage('a4', 'p');
        doc.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        
        const filename = type === 'orders' ? 'Orders_Report.pdf' : 'Invoices_Report.pdf';
        doc.save(filename);
    } catch (error) {
        alert('Error generando PDF: ' + error.message);
    }
}

async function downloadAnalysisPDF(orderNumber) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    try {
        const element = document.getElementById('analysisResult');
        const canvas = await html2canvas(element, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        
        const imgWidth = 190;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        doc.addPage('a4', 'p');
        doc.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        
        doc.save(`Analysis_Order_${orderNumber}.pdf`);
    } catch (error) {
        alert('Error generando PDF: ' + error.message);
    }
}
