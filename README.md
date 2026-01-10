# C2C Camera Platform 📷

## Overview 📝

C2C Camera Platform is a full-stack consumer-to-consumer web application that enables users to buy and sell camera equipment directly with each other. Users can create listings, manage transactions, and communicate in real time through an integrated chat system. A separate admin panel is provided to monitor platform activity, manage content, and track revenue.

The project focuses on security, scalability, and clean architecture, following modern best practices for web application development.

---

## Tech Stack 🛠️

### Frontend

* Next.js (App Router)
* TypeScript
* Server-side rendering and client-side data fetching

### Backend

* NestJS
* RESTful APIs
* WebSocket for real-time communication
* JWT-based authentication and authorization

### Database

* PostgreSQL or MySQL
* TypeORM for ORM and data access

---

## Main Features ✨

### User Features

* User registration, login, and logout
* Profile management
* Create, update, and delete camera listings
* Browse, search, and view camera products
* Purchase camera equipment from other users
* View order and transaction history
* Real-time one-to-one chat between buyers and sellers

### Admin Features

* Separate admin interface
* View daily and monthly revenue
* Track number of listings created per day
* Manage users (activate, deactivate, ban)
* Moderate and manage camera listings
* View transaction statistics and system reports

---

## Security Features 🔐

* Password hashing using bcrypt
* JWT authentication with access and refresh tokens
* Role-based access control (RBAC)
* Route protection using guards
* Input validation using class-validator
* SQL Injection prevention via TypeORM
* XSS and CSRF protection
* Secure HTTP headers
* Rate limiting for sensitive endpoints
* Environment variable-based configuration
* No sensitive data stored on the client

---

## Real-time Chat System 💬

* WebSocket-based private chat between buyers and sellers
* JWT authentication for WebSocket connections
* Persistent chat messages stored in the database
* Access control to prevent unauthorized users from joining chat rooms

---

## System Architecture 🏗️

The frontend is built with Next.js and communicates with the backend through REST APIs and WebSocket connections. The backend is implemented using NestJS with a modular architecture that separates controllers, services, and modules. TypeORM is used to manage database entities and relationships.

---

## Database Design 🗄️

The system uses a relational database with the following main entities:

* User
* Camera
* Order
* Transaction
* ChatRoom
* ChatMessage
* Admin

Entity relationships, indexing, and soft deletion are applied to ensure performance and data integrity.

---

## Installation and Setup ⚙️

1. Clone the repository
2. Install dependencies for both frontend and backend
3. Configure environment variables
4. Run database migrations
5. Start backend and frontend servers

Detailed setup instructions may vary depending on the deployment environment.

---

## Environment Variables 🌱

The following environment variables are required:

* DATABASE_URL
* JWT_SECRET
* JWT_REFRESH_SECRET
* PORT

Do not commit environment variable values to the repository.

---

## Admin Account 🛡️

Admin accounts are created through database seeding or manual setup. Admin access is restricted to authorized users only.

---

## Project Status 📌

This project is developed for academic and learning purposes and can be extended for real-world applications.

---

## Lic

This project is licensed under the MIT License.
