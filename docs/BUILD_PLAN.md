# Step-by-Step Build Plan

## Phase 1 - Core Retail System

1. Create FastAPI backend project structure.
2. Add SQLAlchemy models for customers, credit records, products, and sales.
3. Add SQLite database connection and seed data.
4. Build CRUD APIs for customers, credit records, inventory, and sales.
5. Build dashboard summary API.
6. Build automation plan API for follow-ups, reorder queue, and slow stock.
7. Create React Vite frontend.
8. Build dashboard, automation center, customer management, credit tracker, and inventory pages.

## Phase 2 - AI Reminder and Risk Analyzer

1. Add AI provider configuration for local, OpenAI, and Gemini modes.
2. Add prompt template for WhatsApp reminders.
3. Add tone options: polite, friendly, professional, strong.
4. Add language options: English, Hindi, Hinglish.
5. Add copy-to-clipboard button.
6. Add customer risk analyzer using amount due, overdue days, reminder count, and notes.

## Phase 3 - AI Business Assistant and Reports

1. Build business context from customers, credit records, inventory, and sales.
2. Add AI business assistant endpoint.
3. Add daily summary report.
4. Add monthly summary report.
5. Add pending credit report.
6. Add inventory report with AI-style recommendations.

## Phase 4 - Polish and Portfolio Readiness

1. Improve responsive UI for desktop and mobile.
2. Add README and documentation.
3. Add `.env.example` and setup instructions.
4. Add resume bullet points.
5. Capture screenshots for GitHub after running the project.
6. Prepare deployment by replacing SQLite with PostgreSQL and adding authentication.
