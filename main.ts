// OIAPI CORS Proxy for Deno Deploy
const TARGET_API = "https://oiapi.net/api/BigModel";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

Deno.serve(async (req: Request) => {
  // 处理浏览器预检OPTIONS请求
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const controller = new AbortController();
  const timeoutTimer = setTimeout(() => controller.abort(), 15000);

  try {
    const urlObj = new URL(req.url);
    const targetUrl = new URL(TARGET_API);

    // 把前端传递的query参数转发到目标接口
    urlObj.searchParams.forEach((val, key) => {
      targetUrl.searchParams.set(key, val);
    });

    // 构造转发请求
    const forwardReq = new Request(targetUrl.toString(), {
      method: req.method,
      headers: req.headers,
      body: req.body,
      signal: controller.signal
    });

    const res = await fetch(forwardReq);
    clearTimeout(timeoutTimer);

    // 复制响应并附加CORS头
    const newHeaders = new Headers(res.headers);
    Object.entries(corsHeaders).forEach(([k, v]) => newHeaders.set(k, v));
    return new Response(res.body, { status: res.status, headers: newHeaders });

  } catch (err) {
    clearTimeout(timeoutTimer);
    const msg = err.name === "AbortError"
      ? "上游请求超时：海外节点无法连接oiapi.net"
      : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 504,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
