import crypto from "crypto";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { getDb } from "./src/backend/db.ts";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize DB
  const db = await getDb();

  // Audit Helper
  const audit = async (userId: number | null, action: string, details: string) => {
    await db.run('INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)', userId, action, details);
  };

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "bioterra-secret-key");
      req.user = decoded;
      next();
    } catch (e) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  const authorize = (roles: string[]) => (req: any, res: any, next: any) => {
    if (!roles.includes((req as any).user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };

  // API Routes
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await db.get("SELECT * FROM users WHERE email = ? AND active = 1", email);
    if (user && await bcrypt.compare(password, user.password_hash)) {
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        process.env.JWT_SECRET || "bioterra-secret-key",
        { expiresIn: "24h" }
      );
      await audit(user.id, "LOGIN", "Usuário realizou login");
      res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email } });
    } else {
      res.status(401).json({ error: "Credenciais inválidas" });
    }
  });

  // Admin Routes
  app.get("/api/admin/users", authenticate, authorize(["ADMIN"]), async (req, res) => {
    const users = await db.all("SELECT id, name, email, role, active, created_at FROM users");
    res.json(users);
  });

  app.post("/api/admin/users", authenticate, authorize(["ADMIN"]), async (req, res) => {
    const { name, email, password, role } = req.body;
    const hash = await bcrypt.hash(password, 10);
    try {
      await db.run("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)", name, email, hash, role);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "E-mail já cadastrado" });
    }
  });

  app.patch("/api/admin/users/:id", authenticate, authorize(["ADMIN"]), async (req, res) => {
    const { id } = req.params;
    const { active, role, name } = req.body;
    await db.run("UPDATE users SET active = COALESCE(?, active), role = COALESCE(?, role), name = COALESCE(?, name) WHERE id = ?", active, role, name, id);
    res.json({ success: true });
  });

  // Chemist Routes
  app.get("/api/products", authenticate, async (req, res) => {
    const products = await db.all("SELECT * FROM products ORDER BY name ASC");
    res.json(products);
  });

  app.post("/api/products", authenticate, authorize(["ADMIN", "CHEMIST"]), async (req, res) => {
    const { name, description } = req.body;
    const result = await db.run("INSERT INTO products (name, description) VALUES (?, ?)", name, description);
    res.json({ id: result.lastID });
  });

  app.get("/api/suppliers", authenticate, async (req, res) => {
    const suppliers = await db.all("SELECT * FROM suppliers ORDER BY name ASC");
    res.json(suppliers);
  });

  app.post("/api/suppliers", authenticate, authorize(["ADMIN", "CHEMIST"]), async (req, res) => {
    const { name } = req.body;
    const result = await db.run("INSERT INTO suppliers (name) VALUES (?)", name);
    res.json({ id: result.lastID });
  });

  app.get("/api/offers", authenticate, async (req, res) => {
    // Hidden supplier if not Admin/Chemist
    const isAdminOrChemist = ["ADMIN", "CHEMIST"].includes((req as any).user.role);
    let query = `
      SELECT o.*, p.name as product_name, s.name as supplier_name, pk.name as packaging_name
      FROM price_offers o
      JOIN products p ON o.product_id = p.id
      JOIN suppliers s ON o.supplier_id = s.id
      JOIN packagings pk ON o.packaging_id = pk.id
      WHERE o.valid_until >= datetime('now')
      ORDER BY o.created_at DESC
    `;
    const offers = await db.all(query);
    
    if (!isAdminOrChemist) {
      // Anonymize or filter based on policy
      const policyRes = await db.get("SELECT value FROM settings WHERE key = 'price_policy'");
      const policy = policyRes?.value || 'MAX';
      
      // Group by product and packaging to apply policy
      const grouped: any = {};
      offers.forEach(o => {
        const key = `${o.product_id}-${o.packaging_id}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(o);
      });

      const filtered: any[] = [];
      Object.values(grouped).forEach((group: any) => {
        if (policy === 'MAX') {
          const max = group.reduce((prev: any, current: any) => (prev.price_usd > current.price_usd) ? prev : current);
          filtered.push({ ...max, supplier_name: "Fornecedor Confidencial" });
        } else if (policy === 'MIN') {
          const min = group.reduce((prev: any, current: any) => (prev.price_usd < current.price_usd) ? prev : current);
          filtered.push({ ...min, supplier_name: "Fornecedor Confidencial" });
        } else {
          group.forEach((o: any) => filtered.push({ ...o, supplier_name: "Fornecedor Confidencial" }));
        }
      });
      return res.json(filtered);
    }
    
    res.json(offers);
  });

  app.post("/api/offers", authenticate, authorize(["ADMIN", "CHEMIST"]), async (req, res) => {
    const { product_id, supplier_id, packaging_id, price_usd, valid_until, coa_ref } = req.body;
    await db.run(
      "INSERT INTO price_offers (product_id, supplier_id, packaging_id, price_usd, valid_until, coa_ref, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
      product_id, supplier_id, packaging_id, price_usd, valid_until, coa_ref, (req as any).user.id
    );
    res.json({ success: true });
  });

  // Commercial Routes
  app.get("/api/settings", authenticate, async (req, res) => {
    const settings = await db.all("SELECT * FROM settings");
    res.json(settings);
  });

  app.patch("/api/settings", authenticate, authorize(["ADMIN"]), async (req, res) => {
    const { key, value } = req.body;
    await db.run("UPDATE settings SET value = ? WHERE key = ?", value, key);
    res.json({ success: true });
  });

  app.get("/api/state-adjustments", authenticate, async (req, res) => {
    const adjustments = await db.all("SELECT * FROM state_adjustments");
    res.json(adjustments);
  });

  // Quotes Routes
  app.get("/api/quotes", authenticate, async (req, res) => {
    const isSales = ["SELLER", "REPRESENTATIVE"].includes((req as any).user.role);
    let query = `
      SELECT q.*, p.name as product_name, pk.name as packaging_name, u.name as user_name
      FROM quotes q
      JOIN products p ON q.product_id = p.id
      JOIN packagings pk ON q.packaging_id = pk.id
      JOIN users u ON q.user_id = u.id
    `;
    if (isSales) {
      query += " WHERE q.user_id = " + (req as any).user.id;
    }
    query += " ORDER BY q.created_at DESC";
    const quotes = await db.all(query);
    res.json(quotes);
  });

  app.post("/api/quotes", authenticate, async (req, res) => {
    const { customer_name, product_id, packaging_id, quantity, state_code, is_fob, ptax, freight_brl_ton, total_usd, total_brl, status, unit_cost_usd } = req.body;
    const external_token = crypto.randomBytes(16).toString('hex');
    await db.run(
      `INSERT INTO quotes (user_id, customer_name, product_id, packaging_id, quantity, state_code, is_fob, ptax, freight_brl_ton, total_usd, total_brl, status, unit_cost_usd, external_token)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      (req as any).user.id, customer_name, product_id, packaging_id, quantity, state_code, is_fob, ptax, freight_brl_ton, total_usd, total_brl, status, unit_cost_usd, external_token
    );
    res.json({ success: true, token: external_token });
  });

  // Public Quote Access
  app.get("/api/public/quotes/:token", async (req, res) => {
    const { token } = req.params;
    const quote = await db.get(`
      SELECT q.*, p.name as product_name, pk.name as packaging_name, u.name as user_name
      FROM quotes q
      JOIN products p ON q.product_id = p.id
      JOIN packagings pk ON q.packaging_id = pk.id
      JOIN users u ON q.user_id = u.id
      WHERE q.external_token = ?
    `, token);
    
    if (!quote) return res.status(404).json({ error: "Proposta não encontrada" });
    res.json(quote);
  });

  app.post("/api/public/quotes/:token/accept", async (req, res) => {
    const { token } = req.params;
    const quote = await db.get("SELECT id, status FROM quotes WHERE external_token = ?", token);
    
    if (!quote) return res.status(404).json({ error: "Proposta não encontrada" });
    if (quote.status === 'CLOSED') return res.status(400).json({ error: "Proposta já aceita" });

    await db.run("UPDATE quotes SET status = 'CLOSED', accepted_at = CURRENT_TIMESTAMP WHERE external_token = ?", token);
    await audit(null, "CLIENT_ACCEPT", `Cliente aceitou proposta ${quote.id}`);
    res.json({ success: true });
  });

  // Administrative / DRE
  app.get("/api/admin/dre", authenticate, authorize(["ADMIN"]), async (req, res) => {
    const timeframe = req.query.timeframe || '30 days';
    
    const stats = await db.get(`
      SELECT 
        SUM(total_brl) as total_revenue_brl,
        SUM(quantity * unit_cost_usd * ptax) as total_cogs_brl,
        SUM(total_brl - (quantity * unit_cost_usd * ptax)) as gross_profit_brl
      FROM quotes 
      WHERE status = 'CLOSED' 
      AND created_at >= date('now', ?)
    `, `-${timeframe}`);

    const salesBySeller = await db.all(`
      SELECT u.name, SUM(q.total_brl) as total_sales
      FROM quotes q
      JOIN users u ON q.user_id = u.id
      WHERE q.status = 'CLOSED'
      AND q.created_at >= date('now', ?)
      GROUP BY u.id
    `, `-${timeframe}`);

    res.json({
      revenue: stats.total_revenue_brl || 0,
      cogs: stats.total_cogs_brl || 0,
      grossProfit: stats.gross_profit_brl || 0,
      margin: stats.total_revenue_brl ? (stats.gross_profit_brl / stats.total_revenue_brl) * 100 : 0,
      salesBySeller
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Seed admin if none exists
    const db = await getDb();
    const admin = await db.get("SELECT * FROM users WHERE role = 'ADMIN'");
    if (!admin) {
      const hash = await bcrypt.hash("admin123", 10);
      await db.run("INSERT INTO users (name, email, password_hash, role) VALUES ('Admin Bio Terra', 'admin@bioterra.com', ?, 'ADMIN')", hash);
      console.log("Admin user created: admin@bioterra.com / admin123");
    }
  });
}

startServer();
