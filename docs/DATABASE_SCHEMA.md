# Database Schema

## customers

| Column | Type | Notes |
|---|---|---|
| id | integer | Primary key |
| store_name | string | Shop or customer name |
| phone | string | Contact number |
| address | text | Optional address |
| notes | text | Payment habits, follow-up notes |
| created_at | datetime | Auto generated |
| updated_at | datetime | Auto updated |

## credit_records

| Column | Type | Notes |
|---|---|---|
| id | integer | Primary key |
| customer_id | integer | Foreign key to customers |
| product_description | string | Product, invoice, or order note |
| amount_due | float | Total credit amount |
| amount_paid | float | Paid amount |
| due_date | date | Payment due date |
| status | string | pending, partial, paid, overdue |
| reminder_count | integer | WhatsApp reminders sent |
| created_at | datetime | Auto generated |
| updated_at | datetime | Auto updated |

## credit_payments

| Column | Type | Notes |
|---|---|---|
| id | integer | Primary key |
| credit_record_id | integer | Foreign key to credit_records |
| amount | float | Payment amount |
| payment_date | date | Actual collection date |
| payment_mode | string | cash, upi, bank, cheque, other |
| notes | text | Optional receipt or collection note |
| created_at | datetime | Auto generated |
| updated_at | datetime | Auto updated |

## products

| Column | Type | Notes |
|---|---|---|
| id | integer | Primary key |
| name | string | Product name |
| category | string | Product category |
| current_stock | integer | Available stock |
| minimum_stock | integer | Alert threshold |
| purchase_price | float | Cost price |
| selling_price | float | Sale price |
| supplier | string | Optional supplier |
| last_sold_date | date | Used for dead stock detection |
| created_at | datetime | Auto generated |
| updated_at | datetime | Auto updated |

## sale_records

| Column | Type | Notes |
|---|---|---|
| id | integer | Primary key |
| product_id | integer | Optional foreign key to products |
| customer_id | integer | Optional foreign key to customers |
| product_name | string | Product snapshot |
| quantity | integer | Quantity sold |
| unit_price | float | Unit sale price |
| total_amount | float | Sale total |
| sale_date | date | Sale date |
| created_at | datetime | Auto generated |
| updated_at | datetime | Auto updated |
