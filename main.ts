const UPSTREAM = "https://oiapi.net/api/BigModel";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ err: "只允许POST" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
    });
  }
  try {
    const rawText = await req.text();
    const payload = JSON.parse(rawText);
    // 重新序列化，修复传输中JSON损坏问题
    const sendBody = JSON.stringify(payload);

    const upstreamRes = await fetch(UPSTREAM, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: sendBody
    });

    const outHeaders = new Headers(upstreamRes.headers);
    for (const [k, v] of Object.entries(CORS_HEADERS)) {
      outHeaders.set(k, v);
    }
    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      headers: outHeaders
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
    });
  }
});
