import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mock Database for Cloud Connectivity Demo
  let users: any[] = [];
  let cloudTransactions: any[] = [];

  // API routes
  app.post("/api/auth/signup", (req, res) => {
    const { email, password, name } = req.body;
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ message: "User already exists" });
    }
    const newUser = { id: Date.now().toString(), email, password, name };
    users.push(newUser);
    res.status(201).json({ user: { id: newUser.id, email: newUser.email, name: newUser.name } });
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    res.json({ user: { id: user.id, email: user.email, name: user.name } });
  });

  app.post("/api/sync", (req, res) => {
    const { userId, transactions } = req.body;
    // Simple implementation: replace user's transactions
    cloudTransactions = cloudTransactions.filter(t => t.userId !== userId);
    const stamped = transactions.map((t: any) => ({ ...t, userId }));
    cloudTransactions.push(...stamped);
    res.json({ status: "success", count: stamped.length });
  });

  app.get("/api/sync/:userId", (req, res) => {
    const userTransactions = cloudTransactions.filter(t => t.userId === req.params.userId);
    res.json(userTransactions);
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
