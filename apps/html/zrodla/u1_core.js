/* SPDX-License-Identifier: MPL-2.0
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.
 * © 2026 Piotr Mędrzycki, Paweł Mędrzycki */
/* ================= Okap Teren · interfejs: wspólne ================= */
const VERSION='4.1.0',CODENAME='Brick Betula';
const $=id=>document.getElementById(id);
const h=(tag,attrs,...kids)=>{const e=document.createElement(tag);if(attrs)for(const k in attrs){if(k==='class')e.className=attrs[k];else if(k==='html')e.innerHTML=attrs[k];else if(k.startsWith('on'))e.addEventListener(k.slice(2),attrs[k]);else if(attrs[k]!=null&&attrs[k]!==false)e.setAttribute(k,attrs[k]);}
  for(const c of kids.flat()){if(c==null||c===false)continue;e.append(c.nodeType?c:document.createTextNode(String(c)));}return e;};
const fmt=(v,d=1)=>v==null||!isFinite(v)?'–':Number(v).toLocaleString('pl-PL',{minimumFractionDigits:d,maximumFractionDigits:d});
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let toastT=0;function toast(m,ms){const t=$('toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),ms||2600);}
let CSSV={};
function readCss(){const cs=getComputedStyle(document.documentElement);const out={};for(const n of ['bg','surface','surface-2','ink','ink-soft','line','accent','sky-top','sky-bot','bld','bld-top','crit','warn','good','info','trunk','dead','road','t-zw','t-zs','t-uw','t-us',
  's-trawnik','s-sciolka','s-chodnik','s-laka','s-zadrz','s-rabata','s-klomb','s-grad','s-leg','s-ekoton','w1','w2','w3','w4','w5','w6','card','grid'])out[n]=cs.getPropertyValue('--'+n).trim();CSSV=out;}
const isDark=()=>{const c=hex2rgb(CSSV.bg||'#EDEFEA');return c[0]+c[1]+c[2]<300;};
function hex2rgb(s){s=String(s||'').trim();if(s.startsWith('rgb')){const m=s.match(/[\d.]+/g);return [+m[0],+m[1],+m[2]];}if(s[0]==='#')s=s.slice(1);if(s.length===3)s=s.split('').map(c=>c+c).join('');const v=parseInt(s,16);return [(v>>16)&255,(v>>8)&255,v&255];}
const rgbs=(c,a)=>a==null?`rgb(${c[0]|0},${c[1]|0},${c[2]|0})`:`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;
const mix=(a,b,f)=>[a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,a[2]+(b[2]-a[2])*f];
// rampy barw dla warstw ciągłych (te same w obu motywach; jasność podłoża niezależna od motywu)
const RAMPS={
  terrain:['#2F5D50','#6E9A5E','#C9C27A','#B0805A','#E9E2D5'],
  green:['#F2EFD8','#B9D58C','#5E9E4E','#1F5A33'],
  blue:['#F3EBD6','#A9CFD9','#3E87A8','#123E6B'],
  brown:['#F1E9D6','#CDAE7E','#8A6238','#4A2E16'],
  red:['#F3EEE4','#E9B98E','#C9623A','#7D1D1D'],
  light:['#1B1F2A','#4B3F72','#B5645A','#F2C14E','#FFF7D6'],
  heat:['#F7F4C8','#F4C04A','#E5762E','#B8322A','#5C1336'],
  purple:['#F2EEF4','#C9B3DA','#8B62B0','#4A2470']};
const rampCache={};
function rampRGB(name,t){t=t<0?0:t>1?1:t;const st=rampCache[name]||(rampCache[name]=RAMPS[name].map(hex2rgb));const f=t*(st.length-1);const i=Math.min(st.length-2,Math.floor(f));return mix(st[i],st[i+1],f-i);}
const rampCSS=name=>'linear-gradient(90deg,'+RAMPS[name].join(',')+')';

/* ================= warstwy ================= */
let T=null;           // bieżący teren (S.T po starcie symulacji)
const SURF_COL={chodnik:'s-chodnik',trawnik:'s-trawnik',laka:'s-laka',rabata:'s-rabata',klomb:'s-klomb',sciolka:'s-sciolka',zadrzewienie:'s-zadrz',grad:'s-grad',leg:'s-leg',ekoton:'s-ekoton',jezdnia:'road',budynek:'bld'};
const HAB_COL={zw:'t-zw',zs:'t-zs',uw:'t-uw',us:'t-us'};
const chmAt=i=>{let v=T.bld[i]>0?T.bld[i]:0;if(S&&S.vx&&S.vx.hi[i]>=0){const c=S.vx.top[i]-T.dtm[i];if(c>v)v=c;}return v;};
const laiAt=i=>{const X=S&&S.vx;if(!X||X.hi[i]<0)return 0;let l=0;for(let k=X.lo[i];k<=X.hi[i];k++)l+=X.mu[X.off[i]+k-X.lo[i]];return l*X.dz/0.5;};
const peopleW=i=>{const tg=T.target[i];if(!tg)return 0;const sh=S&&S.ground?1-S.ground[i]:0;const nz=S&&S.noise?S.noise[i]:50;return tg*(0.6+0.6*sh)*(nz>65?0.7:1);};
// warstwy rastrowe: podgląd na podłożu, eksport ASC/CSV, profil w przekroju
const LAYERS=[
  {k:'surf',n:'Płaty: nawierzchnia i runo',cat:'surf',val:i=>T.surf[i],exp:true,dec:0},
  {k:'hab',n:'Siedlisko',cat:'hab',val:i=>T.hab[i],exp:true,dec:0},
  {k:'dtm',n:'Wysokość terenu (NMT)',u:'m n.p.m.',ramp:'terrain',auto:true,val:i=>T.dtm[i],exp:true},
  {k:'chm',n:'Wysokość pokrycia (nNMPT)',u:'m',ramp:'green',lo:0,hi:30,val:chmAt,exp:true},
  {k:'lai',n:'Ulistnienie kolumny (LAI, wsk.)',u:'m²/m²',ramp:'green',lo:0,hi:6,val:laiAt,exp:true,sim:true},
  {k:'zstar',n:'Wysokość zwarcia z* (PPA; szare = otwarte)',u:'m',ramp:'green',lo:0,hi:30,val:i=>S.zstar?S.zstar[i]:NaN,exp:true,sim:true},
  {k:'twi',n:'Wilgotność (TWI, względny)',u:'−1…1',ramp:'blue',lo:-1,hi:1,val:i=>T.twiN[i],exp:true},
  {k:'vig',n:'Runo: wigor',u:'0–1',ramp:'green',lo:0,hi:1,val:i=>S.vig[i],exp:true,sim:true},
  {k:'lit',n:'Ściółka',u:'0–3',ramp:'brown',lo:0,hi:2,val:i=>S.lit[i],exp:true,sim:true},
  {k:'fauna',n:'Fauna glebowa',u:'0–1',ramp:'brown',lo:0,hi:1,val:i=>S.fauna[i],exp:true,sim:true},
  {k:'comp',n:'Ugniecenie gleby',u:'0–0,8',ramp:'red',lo:0,hi:0.8,val:i=>S.comp[i],exp:true,sim:true},
  {k:'ground',n:'Światło przy ziemi',u:'0–1',ramp:'light',lo:0,hi:1,val:i=>S.ground?S.ground[i]:1,exp:true,sim:true},
  {k:'noise',n:'Hałas drogowy',u:'dB',ramp:'heat',lo:40,hi:80,val:i=>S.noise?S.noise[i]:NaN,exp:true,sim:true},
  {k:'no2',n:'NO₂ (wskaźnik z hałasu)',u:'0–1',ramp:'heat',lo:0,hi:1,val:i=>S.no2?S.no2[i]:NaN,exp:true,sim:true},
  {k:'salt',n:'Sól w glebie',u:'0–1,5',ramp:'red',lo:0,hi:1.5,val:i=>S.soilSalt[i],exp:true,sim:true},
  {k:'people',n:'Ludzie (obecność ważona)',u:'0–4',ramp:'purple',lo:0,hi:4,val:peopleW,exp:true,sim:true},
  {k:'target',n:'Strefa użytkowania (cel 0–3)',u:'0–3',ramp:'purple',lo:0,hi:3,val:i=>T.target[i],exp:true,dec:0},
  {k:'traffic',n:'Natężenie ruchu (0–3)',u:'0–3',ramp:'heat',lo:0,hi:3,val:i=>T.traffic[i],exp:true,dec:0},
  {k:'bld',n:'Wysokość budynków',u:'m',ramp:'purple',lo:0,hi:30,val:i=>T.bld[i],exp:true},
];
const LBYK=Object.fromEntries(LAYERS.map(l=>[l.k,l]));
function catClasses(cat){if(cat==='surf')return SURF_CODES.map((c,j)=>({v:j,n:SURF[c].name,col:CSSV[SURF_COL[c]]||'#888'}));return HAB_CODES.map((c,j)=>({v:j,n:HAB[c].name,col:CSSV[HAB_COL[c]]||'#888'}));}
function layerRange(L){if(!L.auto)return [L.lo,L.hi];let lo=1e9,hi=-1e9;for(let i=0;i<T.n;i++){const v=L.val(i);if(isFinite(v)){if(v<lo)lo=v;if(v>hi)hi=v;}}if(hi-lo<0.5){hi+=0.25;lo-=0.25;}return [lo,hi];}
// obiekty punktowe: rój (punkty) albo mapa ciepła (średnia ważona w oknie)
const PTS={
  people:{n:'Ludzie pod drzewami i na ścieżkach',field:peopleW},
  fails:{n:'Awarie: wywroty, złamania, konary',log:['wywrot','złamanie','konar']},
  removed:{n:'Usunięcia drzew',log:['usunięcie','wycinka']},
  regen:{n:'Odnowienia < 4 m (samosiewy, odrosty)',trees:t=>(t.origin==='samosiew'||t.origin==='odrost')&&t.H<4&&!t.dead},
  rot:{n:'Drzewa ze zgnilizną pnia',trees:t=>t.inf&&!t.dead,w:t=>0.3+t.dr},
  risk:{n:'Drzewa o podwyższonym ryzyku',trees:t=>t.risk>0.5,w:t=>Math.min(3,t.risk)}};
