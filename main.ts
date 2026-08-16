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
    const sendBody = JSON.stringify(payload);

    const upstreamRes = await fetch(UPSTREAM, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept-Encoding": "identity" // 强制上游不要压缩
      },
      body: sendBody
    });

    // 关键：彻底删除压缩相关头部，杜绝解码失败
    const outHeaders = new Headers(upstreamRes.headers);
    outHeaders.delete("Content-Encoding");
    outHeaders.delete("Content-Length");
    outHeaders.delete("Transfer-Encoding");

    // 注入CORS
    for (const [k, v] of Object.entries(CORS_HEADERS)) {
      outHeaders.set(k, v);
    }

    // 先读取完整响应文本，不再流式转发，彻底规避解码异常
    const respText = await upstreamRes.text();
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
