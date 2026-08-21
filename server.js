import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT ?? 3000;

// Pico.css served straight out of node_modules — no CDN.
app.use(
  "/vendor/pico",
  express.static(path.join(root, "node_modules/@picocss/pico/css")),
);

// The shared engine, importable from both games as /engine/*.js
app.use("/engine", express.static(path.join(root, "engine")));

app.use("/basic", express.static(path.join(root, "basic")));
app.use("/cool", express.static(path.join(root, "cool")));
app.use("/", express.static(path.join(root, "public")));

app.listen(port, () => {
  console.log(`See it on http://localhost:${port}`);
});
