# CRL Purchases

Purchase Order and Invoice Management System

## Descripción

CRL Purchases es una aplicación web para gestionar órdenes de compra y facturas. Permite:

- 📤 Cargar archivos PDF de órdenes de compra
- 📋 Cargar archivos PDF de facturas
- 📊 Ver y imprimir órdenes cargadas
- 📄 Ver e imprimir facturas cargadas
- 🔍 Analizar órdenes y compararlas con facturas
- 📥 Descargar reportes en PDF

## Características

✅ Carga de archivos PDF
✅ Extracción automática de datos
✅ Base de datos SQLite
✅ Generación de reportes PDF
✅ Interfaz responsive
✅ Búsqueda y análisis de órdenes

## Instalación

1. Clona este repositorio
2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Inicia el servidor:
   ```bash
   npm start
   ```

4. Abre en tu navegador:
   ```
   http://localhost:3000
   ```

## Uso

### Upload Order
- Carga un PDF que contenga: Order #, Order Date, Material, Description, Quantity Total, PO#
- La aplicación extraerá automáticamente los datos

### Upload Invoice
- Carga un PDF que contenga: Sales Order, Date Shipped, Customer PO, Product Number, Product Description, Quantity Shipped, Quantity Order, Extension
- La aplicación extraerá automáticamente los datos

### Check Orders
- **Print Orders**: Visualiza todas las órdenes cargadas
- **Print Invoices**: Visualiza todas las facturas cargadas
- **Analyze Orders**: Busca una orden y compárala con sus facturas correspondientes

## Estructura del Proyecto

```
crl-purchases/
├── public/
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── uploads/
├── server.js
├── package.json
├── database.db
└── README.md
```

## Dependencias

- express: Framework web
- multer: Carga de archivos
- pdf-parse: Extracción de texto PDF
- sqlite3: Base de datos
- jspdf: Generación de PDF
- html2canvas: Conversión de HTML a imagen
- cors: Control de acceso

## Autor

farevalo78

## Licencia

MIT
