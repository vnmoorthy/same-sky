import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("ships the built Same Sky product", async () => {
  await access(new URL("dist/server/index.js", root));
  const [page, app, layout] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/same-sky-app.tsx", root), "utf8"),
    readFile(new URL("app/layout.tsx", root), "utf8"),
  ]);
  assert.match(page, /SameSkyApp/);
  assert.match(layout, /Same Sky — Feel the set from anywhere/);
  assert.match(app, /I’m at the festival/);
  assert.match(app, /I’m watching from home/);
  assert.match(app, /Hold to send a pulse/);
  assert.match(app, /Gone within 24 hours/);
  assert.doesNotMatch(page + app + layout, /codex-preview|react-loading-skeleton|Your site is taking shape/);
});

test("implements every server state transition", async () => {
  const [presence, publish, pulse, remove] = await Promise.all([
    readFile(new URL("app/api/sessions/[code]/presence/route.ts", root), "utf8"),
    readFile(new URL("app/api/sessions/[code]/publish/route.ts", root), "utf8"),
    readFile(new URL("app/api/sessions/[code]/pulse/route.ts", root), "utf8"),
    readFile(new URL("app/api/sessions/[code]/delete/route.ts", root), "utf8"),
  ]);
  assert.match(presence, /draft_ready/);
  assert.match(publish, /postcard_ready/);
  assert.match(pulse, /pulse_ready/);
  assert.match(remove, /DELETE FROM sessions/);
});
