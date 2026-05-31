/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client lazy-style to prevent immediate startup crash if key is undefined
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn('Warning: GEMINI_API_KEY is not defined in environment variables. Assistant capabilities will run in fallback dummy-response mode.');
    }
    aiClient = new GoogleGenAI({
      apiKey: key || 'MOCK_KEY',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Server-side AI Business Assistant Proxy
app.post('/api/chat', async (req, res) => {
  const { messages, businessStats, lowStockProducts, recentInvoices } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid message logs format.' });
  }

  const userKey = process.env.GEMINI_API_KEY;
  if (!userKey || userKey === 'MY_GEMINI_API_KEY') {
    // Return a helpful friendly simulated Hinglish guide in case API key is missing, so user doesn't hit a wall
    const lastUserMsg = messages[messages.length - 1]?.content || 'Hello';
    return res.json({
      content: `👋 **Namaste! Main aapka Vyapaar Buddy assistant hoon!**\n\nEk choti si bhashan: Aapka **Gemini API Key** abhi configure nahi hua hai. Aap ise badalne ke liye **Settings > Secrets** panel me jaakar original key daal sakte hain. \n\nTab tak ke liye, main seedha aapke query ka mock uttar de raha hoon! \n\nAapne pucha: "${lastUserMsg}"\n\nAapka dhandha badhiya chal raha hai! \n- Total Sales: ₹${businessStats?.totalSales?.toFixed(2) || '0.00'}\n- Outstanding Udhaar: ₹${businessStats?.totalUdhaarOutstanding?.toFixed(2) || '0.00'}\n- Low Stock Items: ${lowStockProducts?.length || 0} product(s).\n\nLet me know once you connect your real Gemini Key for real-time intelligent shop audits! 🙌`,
    });
  }

  try {
    const trackingStats = businessStats || { totalSales: 0, totalExpenses: 0, totalUdhaarOutstanding: 0, netProfit: 0, cashInHand: 0 };
    const stockList = Array.isArray(lowStockProducts) ? lowStockProducts.map((p: any) => `${p.name} (Stock: ${p.stock} ${p.unit})`).join(', ') : 'None';
    const invList = Array.isArray(recentInvoices) ? recentInvoices.slice(0, 3).map((i: any) => `Invoice ${i.invoiceNumber} for ${i.customerName} of ₹${i.totalAmount} (Status: ${i.paymentStatus})`).join(', ') : 'None';

    const systemInstruction = `You are "Vyapaar Buddy", an extremely helpful, smart, and friendly Indian Business Analyst, Bookkeeper, and accounting consultant for small merchants (Kirana shops, electronics stores, boutiques, wholesalers).
Your goal is to helper the user optimize their sales, recover dues (Udhaar), handle inventory limits, and manage expenses.

Maintain a warm, enthusiastic, highly professional tone. Speak in fluent 'Hinglish' (a combination of English and Hindi written in Latin script) representing standard Indian vernacular, or clear English if the user writes in English. Use standard accounting and local business terminology where suitable (e.g., 'Udhaar', 'Khata book', 'Grahak', 'Dhandha', 'Munafe', 'Baki Khata', 'Bhugtan', 'Kharche').

Here is the current real-time shop performance metadata:
- Total Sales Revenue: ₹${trackingStats.totalSales.toFixed(2)}
- Total Expenses: ₹${trackingStats.totalExpenses.toFixed(2)}
- Outstanding Customer Udhaar (Receivables): ₹${trackingStats.totalUdhaarOutstanding.toFixed(2)}
- Net Profit: ₹${trackingStats.netProfit.toFixed(2)}
- Current Cash In Hand: ₹${trackingStats.cashInHand.toFixed(2)}
- Critical Low Stock Items: ${stockList || 'None - inventory levels are stable.'}
- Recent Sales Transactions: ${invList}

When the user asks for suggestions, give intelligent business tips suitable for micro-enterprises in India (e.g., offering discounts on slow stock, suggesting UPI barcodes to decrease credit loops, drafting helpful reminders for outstanding debt).
If they ask you to write a payment reminder message for a customer, write a highly polite yet clear SMS/WhatsApp message in both Hindi and English that they can copy-paste immediately. Include placeholders like [Customer Name], [Amount], [Invoice Number].
Keep responses brief, highly readable, structured with bold headlines, bullet points, and numbered steps where useful.`;

    const formattedContents = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: formattedContents as any,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    res.json({ content: response.text });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: error.message || 'Error occurred while contacting Gemini API.' });
  }
});

// Configure Vite or Static Files
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite dev middleware attached.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Production static distribution enabled.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running successfully on port ${PORT}`);
  });
}

setupServer();
