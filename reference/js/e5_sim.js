/* ================= stan symulacji ================= */
let P={world:deep(WORLD_DEFAULT),species:deep(LIB)};
let S=null;
const spIdx=k=>spIdxIn(P.species,k);
function effWorld(){const W=deep(P.world);const u=+P.world.uncert||0;if(u>0&&S&&S.zW)for(const k in UNC_W){if(S.zW[k]!=null&&typeof P.world[k]==='number')W[k]=applyDist(P.world[k],S.zW[k],UNC_W[k],u);}return W;}
function effSpecies(){const u=+P.world.uncert||0;return P.species.map((s0,i)=>{const s=deep(s0);const z=S.zSp&&S.zSp[i];
  if(u>0&&z){for(const k in UNC_SP){if(k==='alloc'){s.alloc=applyAlloc(s0.alloc,z.alloc,UNC_SP.alloc[1],u);continue;}const v=getK(s0,k);if(z[k]!=null&&typeof v==='number')setK(s,k,applyDist(v,z[k],UNC_SP[k],u));}}return s;});}
function buildInd(t){const b=S.SP[t.sp];const o=Object.assign({},b);const sc=(+S.W.genVar||0)*(b.gen||0);
  if(sc>0&&t.gz){for(const k of GEN_TRAITS){if(!(k in b))continue;if(k==='alloc'){o.alloc=applyAlloc(b.alloc,t.gz.alloc,UNC_SP.alloc[1],sc);continue;}o[k]=applyDist(b[k],t.gz[k],UNC_SP[k],sc);}}t.I=o;return o;}
const IND=t=>t.I||buildInd(t);
function refreshParams(){S.W=effWorld();S.SP=effSpecies();for(const t of S.trees)buildInd(t);}
function newGeno(mother){const z=drawZ(S.rngG,GEN_TRAITS);if(mother){for(const k of GEN_TRAITS){if(mother[k]==null)continue;if(k==='alloc')z.alloc=z.alloc.map((v,i)=>0.5*mother.alloc[i]+0.866*v);else z[k]=0.5*mother[k]+0.866*z[k];}}return z;}

const SEAS=['Wiosna','Lato','Jesień','Zima'],SEAS_KEY=['spring','summer','autumn','winter'];
const LEAF_F=[0.7,1,0.7,0.25];
const GPP_SH=[0.3,0.5,0.2,0],RAKE_SH=[0.25,0.4,0.25,0.1],MOIST_S=[1.15,0.85,1.0,1];
const SEAS_W=[{h:1.8,d:0.4,c:1.6,r:0.6},{h:0.6,d:1.5,c:0.8,r:0.9},{h:0,d:0.6,c:0,r:2.2}];
const CAP_H=[0.65,0.35,0],CAP_D=[0.25,0.55,0.2],TAKE=[0,0.3,0.7];
let LEAFF=1;
const crownPot=(s,D)=>Math.min(s.crownMax,s.crownA*Math.pow(Math.max(D,0.3),s.crownB));
const vol=t=>0.5*(t.D/100)*(t.D/100)*t.H;
const qAt=(q,H)=>q*Math.pow(Math.max(H,1)/20,0.3);
const sail=t=>Math.max(t.weq||t.Wc,0.3)*(0.35+0.65*t.cf*LEAFF);
const sigEff=(t,s)=>s.sigma*(0.8+0.5*t.sw);
const dEff=t=>t.D*Math.cbrt(Math.max(0.02,1-Math.pow(t.dr,4)));
function dReq(t,s,q){const qe=qAt(q,t.H);return 100*Math.cbrt(S.W.kw*qe*qe*t.exp*sail(t)*t.H/sigEff(t,s));}
const dBuck=(t,s)=>100*Math.pow(t.H/(S.W.cb*Math.cbrt(s.sigma)),1.5);
function anchReq(t,q){const qe=qAt(q,t.H);return S.W.kA*qe*qe*t.exp*sail(t)*t.H;}
const anchCap=t=>t.RC*(1-t.rd);
const defEff=t=>clamp(IND(t).def+t.acc.d,0,1);
// warunki komórki pod pniem
const saltE=i=>Math.exp(-S.T.dSalt[i]/Math.max(0.5,S.W.saltDecay));
const moistI=i=>clamp(HAB[habKey(S.T,i)].moist*(1+S.W.twiWet*S.T.twiN[i])*(1-S.W.slopeDry*Math.max(0,S.T.south[i])),0.3,1.3);
const rakeCell=i=>{const k=surfKey(S.T,i);return (k==='trawnik'&&S.T.target[i]>=1)||k==='rabata'||k==='klomb';};
function vclass(t){const sc=t.cf-0.35*t.dr-0.25*t.wound;return t.dead?5:sc>0.85?1:sc>0.7?2:sc>0.5?3:sc>0.3?4:5;}

function newTree(sp,x,y,age,H,D,o){o=o||{};const T=S.T;const ci=cellOf(T,x,y);
  const t={id:S.nextId++,sp,x,y,ci,z0:ci>=0?T.dtm[ci]:0,H,D,Wc:0,Rp:0,Reff:0,weq:0,keep:1,loss:0,cf:1-(o.die||0),sw:0.4,RC:0,FR:0,fF:0.55,rd:0,wound:o.wound||0,inf:(o.dr||0)>0,dr:o.dr||0,
    reserve:0.6,starve:0,age,planted:o.young?S.year0+S.year:null,alive:true,dead:false,counted:false,bid:0.05,light:0,lf:1,cue:0,exp:0.5,gpp:0,rake:0,net:0,netY:0,rakeY:0,gppS:[0,0,0],
    f:{h:0,d:0,c:0,r:0},margin:2,anch:2,broken:0,pr:{san:0,red:0,clr:0},epicT:0,def:{l:0,w:0,n:0,x:0},ds:0,dsS:[0,0,0],nf:0,dH:0,dD:0,H0:H,D0:D,sv:1,
    serv:{shade:0,cool:0,co2:0,rain:0,no2:0,bio:0,tot:0},risk:0,pf:0,pb:0,care:o.young?3:0,init:null,cause:'',origin:o.young?'posadzone':(o.origin||'stare'),srcId:o.srcId||null,
    gz:o.gz?deep(o.gz):newGeno(o.mother||null),acc:{w:0,s:0,h:0,d:0},leafOut:1,I:null,shock:0,loan:0,seeds:0};
  const s=buildInd(t);t.Wc=o.R?Math.min(2*o.R,s.crownMax*1.3):crownPot(s,D)*(o.young?0.6:1);t.Rp=t.Wc/2;t.Reff=t.Rp;t.weq=t.Wc;t.FR=0.8*Math.max(0.3,t.weq*t.cf);return t;}
function rootTarget(t,fr){const i=t.ci;return anchReq(t,S.W.qRef)*(1.5+0.8*t.sv)*(1-0.15*SURF[surfKey(S.T,i)].seal)*clamp(0.6+0.4*fr/0.15,0.7,1.4);}
function rakeOf(t,s){const W=S.W;const leaf=Math.max(0.05,t.weq)*Math.max(0.2,t.cf);return (W.maintWood*Math.max(t.H,1)/20+W.maintLeaf*(1-0.3*s.pp*(1-t.lf)))*leaf*s.maint*(1+0.05*s.pp);}
// gleba dla korzeni: każde drzewo dzieli objętość gleby w kole korzeni z sąsiadami, proporcjonalnie do potrzeb
function rootShare(){const T=S.T;const need=S.rootNeed||(S.rootNeed=new Float32Array(T.n));need.fill(0);const R=t=>clamp(1.2*Math.max(t.Rp,1),2,8);const st=Math.max(T.res,1);
  const each=(t,f)=>{const r=R(t);for(let dx=-r;dx<=r;dx+=st)for(let dy=-r;dy<=r;dy+=st){if(dx*dx+dy*dy>r*r)continue;const i=cellOf(T,t.x+dx,t.y+dy);if(i>=0)f(i,st*st);}};
  for(const t of S.trees){if(!t.alive||t.dead)continue;const nd=Math.max(0.3,0.5*t.D+2);t._need=nd;each(t,i=>{need[i]+=nd;});}
  for(const t of S.trees){if(!t.alive||t.dead)continue;let av=0;each(t,(i,a)=>{av+=soilvOf(surfKey(T,i))*a*t._need/Math.max(t._need,need[i]);});t.sv=clamp(av/(t._need*1.5),0.2,1);}}
function initRoots(t){const s=IND(t);rootShareOne(t);t.RC=rootTarget(t,0.15)*(t.care>0?0.6:1);t.reserve=1.5*rakeOf(t,s)+0.4;t.FR=0.8*Math.max(0.3,t.weq*t.cf);}
function rootShareOne(t){const T=S.T;const r=clamp(1.2*Math.max(t.Rp,1),2,8);let av=0;const nd=Math.max(0.3,0.5*t.D+2);const st=Math.max(T.res,1);
  for(let dx=-r;dx<=r;dx+=st)for(let dy=-r;dy<=r;dy+=st){if(dx*dx+dy*dy>r*r)continue;const i=cellOf(T,t.x+dx,t.y+dy);if(i>=0)av+=soilvOf(surfKey(T,i))*st*st*(S.rootNeed&&S.rootNeed[i]>nd?nd/S.rootNeed[i]:1);}t.sv=clamp(av/(nd*1.5),0.2,1);}

const opsZero=()=>({san:0,red:0,clr:0,rem:0,plant:0,insp:0,rbh:0,weed:0,basal:0,runo:0});
const recZero=()=>({seed:0,suck:0,mow:0,weed:0});
// pula gatunków z zewnątrz (opad nasion spoza obszaru)
const DEFAULT_POOL=['apla','aneg','tcor','snig','rpse','bpen','qrob','aalt','fexc'];
function initCells(){const T=S.T,n=T.n;S.lit=new Float32Array(n);S.fauna=new Float32Array(n);S.comp=new Float32Array(n);S.soilSalt=new Float32Array(n);S.vig=new Float32Array(n).fill(0.8);S.miner=new Float32Array(n).fill(0.4);
  for(let i=0;i<n;i++){const sf=SURF[surfKey(T,i)];S.lit[i]=0.2+0.8*sf.mulch;S.fauna[i]=clamp(0.15+0.5*(1-sf.seal)+0.3*sf.mulch-(rakeCell(i)?0.15:0),0.05,1);S.comp[i]=sf.seal<0.5?0.12*T.target[i]:0;}}
function createSim(T,seed,opts){opts=opts||{};const W0=P.world;
  S={T,rng:mulberry32(seed),rngE:mulberry32((seed*2654435761)%4294967296+11),rngP:mulberry32(seed*7919+13),rngG:mulberry32(seed*104729+29),seed,
     year:0,season:0,lastSeason:-1,year0:W0.startYear,trees:[],nextId:1,hist:[],event:null,events:[null,null,null,null],die:1,
     deaths:{'cień':0,'posusz':0,'złamanie':0,'wywrot':0,'usunięcie':0,'wycinka':0,'koszenie':0},ops:opsZero(),remWhy:{},burst:[],recY:recZero(),lostV:0,fails:0,
     log:[],cum:{fail:0,rbh:0,co2:0,removed:0,planted:0,seed:0,suck:0,mow:0,weed:0,branch:0},bank:new Map(),bankM:new Map(),pool:(T.pool||DEFAULT_POOL).slice()};
  S.zW=drawZ(S.rngP,Object.keys(UNC_W));S.zSp=P.species.map(()=>drawZ(S.rngP,Object.keys(UNC_SP)));S.W=effWorld();S.SP=effSpecies();
  initCells();
  for(const d of T.trees0){const sp=d.sp!=null&&d.sp>=0?d.sp:spIdx(d.k);if(sp<0)continue;const H=Math.min(d.H,S.SP[sp].maxH*1.05);const t=newTree(sp,d.x,d.y,d.age||20,H,d.D,{die:d.die,wound:d.wound,dr:d.dr,R:d.R,srcId:d.id});if(t.ci<0||T.bld[t.ci]>0)continue;S.trees.push(t);}
  crowns(S);canopyRaster(S);computeLight(S,1);exposure(S);rootShare();computeNoise(S);computeCover(S);
  S.trees.forEach(t=>{initRoots(t);t.sw=clamp(0.2+0.4*t.cf*Math.min(1,t.lf+0.2),0.15,0.6);refMech(t);t.init={y:S.year0,H:t.H,D:t.D,cf:t.cf,cls:vclass(t)};});
  services();record();return S;}

/* ================= karty pór roku ================= */
const EV={calm:{t:'Spokojnie',e:'Bez zdarzeń.'},wind:{t:'Wiatr',e:'Słabe pnie i płytko zakotwione drzewa mogą zawieść.'},storm:{t:'Burza',e:'Burza przy pełnym ulistnieniu.'},gale:{t:'Wichura',e:'Test dla wszystkich drzew, także w osłonie.'},
  drought:{t:'Susza',e:'Mniej wody, najmocniej na suchych i uszczelnionych polach.'},heat:{t:'Upał',e:'Większe parowanie, szok cieplny przy fasadach.'},
  winter:{t:'Ostra zima',e:'Więcej soli przy jezdniach, przemarzanie pędów.'},thaw:{t:'Odwilż z solą',e:'Roztopy wnoszą sól do gleby.'},snow:{t:'Okiść i szadź',e:'Lód łamie konary kruchych gatunków.'},
  frost:{t:'Przymrozek późny',e:'Mróz po rozwoju liści.'},wet:{t:'Mokra pora',e:'Więcej wody, słabsze zakotwienie.'},works:{t:'Roboty ziemne',e:'Wykop uszkadza korzenie drzew w pobliżu.'},pests:{t:'Gradacja szkodników',e:'Owady ogołacają jeden gatunek.'}};
function drawEvent(si){const d=(S.W.deck||{})[SEAS_KEY[si]]||{calm:1};const keys=Object.keys(d);let tot=0;keys.forEach(k=>tot+=Math.max(0,+d[k]||0));const r0=S.rngE;let r=r0()*tot,type='calm';
  for(const k of keys){r-=Math.max(0,+d[k]||0);if(r<=0){type=k;break;}}const die=1+Math.floor(r0()*6);S.die=die;const m=0.7+0.1*die,wb=S.W.windBase;let q=0.4,sp=-1,x=-1,y=-1;
  if(type==='wind')q=wb.wind*m;else if(type==='storm')q=wb.storm*m;else if(type==='gale')q=wb.gale*m;
  else if(type==='pests'){const pres=[...new Set(S.trees.filter(t=>!t.dead).map(t=>t.sp))].sort((a,b)=>a-b);sp=pres.length?pres[Math.floor(r0()*pres.length)]:0;}
  else if(type==='works'){x=r0()*S.T.nx*S.T.res;y=r0()*S.T.ny*S.T.res;}
  S.event={type,q,sp,x,y,mult:m,season:si,die};S.events[si]=S.event;}

/* ================= pory roku ================= */
function stepSeason(){const si=S.season;
  if(si===0){S.year++;S.ops=opsZero();S.recY=recZero();S.events=[null,null,null,null];S.lostV=0;S.fails=0;for(const t of S.trees){t.H0=t.H;t.D0=t.D;t.netY=0;t.rakeY=0;t.gppS=[0,0,0];t.dsS=[0,0,0];}}
  refreshParams();drawEvent(si);
  if(si===0)spring();else if(si===1)summer();else if(si===2)autumn();else winter();
  storms(si);cleanup();S.lastSeason=si;S.season=(si+1)%4;
  if(S.season===0){if(S.year-(S.noiseYear||0)>=Math.max(1,S.W.noiseEvery)){canopyRaster(S);computeNoise(S);}services();record();}}
function stepYear(){do{stepSeason();}while(S.season!==0);}
function works(ev){if(ev.type!=='works')return;for(const t of S.trees){const d=Math.hypot(t.x-ev.x,t.y-ev.y);if(d<6){t.rd=clamp(t.rd+(0.5-d/12)*ev.mult*0.8,0,0.9);t.wound=clamp(t.wound+0.04,0,1);}}
  const T=S.T;for(let i=0;i<T.n;i++){const [x,y]=cellXY(T,i);if(Math.hypot(x-ev.x,y-ev.y)<6){S.comp[i]=clamp(S.comp[i]+0.2,0,0.8);S.lit[i]*=0.5;S.fauna[i]*=0.6;}}}
function spring(){const W=S.W,ev=S.event;
  for(const t of S.trees){if(t.dead)continue;const s=IND(t);const fl=W.flush*rakeOf(t,s)+0.02;const ff=clamp(t.reserve/fl,0.4,1);t.leafOut=ff*(1-0.3*t.shock);t.reserve-=ff*fl;t.loan=ff*fl;
    if(ev.type==='frost'){const sens=clamp(s.frost*(1+0.5*t.nf/Math.max(0.01,W.nfMax)),0,1);const dmg=clamp(sens*(ev.mult-0.5),0,1);t.leafOut*=1-0.5*dmg;t.reserve-=0.5*fl*dmg;if(t.reserve<0){t.cf=clamp(t.cf-0.05*dmg,0,1);t.reserve=0;}}}
  works(ev);crowns(S);canopyRaster(S);computeLight(S,0);computeCover(S);establish();grow(0);runoVigor(0);}
function summer(){crowns(S);canopyRaster(S);computeLight(S,1);exposure(S);grow(1);runoVigor(1);runoDisturb(1);dieback();suckers();basalCare();}
function autumn(){const ev=S.event;works(ev);crowns(S);canopyRaster(S);computeLight(S,2,true);grow(2);runoDisturb(2);soilYear();infectAndDecay();seedFall();
  for(const t of S.trees){if(t.dead||!t.alive)continue;t.FR*=1-S.W.frTurn;t.dH=t.H-t.H0;t.dD=t.D-t.D0;const swT=clamp(0.2+0.4*t.cf*Math.min(1,t.lf+0.2),0.15,0.6);t.sw+=0.15*(swT-t.sw);
    if(t.netY>0)t.cf=clamp(t.cf+0.3*(1-t.cf)*clamp(t.netY/(t.rakeY+0.01),0,1),0,1);if(t.epicT>0)t.epicT--;t.gpp=t.gppS[0]+t.gppS[1]+t.gppS[2];}
  crownPlast();}
function winter(){const W=S.W,ev=S.event,T=S.T;const wint=ev.type==='winter'?1.5*ev.mult:1;
  for(let i=0;i<T.n;i++){const se=saltE(i);S.soilSalt[i]=W.saltKeep*S.soilSalt[i]+se*wint+(ev.type==='thaw'?0.5*se*ev.mult:0);}
  runoCare();
  for(const t of S.trees){if(t.dead||!t.alive)continue;const s=IND(t);const i=t.ci;
    if(t.shock>0){if(t.dsS[1]>0.5)t.cf-=0.15*t.shock;t.shock*=W.irrRoot?0.4:0.6;if(t.shock<0.05)t.shock=0;}
    const rk=rakeOf(t,s)*RAKE_SH[3];t.reserve-=rk;t.netY-=rk;t.rakeY+=rk;if(t.reserve<0){t.cf-=0.1;t.reserve=0;}
    const tolS=clamp(s.tolSalt+t.acc.s,0,1);t.cf-=W.saltDie*saltE(i)*wint*(1-tolS)*(t.H<6?1:0.7);
    if(ev.type==='winter')t.cf-=W.nFrost*t.nf/Math.max(0.01,W.nfMax)*ev.mult;
    if(ev.type==='snow'&&t.H>=4&&S.rng()<0.35*(ev.mult-0.5)*clamp(1.3-s.sigma,0.1,1)*(0.5+0.5*t.cf)){t.cf-=0.04+0.08*S.rng();t.wound=clamp(t.wound+0.03,0,1);S.cum.branch++;}
    t.acc.s+=0.3*(s.pp*0.2*Math.min(1,S.soilSalt[i])-t.acc.s);t.cf=clamp(t.cf,0,1);
    t.net=t.netY;t.rake=t.rakeY;if(t.netY<0)t.starve++;else t.starve=0;
    if(t.starve>=4&&t.lf<0.35&&!t.dead){t.dead=true;t.cause='cień';t.cf=0;S.deaths['cień']++;t.counted=true;}
    t.acc.d*=0.8;t.age++;if(t.care>0)t.care--;}
  deathCheck();manage();}
function grow(si){const W=S.W,ev=S.event,rng=S.rng,T=S.T;rootShare();
  for(const t of S.trees){if(t.dead||!t.alive)continue;const s=IND(t);const i=t.ci;const hab=HAB[habKey(T,i)],sk=surfKey(T,i),surf=SURF[sk];
    if(si<2&&t.H<1.5&&t.origin!=='posadzone'&&surf.mow>0&&rng()<0.6*W.mowKill*surf.mow*(1-protAt(S,i))){t.alive=false;t.cause='koszenie';S.recY.mow++;S.cum.mow++;continue;}
    const te=S.no2[i],fe=T.facE[i];const leafA=Math.max(0.3,t.weq*t.cf);const comp=S.comp[i];const deepR=1-0.5*Math.min(1,t.D/30);
    const wa=clamp(Math.sqrt(t.FR*(1-t.rd)*(1-0.4*comp)/(0.8*leafA))*(1-0.5*t.shock),0.2,1.2);
    const irrT=Math.min(1.5,((sk==='rabata'||sk==='klomb')?surf.irrig*W.irrBeds:0)+(t.care>0&&W.irrRoot?0.8:0));
    const tolS=clamp(s.tolSalt+t.acc.s,0,1),tolD=clamp(s.tolDrought+t.acc.w,0,1);
    let supply=MOIST_S[si]*(0.5+0.5*moistI(i))*(0.6+0.4*t.sv)*(1-0.25*surf.seal)*(0.9+0.2*Math.min(1,S.lit[i]))*(1+0.15*S.fauna[i])*(1-0.3*comp)*(1-W.herbComp*surf.compW*S.vig[i]*deepR)*(si===1?1+0.4*irrT:si===0?1+0.15*irrT:1)*wa*(1-W.saltOsm*clamp(S.soilSalt[i],0,1)*(1-tolS));
    if(ev.type==='drought')supply*=clamp(1-0.35*ev.mult*(hab.moist<0.8?1.2:0.8),0.2,1);if(ev.type==='wet')supply*=1.2;
    const demand=1+W.trafficET*te+W.facadeET*fe*(si===1?1:0.5)+(ev.type==='heat'?0.3*ev.mult:0)+0.1*Math.max(0,T.south[i]);
    const ds=clamp((0.7-supply/demand)/0.7*(1.2-tolD),0,1);t.dsS[si]=ds;t.ds=Math.max(t.dsS[0],t.dsS[1],t.dsS[2]);
    t.acc.w+=0.3*(s.pp*0.25*ds-t.acc.w)*(si===1?1:0.5);if(fe>0)t.acc.h+=0.2*(s.pp*0.2*fe-t.acc.h);
    const mW=1-0.6*ds;const nf=W.nfMax*(1-Math.exp(-3*te));t.nf=nf;
    const mN=clamp(hab.nut*(0.85+0.3*Math.min(1,S.miner[i]))-W.herbComp*surf.compN*S.vig[i]*0.5*deepR+nf+s.nfix*0.5,0.2,1.25);
    const mT=1-W.noxTox*Math.pow(te,1.5)*(1-s.tolNOx);
    const dE=defEff(t);let hb=1-0.08*(1-dE);
    if(ev.type==='pests'&&ev.sp===t.sp){hb*=1-0.5*ev.mult*(1-0.7*dE);t.acc.d=Math.min(0.5,t.acc.d+s.pp*0.3);t.cf=clamp(t.cf-0.04*(1-dE),0,1);}
    const g=W.eps*t.light*hab.prod*(s.hab[habKey(T,i)]||1)*mW*mN*mT*hb*GPP_SH[si];
    if(si===1)t.def={l:1-t.lf,w:1-mW,n:Math.max(0,1-mN),x:1-mT};
    const rkA=rakeOf(t,s);const rake=rkA*RAKE_SH[si];let net=g-rake;t.gppS[si]=g;t.netY+=net;t.rakeY+=rake;
    if(net<0){t.reserve+=net;if(t.reserve<0){const sh=clamp(-t.reserve/(rkA*0.5+0.01),0,0.6);t.cf-=0.35*sh;t.reserve=0;}}
    else{let nn=net;if(si===0&&t.loan>0){const rp=Math.min(t.loan,nn);t.reserve+=rp;nn-=rp;t.loan=0;}const cap=1.5*rkA+0.4;const take=Math.min(Math.max(0,cap-t.reserve),TAKE[si]*nn);t.reserve+=take;invest(t,s,nn-take,ds,nf,si);}
    if(si<2&&rng()<W.mowP*0.5*surf.mow*(t.D<30?1:0.5))t.wound=clamp(t.wound+0.04+0.08*rng(),0,1);
    t.cf=clamp(t.cf,0,1);}}
function invest(t,s,I,ds,nf,si){const W=S.W;I*=1-0.3*defEff(t);
  const a=s.alloc;const tot=a.h+a.d+a.c+a.r||1;let fh=a.h/tot,fd=a.d/tot,fc=a.c/tot,fr=a.r/tot;
  const sa=clamp(s.plast*W.gameStrength*t.cue,0,1.5);fh+=0.35*sa;const th=clamp(s.mech*W.mechanoStrength*t.exp,0,1.5);fd+=0.3*th;fh-=0.1*th;
  const deep_=clamp((0.3-t.lf)/0.3,0,1),wt=s.wait*deep_;fh-=0.3*wt;fd+=0.15*wt;fc+=0.1*wt;fr+=0.25*ds*(0.5+s.pp);fr=Math.max(0.03,fr-W.nRoot*nf);
  if(t.epicT>0){fc+=0.25*s.epic;fh+=0.15*s.epic;}
  fh=Math.max(0,fh);fd=Math.max(0,fd);fc=Math.max(0,fc);fr=Math.max(0,fr);const s1=fh+fd+fc+fr||1;const frBase=fr/s1;
  const sw=SEAS_W[si];fh*=sw.h;fd*=sw.d;fc*=sw.c;fr*=sw.r;const sum=fh+fd+fc+fr||1;fh/=sum;fd/=sum;fc/=sum;fr/=sum;if(si===1)t.f={h:fh,d:fd,c:fc,r:fr};if(si<2)t.game=sa>0.25;
  const costM=W.woodCost*s.rho*0.5*(t.D/100)*(t.D/100)+1e-4;const hcap=s.maxDH*CAP_H[si]*Math.max(0,1-t.H/s.maxH)*(0.5+0.5*t.cf);
  const dH=hcap>0?Math.min(hcap,fh*I/costM):0;const left=fh*I-dH*costM;const dV=(fd*I+left)/(W.woodCost*s.rho);
  let nD=Math.sqrt(t.D*t.D+dV/(0.5*Math.max(t.H,0.5))*1e4);const dcap=s.maxDD*CAP_D[si];if(nD>t.D+dcap)nD=t.D+dcap;
  t.H+=dH;t.D=nD;const gs=GPP_SH[si];const bid=fc*I;t.bid=si===0?bid/gs:Math.max(t.bid*0.8,bid/gs);const pot=crownPot(s,t.D);
  t.Wc=Math.min(pot,t.Wc+(0.1*pot+(t.epicT>0?0.1*pot*s.epic:0))*gs+W.crownGrow*bid);
  const Ir=fr*I;const fF=clamp(0.55+0.35*ds*(0.5+s.pp)-0.2*th,0.2,0.9);t.fF=fF;const leafA=Math.max(0.3,t.weq*t.cf);
  const FRt=leafA*(0.8+0.8*ds*(0.5+s.pp));if(t.FR<FRt)t.FR+=Math.min(FRt-t.FR,fF*Ir/W.cFR);else t.FR-=0.2*gs*(t.FR-FRt);
  const tg=rootTarget(t,frBase*(1-fF)/0.45);if(tg>t.RC)t.RC+=Math.min(tg-t.RC,0.3*tg*gs*clamp(I/(rakeOf(t,s)*RAKE_SH[si]+0.1*gs),0,1)*clamp((1-fF)*fr/(0.45*0.15),0.5,2));else t.RC-=0.05*gs*(t.RC-tg);
  t.rd=Math.max(0,t.rd-0.04*gs);}
function dieback(){const W=S.W,ev=S.event,T=S.T;for(const t of S.trees){if(t.dead||!t.alive)continue;const s=IND(t);const i=t.ci;const te=S.no2[i],fe=T.facE[i];const ds=t.dsS[1];
  const tolD=clamp(s.tolDrought+t.acc.w,0,1),tolH=clamp(s.tolHeat+t.acc.h,0,1);
  const die=W.droughtDie*ds*ds*(1-tolD)+W.heatDie*fe*(1-tolH)*(0.5+ds)*(ev.type==='heat'?1.5*ev.mult:0.5)+0.02*te*(1-s.tolNOx)+(t.sw<0.25?0.12*(0.25-t.sw)/0.1:0);
  t.cf=clamp(t.cf-die,0,1);}deathCheck();}
// zgnilizna twardzieli: wejście przez rany, rozkład obniża D_eff (pozostałe gildie grzybów w wersji 4.1)
function infectAndDecay(){const W=S.W;for(const t of S.trees){if(!t.alive)continue;const s=IND(t);if(t.dead){t.dr=clamp(t.dr+0.05,0,0.95);continue;}
  const heal=0.02+0.5*s.compart*((t.D-t.D0)/Math.max(t.D,1));t.wound=Math.max(0,t.wound-heal);
  if(!t.inf&&S.rng()<W.infK*t.wound*(1+(1-t.sw))*s.decaySus*(1-0.5*s.compart)*(1-0.6*defEff(t))*0.5)t.inf=true;
  if(t.inf)t.dr=clamp(t.dr+W.decayK*s.decaySus*(1.3-0.6*t.cf)*(1+(0.4-t.sw))*(1-0.4*defEff(t)),0,0.92);}}
function deathCheck(){for(const t of S.trees){if(!t.alive||t.dead)continue;if(t.cf<0.1){t.dead=true;t.cause='posusz';}if(t.dead){t.cf=0;S.deaths[t.cause]=(S.deaths[t.cause]||0)+1;t.counted=true;}}}
function cleanup(){for(const t of S.trees){if(!t.alive&&!t.counted&&t.cause!=='złamanie'){S.deaths[t.cause]=(S.deaths[t.cause]||0)+1;t.counted=true;}}S.trees=S.trees.filter(t=>t.alive);}

/* ================= mechanika ================= */
function storms(si){const ev=S.event;const windy=ev.type==='wind'||ev.type==='storm'||ev.type==='gale';const wetF=(ev.type==='wet'||ev.type==='thaw')?0.8:1;LEAFF=LEAF_F[si];const rng=S.rng;
  for(const t of S.trees){const r=windTest(t,windy?ev.q:null,wetF);if(!r)continue;S.fails++;S.cum.fail++;
    logEv(t,r);if(r==='wywrot'){S.lostV+=vol(t);t.alive=false;t.cause='wywrot';}
    else{const v0=vol(t);t.H*=0.45+0.25*rng();t.Wc*=0.5;t.reserve*=0.7;t.broken++;t.wound=clamp(t.wound+0.1,0,1);S.lostV+=v0-vol(t);S.deaths['złamanie']++;if(t.dead){t.alive=false;t.cause='złamanie';}}}
  for(const t of S.trees){if(!t.alive||t.H<4)continue;const pBr=t.pb/4*(windy?(ev.type==='gale'?4:2.5):1);if(rng()<pBr){t.cf=clamp(t.cf-0.02-0.04*rng(),0,1);t.wound=clamp(t.wound+0.02,0,1);S.cum.branch++;logEv(t,'konar');}}
  LEAFF=1;for(const t of S.trees)refMech(t);}
// dziennik zdarzeń przestrzennych (awarie, spadki konarów, usunięcia) dla warstw punktowych i eksportu
function logEv(t,k){S.log.push({x:t.x,y:t.y,yr:S.year0+S.year,s:S.season,k,sp:t.sp,H:t.H,id:t.id});if(S.log.length>4000)S.log.splice(0,S.log.length-4000);}
function windTest(t,q,wetF){if(!t.alive||t.H<2)return null;const s=IND(t);const de=dEff(t),db=dBuck(t,s);if(de<db)return 'złamanie';if(q==null||t.H<4)return null;
  const m=de/Math.max(dReq(t,s,q),db),an=anchCap(t)*wetF*(t.care>0?3:1)/Math.max(1e-6,anchReq(t,q));const mn=Math.min(m,an);
  if(mn<1&&S.rng()<clamp((1-mn)*1.2,0,0.7)){const wet=HAB[habKey(S.T,t.ci)].moist>0.9||S.T.twiN[t.ci]>0.5?1.3:1;return an/wet<m?'wywrot':'złamanie';}return null;}
function refMech(t){if(!t.alive||t.H<2){t.margin=3;t.anch=3;t.pf=0;t.pb=0;t.risk=0;return;}const s=IND(t);const de=dEff(t),db=dBuck(t,s);
  t.margin=de/Math.max(dReq(t,s,S.W.qRef),db);t.anch=anchCap(t)/Math.max(1e-6,anchReq(t,S.W.qRef));t.pf=annualPf(t,s,de,db);
  t.pb=clamp(0.02*(1-t.cf)+0.004*Math.min(3,t.pr.red+t.pr.clr)*s.epic+(t.dead?0.1:0),0,0.5);const cons=Math.pow(vol(t)+0.02,0.6);
  t.risk=(t.pf*cons+t.pb*0.15*cons)*(0.2+S.T.target[t.ci])*10;}
function annualPf(t,s,de,db){const W=S.W;let p=0;const save=LEAFF;
  for(let si=0;si<4;si++){const d=(W.deck||{})[SEAS_KEY[si]]||{};const tot=Object.values(d).reduce((a,v)=>a+Math.max(0,+v||0),0)||1;LEAFF=LEAF_F[si];
    for(const k of ['wind','storm','gale']){const w=Math.max(0,+d[k]||0)/tot;if(!w)continue;for(let dd=1;dd<=6;dd++){const q=W.windBase[k]*(0.7+0.1*dd);
      const m=de/Math.max(dReq(t,s,q),db),an=anchCap(t)/Math.max(1e-6,anchReq(t,q));const mn=Math.min(m,an);if(mn<1)p+=w/6*clamp((1-mn)*1.2,0,0.7);}}}
  LEAFF=save;return clamp(1-Math.exp(-p)+(t.dead?0.15:0),0,1);}

/* ================= zarządzanie ================= */
function basalCare(){const W=S.W,o=S.ops;S.trees.forEach(t=>{if(!t.alive||t.dead)return;const s=IND(t);if(W.basalClean&&s.basal>0&&t.H>=4&&S.T.target[t.ci]>=1){o.basal++;o.rbh+=W.h_basal*s.basal;}});}
function plantStandard(sp,x,y){const W=S.W;const nt=newTree(sp,x,y,5,4,6,{young:true});if(nt.ci<0)return null;crownsOne(nt);initRoots(nt);nt.sw=0.45;nt.RC*=0.85;nt.FR=0.15*Math.max(0.3,nt.weq*nt.cf);nt.shock=1;nt.care=3;
  nt.init={y:S.year0+S.year,H:nt.H,D:nt.D,cf:1,cls:1};S.trees.push(nt);S.ops.plant++;S.ops.rbh+=W.h_plant;S.cum.planted++;return nt;}
function crownsOne(t){t.Rp=t.Wc/2;t.Reff=t.Rp;t.weq=t.Wc;t.keep=1;}
function manage(){const W=S.W,T=S.T;const insp=W.inspect>0&&(S.year%Math.max(1,Math.round(W.inspect))===0);const o=S.ops;
  S.trees.forEach(t=>{if(t.care>0&&t.alive)o.rbh+=W.h_care;});if(!insp)return;const rem=[];
  if(W.weed){for(const t of S.trees){if(t.alive&&T.target[t.ci]>=W.minTarget&&(t.origin==='samosiew'||t.origin==='odrost')&&t.H<4){t.alive=false;t.cause='usunięcie';t.counted=true;S.deaths['usunięcie']++;o.weed++;o.rbh+=W.h_weed;S.recY.weed++;S.cum.weed++;stumpBurst(t,0.5);}}}
  for(const t of S.trees){if(!t.alive||T.target[t.ci]<W.minTarget)continue;o.insp++;o.rbh+=W.h_insp;const s=IND(t);const size=Math.max(0.5,Math.min(3,t.H/12));
    const why=t.dead?'martwe':t.broken>0?'złamane':vclass(t)>=5?'zamierające':(t.care<=0&&t.H>=6&&t.margin<W.removeMargin)?'słaby pień':(t.care<=0&&t.H>=6&&t.anch<W.removeMargin)?'słabe zakotwienie':null;
    if(why){t.why=why;S.remWhy[why]=(S.remWhy[why]||0)+1;rem.push(t);continue;}
    if(W.pruneSanitary&&t.cf<0.78){t.Wc*=0.55+0.45*t.cf;t.cf=Math.min(1,t.cf+(1-t.cf)*0.6);t.wound=clamp(t.wound+0.02,0,1);t.pr.san++;o.san++;o.rbh+=W.h_san*size;}
    if(W.pruneReduce&&(t.margin<1||t.anch<1)){t.Wc*=0.7;t.H*=0.88;t.wound=clamp(t.wound+0.06,0,1);t.epicT=3;t.pr.red++;o.red++;o.rbh+=W.h_red*size;woundInf(t,s,0.25);}}
  for(const t of rem){logEv(t,'usunięcie');t.alive=false;t.cause='usunięcie';t.counted=true;S.deaths['usunięcie']++;o.rem++;o.rbh+=W.h_rem*Math.max(0.5,Math.min(3,t.H/12));S.cum.removed++;stumpBurst(t,t.dead?0.2:1);
    if(W.replant&&T.bld[t.ci]<=0&&(t.origin==='stare'||t.origin==='posadzone'))plantStandard((W.noReplant||[]).includes(P.species[t.sp].key)?replSp(t):t.sp,t.x,t.y);}}
// zamiennik gatunku, którego się nie dosadza (np. inwazyjnego): pierwszy z listy W.replantSp
function replSp(t){const k=(S.W.replantSp||['tcor'])[0];const j=spIdx(k);return j>=0?j:t.sp;}
function woundInf(t,s,p){if(!t.inf&&S.rng()<p*s.decaySus*(1-0.5*s.compart)*(1-0.6*defEff(t)))t.inf=true;}

/* ================= odnowienie ================= */
function stumpBurst(t,f){const s=IND(t);if(!S.W.suckers||s.sucker<0.3)return;S.burst.push({sp:t.sp,x:t.x,y:t.y,n:Math.round(s.sucker*6*f),dist:s.suckDist,gz:t.gz});}
function nearCount(x,y,r){let n=0;for(const t of S.trees){if(t.alive&&Math.abs(t.x-x)<r&&Math.abs(t.y-y)<r)n++;}return n;}
function suckers(){const W=S.W,T=S.T;if(!W.suckers){S.burst=[];return;}const rng=S.rng;
  const add=(sp,x0,y0,dist,boost,gz)=>{const a=rng()*6.283,d=0.6+rng()*dist;const x=x0+Math.cos(a)*d,y=y0+Math.sin(a)*d;const i=cellOf(T,x,y);if(i<0||S.trees.length>=W.maxTrees||T.bld[i]>0)return;
    if(rng()<SURF[surfKey(T,i)].seal)return;if(nearCount(x,y,0.8)>=2)return;if(rng()>boost*(0.25+0.75*Math.min(1,S.ground[i]/0.35)))return;
    const nt=newTree(sp,x,y,1,0.9,0.8,{origin:'odrost',gz});nt.RC=0.05;nt.Wc=0.6;crownsOne(nt);nt.reserve=1;nt.FR=0.5;nt.init={y:S.year0+S.year,H:0.9,D:0.8,cf:1,cls:1};S.trees.push(nt);S.recY.suck++;S.cum.suck++;};
  const par=S.trees.slice();for(const t of par){const s=IND(t);if(t.dead||!t.alive||s.sucker<=0||t.H<2)continue;const lam=s.sucker*0.35*(1+2*t.rd)*(t.netY>0?1:0.4);let n=Math.floor(lam);if(rng()<lam-n)n++;for(let k=0;k<n;k++)add(t.sp,t.x,t.y,s.suckDist,0.8,t.gz);}
  for(const b of S.burst){for(let k=0;k<b.n;k++)add(b.sp,b.x,b.y,b.dist,1,b.gz);}S.burst=[];}
function seedFall(){const W=S.W,T=S.T;if(W.seedRain<=0)return;const rng=S.rng;const nsp=P.species.length;const area=T.nx*T.ny*T.res*T.res;
  const put=(i,sp,g)=>{const k=i*nsp+sp;const c=(S.bank.get(k)||0)+1;S.bank.set(k,c);if(rng()<1/c)S.bankM.set(k,g);};
  for(const t of S.trees){const s=IND(t);t.seeds=0;if(t.dead||!t.alive||t.H<s.matH||s.rain<=0)continue;const vig=0.5+0.5*clamp(t.netY/(t.rakeY+0.01)+0.5,0,1);
    const n=Math.round(s.rain*2*W.seedRain*10*rng()*vig*Math.max(1,t.weq/8));t.seeds=n;for(let k=0;k<n;k++){const i=cellOf(T,t.x+randn(rng)*s.disp,t.y+randn(rng)*s.disp);if(i>=0)put(i,t.sp,t.gz);}}
  S.pool.forEach(k=>{const j=spIdx(k);if(j<0)return;const s=S.SP[j];const e=W.seedRain*s.rain*area/600;let n=Math.floor(e);if(rng()<e-n)n++;for(let q=0;q<n;q++)put(Math.floor(rng()*T.n),j,null);});}
function establish(){const W=S.W,T=S.T;const rng=S.rng;const nsp=P.species.length;const born=new Map();
  for(const [k,cnt] of S.bank){const i=Math.floor(k/nsp),sp=k-i*nsp;if(born.get(i)||S.trees.length>=W.maxTrees)continue;const sk=surfKey(T,i),surf=SURF[sk];if(T.bld[i]>0)continue;
    const pr=protAt(S,i);const site=surf.seed?1:(surf.seal<0.5?pr:0);if(site<=0)continue;const s=S.SP[sp];const gl=S.ground[i]*(1-0.7*surf.tall*S.vig[i]);const lf=gl>=s.lightReq?1:Math.pow(gl/Math.max(s.lightReq,0.01),2);
    if(rng()<1-Math.pow(1-W.estab*site*lf*(s.hab[habKey(T,i)]||1),cnt)){const [cx,cy]=cellXY(T,i);const x=cx+(rng()-0.5)*T.res,y=cy+(rng()-0.5)*T.res;if(nearCount(x,y,0.6)>=3)continue;
      const nt=newTree(sp,x,y,1,0.5,0.5,{origin:'samosiew',mother:S.bankM.get(k)||null});nt.RC=0.02;nt.Wc=0.4;crownsOne(nt);nt.FR=0.3;S.recY.seed++;S.cum.seed++;nt.init={y:S.year0+S.year,H:0.5,D:0.5,cf:1,cls:1};S.trees.push(nt);born.set(i,1);}}
  S.bank.clear();S.bankM.clear();}

/* ================= runo i gleba ================= */
function runoVigor(si){const T=S.T;const dry=S.event.type==='drought';for(let i=0;i<T.n;i++){const sf=SURF[surfKey(T,i)];let tg=sf.light>0?clamp(S.ground[i]/sf.light,0,1):1;if(dry)tg*=1-0.35*(1-Math.min(1,sf.irrig*S.W.irrBeds));S.vig[i]=clamp(S.vig[i]+0.4*(tg-S.vig[i]),0,1);}}
function runoDisturb(si){const rng=S.rng,T=S.T;for(const t of S.trees){if(!t.alive||t.dead||t.origin==='posadzone')continue;const sf=SURF[surfKey(T,t.ci)];
  if(t.H<1.5&&((sf.dig>0&&si!==1)||(sf.weed>0&&si===1&&rng()<sf.weed))){t.alive=false;t.cause='prace w runie';}}}
// nakład na runo w rbh na m² rocznie (koszenie, pielęgnacja rabat i klombów, dosiewanie łysiejącego trawnika)
function runoCare(){const W=S.W,T=S.T,o=S.ops;const a=T.res*T.res;for(let i=0;i<T.n;i++){const k=surfKey(T,i);const sf=SURF[k];if(sf.rbh<=0)continue;if(T.target[i]<W.minTarget&&sf.rbh<1)continue;let h=sf.rbh/20*a*W.runoRbh;if(k==='trawnik'&&S.vig[i]<0.5)h+=W.h_reseed/20*a;o.runo+=h;o.rbh+=h;}}
function soilYear(){const W=S.W,T=S.T,n=T.n;const fall=new Float32Array(n);
  for(const t of S.trees){if(t.dead||!t.alive)continue;const r=Math.max(t.Reff,T.res*0.5);const per=t.cf*t.leafOut*0.25;for(let dx=-r;dx<=r;dx+=T.res)for(let dy=-r;dy<=r;dy+=T.res){if(dx*dx+dy*dy>r*r)continue;const i=cellOf(T,t.x+dx,t.y+dy);if(i>=0)fall[i]+=per;}}
  for(let i=0;i<n;i++){const sf=SURF[surfKey(T,i)];let lit=S.lit[i]+fall[i]+0.3*sf.mulch;if(rakeCell(i))lit*=1-clamp(4*W.rakeLoss,0,0.9);if(sf.seal>0.5)lit*=0.2;if(sf.dig>0)lit*=0.5;
    const dec=lit*(1-Math.exp(-(0.3+0.9*S.fauna[i])));lit-=dec;S.lit[i]=clamp(lit,0,3);S.miner[i]=clamp(dec*1.5,0,1.5);
    const ft=clamp((0.3+0.7*Math.min(1,S.lit[i]+dec))*(0.5+0.5*moistI(i)+0.2*sf.irrig)*(1-0.9*sf.seal)*(1-0.5*Math.min(1,S.soilSalt[i]))*(1-0.4*S.comp[i])*(sf.dig?0.6:1),0,1);S.fauna[i]=clamp(S.fauna[i]+0.3*(ft-S.fauna[i]),0,1);
    S.comp[i]=clamp(S.comp[i]+(sf.seal<0.5&&!sf.dig?W.trample*T.target[i]*(1-0.5*sf.mulch):0)-0.25*(0.3+S.fauna[i])*S.comp[i]-(sf.dig?0.5*S.comp[i]:0),0,0.8);}}


/* ================= plastyczność koron i z* ================= */
// Promienie sektorów przesuwają się ku światłu i wolnej przestrzeni (fototropizm, unikanie cienia), a w głębokim cieniu sektor zamiera.
// Średnia szerokość korony nadal wynika z inwestycji w koronę; plastyczność zmienia jej rozkład i odejmuje zrzucone części.
function sectorFree(t,k){const T=S.T;const r=t.cr[k]+Math.max(T.res,1);const x=t.x+SEC_DX[k]*r,y=t.y+SEC_DY[k]*r;const i=cellOf(T,x,y);if(i<0)return 1;const z=zTop(t)-0.4*t.H*S.W.crownRatio;
  if(T.babs[i]>z)return 0.05;const j=voxJ(S,i,z);if(j<0||S.vx.mu[j]<=0)return 1;const o=S.vx.own[j];if(o===t.id&&S.vx.mu[j]-S.vx.muO[j]<1e-6)return 1;return S.vx.top[i]>=zTop(t)-0.5?0.3:0.75;}
function crownPlast(){const W=S.W;const kp=+W.crownPlast||0;if(kp<=0)return;const shed=W.shedL,amax=W.maxAsym;
  for(const t of S.trees){if(!t.alive||t.dead||t.H<1.5||!t.secL)continue;syncSec(t);const mean=t.Wc/2;if(mean<=0.2)continue;const w=new Float32Array(8);let wm=0;
    for(let k=0;k<8;k++){w[k]=(0.15+t.secL[k])*sectorFree(t,k);wm+=w[k];}wm/=8;if(wm<=0)continue;
    for(let k=0;k<8;k++){const tg=clamp(mean*Math.pow(w[k]/wm,0.5*kp),0.45*mean,amax*mean);t.cr[k]+=0.35*(tg-t.cr[k]);if(t.secL[k]<shed)t.cr[k]*=1-0.12*kp*(1-t.secL[k]/shed);if(t.cr[k]<0.15)t.cr[k]=0.15;}
    let m=0;for(let k=0;k<8;k++)m+=t.cr[k];t.Wc=2*m/8;}}
// z* według PPA: wysokość, przy której suma powierzchni koron drzew wyższych w kole o promieniu zR wypełnia koło (zwarcie okapu); brak = drzewostan otwarty
function ppaZ(x,y,bk,R,A0){const nb=bk.near(x,y,R).filter(o=>!o.dead&&o.alive&&o.H>=1.3&&(o.x-x)**2+(o.y-y)**2<=R*R).sort((a,b)=>b.H-a.H);let acc=0;for(const o of nb){acc+=Math.PI*o.Rp*o.Rp;if(acc>=A0)return o.H;}return NaN;}
function computeZstar(){const T=S.T,R=Math.max(3,+S.W.zR||15),A0=Math.PI*R*R;const bk=bucketTrees(S,R);for(const t of S.trees){if(!t.alive)continue;t.zs=t.dead?NaN:ppaZ(t.x,t.y,bk,R,A0);}
  const st=Math.max(1,Math.round(5/T.res));const Z=S.zstar||(S.zstar=new Float32Array(T.n));for(let r=0;r<T.ny;r+=st)for(let c=0;c<T.nx;c+=st){const [x,y]=cellXY(T,r*T.nx+c);const v=ppaZ(x+(st-1)*T.res/2,y-(st-1)*T.res/2,bk,R,A0);
    for(let a=0;a<st&&r+a<T.ny;a++)for(let b=0;b<st&&c+b<T.nx;b++)Z[(r+a)*T.nx+c+b]=v;}}
// profil pionowy okapu: gęstość ulistnienia (wskaźnik, tłumienie / 0,5) i pokrycie na kolejnych poziomach nad gruntem, na powierzchni bez budynków i jezdni
function vertProfile(mask){const T=S.T,X=S.vx;let nk=0;for(let i=0;i<T.n;i++)if(X.hi[i]+1>nk)nk=X.hi[i]+1;const lad=new Float64Array(nk),cov=new Float64Array(nk);let nc=0;
  for(let i=0;i<T.n;i++){if(mask?!mask[i]:(T.bld[i]>0||T.traffic[i]>0))continue;nc++;if(X.hi[i]<0)continue;for(let k=X.lo[i];k<=X.hi[i];k++){const m=X.mu[X.off[i]+k-X.lo[i]];if(m>0){lad[k]+=m/0.5;cov[k]++;}}}
  return {dz:X.dz,n:nc,lad:Array.from(lad,v=>nc?v/nc:0),cov:Array.from(cov,v=>nc?v/nc:0)};}
/* ================= bilans ================= */
function services(){const W=S.W,T=S.T;for(const t of S.trees){const s=IND(t);const i=t.ci;const leaf=Math.max(0,t.weq)*Math.max(0,t.cf);const water=1-t.ds;const te=S.no2[i];
    const co2=Math.max(0,(0.5*((t.D/100)**2*t.H-((t.D-t.dD)/100)**2*(t.H-t.dH))))*s.rho*1000*1.25*0.5*3.67;
    const bio=clamp(t.age/150,0,1)*0.5+clamp(t.D/80,0,1)*0.3+(t.dr>0.2?0.3:0)+0.3*s.native;
    const sv={shade:Math.PI*t.Reff*t.Reff*Math.max(0,t.cf),cool:leaf*water*(t.H>3?1:0.5),co2,rain:leaf*0.8,no2:leaf*(0.2+te)*(1-0.5*W.noxTox*(1-s.tolNOx)),bio};
    sv.tot=leaf*1+sv.cool*1.2+sv.co2*0.02+sv.rain*0.5+sv.no2*1.5+sv.bio*4;t.serv=sv;}}
function record(){const T=S.T;const n=S.trees.length;const cls=[0,0,0,0,0];let cfS=0,mlow=0,alow=0,wd=0,inf=0,dD=0,dH=0,nG=0,risk=0,nl=0;const serv={shade:0,cool:0,co2:0,rain:0,no2:0,bio:0,tot:0},def={l:0,w:0,n:0,x:0};
  for(const t of S.trees){cls[vclass(t)-1]++;cfS+=t.cf;if(t.H>=4){if(t.margin<1)mlow++;if(t.anch<1)alow++;}if(t.wound>0.03)wd++;if(t.inf)inf++;if(!t.dead&&t.H>1.5){dD+=t.dD;dH+=t.dH;nG++;def.l+=t.def.l;def.w+=t.def.w;def.n+=t.def.n;def.x+=t.def.x;nl++;}
    for(const k in serv)serv[k]+=t.serv[k]||0;risk+=t.risk;}
  let hdS=0,hdN=0;for(const t of S.trees){if(!t.dead&&t.H>=4&&t.D>3){hdS+=t.H/(t.D/100);hdN++;}}
  computeZstar();const zz=[];let nOpen=0,nB=0,hdB=0,nC=0,hdC=0,hdO=0,n4z=0;for(const t of S.trees){if(t.dead||t.H<4||t.D<=3)continue;n4z++;const hd=t.H/(t.D/100);
    if(!isFinite(t.zs)){nOpen++;hdO+=hd;continue;}zz.push(t.zs);if(t.H<t.zs&&t.zs-t.H<=3){nB++;hdB+=hd;}else if(t.H>=t.zs){nC++;hdC+=hd;}}
  zz.sort((a,b)=>a-b);const zsM=zz.length?zz[zz.length>>1]:null;const vp=vertProfile();let ladT=0;for(const v of vp.lad)ladT+=v*vp.dz;
  const n4=S.trees.filter(t=>t.H>=4).length||1;S.cum.rbh+=S.ops.rbh;S.cum.co2+=serv.co2;
  const comp=new Array(P.species.length).fill(0);let spA=0,suA=0,recBig=0,canopy=0;for(const t of S.trees){if(t.dead)continue;comp[t.sp]++;if(t.origin==='samosiew')spA++;if(t.origin==='odrost')suA++;if((t.origin==='samosiew'||t.origin==='odrost')&&t.H>=4)recBig++;canopy+=Math.PI*t.Reff*t.Reff;}
  // środowisko ważone obecnością ludzi
  let wsum=0,noiseP=0,no2P=0,shadeP=0,glM=0,litM=0,faunaM=0,compM=0,nu=0;for(let i=0;i<T.n;i++){const w=T.target[i];if(w>0&&S.noise){wsum+=w;noiseP+=w*S.noise[i];no2P+=w*S.no2[i];shadeP+=w*(1-(S.ground?S.ground[i]:1));}
    if(SURF[surfKey(T,i)].seal<0.5){glM+=S.ground?S.ground[i]:1;litM+=S.lit[i];faunaM+=S.fauna[i];compM+=S.comp[i];nu++;}}
  const area=T.nx*T.ny*T.res*T.res;
  S.hist.push({y:S.year0+S.year,n,cls,hd:hdN?hdS/hdN:null,zsM,openF:n4z?nOpen/n4z:null,belowF:n4z?nB/n4z:null,hdBelow:nB?hdB/nB:null,hdCanopy:nC?hdC/nC:null,hdOpen:nOpen?hdO/nOpen:null,lai:ladT,cf:n?cfS/n:0,mlow:mlow/n4,alow:alow/n4,wd:n?wd/n:0,inf:n?inf/n:0,dD:nG?dD/nG:null,dH:nG?dH/nG:null,serv,risk,ops:deep(S.ops),rbh:S.ops.rbh,
    def:{l:nl?def.l/nl:0,w:nl?def.w/nl:0,n:nl?def.n/nl:0,x:nl?def.x/nl:0},fails:S.fails||0,ev:(S.events||[]).map(e=>e?e.type:'-').join('/'),cumFail:S.cum.fail,cumRbh:S.cum.rbh,cumRem:S.cum.removed,
    comp,spA,suA,recBig,canopy:canopy/area,noiseP:wsum?noiseP/wsum:null,no2P:wsum?no2P/wsum:null,shadeP:wsum?shadeP/wsum:null,soil:{gl:nu?glM/nu:null,lit:nu?litM/nu:null,fauna:nu?faunaM/nu:null,comp:nu?compM/nu:null},deaths:deep(S.deaths)});
  if(S.hist.length>400)S.hist.shift();}
