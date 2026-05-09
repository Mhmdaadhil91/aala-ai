import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // PDF Generation Endpoint
  app.post("/api/generate-pdf", async (req, res) => {
    try {
      const { htmlContent, options } = req.body;
      const { width = "6in", height = "9in", margin = "0.5in" } = options || {};

      const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();
      
      await page.setContent(htmlContent, { waitUntil: "networkidle0" });
      
      const pdf = await page.pdf({
        width,
        height,
        margin: {
          top: margin,
          bottom: margin,
          left: margin,
          right: margin,
        },
        printBackground: true,
        displayHeaderFooter: false,
      });

      await browser.close();

      res.contentType("application/pdf");
      res.send(pdf);
    } catch (error) {
      console.error("PDF generation error:", error);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });

  // Stripe Placeholder
  app.post("/api/create-checkout-session", async (req, res) => {
    // In a real app, integrate Stripe SDK here
    res.json({ url: "/dashboard?session=success" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
