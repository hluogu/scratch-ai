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

  let payload: Record<string, string> = {};
  // GET模式：读取url参数，放入JSON body（不再依靠URL向上游传数据）
  if(req.method === "GET"){
    url.searchParams.forEach((v,k)=>payload[k]=v);
  }else{
    // POST模式：读取请求body
    payload = await req.json().catch(()=> ({}));
  }

  try {
    const upstreamRes = await fetch(targetUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const respHeaders = new Headers(upstreamRes.headers);
    Object.entries(CORS_HEADERS).forEach(([k,v])=>respHeaders.set(k,v));
    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      headers: respHeaders
    });
  } catch(err){
    return Response.json({error:String(err)}, {status:500, headers:CORS_HEADERS});
  }
});
