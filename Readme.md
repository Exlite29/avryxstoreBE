Node.js Backend Template for Sari-Sari Store Management System
Project Overview
A secure and scalable backend for a Sari-Sari store inventory and sales management system with barcode scanning and image recognition capabilities.

Project Structure
text
sari-sari-backend/
├── src/
│ ├── config/ # Environment configurations
│ │ ├── database.js
│ │ ├── cloudinary.js # Image storage
│ │ ├── scanner.js # Barcode scanner config
│ │ └── security.js
│ ├── middleware/
│ │ ├── auth.js
│ │ ├── upload.js # Image upload handling
│ │ ├── scanner.js # Barcode/image processing
│ │ ┍── validation.js
│ │ └── rateLimiter.js
│ ├── routes/
│ │ ├── auth.routes.js
│ │ ├── products.routes.js
│ │ ├── inventory.routes.js
│ │ ├── sales.routes.js
│ │ ├── scanner.routes.js # Barcode/image scanning endpoint
│ │ └── reports.routes.js
│ ├── controllers/
│ │ ├── auth.controller.js
│ │ ├── product.controller.js
│ │ ├── inventory.controller.js
│ │ ├── sales.controller.js
│ │ ├── scanner.controller.js # Scanning logic
│ │ └── report.controller.js
│ ├── models/
│ │ ├── User.model.js
│ │ ├── Product.model.js
│ │ ├── Inventory.model.js
│ │ ├── Sales.model.js
│ │ ├── Barcode.model.js # Barcode mappings
│ │ └── Transaction.model.js
│ ├── services/
│ │ ├── auth.service.js
│ │ ├── product.service.js
│ │ ├── inventory.service.js
│ │ ├── scanner.service.js # Scanning service
│ │ ├── image.service.js # Image processing
│ │ ├── barcode.service.js # Barcode processing
│ │ ├── notification.service.js
│ │ └── report.service.js
│ ├── utils/
│ │ ├── scanners/
│ │ │ ├── barcodeScanner.js
│ │ │ ├── imageProcessor.js
│ │ │ └── ocrHelper.js # Optional OCR for price tags
│ │ ├── validators/
│ │ ├── helpers.js
│ │ ├── logger.js
│ │ └── apiResponse.js
│ ├── validations/
│ │ ├── auth.validation.js
│ │ ├── product.validation.js
│ │ ├── scanner.validation.js
│ │ └── sales.validation.js
│ ├── types/ # TypeScript definitions
│ ├── jobs/ # Background jobs
│ │ ├── inventorySync.js
│ │ └── reportGenerator.js
│ └── app.js
├── uploads/ # Temporary uploads
│ └── temp/
├── tests/
│ ├── unit/
│ ├── integration/
│ └── scanner.test.js # Scanner-specific tests
├── .env.example
├── docker-compose.yml
├── Dockerfile
└── README.md
Core Features Required

1. Barcode & Image Scanning System
   Barcode Scanning Endpoint: Accepts images containing barcodes (QR, UPC, EAN)

Direct Barcode Input: Accept barcode numbers directly

Image Recognition: Recognize products from photos (using pre-trained ML model or API)

Multiple Format Support: JPEG, PNG, WebP, HEIC

Batch Scanning: Process multiple items at once

Offline Mode: Basic barcode scanning without internet

Scanner Validation: Verify scanned products exist in inventory

2. Product Management
   Add products via barcode scanning

Add products via manual entry with photo upload

Bulk import from CSV/Excel

Product categorization (groceries, toiletries, snacks, etc.)

Expiry date tracking

Price management (wholesale/retail)

Stock level alerts

Supplier information

3. Inventory Management
   Real-time stock tracking

Low stock notifications

Inventory audit via scanning

Batch number tracking

Expiry date monitoring

Inventory valuation

Stock movement history

4. Sales & Point of Sale
   Quick sale via barcode scanning

Image-based product lookup

Sales transactions with receipt generation

Customer management (regulars)

Credit tracking (suki system)

Discount management

Sales reports

5. Security Features
   Store owner authentication

Employee role management (owner, manager, cashier)

Transaction logging for accountability

Receipt validation

Data encryption for sensitive information

IP-based access control for store network

Scanner-Specific Implementation
Scanner Service Endpoints:
javascript
POST /api/v1/scanner/barcode
POST /api/v1/scanner/image-recognition
POST /api/v1/scanner/bulk-scan
POST /api/v1/scanner/quick-sale
Scanner Payload Examples:
json
{
"scan_type": "barcode|image|both",
"image": "base64_encoded_image_or_form_data",
"barcode": "optional_barcode_number",
"store_id": "store_identifier",
"device_id": "scanner_device_id"
}
Image Processing Features:
Auto-rotate images for better scanning

Image compression for faster uploads

Multiple barcode detection in single image

Product image storage for future recognition

Thumbnail generation for product catalog

Technology Stack
Core:
Runtime: Node.js 18+

Framework: Express.js with TypeScript

Database: PostgreSQL (primary) + Redis (caching)

ORM: Prisma/TypeORM

Scanning & Image Processing:
Barcode Scanning: node-zxing or jsqr for client-side, quaggaJS integration

Image Processing: sharp for image manipulation

Cloud Storage: Cloudinary/AWS S3 for product images

Optional ML: TensorFlow.js for basic image recognition or integration with Google Vision API/Amazon Rekognition

Security:
Authentication: JWT with refresh tokens

Encryption: bcrypt for passwords, crypto for sensitive data

Rate Limiting: express-rate-limit

Security Headers: Helmet.js

Input Sanitization: express-validator

File Upload:
Middleware: multer + multer-s3 for direct uploads

Validation: File type, size, and virus scanning

Storage: Local temp + cloud backup

API Response Format for Scanner
json
{
"success": true,
"data": {
"scan_id": "unique_scan_id",
"products": [
{
"product_id": "prod_123",
"name": "Milo 300g",
"barcode": "4801234567890",
"price": 120.50,
"stock": 15,
"image_url": "https://...",
"match_confidence": 0.95,
"scan_method": "barcode|image_recognition"
}
],
"unrecognized_items": [
{
"image_url": "temp_storage_url",
"suggestions": []
}
]
},
"metadata": {
"scan_time": "2024-01-15T10:30:00Z",
"items_scanned": 5,
"items_recognized": 4
}
}
Database Schema Highlights
Products Table:
sql
CREATE TABLE products (
id UUID PRIMARY KEY,
barcode VARCHAR(50) UNIQUE,
name VARCHAR(255) NOT NULL,
description TEXT,
category VARCHAR(100),
unit_price DECIMAL(10,2),
wholesale_price DECIMAL(10,2),
stock_quantity INTEGER DEFAULT 0,
low_stock_threshold INTEGER DEFAULT 10,
image_urls TEXT[], -- Array of image URLs
barcode_image_url VARCHAR(500),
supplier_id UUID,
expiry_date DATE,
created_at TIMESTAMP,
updated_at TIMESTAMP
);

CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_category ON products(category);
Scans Table:
sql
CREATE TABLE product_scans (
id UUID PRIMARY KEY,
scan_type VARCHAR(20), -- 'barcode', 'image', 'manual'
input_data TEXT, -- barcode number or image data
product_id UUID REFERENCES products(id),
confidence_score DECIMAL(3,2), -- For image recognition
scanned_by UUID REFERENCES users(id),
store_id UUID REFERENCES stores(id),
device_id VARCHAR(100),
location JSONB, -- GPS coordinates if available
created_at TIMESTAMP
);
Setup & Deployment
Environment Variables:
env

# Scanner Configuration

BARCODE_SCANNER_API_KEY=your_api_key
IMAGE_RECOGNITION_PROVIDER=google|aws|custom
GOOGLE_VISION_API_KEY=your_google_key
AWS_REKOGNITION_ACCESS_KEY=your_aws_key

# Image Storage

CLOUDINARY_URL=cloudinary://key:secret@cloud_name
UPLOAD_MAX_SIZE=5242880 # 5MB
ALLOWED_IMAGE_TYPES=jpg,jpeg,png,webp

# Store Configuration

STORE_ID=store_001
STORE_NAME="My Sari-Sari Store"
Quick Start Commands:
bash

# Install dependencies

npm install

# Setup database

npm run db:migrate
npm run db:seed

# Start development server with hot reload

npm run dev

# Run scanner tests

npm test -- scanner.test.js

# Build for production

npm run build

# Start production server

npm start
Testing Scanner Features
Test Cases to Include:
Barcode Scanning Test: Validate different barcode formats

Image Upload Test: Test various image formats and sizes

Recognition Accuracy: Test product matching accuracy

Offline Mode: Test scanning without internet

Batch Processing: Test scanning multiple items

Error Handling: Test invalid/malformed inputs

Performance Test: Measure scanning response time

Security Considerations for Scanner
Image Upload Security:

Validate file types and sizes

Scan for malicious content

Use signed URLs for uploads

Implement upload rate limiting

Data Privacy:

Blur customer faces in stored images

Automatic deletion of temporary scan images

Encryption of scan history

Fraud Prevention:

Duplicate scan detection

Price manipulation alerts

Unusual scan pattern detection

Monitoring & Analytics
Scanner Metrics:

Scan success rate

Recognition accuracy by product category

Average processing time

Most scanned products

Business Insights:

Fast-moving consumer goods

Stock turnover rate

Peak scanning hours

Scanner usage patterns

Mobile Integration Features
Progressive Web App Support:

Camera access for scanning

Offline scanning capability

Push notifications for low stock

Cross-Platform Compatibility:

iOS Safari camera support

Android Chrome camera support

Responsive image capture

Backup & Recovery
Regular Backups:

Daily product database backups

Product images backup to cloud

Scan history archival

Disaster Recovery:

Manual entry fallback mode

Local cache of critical products

Export/import functionality
