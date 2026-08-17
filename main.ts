const UPSTREAM = "https://oiapi.net/api/BigModel";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

Deno.serve(async (req: Request) => {
  // 跨域预检
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const clientUrl = new URL(req.url);
  const targetUrl = new URL(UPSTREAM);

  // 复制URL查询参数
  for (const [k, v] of clientUrl.searchParams) {
    targetUrl.searchParams.set(k, v);
  }

  let forwardBody: ReadableStream | null = null;
  let forwardHeaders = new Headers(req.headers);

  // ===== 关键逻辑：统一把请求转换成POST发向上游，解决超长问题 =====
  if (req.method === "GET") {
    // GET 请求：把所有参数打包成JSON body，转为POST向上游发送
    const payload: Record<string, string> = {};
    for (const [k, v] of clientUrl.searchParams) {
      payload[k] = v;
    }
    forwardBody = JSON.stringify(payload);
    forwardHeaders.set("Content-Type", "application/json");
  } else {
    // POST 请求：直接透传body
    forwardBody = req.body;
  }

  try {
    const upstreamRes = await fetch(targetUrl.toString(), {
      method: "POST", // 固定向上游发送POST，适配oiapi接口规范
      headers: forwardHeaders,
      body: forwardBody
    });

    const respHeaders = new Headers(upstreamRes.headers);
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
