const TARGET_API = "https://oiapi.net/api/BigModel";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const controller = new AbortController();
  const timeoutTimer = setTimeout(() => controller.abort(), 15000);

  try {
    const urlObj = new URL(req.url);
    const targetUrl = new URL(TARGET_API);
    urlObj.searchParams.forEach((val, key) => {
      targetUrl.searchParams.set(key, val);
    });

    const forwardReq = new Request(targetUrl.toString(), {
      method: req.method,
      headers: req.headers,
      body: req.body,
      signal: controller.signal
    });

    const res = await fetch(forwardReq);
    clearTimeout(timeoutTimer);

    const newHeaders = new Headers(res.headers);
    Object.entries(corsHeaders).forEach(([k, v]) => newHeaders.set(k, v));
    return new Response(res.body, { status: res.status, headers: newHeaders });
  } catch (err) {
    clearTimeout(timeoutTimer);
    const message = err.name === "AbortError" ? "上游请求超时" : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 504,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
