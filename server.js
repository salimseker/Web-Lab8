import express from 'express';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const DEFAULT_PORT = 3000;
const PORT = Number(process.env.PORT) || DEFAULT_PORT;

const app = express();

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
