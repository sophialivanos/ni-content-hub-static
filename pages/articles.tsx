import { useState } from "react";
import Layout from "@/components/Layout";

export default function Articles(){
  const [industry,setIndustry]=useState('');
  const [vertical,setVertical]=useState('');
  const [keywords,setKeywords]=useState('');
  const [headline,setHeadline]=useState('');
  const [trends,setTrends]=useState<string[]>([]);
  const [heads,setHeads]=useState<string[]>([]);
  const [article,setArticle]=useState('');
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState('');

  async function callLF(name:string, args:any){
    const r = await fetch('/api/lf',{method:'POST',headers:{'Content-Type':'application/json'},body: JSON.stringify({ name, args })});
    const isJson = r.headers.get('content-type')?.includes('application/json');
    const data = await (isJson ? r.json() : r.text());
    if(!r.ok) throw new Error(typeof data === 'string' ? data : JSON.stringify(data));
    return data;
  }

  const getTrends = async ()=>{
    if(!industry){ setMsg('Select an industry.'); return; }
    setBusy(true); setMsg('');
    try{
      const data = await callLF('Content_Trends_Research', { Industry:industry, Vertical:vertical, Country:'US', Keywords: keywords.split(',').map(s=>s.trim()).filter(Boolean) });
      setTrends(data?.content?.trends || []);
      setHeads(data?.content?.headlines || []);
    }catch(e:any){ setMsg(e.message);}finally{ setBusy(false); }
  };

  const createArticle = async ()=>{
    if(!industry || !vertical || !headline){ setMsg('Industry, Vertical, and Headline are required.'); return; }
    setBusy(true); setMsg('');
    try{
      const data = await callLF('Content_Article_Creation', { Industry:industry, Vertical:vertical, Country:'US', Headline:headline, Keywords: keywords.split(',').map(s=>s.trim()).filter(Boolean) });
      const content = data?.content ?? data?.result ?? (typeof data === 'string' ? data : JSON.stringify(data,null,2));
      setArticle(content);
    }catch(e:any){ setMsg(e.message);}finally{ setBusy(false); }
  };

  return (
    <Layout>
      <div className="bg-white border border-slate-200 rounded-2xl shadow p-6">
        <h2 className="text-2xl font-extrabold mb-4">Article Creation</h2>
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
          <input className="border rounded-md px-3 py-2" placeholder="Industry" value={industry} onChange={e=>setIndustry(e.target.value)} />
          <input className="border rounded-md px-3 py-2" placeholder="Vertical" value={vertical} onChange={e=>setVertical(e.target.value)} />
          <input className="border rounded-md px-3 py-2" placeholder="Keywords (comma separated)" value={keywords} onChange={e=>setKeywords(e.target.value)} />
          <input className="border rounded-md px-3 py-2" placeholder="Headline" value={headline} onChange={e=>setHeadline(e.target.value)} />
        </div>
        <div className="flex gap-2 mt-3">
          <button className="px-3 py-2 rounded-md border font-semibold" onClick={getTrends} disabled={busy}>Get trends/headlines</button>
          <button className="px-3 py-2 rounded-md bg-indigo-600 text-white font-semibold" onClick={createArticle} disabled={busy}>Generate article</button>
        </div>
        {msg && <div className="mt-3 text-red-700">{msg}</div>}

        {(trends.length>0 || heads.length>0) && (
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 mt-4">
            <div className="border rounded-xl p-4 bg-white">
              <b>Trends</b>
              <ul className="list-disc ml-5 mt-2">{trends.map((t,i)=><li key={i}>{t}</li>)}</ul>
            </div>
            <div className="border rounded-xl p-4 bg-white">
              <b>Suggested headlines</b>
              <ul className="list-disc ml-5 mt-2">{heads.map((h,i)=><li key={i}><button className="underline" onClick={()=>setHeadline(h)}>{h}</button></li>)}</ul>
            </div>
          </div>
        )}

        {article && (
          <div className="mt-4">
            <b>Generated Article</b>
            <textarea className="mt-2 w-full min-h-[300px] border rounded-md p-3" value={article} onChange={e=>setArticle(e.target.value)} />
          </div>
        )}
      </div>
    </Layout>
  );
}
