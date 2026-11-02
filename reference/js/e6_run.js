/* ================= przebiegi, eksperymenty, workery ================= */
// ustawienie = {world:{k:v}, species:{klucz:{k:v}}} ; wartości nadpisują domyślne
function applyOverrides(base,ov){if(!ov)return;if(ov.world)for(const k in ov.world)setK(base.world,k,ov.world[k]);
  if(ov.species)for(const sk in ov.species){const i=spIdxIn(base.species,sk);if(i<0)continue;for(const k in ov.species[sk])setK(base.species[i],k,ov.species[sk][k]);}}
function setParams(...ovs){P={world:deep(WORLD_DEFAULT),species:deep(LIB)};for(const o of ovs)applyOverrides(P,o);}
// wskaźniki końcowe jednego przebiegu (płaska lista, do CSV)
const METRICS=[['n','liczba drzew'],['canopy','pokrycie koron (udział)'],['cf','śr. kondycja korony'],['hd','śr. smukłość H/D (H≥4 m)'],['mlow','udział drzew H≥4 z zapasem pnia <1'],['alow','udział z zapasem zakotwienia <1'],
  ['cumFail','awarie mechaniczne (suma)'],['cumRem','usunięcia (suma)'],['cumRbh','nakład pracy rbh (suma)'],['planted','posadzone (suma)'],['seed','samosiewy (suma)'],['suck','odrosty (suma)'],
  ['servTot','usługi razem (rok)'],['cool','chłodzenie (rok)'],['co2','CO₂ kg (suma)'],['no2P','NO₂ indeks przy ludziach'],['noiseP','hałas dB przy ludziach'],['shadeP','cień przy ludziach'],['risk','ryzyko (suma)'],['recBig','odnowienia H≥4'],['zsM','z* mediana (m)'],['openF','udział drzew otwartych (bez z*)'],['belowF','udział drzew tuż pod z* (do 3 m)'],['hdBelow','H/D tuż pod z*'],['hdCanopy','H/D w okapie (H ≥ z*)'],['hdOpen','H/D drzew otwartych'],['lai','LAI (wskaźnik)']];
function summary(S){const h=S.hist[S.hist.length-1]||{};return {n:h.n,canopy:h.canopy,cf:h.cf,hd:h.hd,mlow:h.mlow,alow:h.alow,cumFail:S.cum.fail,cumRem:S.cum.removed,cumRbh:S.cum.rbh,planted:S.cum.planted,
  seed:S.cum.seed,suck:S.cum.suck,zsM:h.zsM,openF:h.openF,belowF:h.belowF,hdBelow:h.hdBelow,hdCanopy:h.hdCanopy,hdOpen:h.hdOpen,lai:h.lai,servTot:h.serv?h.serv.tot:null,cool:h.serv?h.serv.cool:null,co2:S.cum.co2,no2P:h.no2P,noiseP:h.noiseP,shadeP:h.shadeP,risk:h.risk,recBig:h.recBig};}
const SERIES_KEYS=['n','canopy','cf','hd','zsM','belowF','hdBelow','hdCanopy','lai','mlow','alow','cumFail','cumRbh','risk','noiseP','no2P'];
function seriesOf(S){return S.hist.map(h=>{const o={y:h.y};for(const k of SERIES_KEYS)o[k]=h[k];o.serv=h.serv?h.serv.tot:null;return o;});}
// jeden przebieg: teren, nadpisania (ustawienie Q, eksperyment M), ziarno, lata
function runOne(T,ovs,seed,years,onYear){setParams(...ovs);createSim(T,seed);for(let y=0;y<years;y++){stepYear();if(onYear)onYear(y+1);}return {sum:summary(S),series:seriesOf(S)};}
// plan: {name, years, reps, seed0, settings:[{name,world,species}], experiments:[{name,world,species}]}
function expandPlan(plan){const jobs=[];const Q=plan.settings&&plan.settings.length?plan.settings:[{name:'bazowe'}];const M=plan.experiments&&plan.experiments.length?plan.experiments:[{name:'kontrola'}];
  Q.forEach((q,qi)=>M.forEach((m,mi)=>{for(let r=0;r<Math.max(1,plan.reps|0);r++)jobs.push({qi,mi,r,q:q.name||('Q'+(qi+1)),m:m.name||('M'+(mi+1)),seed:(plan.seed0||1)+r,ovs:[q,m]});}));return jobs;}
// generator czynnikowy: {k:[v1,v2], k2:[...]} -> lista ustawień
function factorial(fac,prefix){const keys=Object.keys(fac);let out=[{}];for(const k of keys){const nx=[];for(const o of out)for(const v of fac[k]){const c=Object.assign({},o);c[k]=v;nx.push(c);}out=nx;}
  return out.map(o=>{const s={name:(prefix||'')+keys.map(k=>k.split('.').pop()+'='+o[k]).join(' '),world:{},species:{}};for(const k in o){if(k.startsWith('species.')){const p=k.split('.');(s.species[p[1]]=s.species[p[1]]||{})[p.slice(2).join('.')]=o[k];}else setK(s.world,k.replace(/^world\./,''),o[k]);}return s;});}
function aggregate(plan,results){const g=new Map();for(const r of results){const k=r.qi+'|'+r.mi;if(!g.has(k))g.set(k,{q:r.q,m:r.m,qi:r.qi,mi:r.mi,runs:[]});g.get(k).runs.push(r.sum);}
  return [...g.values()].sort((a,b)=>a.qi-b.qi||a.mi-b.mi).map(G=>{const o={q:G.q,m:G.m,n:G.runs.length,mean:{},sd:{}};for(const [k] of METRICS){const v=G.runs.map(x=>x[k]).filter(x=>x!=null&&isFinite(x));const mu=v.length?v.reduce((a,b)=>a+b,0)/v.length:null;
    o.mean[k]=mu;o.sd[k]=v.length>1?Math.sqrt(v.reduce((a,b)=>a+(b-mu)*(b-mu),0)/(v.length-1)):0;}return o;});}
// worker: wiadomość {T, jobs, years}; odpowiada {type:'done', job, sum, series} po każdym przebiegu
if(typeof self!=='undefined'&&typeof document==='undefined'&&typeof importScripts==='function'){
  let WT=null;self.onmessage=e=>{const d=e.data;if(d.type==='init'){WT=d.T;return;}if(d.type!=='run')return;for(const j of d.jobs){try{const r=runOne(d.T||WT,j.ovs,j.seed,d.years,y=>{if(y%5===0)self.postMessage({type:'tick',id:j.id,y});});self.postMessage({type:'done',id:j.id,sum:r.sum,series:r.series});}
    catch(err){self.postMessage({type:'err',id:j.id,msg:String(err&&err.stack||err)});}}self.postMessage({type:'idle'});};}
