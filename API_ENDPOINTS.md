# 📡 API ENDPOINTS - C2C Platform

## 🔐 Authentication
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

## 📦 Products
```
GET    /api/products                    # All products
GET    /api/products/:id                # Product detail
GET    /api/products/seller/:sellerId   # Seller's products
POST   /api/products                    # Create product (seller)
PUT    /api/products/:id                # Update product
DELETE /api/products/:id                # Delete product
PATCH  /api/products/:id/status         # Update status (admin)
```

## 🛒 Orders
```
GET    /api/orders                      # All orders (admin)
GET    /api/orders/my                   # My orders (buyer/seller)
GET    /api/orders/:id                  # Order detail
POST   /api/orders                      # Create order
PATCH  /api/orders/:id/status           # Update status
PATCH  /api/orders/:id/confirm          # Confirm delivery
```

## 💳 Payments
```
POST   /api/payments                    # Create payment
POST   /api/payments/callback           # Payment callback
GET    /api/payments/:id                # Payment detail
POST   /api/payments/:id/refund         # Refund payment
```

## 💰 Transactions
```
GET    /api/transactions                # All transactions
GET    /api/transactions/my             # My transactions
GET    /api/transactions/:id            # Transaction detail
POST   /api/transactions/:id/payout     # Request payout
```

## ⭐ Reviews
```
GET    /api/reviews                     # All reviews
GET    /api/reviews/product/:productId  # Product reviews
POST   /api/reviews                     # Create review
PUT    /api/reviews/:id                 # Update review
DELETE /api/reviews/:id                 # Delete review
```

## 👤 Users
```
GET    /api/users                       # All users (admin)
GET    /api/users/:id                   # User detail
PUT    /api/users/:id                   # Update profile
GET    /api/users/:id/products          # User's products
GET    /api/users/:id/reputation        # Reputation score
```

## 🔧 Admin
```
GET    /api/admin/dashboard             # Dashboard stats
GET    /api/admin/pending-products      # Products pending approval
PATCH  /api/admin/products/:id/approve  # Approve product
PATCH  /api/admin/products/:id/reject   # Reject product
GET    /api/admin/analytics             # Platform analytics
POST   /api/admin/config                # Update platform config
```

## 💎 Subscriptions
```
GET    /api/subscriptions               # My subscriptions
POST   /api/subscriptions               # Subscribe
GET    /api/subscriptions/packages      # Available packages
```

## 📢 Notifications
```
GET    /api/notifications               # My notifications
PATCH  /api/notifications/:id/read      # Mark as read
DELETE /api/notifications/:id           # Delete notification
```

## 🚨 Disputes
```
GET    /api/disputes                    # My disputes
POST   /api/disputes                    # Create dispute
GET    /api/disputes/:id                # Dispute detail
POST   /api/disputes/:id/resolve        # Resolve dispute (admin)
```

## 🔍 Search
```
GET    /api/search                      # Search products
GET    /api/search/suggestions          # Search suggestions
```

## 📊 Analytics
```
GET    /api/analytics/daily             # Daily analytics
GET    /api/analytics/monthly           # Monthly analytics
GET    /api/analytics/yearly            # Yearly analytics
```
