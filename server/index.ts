import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import connectDB from "./db.js"; // your MongoDB connection
import dotenv from "dotenv";
import getPort from "get-port";
import cors from "cors";
import bcrypt from "bcrypt";
import User from "./models/userModel.js";
import { WebSocketServer } from "ws";

dotenv.config(); // ✅ Load environment variables

const app = express();

// Add CORS middleware
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true
}));

// ✅ Connect to MongoDB before starting the server
await connectDB();

// Create test users if they don't exist
try {
  const testUsers = [
    {
      username: 'admin',
      password: await bcrypt.hash('admin123', 10),
      role: 'admin',
      name: 'Admin User'
    },
    {
      username: 'teacher',
      password: await bcrypt.hash('teacher123', 10),
      role: 'teacher',
      name: 'Test Teacher'
    },
    {
      username: 'student',
      password: await bcrypt.hash('student123', 10),
      role: 'student',
      name: 'Test Student'
    }
  ];

  for (const user of testUsers) {
    const exists = await User.findOne({ username: user.username });
    if (!exists) {
      await User.create(user);
      console.log(`Created test user: ${user.username}`);
    }
  }
} catch (error) {
  console.error('Error creating test users:', error);
}

// --- Body Parsers ---
declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: false }));

// --- Logging Middleware ---
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// --- Async server setup ---
(async () => {
  try {
    const server = await registerRoutes(app);

    // ✅ Setup WebSocket server
    const wss = new WebSocketServer({ server });
    
    // Store connected clients by role
    const clients = new Set<any>();
    
    // Expose broadcast function globally so routes can use it
    (global as any).broadcastToStudents = (message: any) => {
      const payload = JSON.stringify(message);
      clients.forEach((client: any) => {
        if (client.readyState === 1) { // 1 = OPEN
          client.send(payload);
        }
      });
    };

    wss.on('connection', (socket: any) => {
      console.log('📡 WebSocket client connected');
      clients.add(socket);

      socket.on('message', (data: any) => {
        try {
          const message = JSON.parse(data.toString());
          console.log('📨 WebSocket message from client:', message);
          // Echo back or handle subscription logic
          if (message.type === 'subscribe') {
            console.log(`✅ Client subscribed as ${message.role}`);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      });

      socket.on('close', () => {
        console.log('📡 WebSocket client disconnected');
        clients.delete(socket);
      });

      socket.on('error', (error: any) => {
        console.error('❌ WebSocket error:', error);
      });
    });

    // Error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      console.error("❌ Error:", err);
    });

    // Serve frontend via Vite (dev) or static build (prod)
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // --- Start server ---
    const PORT = process.env.PORT ? Number(process.env.PORT) : 5004;
    server.listen(PORT, () => {
      console.log(`✅ Server running on http://0.0.0.0:${PORT} (env=${process.env.NODE_ENV || 'development'})`);
      console.log(`📡 WebSocket server ready on ws://0.0.0.0:${PORT}`);
    });

  } catch (error) {
    console.error("❌ Server initialization failed:", error);
    process.exit(1);
  }
})();
