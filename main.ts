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
  const timeoutTimer = setTimeout(() => controller.abort(), 18000);

  try {
    const body = await req.text();
    const forwardHeaders = new Headers(req.headers);
    forwardHeaders.set("Accept-Encoding", "identity");

    const forwardReq = new Request(TARGET_API, {
      method: req.method,
      headers: forwardHeaders,
      body,
      signal: controller.signal
    });

    const res = await fetch(forwardReq);
    clearTimeout(timeoutTimer);

    const newHeaders = new Headers(res.headers);
    newHeaders.delete("Content-Encoding");
    newHeaders.delete("Content-Length");
    Object.entries(corsHeaders).forEach(([k, v]) => newHeaders.set(k, v));

    return new Response(res.body, { status: res.status, headers: newHeaders });
  } catch (err) {
    clearTimeout(timeoutTimer);
    const msg = err.name === "AbortError" ? "请求超时" : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 504,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
