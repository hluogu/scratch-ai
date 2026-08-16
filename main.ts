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

    // 核心改动：JSON → urlencoded表单
    const formData = new URLSearchParams();
    formData.append("prompt", payload.prompt);

    const upstreamRes = await fetch(UPSTREAM, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept-Encoding": "identity"
      },
      body: formData
    });

    const respText = await upstreamRes.text();
    const outHeaders = new Headers();
    for (const [k, v] of Object.entries(CORS_HEADERS)) {
      outHeaders.set(k, v);
    }
    outHeaders.set("Content-Type", "application/json");
    return new Response(respText, {
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
