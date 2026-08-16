const UPSTREAM_URL = "https://oiapi.net/api/BigModel";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

Deno.serve(async (request: Request) => {
  // 处理预检
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (request.method !== "POST") {
    return new Response(JSON.stringify({msg:"只允许POST"}), {
      status: 405,
      headers: {...CORS_HEADERS, "Content-Type":"application/json"}
    });
  }
  try {
    // 原样读取body，不做任何篡改
    const rawBody = await request.text();
    const upstreamResponse = await fetch(UPSTREAM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept-Encoding": "identity"
      },
      body: rawBody
    });

    const outHeaders = new Headers(upstreamResponse.headers);
    outHeaders.delete("Content-Encoding");
    outHeaders.delete("Content-Length");
    for(const [k,v] of Object.entries(CORS_HEADERS)){
      outHeaders.set(k, v);
    }

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: outHeaders
    });
  } catch (err) {
    return new Response(JSON.stringify({error: String(err)}), {
      status: 500,
      headers: {...CORS_HEADERS, "Content-Type":"application/json"}
    });
  }
});
