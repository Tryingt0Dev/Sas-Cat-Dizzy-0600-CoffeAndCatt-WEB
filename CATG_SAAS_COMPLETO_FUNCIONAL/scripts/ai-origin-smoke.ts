import assert from "assert";
import { POST as aiPost } from "../app/api/ai/sales-assistant/route";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

function makeRequest(origin: string) {
  return new Request(`${BASE_URL}/api/ai/sales-assistant`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin
    },
    body: JSON.stringify({
      businessSlug: "does-not-matter",
      message: "Hola"
    })
  });
}

async function main() {
  const env = process.env as Record<string, string | undefined>;
  env.NODE_ENV = "production";
  const prodResponse = await aiPost(makeRequest("http://evil.example.com"));
  assert(prodResponse.status === 403, `Expected 403 in production, got ${prodResponse.status}`);

  env.NODE_ENV = "development";
  const devResponse = await aiPost(makeRequest("http://evil.example.com"));
  assert(devResponse.status !== 403, `Expected non-403 in development, got ${devResponse.status}`);

  console.log("AI origin smoke test passed: production rejects, development allows request origin checks.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
