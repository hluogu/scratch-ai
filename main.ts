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
  const targetUrl = new URL(UPSTREAM);
  // 把前端所有查询参数原样复制转发给上游
  url.searchParams.forEach((v,k)=>{
    targetUrl.searchParams.set(k,v);
  });
  try {
    const upstreamRes = await fetch(targetUrl.toString(), {
      method:"GET"
    });
    const respText = await upstreamRes.text();
    const outHeaders = new Headers();
    Object.entries(CORS_HEADERS).forEach(([k,v])=>outHeaders.set(k,v));
    outHeaders.set("Content-Type","application/json");
    return new Response(respText, {status:upstreamRes.status, headers:outHeaders});
  } catch(err){
    return new Response(JSON.stringify({error:String(err)}), {
      status:500,
      headers:{...CORS_HEADERS,"Content-Type":"application/json"}
    });
  }
});
