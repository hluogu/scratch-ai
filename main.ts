// OIAPI CORS Proxy Deno Deploy New Version
const TARGET_API = "https://oiapi.net/api/BigModel";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  const controller = new AbortController();
  const timeoutTimer = setTimeout(() => controller.abort(), 15000);
  try {
    const reqUrl = new URL(request.url);
    let forwardReq: Request;
    if (request.method === "GET") {
      const targetUrl = new URL(TARGET_API);
      reqUrl.searchParams.forEach((val, key) => targetUrl.searchParams.set(key, val));
      forwardReq = new Request(targetUrl.toString(), { method: "GET", signal: controller.signal });
    } else {
      forwardReq = new Request(TARGET_API, {
        method: request.method,
        headers: request.headers,
        body: request.body,
        signal: controller.signal
      });
    }
    const upstreamResp = await fetch(forwardReq);
    clearTimeout(timeoutTimer);
    const respHeaders = new Headers(upstreamResp.headers);
    Object.entries(corsHeaders).forEach(([k, v]) => respHeaders.set(k, v));
    return new Response(upstreamResp.body, { status: upstreamResp.status, headers: respHeaders });
  } catch (err)
    clearTimeout(timeoutTimer);
    const errorMsg = err.name === "AbortError" ? "上游请求超时：海外节点无法连接oiapi.net" : String(err);
    return new Response(JSON.stringify({ error: errorMsg }), { status: 504, headers: corsHeaders });
  }
});
