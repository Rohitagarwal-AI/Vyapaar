# Backend API Endpoints

Base URL:

```text
http://localhost:8000/api
```

## Dashboard

- `GET /dashboard/summary` - returns total pending credit, overdue customer count, low stock count, today's sales, suggested actions, overdue records, and low-stock items.

## Automation

- `GET /automation/plan` - returns priority follow-up queue, reorder queue, slow-stock actions, daily playbook, automation score, and smart rules.

## Customers

- `GET /customers?search=term` - list and search customers.
- `POST /customers` - create customer.
- `GET /customers/{customer_id}` - get customer profile.
- `PUT /customers/{customer_id}` - update customer.
- `DELETE /customers/{customer_id}` - delete customer.

## Credit Tracker

- `GET /credits` - list credit records.
- `GET /credits?status=overdue` - filter credit records by effective status.
- `GET /credits/overdue` - list overdue credit records.
- `POST /credits` - create credit record.
- `PUT /credits/{record_id}` - update credit record.
- `PATCH /credits/{record_id}/payment` - update paid amount.
- `POST /credits/{record_id}/payments` - record a dated payment transaction and update outstanding balance.
- `POST /credits/{record_id}/reminder-sent` - increment reminder count.
- `DELETE /credits/{record_id}` - delete credit record.

## Inventory

- `GET /inventory/products?search=term` - list and search products.
- `POST /inventory/products` - create product.
- `PUT /inventory/products/{product_id}` - update product.
- `DELETE /inventory/products/{product_id}` - delete product.
- `GET /inventory/low-stock` - products at or below minimum stock.
- `GET /inventory/dead-stock?days=60` - products not sold for the threshold.

## Sales

- `GET /sales` - list sales.
- `POST /sales` - create sale and decrement stock when product ID is provided.

## AI

- `POST /ai/reminder` - generate WhatsApp payment reminder.
- `POST /ai/risk` - analyze risk from manual input.
- `GET /ai/risk/customer/{customer_id}` - analyze risk from customer credit history.
- `POST /ai/business-assistant` - answer business questions from shop data.

## Reports

- `GET /reports/daily`
- `GET /reports/monthly`
- `GET /reports/pending-credit`
- `GET /reports/inventory`
