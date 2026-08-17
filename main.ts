const UPSTREAM = "https://oiapi.net/api/BigModel";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const url = new URL(req.url);
  let payload: Record<string, unknown> = {};

  if (req.method === "GET") {
    url.searchParams.forEach((val, key) => {
      payload[key] = val;
    });
  } else {
    try {
      payload = await req.json();
    } catch {
      payload = {};
    }
  }

  try {
    const upstreamRes = await fetch(UPSTREAM, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const respHeaders = new Headers(upstreamRes.headers);
    // =========核心修复=========
    // 删除压缩相关头，避免浏览器强制解压导致失败
    respHeaders.delete("Content-Encoding");
    respHeaders.delete("Content-Length");
    respHeaders.delete("Transfer-Encoding");
    // =========================
    Object.entries(CORS_HEADERS).forEach(([k, v]) => {
      respHeaders.set(k, v);
    });

    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      headers: respHeaders
    });
  } catch (err) {
    return Response.json(
      { error: String(err) },
      { status: 500, headers: CORS_HEADERS }
    );
  }
});
