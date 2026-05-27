const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Configurar almacenamiento de archivos
const upload = multer({ 
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF'));
    }
  }
});

// Inicializar Base de Datos SQLite
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err.message);
  } else {
    console.log('Conectado a SQLite');
    initializeTables();
  }
});

// Crear tablas si no existen
function initializeTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS Orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      order_date TEXT,
      material TEXT,
      description TEXT,
      quantity_total INTEGER,
      po_number TEXT,
      pdf_filename TEXT,
      pdf_content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS Invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sales_order TEXT NOT NULL,
      date_shipped TEXT,
      customer_po TEXT,
      product_number TEXT,
      product_description TEXT,
      quantity_shipped INTEGER,
      quantity_ordered INTEGER,
      extension REAL,
      pdf_filename TEXT,
      pdf_content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sales_order) REFERENCES Orders(order_number)
    )
  `);
}

// Función para extraer texto del PDF
async function extractTextFromPDF(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    throw new Error('Error al parsear PDF: ' + error.message);
  }
}

// Función para extraer datos de órdenes del texto
function extractOrderData(text) {
  const lines = text.split('\n').filter(line => line.trim());
  const data = {};

  // Buscar patrones de datos
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Buscar Order #
    if (line.match(/order\s*#|order\s*number/i)) {
      const match = line.match(/(\d+)/);
      if (match) data.order_number = match[1];
    }

    // Buscar Order Date
    if (line.match(/order\s*date|date\s*of\s*order/i)) {
      const match = line.match(/(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})/);
      if (match) data.order_date = match[1];
    }

    // Buscar Material
    if (line.match(/material|item/i)) {
      data.material = lines[i + 1]?.trim() || 'N/A';
    }

    // Buscar Description
    if (line.match(/description|desc/i)) {
      data.description = lines[i + 1]?.trim() || 'N/A';
    }

    // Buscar Quantity Total
    if (line.match(/quantity\s*total|qty\s*total|total\s*qty|quantity/i)) {
      const match = line.match(/(\d+)/);
      if (match) data.quantity_total = parseInt(match[1]);
    }

    // Buscar PO #
    if (line.match(/po\s*#|po\s*number|purchase\s*order/i)) {
      const match = line.match(/(\w+-?\w+)/);
      if (match) data.po_number = match[1];
    }
  }

  return data;
}

// Función para extraer datos de facturas del texto
function extractInvoiceData(text) {
  const lines = text.split('\n').filter(line => line.trim());
  const data = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Buscar Sales Order
    if (line.match(/sales\s*order|so\s*#|sales\s*order\s*#/i)) {
      const match = line.match(/(\d+)/);
      if (match) data.sales_order = match[1];
    }

    // Buscar Date Shipped
    if (line.match(/date\s*shipped|ship\s*date|shipped/i)) {
      const match = line.match(/(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})/);
      if (match) data.date_shipped = match[1];
    }

    // Buscar Customer PO
    if (line.match(/customer\s*po|customer\s*#|po\s*customer/i)) {
      const match = line.match(/(\w+-?\w+)/);
      if (match) data.customer_po = match[1];
    }

    // Buscar Product Number
    if (line.match(/product\s*number|producto\s*number|item\s*#|sku/i)) {
      const match = line.match(/(\w+-?\w+)/);
      if (match) data.product_number = match[1];
    }

    // Buscar Product Description
    if (line.match(/product\s*description|description/i)) {
      data.product_description = lines[i + 1]?.trim() || 'N/A';
    }

    // Buscar Quantity Shipped
    if (line.match(/quantity\s*shipped|qty\s*shipped|shipped/i)) {
      const match = line.match(/(\d+)/);
      if (match) data.quantity_shipped = parseInt(match[1]);
    }

    // Buscar Quantity Order
    if (line.match(/quantity\s*order|qty\s*order|ordered/i)) {
      const match = line.match(/(\d+)/);
      if (match) data.quantity_ordered = parseInt(match[1]);
    }

    // Buscar Extension
    if (line.match(/extension|total|amount/i)) {
      const match = line.match(/(\d+\.\d{2})/);
      if (match) data.extension = parseFloat(match[1]);
    }
  }

  return data;
}

// RUTAS

// 1. Upload Order
app.post('/api/upload-order', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    // Extraer texto del PDF
    const pdfText = await extractTextFromPDF(req.file.path);
    
    // Extraer datos específicos
    const orderData = extractOrderData(pdfText);

    if (!orderData.order_number) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        error: 'No se pudo extraer Order # del PDF. Asegúrate de que el PDF contiene esta información.' 
      });
    }

    // Guardar en base de datos
    db.run(
      `INSERT INTO Orders (order_number, order_date, material, description, quantity_total, po_number, pdf_filename, pdf_content)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderData.order_number,
        orderData.order_date || null,
        orderData.material || null,
        orderData.description || null,
        orderData.quantity_total || null,
        orderData.po_number || null,
        req.file.filename,
        pdfText
      ],
      function(err) {
        if (err) {
          fs.unlinkSync(req.file.path);
          return res.status(400).json({ error: 'Error: ' + err.message });
        }

        res.json({ 
          success: true, 
          message: `Orden #${orderData.order_number} cargada exitosamente`,
          data: orderData
        });
      }
    );

  } catch (error) {
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Error al procesar PDF: ' + error.message });
  }
});

// 2. Upload Invoice
app.post('/api/upload-invoice', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    // Extraer texto del PDF
    const pdfText = await extractTextFromPDF(req.file.path);
    
    // Extraer datos específicos
    const invoiceData = extractInvoiceData(pdfText);

    if (!invoiceData.sales_order) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        error: 'No se pudo extraer Sales Order del PDF. Asegúrate de que el PDF contiene esta información.' 
      });
    }

    // Guardar en base de datos
    db.run(
      `INSERT INTO Invoices (sales_order, date_shipped, customer_po, product_number, product_description, quantity_shipped, quantity_ordered, extension, pdf_filename, pdf_content)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoiceData.sales_order,
        invoiceData.date_shipped || null,
        invoiceData.customer_po || null,
        invoiceData.product_number || null,
        invoiceData.product_description || null,
        invoiceData.quantity_shipped || null,
        invoiceData.quantity_ordered || null,
        invoiceData.extension || null,
        req.file.filename,
        pdfText
      ],
      function(err) {
        if (err) {
          fs.unlinkSync(req.file.path);
          return res.status(400).json({ error: 'Error: ' + err.message });
        }

        res.json({ 
          success: true, 
          message: `Factura para SO#${invoiceData.sales_order} cargada exitosamente`,
          data: invoiceData
        });
      }
    );

  } catch (error) {
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Error al procesar PDF: ' + error.message });
  }
});

// 3. Get All Orders
app.get('/api/orders', (req, res) => {
  db.all('SELECT * FROM Orders ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// 4. Get All Invoices
app.get('/api/invoices', (req, res) => {
  db.all('SELECT * FROM Invoices ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// 5. Analyze Order
app.get('/api/analyze-order/:orderNumber', (req, res) => {
  const orderNumber = req.params.orderNumber;

  db.get('SELECT * FROM Orders WHERE order_number = ?', [orderNumber], (err, order) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    db.all('SELECT * FROM Invoices WHERE sales_order = ?', [orderNumber], (err, invoices) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const analysis = {
        order: order,
        invoices: invoices,
        status: invoices.length > 0 ? 'Invoice Retrieved' : 'Invoice has not been retrieved or is missing',
        totalInvoiced: invoices.reduce((sum, inv) => sum + (inv.extension || 0), 0),
        totalOrdered: order.quantity_total,
        invoicedQuantity: invoices.reduce((sum, inv) => sum + (inv.quantity_shipped || 0), 0)
      };

      res.json(analysis);
    });
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log('Esperando archivos PDF...');
});

module.exports = app;
