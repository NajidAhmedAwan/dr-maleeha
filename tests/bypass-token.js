import fs from 'node:fs';

export function loadBypassToken() {
  return (
    process.env.VERCEL_AUTOMATION_BYPASS_SECRET ||
    (fs.existsSync('.vercel-bypass-token')
      ? fs.readFileSync('.vercel-bypass-token', 'utf8').trim()
      : null)
  );
}
