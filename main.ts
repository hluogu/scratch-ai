const UPSTREAM = "https://oiapi.net/api/BigModel";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({err:"只允许POST"}), {
      status:400,
      headers: {...CORS, "Content-Type":"application/json"}
    });
  }
  try {
    // 关键：完整读取原始body，不要中途操作、不要解析重建
    const rawBody = await req.text();
    const upstreamResp = await fetch(UPSTREAM, {
      method:"POST",
      headers: {
        "Content-Type":"application/json"
      },
      body: rawBody
    });
    const outHeaders = new Headers(upstreamResp.headers);
    Object.entries(CORS).forEach(([k,v])=>outHeaders.set(k,v));
    return new Response(upstreamResp.body, {
      status: upstreamResp.status,
      headers: outHeaders
    });
  } catch (err) {
    return new Response(JSON.stringify({error:String(err)}), {
      status:500,
      headers: {...CORS, "Content-Type":"application/json"}
    });
  }
});
