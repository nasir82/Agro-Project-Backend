# 🌾 Smart Agro Connect

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v4.18+-blue.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-v7+-brightgreen.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)

**Smart Agro Connect** is a comprehensive digital marketplace platform that revolutionizes agricultural commerce by connecting farmers, agents, and retailers across Bangladesh. The platform facilitates bulk agricultural trading with integrated logistics, quality assurance, and secure payment systems.

## 🎯 Project Vision

Creating a unified agricultural ecosystem that empowers farmers to reach broader markets while providing retailers with reliable access to quality agricultural products through a network of verified agents and efficient supply chain management.

## ⭐ Key Features

### 🔐 **Multi-Role Authentication System**

- **Farmers/Sellers**: Product listing, inventory management, order fulfillment
- **Agents**: Regional verification, warehouse management, logistics coordination
- **Retailers/Buyers**: Product discovery, bulk ordering, payment processing
- **Administrators**: Platform oversight, user management, system analytics

### 🛒 **Advanced E-Commerce Engine**

- Real-time inventory tracking and management
- Intelligent cart system with automatic price calculations
- Multi-stage order processing with status tracking
- Integrated payment processing via Stripe
- Comprehensive review and rating system

### 🌍 **Regional Distribution Network**

- Geographic product filtering by divisions and districts
- Agent-managed regional warehouses
- Automated logistics routing and tracking
- Location-based delivery optimization

### 📱 **Application Management System**

- Role-based application workflows
- Automated approval processes
- Document verification and compliance
- Membership fee processing

## 🏗️ Technical Architecture

### **Backend Stack**

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with HTTP-only cookies
- **Payment Processing**: Stripe Integration
- **File Handling**: Multer middleware
- **Security**: bcrypt encryption, CORS protection

### **Core Models**

```
├── User Management (User, Admin, Seller, Agent)
├── Product Catalog (Product, Review)
├── Commerce Engine (Cart, Order, Payment)
├── Regional System (RegionData, AgentReviewHistory)
└── Application Workflow (Application)
```

### **API Architecture**

```
├── /users          → Authentication & User Management
├── /admin          → Administrative Controls
├── /agents         → Agent Operations & Verification
├── /products       → Product Catalog & Management
├── /api/orders     → Order Processing & Tracking
├── /api/cart       → Shopping Cart Operations
├── /reviews        → Rating & Review System
├── /regions        → Geographic Data & Filtering
├── /applications   → Role Application Workflows
└── /payment        → Stripe Payment Integration
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account
- Stripe account for payments

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/smart-agro-connect-server.git
   cd smart-agro-connect-server
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:

   ```env
   # Database Configuration
   DB_CLUSTER=your-mongodb-cluster-name
   DB_USERNAME=your-mongodb-username
   DB_PASSWORD=your-mongodb-password
   DB_NAME=smart-agro-connect

   # Authentication
   JWT_SECRET=your-super-secure-jwt-secret
   JWT_EXPIRE=30d

   # Payment Processing
   STRIPE_SECRET_KEY=your-stripe-secret-key

   # Server Configuration
   PORT=5000
   NODE_ENV=development
   ```

4. **Start the server**

   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

The server will be running at `http://localhost:5000`

## 📊 Business Logic

### **Order Workflow**

1. **Product Discovery** → Regional filtering and search
2. **Cart Management** → Bulk quantity selection with price calculation
3. **Order Placement** → Minimum payment (2x delivery charge) to prevent spam
4. **Multi-Stage Fulfillment**:
   - `pending` → Seller confirmation
   - `packaging` → Seller preparation
   - `moving_to_agent` → Transit to seller's agent
   - `on_the_way` → Inter-regional transport
   - `reached_your_region` → Buyer's regional agent
   - `delivered` → Successful completion

### **Agent Network**

- **Regional Verification**: Agents verify sellers and products in their regions
- **Warehouse Management**: Physical product handling and storage
- **Quality Assurance**: Product review and approval processes
- **Logistics Coordination**: Inter-regional delivery management

### **Revenue Model**

- Agent membership fees
- Transaction-based commissions
- Delivery service charges
- Premium seller subscriptions

## 🔧 Configuration

### **CORS Configuration**

The server supports multiple frontend deployments:

- Firebase hosting
- Local development
- Vercel deployment

### **Security Features**

- JWT tokens stored in HTTP-only cookies
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization

## 📁 Project Structure

```
smart-agro-connect-server/
├── config/
│   └── db.js                 # MongoDB connection
├── controllers/              # Business logic controllers
├── middleware/              # Authentication & error handling
├── models/                  # Database schemas
├── routes/                  # API route definitions
├── data/                    # Static data (regions, etc.)
├── docs/                    # API documentation
├── index.js                 # Application entry point
└── package.json             # Dependencies & scripts
```

## 🌐 Deployment

The application is configured for seamless deployment on:

- **Vercel** (Primary hosting)
- **MongoDB Atlas** (Database)
- **Stripe** (Payment processing)

Deployment configuration is handled via `vercel.json` with proper serverless function settings.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🎯 Future Roadmap

- [ ] Real-time chat system for buyer-seller communication
- [ ] AI-powered crop price prediction
- [ ] Mobile application development
- [ ] Blockchain integration for supply chain transparency
- [ ] IoT integration for smart farming data

---

**Smart Agro Connect** - _Bridging the gap between farm and market_ 🌱➡️🏪
