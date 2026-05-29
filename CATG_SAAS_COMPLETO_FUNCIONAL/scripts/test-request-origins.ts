import { requestHasAllowedOrigin } from "@/lib/request-security";

function makeReq(origin: string | null, url = "http://localhost:3000/api/test") {
  const headers = new Headers();
  if (origin) headers.set("origin", origin);
  // @ts-ignore - shape compatible enough for the helper
  return { headers, url } as unknown as Request;
}

async function run() {
  const cases: Array<{ req: Request; env: Record<string, string | undefined>; expected: boolean; desc: string }> = [
    { req: makeReq(null), env: { NODE_ENV: "development", REQUEST_ALLOWED_ORIGINS: "" }, expected: true, desc: "No origin in dev -> allowed" },
    { req: makeReq("http://localhost:3000"), env: { NODE_ENV: "production", REQUEST_ALLOWED_ORIGINS: "http://localhost:3000" }, expected: true, desc: "Explicit localhost in production allowed" },
    { req: makeReq("https://example.com"), env: { NODE_ENV: "production", REQUEST_ALLOWED_ORIGINS: "example.com" }, expected: true, desc: "Bare domain normalized to https and allowed" },
    { req: makeReq("https://notallowed.com"), env: { NODE_ENV: "production", REQUEST_ALLOWED_ORIGINS: "example.com" }, expected: false, desc: "Not listed origin rejected" }
  ];

  for (const c of cases) {
    // Clear only used env vars to be safe
    delete process.env.REQUEST_ALLOWED_ORIGINS;
    delete process.env.NEXT_PUBLIC_APP_URL;
    Object.assign(process.env, c.env);
    const result = requestHasAllowedOrigin(c.req);
    if (result !== c.expected) {
      console.error(`FAIL: ${c.desc} -> expected ${c.expected} got ${result}`);
      process.exitCode = 1;
      return;
    }
    console.log(`OK: ${c.desc}`);
  }

  console.log("All tests passed");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
