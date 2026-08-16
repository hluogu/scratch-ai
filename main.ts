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
    return new Response(JSON.stringify({error:"仅支持POST"}), {status:400, headers:CORS});
  }
  try {
    const body = await req.text();
    const upstreamRes = await fetch(UPSTREAM, {
      method: "POST",
      headers: {
        "Content-Type":"application/json",
        "Accept-Encoding":"identity"
      },
      body
    });
    const respHeaders = new Headers(upstreamRes.headers);
    respHeaders.delete("Content-Encoding");
    respHeaders.delete("Content-Length");
    Object.entries(CORS).forEach(([k,v])=>respHeaders.set(k,v));
    return new Response(upstreamRes.body, { status: upstreamRes.status, headers: respHeaders });
  } catch(err){
    return new Response(JSON.stringify({error:String(err)}), {status:500, headers:CORS});
  }
});
