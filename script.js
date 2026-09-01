const TARGET=1100000000,KEY="om_namah_shivay_jaap_v3";
const DEFAULT_TARGETS={main:TARGET,daily:30000,weekly:210000,monthly:900000,yearly:11000000};
const MILESTONES=[1000,10000,100000,1000000,10000000,100000000,1000000000,TARGET];
// Google Sheet sync (no login required). Existing local Jaap data is preserved.
const GOOGLE_SHEET_WEB_APP_URL="https://script.google.com/macros/s/AKfycbz12A9qSGQIIVspZRM9p5PpKuVPElVS244o2i5bXQQW-Aqo3NvTWb5VMszXOYa0OYzIsQ/exec";
const SYNC_USER_KEY="om_namah_shivay_sync_user_v1";
const SYNC_MIGRATED_KEY="om_namah_shivay_sync_migrated_v1";
function getSyncUserId(){
  let id=localStorage.getItem(SYNC_USER_KEY);
  if(!id){ id="user-"+crypto.randomUUID(); localStorage.setItem(SYNC_USER_KEY,id); }
  return id;
}
function syncJaapToGoogleSheet(date, jaap, totalNow){
  const count=Number(jaap||0);
  if(!GOOGLE_SHEET_WEB_APP_URL || !date || !count) return;
  const payload={userId:getSyncUserId(),name:"Anonymous User",date:String(date),jaap:count,totalJaap:Number(totalNow||0),target:Number(data.targets?.main||TARGET)};
  try{
    fetch(GOOGLE_SHEET_WEB_APP_URL,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(payload),keepalive:true}).catch(()=>{});
  }catch(e){}
}
function migrateExistingJaapToGoogleSheet(){
  if(localStorage.getItem(SYNC_MIGRATED_KEY)==="done") return;
  const entries=Object.entries(data.days||{}).filter(([,v])=>Number(v)>0).sort((a,b)=>a[0].localeCompare(b[0]));
  if(!entries.length){ localStorage.setItem(SYNC_MIGRATED_KEY,"done"); return; }
  let runningTotal=0;
  entries.forEach(([date,count])=>{ const n=Number(count||0); runningTotal+=n; syncJaapToGoogleSheet(date,n,runningTotal); });
  localStorage.setItem(SYNC_MIGRATED_KEY,"done");
}

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const iso=d=>{const x=new Date(d);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`};
const today=()=>iso(new Date());
let data=load(), cal=new Date(), running=false, session=0, started=0, elapsed=0, timer=null;
data.yoga=data.yoga||{topic:"overview",fontSize:19,bookmarked:false};
function load(){try{const d=JSON.parse(localStorage.getItem(KEY));if(d)return {days:d.days||{},sound:d.sound!==false,theme:d.theme||"mahadev",volume:Number(d.volume??.55),speed:Number(d.speed??1),autoAudio:d.autoAudio!==false,deleted:d.deleted||null,targets:{...DEFAULT_TARGETS,...(d.targets||{})},celebrated:d.celebrated||[],pinHash:d.pinHash||"",pinLength:Number(d.pinLength||0),notifications:{notify108:d.notifications?.notify108!==false,notify1000:d.notifications?.notify1000!==false,notifyDaily:d.notifications?.notifyDaily!==false,notifyMilestone:d.notifications?.notifyMilestone!==false}}}catch(e){}return {days:{},sound:true,theme:"mahadev",volume:.55,speed:1,autoAudio:true,deleted:null,targets:{...DEFAULT_TARGETS},celebrated:[],pinHash:"",pinLength:0,notifications:{notify108:true,notify1000:true,notifyDaily:true,notifyMilestone:true}}}
function save(){localStorage.setItem(KEY,JSON.stringify(data))}
function total(){return Object.values(data.days).reduce((a,v)=>a+Number(v||0),0)}
function fmt(n){return Number(n||0).toLocaleString("en-IN")}
function pct(){return data.targets?.main>0?total()/data.targets.main*100:0}
function ptxt(n){return Number(n||0).toFixed(11)+"%"}
function tgtProgress(target){return target>0?total()/target*100:0}
function etaText(remaining){const daily=Number(data.targets.daily||0);if(remaining<=0)return "પૂર્ણ ✓";if(daily<=0)return "—";const days=Math.ceil(remaining/daily);const d=new Date();d.setDate(d.getDate()+days);return `${days} દિવસ • ${d.toLocaleDateString("gu-IN")}`}
function previousMilestone(t){return MILESTONES.filter(x=>x<=t).slice(-1)[0]||0}
async function afterDataChange(oldTotal,oldTodayTotal=Number(data.days[today()]||0),changedToday=true){
 const now=total();
 await customNotifications(oldTotal,now,oldTodayTotal,changedToday);
 const crossed=MILESTONES.filter(m=>oldTotal<m&&now>=m&&!data.celebrated.includes(m));
 if(crossed.length){data.celebrated.push(...crossed);save();for(const m of crossed){if(data.notifications.notifyMilestone) notifyUser(`Milestone Completed: ${fmt(m)} Jaap`);await celebrateMilestone(m)}}
 refresh();drawCalendar();renderRecords();updateReports();updateSharePreview();
}
function notifyUser(message){
 if("Notification" in window && Notification.permission==="granted"){try{new Notification("🕉️ Om Namah Shivay Jaap Counter",{body:message,icon:"Mahadev-1.png"})}catch(e){}}
 showToast("🔔 "+message);
}
function showToast(message){
 let t=$("#appToast");if(!t){t=document.createElement("div");t.id="appToast";t.className="app-toast";document.body.appendChild(t)}
 t.textContent=message;t.classList.add("show");clearTimeout(t._timer);t._timer=setTimeout(()=>t.classList.remove("show"),3600);
}
async function customNotifications(oldTotal,newTotal,oldTodayTotal,changedToday){
 const n=data.notifications||{};
 if(n.notify108 && Math.floor(newTotal/108)>Math.floor(oldTotal/108)) notifyUser(`${fmt(Math.floor(newTotal/108)*108)} Jaap • ${Math.floor(newTotal/108)} Mala complete`);
 if(n.notify1000 && Math.floor(newTotal/1000)>Math.floor(oldTotal/1000)) notifyUser(`${fmt(Math.floor(newTotal/1000)*1000)} Jaap milestone reached`);
 const beforeDay=Number(data.days[today()]||0);
 if(n.notifyDaily && changedToday && data.targets.daily>0 && beforeDay>=data.targets.daily && oldTodayTotal<data.targets.daily) notifyUser(`આજનું Daily Target ${fmt(data.targets.daily)} પૂર્ણ થયું!`);
}
function celebrateMilestone(m){return new Promise(resolve=>{const box=document.createElement("div");box.className="milestone-celebration";box.innerHTML=`<div class="celebration-box"><div class="celebration-om">ॐ</div><h2>🔔 Milestone Completed!</h2><div class="celebration-number">${fmt(m)} Jaap</div><p>🕉️ Har Har Mahadev 🔱</p><button class="gold" id="closeCelebration">ચાલુ રાખો</button></div>`;document.body.appendChild(box);for(let i=0;i<28;i++){const s=document.createElement("i");s.textContent=["✦","✧","🕉️","•"][i%4];s.style.left=(5+Math.random()*90)+"%";s.style.animationDelay=(Math.random()*.8)+"s";box.appendChild(s)}box.querySelector("#closeCelebration").onclick=()=>{box.remove();resolve()};setTimeout(()=>{if(box.isConnected){box.remove();resolve()}},9000)})}
function refresh(){
 const t=total(),p=pct();
 $("#total").textContent=fmt(t);
 if($("#sideTarget")) $("#sideTarget").textContent=fmt(data.targets.main);$("#progress").textContent=ptxt(p);
 $("#sideDone").textContent=fmt(t);$("#sideRemain").textContent=fmt(Math.max(0,data.targets.main-t));$("#sideProgress").textContent=ptxt(t/data.targets.main*100);
 if($("#sideEta")) $("#sideEta").textContent=etaText(data.targets.main-t);
 $("#totalLine").style.width=Math.min(100,t/100000*100)+"%";$("#progressLine").style.width=Math.min(100,t/data.targets.main*100)+"%";$("#sideBar").style.width=Math.min(100,t/data.targets.main*100)+"%";
 $("#soundText").textContent=data.sound?"ON":"OFF";
 const st=stats(); $("#quickStreak").textContent=st.currentStreak; $("#quickBest").textContent=fmt(st.bestDay); $("#quickActive").textContent=st.activeDays; $("#quickAvg").textContent=fmt(Math.round(st.average)); updateStatsUI();
}
function page(id){
 $$(".page").forEach(x=>x.classList.toggle("active",x.id===id));
 if(id==="calendar"){drawCalendar();drawGraphs("daily","monthly")}
 if(id==="graph"){drawGraphs("daily2","monthly2")}
 if(id==="add")renderRecords();
 if(id==="reports")updateReports();
 if(id==="settings")applyTargetInputs();
 if(id==="yoga")initYoga();
}
$$(".nav").forEach(b=>b.onclick=()=>page(b.dataset.page));

const audio=$("#audio");audio.loop=true;audio.volume=.55;
$("#soundCard").onclick=async()=>{data.sound=!data.sound;save();refresh();if(data.sound){try{await audio.play()}catch(e){}}else audio.pause()};
audio.addEventListener("ended",()=>{if(data.sound){audio.currentTime=0;audio.play().catch(()=>{})}});

function updateTimer(){const ms=elapsed+(running?Date.now()-started:0),s=Math.floor(ms/1000),h=Math.floor(s/3600),m=Math.floor(s%3600/60),z=s%60;$("#timer").textContent=[h,m,z].map(v=>String(v).padStart(2,"0")).join(":")}
$("#start").onclick=()=>{running=true;started=Date.now();timer=setInterval(updateTimer,250);$("#jaap").disabled=false;$$(".quick-adds button").forEach(b=>b.disabled=false);$("#start").disabled=true;$("#pause").disabled=false;$("#end").disabled=false;$("#liveMsg").textContent="જાપ ચાલુ છે. 🕉️";if(data.sound)audio.play().catch(()=>{})};
$("#pause").onclick=()=>{if(!running)return;elapsed+=Date.now()-started;running=false;clearInterval(timer);$("#jaap").disabled=true;$$(".quick-adds button").forEach(b=>b.disabled=true);$("#start").disabled=false;$("#pause").disabled=true;$("#liveMsg").textContent="Pause થયેલ છે.";audio.pause();updateTimer()};
$$(".quick-adds button").forEach(b=>b.onclick=()=>{if(!running)return;session+=Number(b.dataset.add);$("#session").textContent=fmt(session)});
$("#undoSession").onclick=()=>{if(session>0){session--;$("#session").textContent=fmt(session)}};
$("#jaap").onclick=()=>{if(!running)return;session++;$("#session").textContent=fmt(session);$("#session").animate([{transform:"scale(1)"},{transform:"scale(1.08)"},{transform:"scale(1)"}],{duration:180})};
$("#end").onclick=()=>{if(running)$("#pause").click();if(session<1){$("#liveMsg").textContent="આ સેશનમાં જાપ નથી.";return}$("#endDate").value=today();$("#modal").classList.remove("hidden")};
$("#cancel").onclick=()=>$("#modal").classList.add("hidden");
$("#confirm").onclick=()=>{const d=$("#endDate").value||today();const oldTotal=total();const oldTodayTotal=Number(data.days[today()]||0);data.days[d]=(data.days[d]||0)+session;save();syncJaapToGoogleSheet(d,session,total());session=0;elapsed=0;$("#session").textContent="0";$("#timer").textContent="00:00:00";$("#modal").classList.add("hidden");$("#end").disabled=true;$("#pause").disabled=true;$("#start").disabled=false;$("#jaap").disabled=true;$("#liveMsg").textContent="સેશન સેવ થયું. 🙏";afterDataChange(oldTotal,oldTodayTotal,d===today())};

$("#addDate").value=today();
$("#save").onclick=()=>{const d=$("#addDate").value,c=Number($("#addCount").value);if(!d||!Number.isFinite(c)||c<0){$("#addMsg").textContent="યોગ્ય તારીખ અને જાપ સંખ્યા આપો.";return}const oldTotal=total();const oldTodayTotal=Number(data.days[today()]||0);data.days[d]=(data.days[d]||0)+c;save();syncJaapToGoogleSheet(d,c,total());refresh();$("#addMsg").textContent=`${d} પર ${fmt(c)} જાપ ઉમેરાયા. કુલ: ${fmt(data.days[d])}`;$("#addCount").value="";afterDataChange(oldTotal,oldTodayTotal,d===today())};
function renderRecords(){const el=$("#records"),arr=Object.entries(data.days).sort((a,b)=>b[0].localeCompare(a[0]));el.innerHTML=arr.length?arr.slice(0,25).map(([d,c])=>`<div class="record"><span>${d}</span><b>${fmt(c)}</b><button data-e="${d}">Edit</button><button data-x="${d}">Delete</button></div>`).join(""):"<p>હજુ ડેટા નથી.</p>";el.querySelectorAll("[data-e]").forEach(b=>b.onclick=()=>{$("#addDate").value=b.dataset.e;$("#addCount").value=data.days[b.dataset.e];$("#addMsg").textContent="Edit: આ જાપમાં વધુ સંખ્યા ઉમેરવા માટે Save દબાવો."});el.querySelectorAll("[data-x]").forEach(b=>b.onclick=()=>{if(confirm("આ તારીખનો આખો ડેટા delete કરવો?")){delete data.days[b.dataset.x];save();refresh();renderRecords();drawCalendar()}})}


function dayKeys(){return Object.keys(data.days).filter(k=>Number(data.days[k])>0).sort()}
function stats(){
 const keys=dayKeys(), vals=keys.map(k=>Number(data.days[k]||0)), t=total(), active=keys.length;
 let longest=0,cur=0,streak=0, prev=null;
 for(const k of keys){const d=new Date(k+"T00:00:00");if(prev&&((d-prev)/86400000===1))cur++;else cur=1;longest=Math.max(longest,cur);prev=d}
 const td=new Date(today()+"T00:00:00"), set=new Set(keys), walk=new Date(td);
 while(set.has(iso(walk))){streak++;walk.setDate(walk.getDate()-1)}
 const best=vals.length?Math.max(...vals):0;
 return {activeDays:active,bestDay:best,average:active?t/active:0,currentStreak:streak,longestStreak:longest,total:t};
}
function updateStatsUI(){
 const s=stats(); const p=tgtProgress(s.total,data.targets.main);
 const ids={statTotal:fmt(s.total),statStreak:s.currentStreak+" Days",statLongest:s.longestStreak+" Days",statBest:fmt(s.bestDay),statActive:s.activeDays,statAverage:fmt(Math.round(s.average)),statRemain:fmt(Math.max(0,data.targets.main-s.total))};
 Object.entries(ids).forEach(([id,v])=>{const e=$("#"+id);if(e)e.textContent=v});
 const daily=s.average, rem=Math.max(0,data.targets.main-s.total);
 const eta=daily>0?Math.ceil(rem/daily):null; $("#statEta").textContent=eta?eta+" days":"—";
 const milestones=[...MILESTONES.filter(x=>x<=data.targets.main),data.targets.main].filter((x,i,a)=>a.indexOf(x)===i).sort((a,b)=>a-b),next=milestones.find(x=>s.total<x)||data.targets.main;
 const prev=milestones[Math.max(0,milestones.indexOf(next)-1)]||0, prog=(s.total-prev)/(next-prev)*100;
 $("#milestoneText").textContent=`${fmt(next)} Jaap • ${fmt(Math.max(0,next-s.total))} બાકી`;
 $("#milestoneBar").style.width=Math.max(0,Math.min(100,prog))+"%";
 const ag=$("#achievementGrid"); if(!ag)return;
 const ach=[["🥉","1,000 Jaap",1000],["🥈","10,000 Jaap",10000],["🥇","1,00,000 Jaap",100000],["💎","10,00,000 Jaap",1000000],["🔱","1 Crore",10000000],["🕉️","10 Crore",100000000],["🌟","100 Crore",1000000000],["🔥","7 Day Streak",null],["🏆","30 Day Streak",null],["📅","100 Active Days",null],["⭐","Best Day 10K+",null],["✨","1,000 Active Days",null]];
 ag.innerHTML=ach.map(([icon,name,need])=>{let ok=need!==null?s.total>=need:name==="7 Day Streak"?s.currentStreak>=7:name==="30 Day Streak"?s.currentStreak>=30:name==="100 Active Days"?s.activeDays>=100:name==="Best Day 10K+"?s.bestDay>=10000:s.activeDays>=1000;return `<div class="achievement ${ok?"unlocked":""}"><div class="icon">${icon}</div><h3>${name}</h3><p>${ok?"Unlocked ✓":"Locked"}</p></div>`}).join("");
}
function showDayDetail(k){
 const el=$("#dayDetail"),c=Number(data.days[k]||0);el.classList.remove("hidden");
 el.innerHTML=`<h3>📅 ${k}</h3><p><b>કુલ જાપ:</b> ${fmt(c)}</p><p><b>Target progress:</b> ${ptxt(c/data.targets.main*100)}</p><p><b>Range:</b> ${range(c)[3]}</p>`;
}


/* ================= Yoga, Pranayama & Adhyatmik Gyan ================= */
const YOGA_CONTENT={
overview:{title:"🧘 યોગ પરિચય",html:`
<h2>યોગ શું છે?</h2>
<p>યોગનો અર્થ માત્ર કસરત કરવો એવો નથી. ભારતીય પરંપરામાં યોગને શરીર, શ્વાસ, મન, ચિત્ત અને આંતરિક જાગૃતિને સુવ્યવસ્થિત કરવાની સાધના તરીકે સમજાવવામાં આવે છે. “યોગ” શબ્દ સંસ્કૃતના “યુજ્” ધાતુ સાથે જોડાયેલો છે, જે જોડાણ અથવા એકીકરણનો અર્થ આપે છે. એટલે યોગનો એક વ્યાપક અર્થ એવો થાય કે વ્યક્તિ પોતાના શરીર, મન, શ્વાસ અને જાગૃતિ વચ્ચે સંતુલન વિકસાવે.</p>
<p>યોગની પરંપરામાં આસન, પ્રાણાયામ, પ્રત્યાહાર, ધારણા, ધ્યાન અને સમાધિ જેવા વિવિધ પાસાઓની ચર્ચા થાય છે. દૈનિક જીવનમાં યોગનો સરળ અને સુરક્ષિત અભ્યાસ શિસ્ત, સ્થિરતા, એકાગ્રતા અને સ્વ-જાગૃતિ વિકસાવવામાં મદદરૂપ થઈ શકે છે. યોગને સ્પર્ધા તરીકે નહીં પરંતુ ધીમે ધીમે વિકસતી જીવનપદ્ધતિ તરીકે જોવું વધુ યોગ્ય છે.</p>
<h3>યોગના મુખ્ય આધાર</h3><ul><li><b>શરીર:</b> આસન દ્વારા સ્થિરતા, લવચીકતા અને શરીરની જાગૃતિ વિકસાવવી.</li><li><b>શ્વાસ:</b> શ્વાસની કુદરતી ગતિને ઓળખવી અને તેને શાંત બનાવવાની કળા શીખવી.</li><li><b>મન:</b> ધ્યાન અને એકાગ્રતા દ્વારા વિચારોને નિરીક્ષણ કરવાની ટેવ વિકસાવવી.</li><li><b>આચાર:</b> સત્ય, અહિંસા, સંયમ, સ્વચ્છતા અને જવાબદારી જેવા મૂલ્યોને જીવનમાં સ્થાન આપવું.</li><li><b>આત્મચિંતન:</b> પોતાની ટેવો, લાગણીઓ અને નિર્ણયો વિશે શાંતિથી વિચારવું.</li></ul>
<h3>યોગનો હેતુ</h3><p>યોગનો હેતુ કોઈ અદભુત શક્તિ મેળવવો માત્ર નથી. તેનો ઊંડો હેતુ મનની અસ્થિરતા ઘટાડવી, સ્વ-જાગૃતિ વધારવી અને જીવનમાં સંતુલન વિકસાવવું છે. આધ્યાત્મિક પરંપરામાં આ આંતરિક શાંતિને આત્મવિચાર અને મુક્તિ તરફની સાધના સાથે પણ જોડવામાં આવે છે.</p>`},
pranayama:{title:"🌬️ પ્રાણાયામ",html:`
<h2>પ્રાણાયામનો અર્થ</h2>
<p>પ્રાણાયામ ભારતીય યોગપરંપરામાં શ્વાસ અને પ્રાણની જાગૃતિ સાથે જોડાયેલો અભ્યાસ છે. “પ્રાણ”ને જીવનશક્તિ અને “આયામ”ને વિસ્તાર અથવા નિયંત્રણ તરીકે સમજાવવામાં આવે છે. વ્યવહારિક રીતે પ્રાણાયામમાં શ્વાસની ગતિ, તેની જાગૃતિ અને શ્વાસ લેવાની-છોડવાની રીત પર ધ્યાન આપવામાં આવે છે.</p>
<p>પ્રાણાયામનો અભ્યાસ હંમેશા આરામદાયક અને નિયંત્રિત રીતે થવો જોઈએ. શ્વાસને બળજબરીથી લાંબો કરવો, લાંબા સમય સુધી રોકવો અથવા ઝડપથી શ્વાસ લેવો દરેક વ્યક્તિ માટે યોગ્ય નથી. શરૂઆતમાં કુદરતી શ્વાસનું નિરીક્ષણ અને ધીમો, આરામદાયક શ્વાસ જાગૃતિનો અભ્યાસ વધુ સરળ છે.</p>
<h3>પ્રાણાયામના પરંપરાગત પ્રકારો</h3>
<p><b>નાડી શોધન:</b> યોગપરંપરામાં તેને નાડીઓના સંતુલન સાથે જોડવામાં આવે છે. સામાન્ય રીતે આ અભ્યાસ શાંત, ધીમા અને જાગૃત શ્વાસ સાથે કરવામાં આવે છે.</p>
<p><b>ભ્રામરી:</b> શ્વાસ છોડતી વખતે મધમાખી જેવા નાદ પર ધ્યાન કેન્દ્રિત કરવાની પરંપરાગત પદ્ધતિ છે. તેનો મુખ્ય ભાર અવાજ અને આંતરિક એકાગ્રતા પર છે.</p>
<p><b>ઉજ્જાયી:</b> યોગમાં વર્ણવાતી શ્વાસની એક પદ્ધતિ છે જેમાં શ્વાસની ગતિ અને અવાજ પ્રત્યે જાગૃતિ રાખવામાં આવે છે. તેને શીખવા માટે યોગ્ય માર્ગદર્શન ઉપયોગી છે.</p>
<p><b>શીતલી અને શીતકારી:</b> પરંપરાગત યોગગ્રંથોમાં શીતળતા સાથે જોડાયેલી શ્વાસ પદ્ધતિઓ તરીકે વર્ણવાય છે. દરેક વ્યક્તિ માટે દરેક પદ્ધતિ યોગ્ય હોય એવું જરૂરી નથી.</p>
<h3>સુરક્ષિત અભ્યાસના સિદ્ધાંતો</h3><ul><li>શ્વાસને ક્યારેય દુખાવો કે ઘબરાટ થાય ત્યાં સુધી ખેંચવો નહીં.</li><li>શ્વાસ રોકવાની અદ્યતન પદ્ધતિઓ સ્વતંત્ર રીતે અજમાવવાને બદલે જાણકાર માર્ગદર્શકની દેખરેખમાં શીખવી.</li><li>ચક્કર, છાતીમાં અસ્વસ્થતા, શ્વાસ લેવામાં તકલીફ અથવા અન્ય અસામાન્ય લક્ષણ થાય તો તરત રોકાઈ જવું.</li><li>પ્રાણાયામને શરીર માટે “ઝડપી પરિણામ” મેળવવાની સ્પર્ધા ન બનાવવી.</li></ul>
<h3>દૈનિક અભ્યાસ વિશે</h3><p>સારો અભ્યાસ નિયમિતતા, શાંતિ અને સ્વ-જાગૃતિ પર આધારિત હોય છે. થોડો સમય શાંત બેસીને શ્વાસને જોવો, શરીરની સ્થિતિ સુધારવી અને ધ્યાન ભટકે ત્યારે ફરીથી શ્વાસ તરફ ધ્યાન લાવવું — આ બધું પ્રાણાયામ અને ધ્યાનની પાયાની જાગૃતિ વિકસાવી શકે છે.</p>`},
chakras:{title:"🌈 માનવ શરીરના 7 ચક્ર",html:`
<h2>સાત ચક્રોની પરંપરાગત સમજ</h2>
<p>ચક્રોની કલ્પના ભારતીય યોગ અને તંત્ર પરંપરાઓમાં સૂક્ષ્મ શરીર સાથે જોડાયેલી આધ્યાત્મિક પ્રતીકાત્મક વ્યવસ્થા તરીકે જોવા મળે છે. અહીં “ચક્ર”નો અર્થ પરંપરાગત સૂક્ષ્મ ઊર્જાકેન્દ્ર છે; તેને આધુનિક શરીરવિજ્ઞાનમાં સાબિત થયેલા ભૌતિક અંગ તરીકે સમજવું યોગ્ય નથી. વિવિધ પરંપરાઓમાં નામ, સ્થાન, રંગ અને વિગતોમાં થોડો ફેરફાર જોવા મળે છે.</p>
<h3>1. મૂળાધાર ચક્ર — Muladhara</h3><p><b>પરંપરાગત સ્થાન:</b> શરીરના તળિયાના ભાગ સાથે પ્રતીકાત્મક રીતે જોડાય છે. <b>તત્વ:</b> પૃથ્વી. <b>પ્રતીકાત્મક વિષય:</b> સ્થિરતા, સુરક્ષા, ધરતી સાથે જોડાણ અને મૂળભૂત જીવનભાવ. મૂળાધારની સાધનામાં સ્થિર બેસવું, શરીરની જાગૃતિ અને જીવનની મૂળભૂત જવાબદારીઓ પ્રત્યે સચેત રહેવાનું પ્રતીકાત્મક મહત્વ આપવામાં આવે છે.</p>
<h3>2. સ્વાધિષ્ઠાન ચક્ર — Svadhisthana</h3><p><b>પરંપરાગત સ્થાન:</b> નીચલા પેટના વિસ્તાર સાથે પ્રતીકાત્મક રીતે જોડાય છે. <b>તત્વ:</b> જળ. <b>વિષય:</b> લાગણીઓ, સર્જનાત્મકતા, અનુકૂલન અને જીવનના પ્રવાહને સ્વીકારવો. આ ચક્ર વિશેની પરંપરાગત ભાષા વ્યક્તિને પોતાની લાગણીઓ ઓળખવા અને સંતુલિત રીતે વ્યક્ત કરવાની યાદ અપાવે છે.</p>
<h3>3. મણિપુર ચક્ર — Manipura</h3><p><b>પરંપરાગત સ્થાન:</b> નાભિ અને પેટના મધ્ય વિસ્તાર સાથે જોડાય છે. <b>તત્વ:</b> અગ્નિ. <b>વિષય:</b> આત્મવિશ્વાસ, સંકલ્પ, શિસ્ત અને કાર્યશક્તિ. મણિપુરનું પ્રતીક વ્યક્તિની અંદરની “હું કરી શકું” ભાવના અને પોતાના નિર્ણયો માટે જવાબદારી લેવાની ક્ષમતા સાથે જોડાય છે.</p>
<h3>4. અનાહત ચક્ર — Anahata</h3><p><b>પરંપરાગત સ્થાન:</b> હૃદય વિસ્તાર. <b>તત્વ:</b> વાયુ. <b>વિષય:</b> કરુણા, પ્રેમ, ક્ષમા, સંતુલન અને સહાનુભૂતિ. અનાહતની આધ્યાત્મિક સમજ આપણને પોતાના અને અન્ય લોકો પ્રત્યે દયાળુ બનવા તરફ દોરી જાય છે. અહીં “પ્રેમ”નો અર્થ માત્ર વ્યક્તિગત લાગણી નહીં પરંતુ વ્યાપક કરુણા પણ છે.</p>
<h3>5. વિશુદ્ધિ ચક્ર — Vishuddha</h3><p><b>પરંપરાગત સ્થાન:</b> ગળાના વિસ્તાર સાથે જોડાય છે. <b>તત્વ:</b> આકાશ. <b>વિષય:</b> વાણી, સત્ય, અભિવ્યક્તિ અને સાંભળવાની ક્ષમતા. વિશુદ્ધિની પ્રતીકાત્મક સાધના વ્યક્તિને બોલતા પહેલાં વિચારવા, સત્ય અને સૌમ્યતાનું પાલન કરવા તથા બીજાને ધ્યાનથી સાંભળવા પ્રેરણા આપે છે.</p>
<h3>6. આજ્ઞા ચક્ર — Ajna</h3><p><b>પરંપરાગત સ્થાન:</b> ભ્રૂમધ્ય સાથે પ્રતીકાત્મક રીતે જોડાય છે. <b>વિષય:</b> એકાગ્રતા, આંતરિક નિરીક્ષણ, સમજ અને વિવેક. આજ્ઞા ચક્રને ઘણી વાર “અંતરદૃષ્ટિ” સાથે જોડવામાં આવે છે. તેનો વ્યવહારુ પાઠ એ છે કે વ્યક્તિ વિચારો અને લાગણીઓને તરત જ સાચા માની લેવાને બદલે તેમને નિરીક્ષે અને પછી નિર્ણય કરે.</p>
<h3>7. સહસ્રાર ચક્ર — Sahasrara</h3><p><b>પરંપરાગત સ્થાન:</b> માથાના શિખર સાથે પ્રતીકાત્મક રીતે જોડાય છે. <b>વિષય:</b> ચેતના, આધ્યાત્મિક એકતા, જ્ઞાન અને પરમ તત્વ પ્રત્યેનું સમર્પણ. સહસ્રારને ઘણી પરંપરાઓમાં હજારો પાંખડીઓવાળા કમળ તરીકે દર્શાવવામાં આવે છે. તે કોઈ ભૌતિક અંગ નહીં પરંતુ ઊંચી આધ્યાત્મિક જાગૃતિનું પ્રતીક છે.</p>
<h3>ચક્રોને કેવી રીતે સમજવું?</h3><p>ચક્રોને “શરીરમાં દેખાતા સાત ભાગ” તરીકે સમજવા કરતાં યોગપરંપરાની ભાષા, પ્રતીકો અને આત્મચિંતનની પદ્ધતિ તરીકે સમજવું વધુ યોગ્ય છે. ધ્યાન, નૈતિક જીવન, સ્વ-નિરીક્ષણ અને શાંત શ્વાસ જેવી સાધનાઓમાં આ પ્રતીકોનો ઉપયોગ મનને એકાગ્ર કરવા માટે થઈ શકે છે.</p>`},
siddhis:{title:"✨ અષ્ટ સિદ્ધિઓ",html:`
<h2>અષ્ટ સિદ્ધિઓ — પરંપરાગત આધ્યાત્મિક વિચાર</h2>
<p>ભારતીય યોગ, પુરાણ અને ભક્તિપરંપરાઓમાં “સિદ્ધિ” શબ્દ વિશેષ આધ્યાત્મિક ક્ષમતા અથવા પૂર્ણતા માટે વપરાય છે. અષ્ટ સિદ્ધિઓની યાદી વિવિધ ગ્રંથો અને પરંપરાઓમાં થોડા અર્થભેદ સાથે મળે છે. નીચેની સમજ પરંપરાગત ધાર્મિક-આધ્યાત્મિક વર્ણનોને સમજવા માટે છે; આ દાવાઓને આધુનિક વૈજ્ઞાનિક ક્ષમતાઓ તરીકે માનવા જોઈએ નહીં.</p>
<h3>1. અણિમા — Aṇimā</h3><p>અણિમાનો અર્થ પરંપરાગત રીતે અતિસૂક્ષ્મ અથવા અણુ જેટલા નાના થવાની શક્તિ તરીકે વર્ણવાય છે. આધ્યાત્મિક અર્થઘટનમાં તેનો સંબંધ અહંકારને નાનું કરવાની અને પોતાના “હું”ને વિશાળ સત્ય સામે નમ્ર બનાવવાની પ્રતીકાત્મક સમજ સાથે પણ કરવામાં આવે છે.</p>
<h3>2. મહિમા — Mahimā</h3><p>મહિમા એટલે અતિ વિશાળ થવાની અથવા વિશાળતા પ્રાપ્ત કરવાની સિદ્ધિ તરીકે વર્ણવાય છે. પ્રતીકાત્મક રીતે તે વ્યક્તિની ચેતનાને સંકુચિત સ્વાર્થમાંથી બહાર લાવી વિશાળ દૃષ્ટિકોણ વિકસાવવાની યાદ અપાવે છે.</p>
<h3>3. ગરિમા — Garimā</h3><p>ગરિમા પરંપરામાં અતિ ભારે થવાની શક્તિ તરીકે વર્ણવાય છે. આધ્યાત્મિક વાંચનમાં તેને સ્થિરતા, ગંભીરતા અને પોતાના ધર્મ અથવા કર્તવ્યમાં અડગ રહેવાના પ્રતીક તરીકે પણ સમજાવી શકાય છે.</p>
<h3>4. લઘિમા — Laghimā</h3><p>લઘિમા અતિ હળવા થવાની સિદ્ધિ તરીકે વર્ણવાય છે. પ્રતીકાત્મક રીતે તે મનના ભાર, અતિશય ચિંતા અને અનાવશ્યક આસક્તિઓને હળવી કરવાની કલ્પના સાથે જોડાઈ શકે છે.</p>
<h3>5. પ્રાપ્તિ — Prāpti</h3><p>પ્રાપ્તિનો પરંપરાગત અર્થ ઇચ્છિત વસ્તુ અથવા સ્થાન સુધી પહોંચવાની વિશેષ ક્ષમતા તરીકે કરવામાં આવે છે. આધ્યાત્મિક અર્થમાં તેનો એક પાઠ એવો હોઈ શકે કે યોગ્ય જ્ઞાન, સાધના અને પ્રયત્ન દ્વારા વ્યક્તિ પોતાના ધ્યેય સુધી પહોંચવા માટે સતત પ્રયત્નશીલ રહે.</p>
<h3>6. પ્રાકામ્ય — Prākāmya</h3><p>પ્રાકામ્યને ઇચ્છિત અનુભવ અથવા કાર્ય પૂર્ણ કરવાની વિશેષ શક્તિ તરીકે વર્ણવવામાં આવે છે. તેને આધ્યાત્મિક રીતે જોતા, ઇચ્છાઓને સમજવી, તેમને શિસ્તમાં રાખવી અને યોગ્ય ધ્યેય માટે સંકલ્પપૂર્વક કાર્ય કરવું મહત્વનું બની જાય છે.</p>
<h3>7. ઈશિત્વ — Īśitva</h3><p>ઈશિત્વનો અર્થ પરંપરાગત રીતે પ્રભુત્વ અથવા નિયંત્રણની વિશેષ શક્તિ તરીકે આપવામાં આવે છે. આ વિચારનો સારો નૈતિક પાઠ એ છે કે સાચું નેતૃત્વ બીજાઓ પર બળજબરી નહીં પરંતુ પોતાના મન, ક્રોધ, લોભ અને અહંકાર પર સંયમથી શરૂ થાય છે.</p>
<h3>8. વશિત્વ — Vaśitva</h3><p>વશિત્વને વસ્તુઓ અથવા શક્તિઓને વશમાં રાખવાની સિદ્ધિ તરીકે વર્ણવવામાં આવે છે. આધ્યાત્મિક દૃષ્ટિએ તેનો ઉપયોગ બીજાને નિયંત્રિત કરવા કરતાં પોતાની ઇન્દ્રિયો, વૃત્તિઓ અને પ્રતિક્રિયાઓ પર સંયમ મેળવવાના પ્રતીક તરીકે સમજવો વધુ અર્થપૂર્ણ છે.</p>
<h3>સિદ્ધિઓ વિશે મુખ્ય સંદેશ</h3><p>યોગપરંપરામાં સિદ્ધિઓની ચર્ચા હોવા છતાં અનેક આધ્યાત્મિક શિક્ષણોમાં ચેતવણી આપવામાં આવે છે કે અસાધારણ શક્તિઓની પાછળ દોડવાથી સાધનાનો મૂળ હેતુ — આત્મજ્ઞાન, વૈરાગ્ય, કરુણા અને આંતરિક શાંતિ — ભૂલી શકાય છે. તેથી અષ્ટ સિદ્ધિઓને રસપ્રદ પરંપરાગત જ્ઞાન તરીકે વાંચી શકાય, પરંતુ રોજિંદા જીવનમાં સત્ય, સંયમ, દયા, એકાગ્રતા અને જવાબદારી જેવા ગુણો વિકસાવવાનું વધારે મહત્વનું છે.</p>`}
};
function renderYoga(){const y=data.yoga||{topic:"overview",fontSize:19,bookmarked:false};const topic=y.topic||"overview";const c=YOGA_CONTENT[topic]||YOGA_CONTENT.overview;$("#yogaTopic").value=topic;$("#yogaFont").value=y.fontSize||19;$("#yogaContent").style.fontSize=(y.fontSize||19)+"px";$("#yogaContent").innerHTML=c.html;$("#yogaBookmark").textContent=y.bookmarked?"🔖 Bookmarked":"🔖 Bookmark"}
function initYoga(){renderYoga()}
$("#yogaTopic").onchange=e=>{data.yoga.topic=e.target.value;save();renderYoga()};$("#yogaFont").oninput=e=>{data.yoga.fontSize=Number(e.target.value);save();renderYoga()};$("#yogaBookmark").onclick=()=>{data.yoga.bookmarked=!data.yoga.bookmarked;save();renderYoga();showToast(data.yoga.bookmarked?"🔖 Yoga topic bookmarked":"🔖 Bookmark removed")};

const ranges=[[0,499,"#555b66","0-499"],[500,999,"#9b1e2c","500-999"],[1000,1499,"#b86500","1000-1499"],[1500,1999,"#a89100","1500-1999"],[2000,4999,"#1557a8","2000-4999"],[5000,9999,"#64239a","5000-9999"],[10000,14999,"#137a43","10000-14999"],[15000,Infinity,"#8d6a18","15000+"]];
function range(c){return ranges.find(r=>c>=r[0]&&c<=r[1])||ranges[0]}
function drawCalendar(){
 const y=cal.getFullYear(),m=cal.getMonth(),first=new Date(y,m,1).getDay(),last=new Date(y,m+1,0).getDate();
 $("#month").textContent=new Date(y,m,1).toLocaleDateString("gu-IN",{month:"long",year:"numeric"});
 let h="";for(let i=0;i<first;i++)h+='<div></div>';
 for(let d=1;d<=last;d++){const k=`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`,c=Number(data.days[k]||0),r=range(c),pr=ptxt(c/data.targets.main*100);h+=`<div class="day ${c===0?"zero":""}" data-date="${k}" style="background:linear-gradient(135deg,${r[2]}44,#121521 70%);border-color:${r[2]}99"><div class="num">${d}</div><div class="count" style="color:${c?r[2]:"#999"}">${fmt(c)}</div><div class="percent">${pr}</div></div>`}
 $("#days").innerHTML=h;
 $("#days").querySelectorAll(".day[data-date]").forEach(e=>e.onclick=()=>showDayDetail(e.dataset.date));
 $("#legend").innerHTML=ranges.map(r=>`<span><i style="background:${r[2]}"></i>${r[3]}</span>`).join("")
}
$("#prev").onclick=()=>{cal.setMonth(cal.getMonth()-1);drawCalendar()};$("#next").onclick=()=>{cal.setMonth(cal.getMonth()+1);drawCalendar()};$("#todayBtn").onclick=()=>{cal=new Date();drawCalendar()};

function valuesDaily(){const a=[],l=[];for(let i=30;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);l.push(`${d.getDate()}/${d.getMonth()+1}`);a.push(Number(data.days[iso(d)]||0))}return[l,a]}
function valuesMonthly(){const l=[],a=[],n=new Date();for(let i=11;i>=0;i--){const d=new Date(n.getFullYear(),n.getMonth()-i,1),pre=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-`;l.push(d.toLocaleDateString("gu-IN",{month:"short"}));a.push(Object.entries(data.days).filter(([k])=>k.startsWith(pre)).reduce((s,[,v])=>s+Number(v),0))}return[l,a]}
function chart(id,labels,vals){
 const c=$("#"+id); if(!c)return;
 const ctx=c.getContext("2d"),w=Math.max(520,c.clientWidth||700),h=Math.max(320,c.clientHeight||360),r=Math.max(1,devicePixelRatio||1);
 c.width=w*r;c.height=h*r;c.style.height=h+"px";ctx.setTransform(r,0,0,r,0,0);ctx.clearRect(0,0,w,h);

 const max=Math.max(1,...vals),padL=62,padR=24,padT=28,padB=48;
 const plotW=w-padL-padR,plotH=h-padT-padB;
 const yVal=v=>padT+plotH-(v/max)*plotH;
 const xVal=i=>padL+(vals.length===1?plotW/2:i*(plotW/Math.max(1,vals.length-1)));

 // Background
 ctx.fillStyle="rgba(4,7,20,.28)";ctx.fillRect(0,0,w,h);

 // Grid + Y labels
 ctx.font="12px system-ui";ctx.textAlign="right";
 for(let i=0;i<=5;i++){
   const y=padT+plotH*i/5, value=max*(1-i/5);
   ctx.strokeStyle="rgba(255,255,255,.09)";ctx.lineWidth=1;
   ctx.beginPath();ctx.moveTo(padL,y);ctx.lineTo(w-padR,y);ctx.stroke();
   ctx.fillStyle="#8e94aa";ctx.fillText(formatGraphValue(value),padL-10,y+4);
 }
 // Vertical guide lines
 for(let i=0;i<vals.length;i++){
   if(vals.length<=12 || i%3===0 || i===vals.length-1){
     const x=xVal(i);ctx.strokeStyle="rgba(255,255,255,.035)";
     ctx.beginPath();ctx.moveTo(x,padT);ctx.lineTo(x,padT+plotH);ctx.stroke();
   }
 }

 // Area under line
 const pts=vals.map((v,i)=>[xVal(i),yVal(v)]);
 if(pts.length){
   ctx.beginPath();ctx.moveTo(pts[0][0],padT+plotH);
   pts.forEach(p=>ctx.lineTo(p[0],p[1]));
   ctx.lineTo(pts[pts.length-1][0],padT+plotH);ctx.closePath();
   const grad=ctx.createLinearGradient(0,padT,0,padT+plotH);
   grad.addColorStop(0,"rgba(145,76,245,.28)");grad.addColorStop(1,"rgba(145,76,245,.015)");
   ctx.fillStyle=grad;ctx.fill();
 }
 // Main line
 if(pts.length){
   ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));
   ctx.strokeStyle="#a56cff";ctx.lineWidth=3;ctx.lineJoin="round";ctx.lineCap="round";ctx.shadowColor="rgba(165,108,255,.45)";ctx.shadowBlur=10;ctx.stroke();ctx.shadowBlur=0;
   // points
   pts.forEach((p,i)=>{
     ctx.beginPath();ctx.arc(p[0],p[1],4.5,0,Math.PI*2);ctx.fillStyle="#0b0e1d";ctx.fill();ctx.strokeStyle="#caa4ff";ctx.lineWidth=2;ctx.stroke();
   });
 }
 // X labels
 ctx.font="11px system-ui";ctx.textAlign="center";ctx.fillStyle="#9da2b5";
 const skip=vals.length>24?3:vals.length>12?2:1;
 labels.forEach((lab,i)=>{
   if(i%skip!==0 && i!==labels.length-1)return;
   const x=xVal(i);ctx.fillText(lab,x,h-18);
 });
 // Hover support
 let tip=c.parentElement.querySelector(".chart-tooltip");
 if(!tip){tip=document.createElement("div");tip.className="chart-tooltip";c.parentElement.appendChild(tip)}
 const move=e=>{
   const rect=c.getBoundingClientRect(),mx=e.clientX-rect.left;
   const i=Math.max(0,Math.min(vals.length-1,Math.round((mx-padL)/Math.max(1,plotW/Math.max(1,vals.length-1)))));
   const p=pts[i]; if(!p)return;
   const tx=Math.min(w-170,Math.max(8,p[0]+12)),ty=Math.max(8,p[1]-70);
   tip.style.left=tx+"px";tip.style.top=ty+"px";tip.innerHTML=`<b>${labels[i]}</b><br><strong>${fmt(vals[i])}</strong> Jaap`;tip.classList.add("show");
 };
 c.onmousemove=move;c.onmouseleave=()=>tip.classList.remove("show");
 c.ontouchstart=e=>{if(e.touches[0])move(e.touches[0])};c.ontouchmove=e=>{if(e.touches[0]){e.preventDefault();move(e.touches[0])}};
}
function formatGraphValue(v){
 v=Math.round(v);
 if(v>=10000000)return (v/10000000).toFixed(v%10000000?1:0)+"Cr";
 if(v>=100000)return (v/100000).toFixed(v%100000?1:0)+"L";
 if(v>=1000)return (v/1000).toFixed(v%1000?1:0)+"K";
 return String(v);
}
function drawGraphs(a,b){let x=valuesDaily();chart(a,x[0],x[1]);x=valuesMonthly();chart(b,x[0],x[1])}

$("#download").onclick=()=>{const blob=new Blob([JSON.stringify({app:"Om Namah Shivay Jaap Counter",version:5,target:data.targets.main,targets:data.targets,days:data.days,sound:data.sound,theme:data.theme,volume:data.volume,speed:data.speed,autoAudio:data.autoAudio,pinHash:data.pinHash||"",notifications:data.notifications,exportedAt:new Date().toISOString()},null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="Mahadev_Jaap_Backup.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)};
$("#restore").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(!x.days)throw 0;data.days=x.days;data.sound=x.sound!==false;data.targets={...DEFAULT_TARGETS,...(x.targets||{})};data.pinHash=x.pinHash||data.pinHash||"";data.theme=x.theme||data.theme||"mahadev";data.volume=Number(x.volume??data.volume??.55);data.speed=Number(x.speed??data.speed??1);data.autoAudio=x.autoAudio!==false;data.notifications={...(data.notifications||{}),...(x.notifications||{})};save();refresh();drawCalendar();applyTargetInputs();applyTheme();loadNotificationSettings();updateNotificationStatus();updateReports();updateSharePreview();alert("Backup restore થયું. 🙏")}catch(err){alert("Invalid backup file.")}};r.readAsText(f)};

document.addEventListener("keydown",e=>{if(e.code==="Space"&&document.querySelector("#live.active")){e.preventDefault();if(running)$("#jaap").click()}});
window.addEventListener("resize",()=>{
 if($("#calendar").classList.contains("active"))drawGraphs("daily","monthly");
 if($("#graph").classList.contains("active"))drawGraphs("daily2","monthly2");
});


function applyTargetInputs(){
 ["mainTarget","dailyTarget","weeklyTarget","monthlyTarget","yearlyTarget"].forEach(id=>{const key=id.replace("Target","");const e=$("#"+id);if(e)e.value=data.targets[key]??DEFAULT_TARGETS[key]});
 if($("#pinStatus")) $("#pinStatus").textContent="PIN Lock: "+(data.pinHash?"ON 🔒":"OFF");
}
$("#saveTargets").onclick=()=>{const vals={main:Number($("#mainTarget").value),daily:Number($("#dailyTarget").value),weekly:Number($("#weeklyTarget").value),monthly:Number($("#monthlyTarget").value),yearly:Number($("#yearlyTarget").value)};if(Object.values(vals).some(v=>!Number.isFinite(v)||v<1)){alert("બધા targetમાં 1 કે તેથી વધુ સંખ્યા આપો.");return}data.targets=vals;save();refresh();updateReports();$("#targetMsg").textContent="Smart targets સેવ થયા. 🎯"};

function reportDatePicker(type){return type==="daily"?`<input id="dailyDatePick" type="date" value="${today()}">`:`<input id="monthlyDatePick" type="month" value="${today().slice(0,7)}">`}
function updateReports(){
 const dailyBox=$("#dailyReport"),monthlyBox=$("#monthlyReport");if(!dailyBox)return;
 const dk=$("#dailyDatePick")?.value||today(),dc=Number(data.days[dk]||0),ds=stats();
 const mala=Math.floor(dc/108),remMala=dc%108;
 dailyBox.innerHTML=`<div class="report-head"><h3>📊 Daily Report</h3>${reportDatePicker("daily")}</div><div class="report-grid"><div class="report-metric"><span>🕉️ Total Jaap</span><b>${fmt(dc)}</b></div><div class="report-metric"><span>📿 Complete Mala</span><b>${fmt(mala)}</b></div><div class="report-metric"><span>➕ Next Mala</span><b>${fmt(remMala)}/108</b></div><div class="report-metric"><span>🎯 Daily Target</span><b>${fmt(data.targets.daily)}</b></div><div class="report-metric"><span>📈 Target Progress</span><b>${ptxt(dc/data.targets.daily*100)}</b></div><div class="report-metric"><span>🏆 Best Day</span><b>${fmt(ds.bestDay)}</b></div><div class="report-metric"><span>🔥 Current Streak</span><b>${ds.currentStreak} days</b></div><div class="report-metric"><span>📅 Active Days</span><b>${ds.activeDays}</b></div></div><div class="report-highlight">${dc>=data.targets.daily?"🎉 આજનું Daily Target પૂર્ણ થયું!":"🎯 આજે હજુ "+fmt(Math.max(0,data.targets.daily-dc))+" જાપ બાકી છે."}</div>`;
 $("#dailyDatePick").onchange=updateReports;
 const ym=$("#monthlyDatePick")?.value||today().slice(0,7);const arr=Object.entries(data.days).filter(([k])=>k.startsWith(ym+"-"));const mt=arr.reduce((s,[,v])=>s+Number(v||0),0),active=arr.filter(([,v])=>Number(v)>0).length,best=arr.reduce((m,[,v])=>Math.max(m,Number(v||0)),0),avg=active?mt/active:0;
 monthlyBox.innerHTML=`<div class="report-head"><h3>📆 Monthly Report</h3>${reportDatePicker("monthly")}</div><div class="report-grid"><div class="report-metric"><span>🕉️ Total Jaap</span><b>${fmt(mt)}</b></div><div class="report-metric"><span>📅 Active Days</span><b>${active}</b></div><div class="report-metric"><span>📊 Daily Average</span><b>${fmt(Math.round(avg))}</b></div><div class="report-metric"><span>⭐ Best Day</span><b>${fmt(best)}</b></div><div class="report-metric"><span>🎯 Monthly Target</span><b>${fmt(data.targets.monthly)}</b></div><div class="report-metric"><span>📈 Target Progress</span><b>${ptxt(tgtProgress(mt,data.targets.monthly))}</b></div><div class="report-metric"><span>📿 Mala</span><b>${fmt(Math.floor(mt/108))}</b></div><div class="report-metric"><span>🏆 Yearly Target</span><b>${fmt(data.targets.yearly)}</b></div></div><div class="report-highlight">${mt>=data.targets.monthly?"🎉 આ મહિનાનું Monthly Target પૂર્ણ થયું!":"🎯 Monthly Target માટે હજુ "+fmt(Math.max(0,data.targets.monthly-mt))+" જાપ બાકી છે."}</div>`;
 $("#monthlyDatePick").onchange=updateReports;
}
function tgtProgress(value,target=data.targets.main){return target>0?value/target*100:0}
$("#dailyReportTab").onclick=()=>{$("#dailyReport").classList.remove("hidden");$("#monthlyReport").classList.add("hidden");$("#dailyReportTab").classList.add("active");$("#monthlyReportTab").classList.remove("active");updateReports()};
$("#monthlyReportTab").onclick=()=>{$("#dailyReport").classList.add("hidden");$("#monthlyReport").classList.remove("hidden");$("#dailyReportTab").classList.remove("active");$("#monthlyReportTab").classList.add("active");updateReports()};

function normalizePin(value){
 let s=String(value??"").trim().replace(/\s+/g,"");
 const map={"૦":"0","૧":"1","૨":"2","૩":"3","૪":"4","૫":"5","૬":"6","૭":"7","૮":"8","૯":"9","٠":"0","١":"1","٢":"2","٣":"3","٤":"4","٥":"5","٦":"6","٧":"7","٨":"8","٩":"9"};
 s=[...s].map(ch=>map[ch]??ch).join("");
 return s;
}
async function hashPin(pin){
 const normalized=normalizePin(pin);
 if(window.crypto?.subtle){
  const bytes=new TextEncoder().encode(normalized);
  const hash=await crypto.subtle.digest("SHA-256",bytes);
  return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,"0")).join("");
 }
 // Fallback for local file:// pages where Web Crypto may be unavailable.
 let h=2166136261; for(let i=0;i<normalized.length;i++){h^=normalized.charCodeAt(i);h=Math.imul(h,16777619)}
 return "fallback-"+(h>>>0).toString(16);
}
async function setPin(){
 const raw=$("#pinInput").value; const pin=normalizePin(raw);
 if(!/^\d{4,12}$/.test(pin)){alert("PIN 4 થી 12 અંકોનો હોવો જોઈએ. ઉદાહરણ: 1234 અથવા 12345678");return}
 data.pinHash=await hashPin(pin); data.pinLength=pin.length; $("#pinInput").value=""; save();
 $("#pinStatus").textContent="PIN Lock: ON 🔒"; alert("PIN Lock ON થઈ ગયું. હવે website ફરી ખોલશો ત્યારે PIN માંગશે. 🔐");
}
async function removePin(){
 if(!data.pinHash){alert("PIN Lock પહેલેથી OFF છે.");return}
 const pin=prompt("હાલનો PIN દાખલ કરો:"); if(pin===null)return;
 if(await hashPin(pin)!==data.pinHash){alert("PIN ખોટો છે.");return}
 data.pinHash=""; data.pinLength=0; save(); $("#pinStatus").textContent="PIN Lock: OFF"; alert("PIN Lock OFF થઈ ગયું.");
}
async function unlock(){
 const pin=normalizePin($("#unlockPin").value);
 if(!/^\d{4,12}$/.test(pin)){ $("#unlockMsg").textContent="4 થી 12 અંકોનો PIN દાખલ કરો."; return; }
 if(await hashPin(pin)===data.pinHash){$("#pinLock").classList.add("hidden");$("#unlockPin").value="";$("#unlockMsg").textContent=""}
 else{$("#unlockMsg").textContent="PIN ખોટો છે. ફરી પ્રયાસ કરો.";$("#unlockPin").select()}
}
$("#setPin").onclick=setPin;$("#removePin").onclick=removePin;$("#unlockBtn").onclick=unlock;$("#unlockPin").addEventListener("keydown",e=>{if(e.key==="Enter")unlock()});
function initPin(){applyTargetInputs();if(data.pinHash){$("#pinLock").classList.remove("hidden");setTimeout(()=>$("#unlockPin").focus(),50)}}

function loadNotificationSettings(){
 const n=data.notifications||{}; $("#notify108").checked=n.notify108!==false;$("#notify1000").checked=n.notify1000!==false;$("#notifyDaily").checked=n.notifyDaily!==false;$("#notifyMilestone").checked=n.notifyMilestone!==false;updateNotificationStatus();
}
function saveNotificationSettings(){data.notifications={notify108:$("#notify108").checked,notify1000:$("#notify1000").checked,notifyDaily:$("#notifyDaily").checked,notifyMilestone:$("#notifyMilestone").checked};save();updateNotificationStatus()}
function updateNotificationStatus(){const e=$("#notificationStatus");if(!e)return;const browser=("Notification" in window)?Notification.permission:"unsupported";e.textContent=browser==="granted"?"Notifications: ON 🔔":browser==="denied"?"Notifications: Blocked — browser permission allow કરો.":"Notifications: OFF"}
$$("#notify108,#notify1000,#notifyDaily,#notifyMilestone").forEach(e=>e?.addEventListener("change",saveNotificationSettings));
$("#enableNotifications").onclick=async()=>{if(!("Notification" in window)){showToast("આ browserમાં notifications ઉપલબ્ધ નથી.");return}try{const p=await Notification.requestPermission();updateNotificationStatus();if(p==="granted")notifyUser("Custom notifications ON થઈ ગઈ.");else showToast("Notification permission allow કરો.")}catch(e){showToast("Notification permission મળી શકી નથી.")}};
function shareText(){const s=stats(),t=today(),dc=Number(data.days[t]||0),m=Math.floor(dc/108);return `🕉️ Om Namah Shivay\n\n📅 ${t}\n🕉️ Today's Jaap: ${fmt(dc)}\n📿 Mala: ${fmt(m)}\n🔥 Current Streak: ${s.currentStreak} days\n🏆 Best Day: ${fmt(s.bestDay)}\n📊 Total Jaap: ${fmt(s.total)}\n🎯 Target Progress: ${ptxt(pct())}\n\nHar Har Mahadev 🔱`}
function updateSharePreview(){const e=$("#sharePreview");if(e)e.textContent=shareText().split("\n").slice(0,4).join(" • ")+" …"}
async function shareProgress(){const text=shareText();try{if(navigator.share){await navigator.share({title:"Om Namah Shivay Jaap Progress",text})}else if(navigator.clipboard){await navigator.clipboard.writeText(text);showToast("📋 Progress copied.")}else{prompt("Copy your progress:",text)}}catch(e){if(e?.name!=="AbortError")showToast("Share cancel થયું.")}}
$("#shareProgress").onclick=shareProgress;
$("#copyProgress").onclick=async()=>{const text=shareText();try{await navigator.clipboard.writeText(text);showToast("📋 Progress copied.")}catch(e){prompt("Copy your progress:",text)}};
function downloadProgressCard(){const c=document.createElement("canvas");c.width=1200;c.height=700;const x=c.getContext("2d");x.fillStyle="#050719";x.fillRect(0,0,c.width,c.height);const g=x.createRadialGradient(600,260,20,600,300,600);g.addColorStop(0,"#25123d");g.addColorStop(1,"#050719");x.fillStyle=g;x.fillRect(0,0,c.width,c.height);x.strokeStyle="#a85cff";x.lineWidth=3;x.strokeRect(35,35,c.width-70,c.height-70);x.textAlign="center";x.fillStyle="#d69aff";x.font="90px serif";x.fillText("ॐ",600,150);x.fillStyle="#fff";x.font="bold 48px sans-serif";x.fillText("Om Namah Shivay",600,220);x.font="bold 72px sans-serif";x.fillText(fmt(Number(data.days[today()]||0)),600,340);x.font="28px sans-serif";x.fillStyle="#cbd0df";x.fillText("Today's Jaap",600,385);x.font="26px sans-serif";x.fillText(`Total: ${fmt(total())}   •   Streak: ${stats().currentStreak} days   •   Mala: ${fmt(Math.floor(Number(data.days[today()]||0)/108))}`,600,455);x.fillStyle="#f1d66a";x.fillText(`Target Progress: ${ptxt(pct())}`,600,515);x.fillStyle="#b9a6cc";x.font="24px sans-serif";x.fillText("Har Har Mahadev 🔱",600,590);const a=document.createElement("a");a.download="Mahadev_Jaap_Progress.png";a.href=c.toDataURL("image/png");a.click()}
$("#downloadProgressCard").onclick=downloadProgressCard;

function applyTheme(){
 document.body.dataset.theme=data.theme||"mahadev";
 if($("#themeSelect")) $("#themeSelect").value=data.theme||"mahadev";
 $$(".theme-tile").forEach(b=>b.classList.toggle("active",b.dataset.themeChoice===(data.theme||"mahadev")));
 $("#volume").value=data.volume??.55; $("#speed").value=data.speed??1; $("#autoAudio").checked=data.autoAudio!==false;
 audio.volume=Number(data.volume??.55);audio.playbackRate=Number(data.speed??1);
}
function chooseTheme(theme){data.theme=theme;save();applyTheme();showToast(`🎨 Theme: ${theme}`)}
$$('.theme-tile').forEach(b=>b.onclick=()=>chooseTheme(b.dataset.themeChoice));
$("#themeSelect").onchange=e=>chooseTheme(e.target.value);
$("#volume").oninput=e=>{data.volume=Number(e.target.value);audio.volume=data.volume;save()};
$("#speed").onchange=e=>{data.speed=Number(e.target.value);audio.playbackRate=data.speed;save()};
$("#autoAudio").onchange=e=>{data.autoAudio=e.target.checked;save()};
$("#exportCsv").onclick=()=>{
 const rows=[["Date","Jaap"] ,...Object.entries(data.days).sort()];
 const csv=rows.map(r=>r.map(x=>`"${String(x).replaceAll('"','""')}"`).join(",")).join("\n");
 const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="Mahadev_Jaap.csv";a.click();
};
$("#undoDelete").onclick=()=>{if(!data.deleted){alert("Recover કરવા માટે કોઈ deleted data નથી.");return}if(data.deleted.all){data.days=data.deleted.all}else{const d=data.deleted;data.days[d.date]=(data.days[d.date]||0)+d.amount}data.deleted=null;save();refresh();drawCalendar();renderRecords();alert("Last deleted data recover થયું. 🙏")};
$("#clearAll").onclick=()=>{if(!confirm("બધો Jaap data delete કરવો છે? Backup લીધું છે?"))return;data.deleted={date:"__all__",amount:0,all:data.days};data.days={};save();refresh();drawCalendar();renderRecords();alert("Data delete થયો. Backup restore કરી શકો છો.")};

$("#download").onclick=()=>{const blob=new Blob([JSON.stringify({app:"Om Namah Shivay Jaap Counter",version:5,target:data.targets.main,targets:data.targets,days:data.days,sound:data.sound,theme:data.theme,volume:data.volume,speed:data.speed,autoAudio:data.autoAudio,pinHash:data.pinHash||"",notifications:data.notifications,exportedAt:new Date().toISOString()},null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="Mahadev_Jaap_Backup.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)};

let deferredInstall=null;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;$("#installMsg").textContent="App install કરી શકાય છે.";});
$("#installApp").onclick=async()=>{if(deferredInstall){deferredInstall.prompt();deferredInstall=null}else $("#installMsg").textContent="Browser menuમાંથી Install / Add to Home Screen પસંદ કરો."};
if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(()=>{});

applyTheme();
applyTargetInputs();
loadNotificationSettings();
updateNotificationStatus();
updateReports();
updateSharePreview();
initYoga();
initPin();
// One-time migration of existing local Jaap history; local data is not deleted.
migrateExistingJaapToGoogleSheet();

refresh();renderRecords();drawCalendar();drawGraphs("daily","monthly");
// Safe User Profile button handler
document.addEventListener("DOMContentLoaded", function () {
  const changeNameBtn = document.getElementById("changeName");

  if (changeNameBtn) {
    changeNameBtn.onclick = function () {
      const oldName = localStorage.getItem("om_namah_shivay_user_name") || "";

      const newName = prompt(
        "🕉️ તમારું નામ લખો:",
        oldName
      );

      if (newName === null) return;

      const name = newName.trim();

      if (!name) {
        alert("કૃપા કરીને નામ લખો.");
        return;
      }

      localStorage.setItem("om_namah_shivay_user_name", name);

      const profileName = document.getElementById("profileName");
      if (profileName) {
        profileName.textContent = name;
      }

      alert("✅ નામ સફળતાપૂર્વક બદલાઈ ગયું.");

      // IMPORTANT:
      // જૂનો Jaap data અહીં delete થતો નથી.
      if (typeof migrateOldDataToSheet === "function") {
        migrateOldDataToSheet();
      }
    };
  }
});
