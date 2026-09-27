import "dotenv/config";
import express from "express";
import path from "node:path";
import { createApp } from "./app";

const port = Number(process.env.PORT || 5000);
const app = await createApp();

if (process.env.NODE_ENV !== "production") {
  const clientPath = path.resolve(process.cwd(), "dist/client");
  app.use(express.static(clientPath));
  app.get("*", (_req, res) => res.sendFile(path.join(clientPath, "index.html")));
}

const server = app.listen(port, () => {
  console.log(`SangraH API running on http://localhost:${port}`);
});

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use. Stop the existing server or run with PORT=${port + 1}.`);
    process.exit(1);
  }
  throw error;
});
