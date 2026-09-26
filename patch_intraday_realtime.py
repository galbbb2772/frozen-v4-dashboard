from pathlib import Path

p = Path('intraday.html')
s = p.read_text(encoding='utf-8')

repls = [
    (
        "let ws=null,wsReady=false,retryMs=1000,heartbeat=null,lastMode='fallback';",
        "let ws=null,wsReady=false,wsHasSnapshot=false,lastRealtimeSnapshotMs=0,retryMs=1000,heartbeat=null,lastMode='fallback';",
    ),
    (
        "async function loadFallback(){\n try{const r=await fetch('data/intraday.json?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error('intraday.json '+r.status);const d=await r.json();if(!wsReady)render(d,'fallback')}catch(e){if(!wsReady){render({current:{status:'WAITING'},history:[]},'fallback')}}\n}",
        "async function loadFallback(){\n try{const r=await fetch('data/intraday.json?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error('intraday.json '+r.status);const d=await r.json();const realtimeFresh=wsHasSnapshot&&(Date.now()-lastRealtimeSnapshotMs<15000);if(!realtimeFresh)render(d,'fallback')}catch(e){const realtimeFresh=wsHasSnapshot&&(Date.now()-lastRealtimeSnapshotMs<15000);if(!realtimeFresh){render({current:{status:'WAITING'},history:[]},'fallback')}}\n}",
    ),
    (
        "ws.onmessage=(ev)=>{try{const m=JSON.parse(ev.data);if(m.type==='snapshot'){render({current:m.current||{},history:m.history||[],protocol:{transport:'Alpaca IEX WebSocket'}},'websocket')}}catch(e){}};",
        "ws.onmessage=(ev)=>{try{const m=JSON.parse(ev.data);if(m.type==='snapshot'){const cur=m.current||{},hist=m.history||[];const usable=hist.length>0||cur.projected_main_b_equity!=null||cur.spy?.price!=null||cur.qqq?.price!=null||(cur.projected_main_b_positions||[]).length>0||(cur.sector_moves||[]).length>0;if(usable){wsHasSnapshot=true;lastRealtimeSnapshotMs=Date.now();render({current:cur,history:hist,protocol:{transport:'Alpaca IEX WebSocket'}},'websocket')}else{wsHasSnapshot=false;lastRealtimeSnapshotMs=0;loadFallback()}}}catch(e){}};",
    ),
    (
        "ws.onclose=()=>{wsReady=false;clearInterval(heartbeat);loadFallback();setTimeout(connectRealtime,retryMs);retryMs=Math.min(retryMs*2,30000)};",
        "ws.onclose=()=>{wsReady=false;wsHasSnapshot=false;lastRealtimeSnapshotMs=0;clearInterval(heartbeat);loadFallback();setTimeout(connectRealtime,retryMs);retryMs=Math.min(retryMs*2,30000)};",
    ),
    (
        "{x:h.map(x=>x.generated_at_utc),y:h.map(x=>x.projected_main_b_equity),name:'Projected MAIN-B',type:'scatter',mode:'lines'}",
        "{x:h.map(x=>x.generated_at_utc),y:h.map(x=>x.projected_main_b_equity),name:'Projected MAIN-B',type:'scatter',mode:h.length<2?'lines+markers':'lines'}",
    ),
    (
        "{x:h.map(x=>x.generated_at_utc),y:h.map(x=>(x.intraday_return_vs_last_eod??null)*100),name:'MAIN-B',type:'scatter',mode:'lines'}",
        "{x:h.map(x=>x.generated_at_utc),y:h.map(x=>(x.intraday_return_vs_last_eod??null)*100),name:'MAIN-B',type:'scatter',mode:h.length<2?'lines+markers':'lines'}",
    ),
    (
        "{x:h.map(x=>x.generated_at_utc),y:h.map(x=>(x.spy_return_vs_prev_close??null)*100),name:'SPY',type:'scatter',mode:'lines'}",
        "{x:h.map(x=>x.generated_at_utc),y:h.map(x=>(x.spy_return_vs_prev_close??null)*100),name:'SPY',type:'scatter',mode:h.length<2?'lines+markers':'lines'}",
    ),
    (
        "{x:h.map(x=>x.generated_at_utc),y:h.map(x=>(x.qqq_return_vs_prev_close??null)*100),name:'QQQ',type:'scatter',mode:'lines'}",
        "{x:h.map(x=>x.generated_at_utc),y:h.map(x=>(x.qqq_return_vs_prev_close??null)*100),name:'QQQ',type:'scatter',mode:h.length<2?'lines+markers':'lines'}",
    ),
    (
        "loadFallback();connectRealtime();setInterval(loadFallback,60000);",
        "loadFallback();connectRealtime();setInterval(loadFallback,60000);setInterval(()=>{if(wsHasSnapshot&&Date.now()-lastRealtimeSnapshotMs>=15000){wsHasSnapshot=false;loadFallback()}},5000);",
    ),
]

for old, new in repls:
    if old in s:
        s = s.replace(old, new)

# Cache-bust the two small runtime helpers on each deploy so mobile browsers do not
# keep an older reset/realtime behavior after a fix.
s = s.replace('src="plotly-mobile-guard.js"', 'src="plotly-mobile-guard.js?v=20260926c"')
s = s.replace('src="realtime-config.js"', 'src="realtime-config.js?v=20260926c"')

p.write_text(s, encoding='utf-8')
print('patched intraday realtime fallback')
