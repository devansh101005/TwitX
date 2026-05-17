import 'dotenv/config';
import { app } from './app';

const PORT = Number(process.env.PORT ?? 3001);

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
  console.log(`[server] webhook mode — POST updates to /telegram/webhook`);
});
