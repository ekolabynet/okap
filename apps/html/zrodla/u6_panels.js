/* ================= wykresy ================= */
function chartCtx(cv){const r=cv.getBoundingClientRect();const d=Math.min(2,window.devicePixelRatio||1);cv.width=Math.max(10,Math.round(r.width*d));cv.height=Math.max(10,Math.round(r.height*d));const c=cv.getContext('2d');c.setTransform(d,0,0,d,0,0);return [c,r.width,r.height];}
const FONT=()=>getComputedStyle(document.body).fontFamily;
function axes(c,W,H,x0,x1,y0,y1,m){c.strokeStyle=CSSV.line;c.fillStyle=CSSV['ink-soft'];c.lineWidth=1;c.font='11px '+FONT();const sx=x=>m.l+(x-x0)/(x1-x0||1)*(W-m.l-m.r),sy=y=>H-m.b-(y-y0)/(y1-y0||1)*(H-m.t-m.b);
  const ys=niceStep((y1-y0)/4);c.textAlign='right';c.textBaseline='middle';for(let y=Math.ceil(y0/ys)*ys;y<=y1+1e-9;y+=ys){c.globalAlpha=0.6;c.beginPath();c.moveTo(m.l,sy(y));c.lineTo(W-m.r,sy(y));c.stroke();c.globalAlpha=1;c.fillText(fmt(y,ys<1?(ys<0.1?2:1):0),m.l-4,sy(y));}
  const xs=m.int?Math.max(1,niceStep((x1-x0)/4)):niceStep((x1-x0)/4);c.textAlign='center';c.textBaseline='top';for(let x=Math.ceil(x0/xs)*xs;x<=x1+1e-9;x+=xs)c.fillText(String(Math.round(x*100)/100),sx(x),H-m.b+3);return [sx,sy];}
function lineChart(cv,series,opt){opt=opt||{};const [c,W,H]=chartCtx(cv);c.clearRect(0,0,W,H);let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
  for(const s of series){for(const [x,y] of s.pts){if(y==null||!isFinite(y))continue;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}for(const b of s.band||[]){if(isFinite(b[1]))y0=Math.min(y0,b[1]);if(isFinite(b[2]))y1=Math.max(y1,b[2]);}}
  if(x0>x1){c.fillStyle=CSSV['ink-soft'];c.font='12px '+FONT();c.fillText('brak danych',10,20);return;}if(opt.zero!==false&&y0>0&&y0<(y1-y0)*0.6)y0=0;if(y1-y0<1e-9){y1+=1;y0-=opt.zero===false?1:0;}const pad=(y1-y0)*0.06;y1+=pad;if(y0!==0)y0-=pad;if(x1===x0)x1=x0+1;
  const leg=opt.legend&&series.length>1;const m={int:true,l:40,r:16,t:leg?6+14*Math.ceil(series.length/2):6,b:18};const [sx,sy]=axes(c,W,H,x0,x1,y0,y1,m);
  for(const s of series){if(s.band){c.fillStyle=rgbs(hex2rgb(s.col),0.14);c.beginPath();let st=false;s.band.forEach(b=>{if(!isFinite(b[1]))return;if(!st){c.moveTo(sx(b[0]),sy(b[2]));st=true;}else c.lineTo(sx(b[0]),sy(b[2]));});for(let i=s.band.length-1;i>=0;i--){const b=s.band[i];if(isFinite(b[1]))c.lineTo(sx(b[0]),sy(b[1]));}c.closePath();c.fill();}
    c.strokeStyle=s.col;c.lineWidth=s.w||2;c.setLineDash(s.dash||[]);c.beginPath();let st=false;for(const [x,y] of s.pts){if(y==null||!isFinite(y)){st=false;continue;}if(st)c.lineTo(sx(x),sy(y));else{c.moveTo(sx(x),sy(y));st=true;}}c.stroke();c.setLineDash([]);}
  if(leg){c.font='11px '+FONT();c.textAlign='left';c.textBaseline='middle';series.forEach((s,i)=>{const x=m.l+(i%2)*(W-m.l)/2,y=8+14*Math.floor(i/2);c.fillStyle=s.col;c.fillRect(x,y-2,12,4);c.fillStyle=CSSV.ink;c.fillText(s.name.length>34?s.name.slice(0,33)+'…':s.name,x+16,y);});}
  else if(series.length>1||series[0]&&series[0].name){c.font='11px '+FONT();c.textAlign='right';c.textBaseline='top';let x=W-m.r;for(let i=series.length-1;i>=0;i--){const s=series[i];if(!s.name)continue;const w=c.measureText(s.name).width;c.fillStyle=CSSV.ink;c.fillText(s.name,x,2);c.fillStyle=s.col;c.fillRect(x-w-14,7,10,3);x-=w+22;}}}
function barChart(cv,items){const [c,W,H]=chartCtx(cv);c.clearRect(0,0,W,H);if(!items.length)return;let y1=0,y0=0;for(const it of items){y1=Math.max(y1,(it.v||0)+(it.sd||0));y0=Math.min(y0,(it.v||0)-(it.sd||0));}if(y1===y0)y1=1;
  const m={l:40,r:8,t:6,b:Math.min(130,14+4.6*Math.min(28,Math.max(...items.map(i=>i.name.length))))};const [,sy]=axes(c,W,H,0,1,y0,y1*1.05,m);c.clearRect(m.l,H-m.b+1,W,m.b);const bw=(W-m.l-m.r)/items.length;
  items.forEach((it,i)=>{const x=m.l+i*bw+bw*0.15,w=bw*0.7;c.fillStyle=it.col;c.fillRect(x,sy(Math.max(0,it.v||0)),w,Math.abs(sy(it.v||0)-sy(0)));c.strokeStyle=CSSV.ink;c.lineWidth=1.2;const xc=x+w/2;c.beginPath();c.moveTo(xc,sy((it.v||0)-(it.sd||0)));c.lineTo(xc,sy((it.v||0)+(it.sd||0)));c.moveTo(xc-4,sy((it.v||0)+(it.sd||0)));c.lineTo(xc+4,sy((it.v||0)+(it.sd||0)));c.moveTo(xc-4,sy((it.v||0)-(it.sd||0)));c.lineTo(xc+4,sy((it.v||0)-(it.sd||0)));c.stroke();
    c.save();c.translate(xc,H-m.b+4);c.rotate(-Math.PI/4);c.fillStyle=CSSV['ink-soft'];c.font='10.5px '+FONT();c.textAlign='right';c.textBaseline='middle';c.fillText(it.name.length>28?it.name.slice(0,27)+'…':it.name,0,0);c.restore();});}
function scatterChart(cv,pts,opt){const [c,W,H]=chartCtx(cv);c.clearRect(0,0,W,H);if(!pts.length){c.fillStyle=CSSV['ink-soft'];c.font='12px '+FONT();c.fillText('brak drzew ≥ 4 m'+(opt.vline!=null?' w zwarciu':''),10,20);return;}let x0=0,x1=0,y1=0;for(const p of pts){x0=Math.min(x0,p.x);x1=Math.max(x1,p.x);y1=Math.max(y1,p.y);}if(x1<=x0)x1=x0+1;
  const m={l:40,r:8,t:6,b:30};const pad=(x1-x0)*0.05;const [sx,sy]=axes(c,W,H,x0<0?x0-pad:0,x1+pad,0,y1*1.08,m);if(opt.vline!=null){c.strokeStyle=CSSV.accent;c.setLineDash([4,3]);c.beginPath();c.moveTo(sx(opt.vline),m.t);c.lineTo(sx(opt.vline),H-m.b);c.stroke();c.setLineDash([]);}c.fillStyle=CSSV['ink-soft'];c.textAlign='center';c.textBaseline='bottom';c.fillText(opt.xl,W/2,H-1);
  for(const p of pts){c.fillStyle=rgbs(p.c,0.8);c.beginPath();c.arc(sx(p.x),sy(p.y),p.sel?4.5:2.6,0,6.283);c.fill();if(p.sel){c.strokeStyle=CSSV.accent;c.lineWidth=2;c.stroke();}}}

// profil pionowy: gęstość ulistnienia (oś dolna) i pokrycie (0–1, oś górna) względem wysokości nad gruntem
function profileChart(cv,vp,zs){const [c,W,H]=chartCtx(cv);c.clearRect(0,0,W,H);const nk=vp.lad.length;if(!nk){c.fillStyle=CSSV['ink-soft'];c.font='12px '+FONT();c.fillText('brak koron',10,20);return;}
  const m={l:40,r:12,t:16,b:30};const zmax=nk*vp.dz;let lmax=0;for(const v of vp.lad)lmax=Math.max(lmax,v);lmax=lmax||1;const sx=v=>m.l+v/lmax*(W-m.l-m.r),sc=v=>m.l+v*(W-m.l-m.r),sy=z=>H-m.b-z/zmax*(H-m.t-m.b);
  c.strokeStyle=CSSV.line;c.fillStyle=CSSV['ink-soft'];c.font='11px '+FONT();c.textAlign='right';c.textBaseline='middle';const st=niceStep(zmax/5);for(let z=0;z<=zmax;z+=st){c.globalAlpha=0.6;c.beginPath();c.moveTo(m.l,sy(z));c.lineTo(W-m.r,sy(z));c.stroke();c.globalAlpha=1;c.fillText(fmt(z,0)+' m',m.l-4,sy(z));}
  c.fillStyle=rgbs(hex2rgb(CSSV.w3),0.45);for(let k=0;k<nk;k++){c.fillRect(m.l,sy((k+1)*vp.dz),sx(vp.lad[k])-m.l,sy(k*vp.dz)-sy((k+1)*vp.dz)-0.5);}
  c.strokeStyle=CSSV.w1;c.lineWidth=2;c.beginPath();for(let k=0;k<nk;k++){const y=sy((k+0.5)*vp.dz);if(k)c.lineTo(sc(vp.cov[k]),y);else c.moveTo(sc(vp.cov[k]),y);}c.stroke();
  if(zs!=null&&isFinite(zs)&&zs<zmax){c.strokeStyle=CSSV.accent;c.setLineDash([5,3]);c.beginPath();c.moveTo(m.l,sy(zs));c.lineTo(W-m.r,sy(zs));c.stroke();c.setLineDash([]);c.fillStyle=CSSV.accent;c.textAlign='right';c.textBaseline='bottom';c.fillText('z* (mediana) '+fmt(zs,1)+' m',W-m.r,sy(zs)-2);}
  c.fillStyle=CSSV['ink-soft'];c.textAlign='left';c.textBaseline='bottom';c.font='10.5px '+FONT();c.fillText('słupki: ulistnienie (maks. '+fmt(lmax,2)+' m²/m³) · linia: pokrycie 0–1',m.l,H-2);}
/* ================= wskaźniki ================= */
function card(k,v,s,tone){return `<div class="card"><div class="k">${esc(k)}</div><div class="v"${tone?` style="color:var(--${tone})"`:''}>${v}</div>${s?`<div class="s">${s}</div>`:''}</div>`;}
function updateCards(){if(!S)return;const h_=S.hist[S.hist.length-1];if(!h_)return;const alive=S.trees.filter(t=>!t.dead).length,dead=S.trees.length-alive;
  $('cards').innerHTML=[card('Rok',S.year0+S.year,S.lastSeason<0?'start':SEAS[SEASON_UI()]),card('Drzewa żywe',alive,dead?dead+' martwych stojących':''),card('Pokrycie koron',fmt(100*h_.canopy,0)+'%','udział powierzchni terenu'),
    card('Smukłość H/D',fmt(h_.hd,0),'średnia drzew ≥ 4 m'),card('z* (PPA, mediana)',h_.zsM!=null?fmt(h_.zsM,1)+' m':'brak zwarcia','otwarte: '+fmt(100*(h_.openF||0),0)+'% drzew ≥ 4 m'),card('Tuż pod z*',fmt(100*(h_.belowF||0),0)+'%','H/D tam '+fmt(h_.hdBelow,0)+' · w okapie '+fmt(h_.hdCanopy,0)+' · otwarte '+fmt(h_.hdOpen,0)),card('Zapas pnia < 1',fmt(100*h_.mlow,0)+'%','drzew ≥ 4 m',h_.mlow>0.25?'warn':''),card('Zapas zakotwienia < 1',fmt(100*h_.alow,0)+'%','drzew ≥ 4 m',h_.alow>0.25?'warn':''),
    card('Awarie',S.cum.fail,'w ostatnim roku: '+h_.fails,h_.fails?'crit':''),card('Usunięte · posadzone',S.cum.removed+' · '+S.cum.planted,'od startu'),card('Odnowienie',S.cum.seed+' · '+S.cum.suck,'samosiewy · odrosty; ≥ 4 m: '+h_.recBig),
    card('Nakład pracy',fmt(h_.rbh,0)+' rbh','w ostatnim roku'),card('Usługi drzew',fmt(h_.serv.tot,0),'indeks roczny (roboczy)'),card('Hałas przy ludziach',fmt(h_.noiseP,1)+' dB','NO₂: '+fmt(h_.no2P,2)+' · cień '+fmt(100*(h_.shadeP||0),0)+'%')].join('');}
function chartBox(id,t,big){return `<div class="chart${big?' big':''}"><div class="t">${esc(t)}</div><canvas id="${id}"></canvas></div>`;}
function buildCharts(){$('charts').innerHTML=[chartBox('cN','Drzewa i odnowienia ≥ 4 m'),chartBox('cCan','Pokrycie koron i kondycja'),chartBox('cHD','Smukłość H/D (średnia, H ≥ 4 m)'),chartBox('cM','Zapas pnia i zakotwienia < 1 (udział)'),
  chartBox('cF','Awarie i usunięcia (suma)'),chartBox('cR','Nakład pracy (rbh na rok)'),chartBox('cS','Usługi drzew (indeks roczny)'),chartBox('cE','Narażenie ludzi: hałas [dB]'),chartBox('cZ','Smukłość względem z*: tuż pod, w okapie, otwarte'),chartBox('cHDD','Smukłość a pierśnica (barwa: sygnał konkurencji)',true),chartBox('cHZ','Smukłość a położenie względem z* (H − z*)',true),chartBox('cVP','Profil pionowy okapu (woksele)',true),chartBox('cSp','Skład gatunkowy (żywe drzewa)',true)].join('');}
function updateCharts(){if(!S||!$('cN'))return;const H_=S.hist;const ys=H_.map(x=>x.y);const L=(k,f)=>H_.map(x=>[x.y,f?f(x):x[k]]);const C=CSSV;
  lineChart($('cN'),[{name:'drzewa',col:C.w1,pts:L('n')},{name:'odnowienia ≥ 4 m',col:C.w3,pts:L('recBig')}]);
  lineChart($('cCan'),[{name:'pokrycie',col:C.w3,pts:L(0,x=>x.canopy)},{name:'kondycja',col:C.w5,pts:L('cf')}]);
  lineChart($('cHD'),[{col:C.w2,pts:L('hd')}],{zero:false});
  lineChart($('cM'),[{name:'pień',col:C.w2,pts:L('mlow')},{name:'zakotwienie',col:C.w4,pts:L('alow')}]);
  lineChart($('cF'),[{name:'awarie',col:C.crit,pts:L('cumFail')},{name:'usunięcia',col:C.w6,pts:L('cumRem')}]);
  lineChart($('cR'),[{col:C.w5,pts:L('rbh')}]);lineChart($('cS'),[{col:C.w3,pts:L(0,x=>x.serv.tot)}]);lineChart($('cE'),[{col:C.w4,pts:L('noiseP')}],{zero:false});
  const pts=S.trees.filter(t=>t.alive&&!t.dead&&t.H>=4&&t.D>3).map(t=>({x:t.D,y:t.H/(t.D/100),c:rampRGB('heat',clamp(t.cue,0,1)),sel:t.id===V.sel}));scatterChart($('cHDD'),pts,{xl:'pierśnica [cm]; ciemne = silna konkurencja'});
  lineChart($('cZ'),[{name:'tuż pod z*',col:C.w2,pts:L('hdBelow')},{name:'okap',col:C.w1,pts:L('hdCanopy')},{name:'otwarte',col:C.w3,pts:L('hdOpen')}],{zero:false,legend:true});
  const hz=S.trees.filter(t=>t.alive&&!t.dead&&t.H>=4&&t.D>3&&isFinite(t.zs)).map(t=>({x:t.H-t.zs,y:t.H/(t.D/100),c:hex2rgb(P.species[t.sp].color),sel:t.id===V.sel}));scatterChart($('cHZ'),hz,{xl:'H − z* [m]; poniżej 0: pod zwarciem okapu',vline:0});
  profileChart($('cVP'),vertProfile(),H_.length?H_[H_.length-1].zsM:null);
  const cnt={};S.trees.forEach(t=>{if(t.alive&&!t.dead)cnt[t.sp]=(cnt[t.sp]||0)+1;});const top=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,12);barChart($('cSp'),top.map(([sp,n])=>({name:P.species[sp].name,col:P.species[sp].color,v:n,sd:0})));}

/* ================= karta drzewa ================= */
function treeCard(){const el=$('treeCard');const t=S&&S.trees.find(x=>x.id===V.sel);if(!t){el.innerHTML='<div class="note">Kliknij drzewo na widoku (narzędzie „Wskaż”).</div>';return;}const s=P.species[t.sp];const I=IND(t);
  const kv=(a)=>a.map(([k,v])=>`<span>${esc(k)}</span><span>${v}</span>`).join('');const pct=v=>fmt(100*v,0)+'%';
  const gen=GEN_TRAITS.filter(k=>k!=='alloc'&&t.gz&&t.gz[k]!=null).map(k=>`${k} ${t.gz[k]>=0?'+':''}${fmt(t.gz[k],2)}`).join(' · ');
  el.innerHTML=`<div class="cols"><div class="box"><h3>${esc(s.name)} <span class="chip">${esc(abbrOf(s))}</span></h3><div class="note"><i>${esc(s.latin)}</i> · ${esc(t.origin)} · nr ${t.id}${t.srcId!=null?' (źródłowy '+esc(t.srcId)+')':''}</div>
    <h4>Rozmiar i kształt</h4><div class="kv">${kv([['wiek',t.age+' lat'],['wysokość',fmt(t.H,1)+' m'],['pierśnica',fmt(t.D,1)+' cm'],['smukłość H/D',fmt(t.H/(t.D/100),0)],['promień korony (efektywny / potencjalny)',fmt(t.Reff,1)+' / '+fmt(t.Rp,1)+' m'],['kondycja korony',pct(t.cf)],['położenie',fmt(t.x+T.xll,1)+'; '+fmt(t.y+T.yll,1)],['teren pod pniem',fmt(t.z0,1)+' m n.p.m. · '+esc(SURF[surfKey(T,t.ci)].name)]])}</div>
    <h4>Konkurencja i środowisko</h4><div class="kv">${kv([['światło korony',pct(t.lf)],['sygnał konkurencji (cień od wyższych)',pct(t.cue)],['ekspozycja na wiatr',pct(t.exp)],['z* w otoczeniu (PPA)',isFinite(t.zs)?fmt(t.zs,1)+' m · H − z* = '+fmt(t.H-t.zs,1)+' m':'brak zwarcia (drzewo otwarte)'],['przesunięcie środka korony',fmt(Math.hypot(t.ox||0,t.oy||0),2)+' m'],['gleba dostępna dla korzeni',pct(t.sv)],['stres wodny (najwyższy w roku)',pct(t.ds)],['hałas / NO₂ przy pniu',fmt(S.noise[t.ci],0)+' dB / '+fmt(S.no2[t.ci],2)],['sól w glebie',fmt(S.soilSalt[t.ci],2)]])}</div></div>
    <div class="box"><h4>Mechanika</h4><div class="kv">${kv([['zapas pnia (przy wietrze odniesienia)',fmt(t.margin,2)],['zapas zakotwienia',fmt(t.anch,2)],['roczne prawd. awarii',pct(t.pf)],['prawd. spadku konaru',pct(t.pb)],['ryzyko (z obecnością ludzi)',fmt(t.risk,2)],['zgnilizna pnia',t.inf?pct(t.dr):'brak'],['rany',pct(t.wound)],['złamania w historii',t.broken]])}</div>
    <h4>Alokacja w ostatnim lecie</h4><div class="kv">${kv([['wysokość / grubość',pct(t.f.h)+' / '+pct(t.f.d)],['korona / korzenie',pct(t.f.c)+' / '+pct(t.f.r)],['gra o wysokość aktywna',t.game?'tak':'nie'],['przyrost ΔH / ΔD (rok)',fmt(t.dH,2)+' m / '+fmt(t.dD,2)+' cm'],['bilans netto (rok)',fmt(t.net,2)]])}</div>
    <h4>Kształt korony (promienie 8 sektorów)</h4><div class="row"><canvas id="tcStar" style="width:150px;height:150px"></canvas><div class="note mono" style="font-size:11.5px">${t.cr?SEC_NAMES.map((n,k)=>n+' '+fmt(t.cr[k],1)).join(' · '):'–'}<br>woksele: ${t.nvox||0}</div></div>
    <h4>Genotyp (odchylenia z)</h4><div class="note mono" style="font-size:11.5px">${esc(gen||'–')}</div>
    <div class="row"><button class="btn" id="tcCut">Wytnij</button><button class="btn" id="tcRed">Redukcja korony</button><button class="btn" id="tcSan">Cięcie sanitarne</button></div></div></div>`;
  drawStar($('tcStar'),t);$('tcCut').onclick=()=>{cutTree(t);};$('tcRed').onclick=()=>{pruneTree(t,'red');};$('tcSan').onclick=()=>{pruneTree(t,'san');};}

// mała mapa korony: promienie sektorów (północ u góry), środek przesunięty, przerywany okrąg = średnia
function drawStar(cv,t){if(!cv||!t.cr)return;if(cv.getBoundingClientRect().width<40)return;const [c,W,H]=chartCtx(cv);c.clearRect(0,0,W,H);let mx=0;for(const r of t.cr)mx=Math.max(mx,r);const sc=(Math.min(W,H)/2-14)/Math.max(mx,0.5);const cx=W/2,cy=H/2;
  c.strokeStyle=CSSV.line;c.lineWidth=1;c.beginPath();c.moveTo(cx,6);c.lineTo(cx,H-6);c.moveTo(6,cy);c.lineTo(W-6,cy);c.stroke();const m=t.cr.reduce((a,b)=>a+b,0)/8;c.setLineDash([3,3]);c.beginPath();c.arc(cx,cy,m*sc,0,6.283);c.stroke();c.setLineDash([]);
  const col=hex2rgb(P.species[t.sp].color);c.fillStyle=rgbs(col,0.45);c.strokeStyle=rgbs(col.map(v=>v*0.6));c.lineWidth=1.5;c.beginPath();for(let k=0;k<=8;k++){const q=k%8;const x=cx+SEC_DX[q]*t.cr[q]*sc,y=cy-SEC_DY[q]*t.cr[q]*sc;if(k)c.lineTo(x,y);else c.moveTo(x,y);}c.closePath();c.fill();c.stroke();
  c.fillStyle=CSSV.trunk;c.beginPath();c.arc(cx,cy,3,0,6.283);c.fill();c.fillStyle=CSSV.ink;c.font='700 10px sans-serif';c.textAlign='center';c.fillText('N',cx,10);}
/* ================= narzędzia ================= */
let TOOL='pick';const BR={attr:'surf',val:1,r:3,bldH:12,dirty:false,traffic:false};
const TOOL_HINT={pick:'Kliknij drzewo, aby zobaczyć kartę; przeciągnij, aby przesunąć widok.',section:'Kliknij punkt A, potem B: powstanie przekrój wzdłuż linii.',plant:'Kliknij podłoże: sadzonka w standardzie alejowym (4 m, 6 cm), 3 lata pielęgnacji.',
  cut:'Kliknij drzewo, aby je wyciąć (odroślowe gatunki mogą wypuścić odrosty).',prune:'Kliknij drzewo, aby je przyciąć.',brush:'Maluj atrybut komórek. Po puszczeniu przelicza się odległości, hałas i światło.'};
const BR_ATTR={surf:{n:'nawierzchnia i runo',opts:()=>SURF_CODES.map((c,i)=>[i,SURF[c].name])},hab:{n:'siedlisko',opts:()=>HAB_CODES.map((c,i)=>[i,HAB[c].name])},traffic:{n:'natężenie ruchu',opts:()=>[[0,'0 brak'],[1,'1 uliczka'],[2,'2 ulica'],[3,'3 arteria']]},
  target:{n:'strefa użytkowania',opts:()=>[[0,'0 rzadko'],[1,'1 zwykle'],[2,'2 często'],[3,'3 bardzo często']]},salt:{n:'solenie',opts:()=>[[0,'nie'],[1,'tak']]},bld:{n:'budynek (wysokość)',opts:null}};
function setTool(t){TOOL=t;document.querySelectorAll('#toolSeg button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));$('vbox').classList.toggle('pick',t!=='pick');V.secA=null;const o=$('toolOpts');o.innerHTML='';
  if(t==='plant'){const s=h('select',{id:'plSp'});P.species.forEach((x,i)=>s.append(h('option',{value:i},x.name)));s.value=String(Math.max(0,spIdx('tcor')));o.append(s);}
  if(t==='prune')o.append(h('select',{id:'prMode'},h('option',{value:'red'},'redukcja korony'),h('option',{value:'san'},'cięcie sanitarne')));
  if(t==='section')o.append(h('button',{class:'btn sm',onclick:()=>openSection('horz')},'Przekrój poziomy'));
  if(t==='brush'){const at=h('select',{onchange:e=>{BR.attr=e.target.value;BR.val=BR.attr==='surf'?1:BR.attr==='hab'?1:0;setTool('brush');}},...Object.entries(BR_ATTR).map(([k,a])=>h('option',{value:k,selected:k===BR.attr},a.n)));o.append(at);
    const A=BR_ATTR[BR.attr];if(A.opts)o.append(h('select',{onchange:e=>BR.val=+e.target.value},...A.opts().map(([v,n])=>h('option',{value:v,selected:v===BR.val},n))));else o.append(h('label',{class:'inl'},'m',h('input',{type:'number',value:BR.bldH,min:0,max:120,style:'width:60px',oninput:e=>BR.bldH=+e.target.value}),h('span',{class:'note'},'0 = usuń')));
    o.append(h('label',{class:'inl'},'promień',h('input',{type:'number',value:BR.r,min:0.5,max:40,step:0.5,style:'width:60px',oninput:e=>BR.r=+e.target.value}),'m'));}
  $('toolHint').textContent=TOOL_HINT[t]||'';requestDraw();}
function afterTreeChange(){crowns(S);canopyRaster(S);computeLight(S,1);computeCover(S);for(const t of S.trees)refMech(t);markDirty();updateCards();treeCard();}
function cutTree(t){if(!t||!t.alive)return;logEv(t,'wycinka');t.alive=false;t.cause='wycinka';t.counted=true;S.deaths['wycinka']=(S.deaths['wycinka']||0)+1;S.cum.removed++;stumpBurst(t,1);S.ops.rem++;S.ops.rbh+=S.W.h_rem;S.trees=S.trees.filter(x=>x.alive);if(V.sel===t.id)V.sel=null;afterTreeChange();toast('Wycięto: '+P.species[t.sp].name+'.');}
function pruneTree(t,mode){if(!t||t.dead)return;const s=IND(t);if(mode==='red'){t.Wc*=0.7;t.H*=0.88;t.wound=clamp(t.wound+0.06,0,1);t.epicT=3;t.pr.red++;S.ops.red++;woundInf(t,s,0.25);}else{t.Wc*=0.55+0.45*t.cf;t.cf=Math.min(1,t.cf+(1-t.cf)*0.6);t.wound=clamp(t.wound+0.02,0,1);t.pr.san++;S.ops.san++;}
  afterTreeChange();toast(mode==='red'?'Redukcja korony wykonana.':'Cięcie sanitarne wykonane.');}
function plantAt(g){if(g.i<0)return;const k=surfKey(T,g.i);if(T.bld[g.i]>0||k==='jezdnia'){toast('Tu nie da się posadzić drzewa ('+SURF[k].name+').');return;}const sp=+$('plSp').value;const nt=plantStandard(sp,g.x,g.y);if(nt){afterTreeChange();toast('Posadzono: '+P.species[sp].name+'.');}}
function paint(g){if(g.i<0)return;const r=BR.r;const st=T.res;let ch=false;for(let dx=-r;dx<=r;dx+=st)for(let dy=-r;dy<=r;dy+=st){if(dx*dx+dy*dy>r*r)continue;const i=cellOf(T,g.x+dx,g.y+dy);if(i<0)continue;
    if(BR.attr==='bld'){if(BR.bldH>0){T.bld[i]=BR.bldH;T.surf[i]=SURF_CODES.indexOf('budynek');T.target[i]=0;}else if(T.bld[i]>0){T.bld[i]=0;T.surf[i]=SURF_CODES.indexOf('trawnik');T.target[i]=1;}BR.traffic=true;}
    else if(BR.attr==='surf'){const was=T.surf[i];T.surf[i]=BR.val;if(SURF_CODES[BR.val]==='budynek'){T.bld[i]=T.bld[i]||BR.bldH;T.target[i]=0;BR.traffic=true;}else if(T.bld[i]>0){T.bld[i]=0;BR.traffic=true;}if(SURF_CODES[BR.val]==='jezdnia'&&!T.traffic[i]){T.traffic[i]=2;BR.traffic=true;}if(SURF_CODES[was]==='jezdnia'&&SURF_CODES[BR.val]!=='jezdnia'){T.traffic[i]=0;BR.traffic=true;}}
    else{T[BR.attr][i]=BR.val;if(BR.attr==='traffic')BR.traffic=true;}ch=true;}if(ch){BR.dirty=true;markDirty();}}
function finishBrush(){if(!BR.dirty)return;BR.dirty=false;deriveTerrain(T);BLDB=null;mapImg=null;S.trees=S.trees.filter(t=>{if(T.bld[t.ci]>0){t.alive=false;return false;}return true;});crowns(S);canopyRaster(S);computeLight(S,1);exposure(S);computeCover(S);
  if(BR.traffic){computeNoise(S);BR.traffic=false;}for(const t of S.trees)refMech(t);markDirty();updateCards();}

/* ================= wskaźnik i gesty na widoku ================= */
let PTR=null;
function initPointer(){const vb=$('vbox');
  vb.addEventListener('pointerdown',e=>{const r=cv.getBoundingClientRect();const x=e.clientX-r.left,y=e.clientY-r.top;PTR={x0:x,y0:y,x,y,px:V.px,py:V.py,moved:false,id:e.pointerId};vb.setPointerCapture(e.pointerId);if(TOOL==='brush'&&S){PTR.brush=true;paint(screenToGround(x,y));}});
  vb.addEventListener('pointermove',e=>{const r=cv.getBoundingClientRect();const x=e.clientX-r.left,y=e.clientY-r.top;
    if(PTR){if(Math.hypot(x-PTR.x0,y-PTR.y0)>5)PTR.moved=true;if(PTR.brush){paint(screenToGround(x,y));return;}if(PTR.moved){V.px=PTR.px+(x-PTR.x0);V.py=PTR.py+(y-PTR.y0);requestDraw();}return;}
    if(e.pointerType==='mouse')hover(x,y);});
  const up=e=>{if(!PTR)return;const p=PTR;PTR=null;try{vb.releasePointerCapture(p.id);}catch(_){}if(p.brush){finishBrush();return;}if(!p.moved)clickAt(p.x0,p.y0);};
  vb.addEventListener('pointerup',up);vb.addEventListener('pointercancel',()=>{PTR=null;});vb.addEventListener('pointerleave',()=>{$('tip').style.display='none';});
  vb.addEventListener('wheel',e=>{e.preventDefault();const r=cv.getBoundingClientRect();zoomAt(Math.exp(-e.deltaY*0.0015),e.clientX-r.left,e.clientY-r.top);},{passive:false});}
function clickAt(x,y){if(!S)return;const g=screenToGround(x,y);const t=pickTree(x,y);
  if(TOOL==='pick'){V.sel=t?t.id:null;requestDraw();treeCard();updateCharts();if(t){showTab('tree');}else if(g.i>=0){const L=LBYK[V.ground];const v=L.val(g.i);toast(`${SURF[surfKey(T,g.i)].name} · ${L.n}: ${L.cat?catClasses(L.cat)[v].n:fmt(v,2)} · ${fmt(g.x+T.xll,1)}; ${fmt(g.y+T.yll,1)}`);}return;}
  if(TOOL==='section'){if(g.i<0)return;if(!V.secA){V.secA={x:g.x,y:g.y};requestDraw();return;}SEC.a=V.secA;SEC.b={x:g.x,y:g.y};V.secA=null;if(Math.hypot(SEC.b.x-SEC.a.x,SEC.b.y-SEC.a.y)<2){SEC.b=null;toast('Za krótki przekrój.');return;}openSection(SEC.mode==='horz'?'prof':SEC.mode);return;}
  if(TOOL==='plant')return plantAt(g);if(TOOL==='cut'){if(t)cutTree(t);return;}if(TOOL==='prune'){if(t)pruneTree(t,$('prMode').value);}}
function hover(x,y){const tip=$('tip');if(!S){tip.style.display='none';return;}const t=pickTree(x,y);let s='';
  if(t)s=`${P.species[t.sp].name} · H ${fmt(t.H,1)} m · D ${fmt(t.D,0)} cm · H/D ${fmt(t.H/(t.D/100),0)}${t.dead?' · martwe':''}`;else{const g=screenToGround(x,y);if(g.i<0){tip.style.display='none';return;}const L=LBYK[V.ground];const v=L.val(g.i);s=`${SURF[surfKey(T,g.i)].name} · ${L.cat?catClasses(L.cat)[v].n:fmt(v,2)+' '+(L.u||'')}`;}
  tip.textContent=s;tip.style.display='block';const w=tip.offsetWidth;tip.style.left=Math.min(V.W-w-6,x+12)+'px';tip.style.top=(y+14)+'px';}

/* ================= parametry ================= */
const PGROUPS=[['Wzrost i alokacja',['eps','woodCost','maintWood','maintLeaf','crownGrow','crownRatio','gameStrength','mechanoStrength','cFR','frTurn','flush']],
  ['Mechanika i wiatr',['qRef','kw','cb','kA','windBase.wind','windBase.storm','windBase.gale',...Object.keys(WORLD_DEFAULT.windRose).map(k=>'windRose.'+k)]],
  ['Stres miejski i woda',['saltDie','saltOsm','saltKeep','saltDecay','noxTox','nfMax','nRoot','nFrost','trafficET','facadeET','heatDie','droughtDie','slopeDry','twiWet']],
  ['Gleba, runo, ściółka',['rakeLoss','mulchBonus','herbComp','trample','mowP','mowKill']],['Rozkład drewna',['infK','decayK']],
  ['Hałas i powietrze',['noiseBg','noiseLw1','noiseLw2','noiseLw3','noiseBarrier','noiseVeg','noiseVegMax','noiseGround','no2Lo','no2Hi','noiseEvery']],
  ['Odnowienie',['seedRain','estab','spont','suckers','closureMin','closureProt','maxTrees']],
  ['Zarządzanie',['inspect','removeMargin','pruneReduce','pruneClear','pruneSanitary','replant','minTarget','weed','basalClean','irrRoot','irrBeds','nurseryPath','noReplant','replantSp']],
  ['Nakład pracy (rbh)',['h_insp','h_san','h_red','h_clr','h_rem','h_plant','h_care','h_weed','h_basal','h_reseed','runoRbh']],['Korony i woksele',['crownPlast','shedL','maxAsym','zR','crownRatio']],['Niepewność i start',['uncert','genVar','startYear']],
  ['Karty pór roku (wagi)',Object.entries(WORLD_DEFAULT.deck).flatMap(([s,d])=>Object.keys(d).map(k=>'deck.'+s+'.'+k))]];
const PLAB={crownPlast:'plastyczność koron (0 = symetryczne)',shedL:'próg światła zrzutu sektora',maxAsym:'maks. sektor / średni promień',zR:'promień do z* (PPA) [m]',crownRatio:'udział korony w wysokości',eps:'wydajność fotosyntezy',woodCost:'koszt drewna',maintWood:'oddychanie drewna',maintLeaf:'oddychanie liści',crownGrow:'przyrost korony',crownRatio:'udział korony w wysokości',gameStrength:'siła gry o wysokość',mechanoStrength:'siła aklimacji mechanicznej',
  qRef:'wiatr odniesienia',inspect:'przegląd co (lat)',removeMargin:'próg usunięcia (zapas)',pruneReduce:'redukcje koron (0/1)',pruneSanitary:'cięcia sanitarne (0/1)',replant:'dosadzenia (0/1)',seedRain:'opad nasion',estab:'ukorzenianie siewek',
  noiseBg:'tło hałasu [dB]',noiseLw1:'moc: uliczka [dB/m]',noiseLw2:'moc: ulica [dB/m]',noiseLw3:'moc: arteria [dB/m]',noiseBarrier:'ekran budynku [dB]',noiseVeg:'tłumienie roślin [dB/m]',noiseVegMax:'maks. tłumienie roślin [dB]',noiseGround:'pochłanianie gruntu [dB]',no2Lo:'NO₂: próg hałasu [dB]',no2Hi:'NO₂: pełne przy [dB]',noiseEvery:'przeliczaj hałas co (lat)',
  uncert:'skala niepewności parametrów',genVar:'skala zmienności genetycznej',startYear:'rok startu',maxTrees:'limit drzew',minTarget:'zarządzaj od strefy',noReplant:'nie dosadzaj gatunków',replantSp:'zamiennik do dosadzeń'};
function buildParams(){const p=$('p-par');p.innerHTML='';const box=h('div',{class:'box'},h('h3',null,'Parametry świata'),h('p',{class:'note'},'Zmiany działają od następnej pory roku w bieżącej grze i trafiają do planów eksperymentów jako „bieżące parametry”. Wartości domyślne są robocze; pomarańczowe pola różnią się od domyślnych.'),
    h('div',{class:'row'},h('button',{class:'btn',onclick:()=>{P={world:deep(WORLD_DEFAULT),species:deep(LIB)};if(S)refreshParams();buildParams();toast('Przywrócono wartości domyślne.');}},'Przywróć domyślne')));
  for(const [g,keys] of PGROUPS){const grid=h('div',{class:'pgrid'});for(const k of keys){const v=getK(P.world,k),d=getK(WORLD_DEFAULT,k);if(v===undefined)continue;const arr=Array.isArray(v);
      const lab=h('label',{class:JSON.stringify(v)!==JSON.stringify(d)?'chg':'',title:k},h('span',null,PLAB[k]||k),h('input',{type:arr?'text':'number',step:'any',value:arr?v.join(', '):v,style:arr?'width:120px':'',onchange:e=>{const nv=arr?e.target.value.split(',').map(x=>x.trim()).filter(Boolean):parseFloat(e.target.value);if(!arr&&!isFinite(nv))return;setK(P.world,k,nv);if(S)refreshParams();lab.className=JSON.stringify(nv)!==JSON.stringify(d)?'chg':'';planInfo&&$('xInfo')&&planInfo();}}));grid.append(lab);}
    box.append(h('h4',null,g),grid);}
  const sel=h('select',{onchange:()=>spGrid()},...P.species.map((s,i)=>h('option',{value:i},s.name+' ('+abbrOf(s)+')')));const sg=h('div',{class:'pgrid'});
  const spGrid=()=>{sg.innerHTML='';const i=+sel.value;const s=P.species[i],b=LIB.find(x=>x.key===s.key);const keys=[];const walk=(o,pre)=>{for(const k in o){const v=o[k];if(typeof v==='number')keys.push(pre+k);else if(v&&typeof v==='object'&&!Array.isArray(v)&&(k==='alloc'||k==='hab'))walk(v,pre+k+'.');}};walk(s,'');
    for(const k of keys){const v=getK(s,k),d=getK(b,k);const lab=h('label',{class:v!==d?'chg':'',title:k},h('span',null,k),h('input',{type:'number',step:'any',value:v,onchange:e=>{const nv=parseFloat(e.target.value);if(!isFinite(nv))return;setK(s,k,nv);if(S)refreshParams();lab.className=nv!==d?'chg':'';}}));sg.append(lab);}};
  const box2=h('div',{class:'box',style:'margin-top:12px'},h('h3',null,'Parametry gatunków'),h('div',{class:'row'},sel),sg);spGrid();p.append(box,box2);}

/* ================= zasady ================= */
function buildRules(){$('rulesDoc').innerHTML=`
<h3>Co nowego w ${VERSION} „${CODENAME}”</h3>
<p>Układ jest teraz mieszany. Grunt (nawierzchnia, runo, gleba, ściółka, hałas, ludzie) zostaje na siatce 2,5D, a przestrzeń nad gruntem to okap z wokseli: sześcianów o boku równym komórce i wysokości 1 m (2 m przy siatce 5 m). Każdy woksel ma tłumienie światła i dominującą koronę.</p>
<ul><li><b>Widok „Woksele”</b> pokazuje teren, budynki, pnie i liście jako bloki (WebGL2), w tej samej aksonometrii co widok 2D. Zimą liście znikają i zostaje szkielet gałęzi.</li>
<li><b>Plastyczne korony.</b> Korona ma 8 promieni sektorów (N, NE … NW). Co roku sektory wydłużają się w stronę światła i wolnej przestrzeni, skracają przy budynkach i wyższych sąsiadach, a w głębokim cieniu zamierają. Środek korony przesuwa się w stronę luki. Średnia szerokość korony nadal wynika z inwestycji w koronę.</li>
<li><b>Światło przez woksele.</b> Promienie (zenit, 8 kierunków nieba, słońce) przechodzą przez kolejne woksele i są tłumione według sumy tłumienia, bez korony własnej. Światło korony to środek i 8 punktów sektorów.</li>
<li><b>z* według PPA.</b> Dla każdego drzewa i dla rastra (co ok. 5 m) liczona jest wysokość, przy której suma powierzchni koron drzew wyższych w kole o promieniu ${P.world.zR} m wypełnia koło. Gdy się nie da, drzewo jest „otwarte”. Wskaźniki: mediana z*, udział drzew tuż pod z* (do 3 m) i ich H/D oraz H/D w okapie i drzew otwartych (hipotezy H4 i H8).</li>
<li><b>Profil pionowy okapu</b> (gęstość ulistnienia i pokrycie na kolejnych poziomach) jest na wykresie i w eksporcie. Eksport ZIP ma katalog <code>woksele/</code> z rastrem na każdy poziom; osobno są CSV wokseli i CSV profilu.</li>
<li><b>Przekroje</b> pokazują woksele koron w pasie (profil) i w płaszczyźnie (pionowy), a przekrój poziomy to wycinek wokseli na zadanej wysokości.</li></ul>
<p><b>Uwaga interpretacyjna.</b> Związek smukłości z położeniem względem z* jest w grze wbudowany w reguły alokacji (gra o wysokość), więc jego pojawienie się w wynikach nie jest dowodem empirycznym. Gra pozwala sprawdzić, jakie wzorce dają przyjęte reguły i jak porównywać je z danymi, np. z woksalizacją ALS.</p>
<h3>Wersja 4.0 „Terrace Tilia”</h3>
<p>Okap Teren to osobne narzędzie obok Okapu Miasto 3.4. Plansza nie jest już przekrojem ulicy, tylko siatką komórek 2,5D: każda komórka ma wysokość terenu, nawierzchnię i runo, siedlisko, ruch, strefę użytkowania i budynek. Drzewa stoją w punktach (x, y) i rywalizują o światło w trzech wymiarach.</p>
<ul><li><b>Widok aksonometryczny i mapa.</b> Obracaj (⟲ ⟳), zmieniaj nachylenie i przewyższenie, przybliżaj kółkiem albo przyciskami, przesuwaj przeciągając.</li>
<li><b>Warstwy do wyboru.</b> Jedna warstwa barwi podłoże (płaty, siedlisko, NMT, nNMPT, wilgotność, runo, ściółka, fauna, ugniecenie, światło przy ziemi, hałas, NO₂, sól, ludzie, ruch, budynki); budynki, drzewa i etykiety gatunków włączasz osobno.</li>
<li><b>Obiekty punktowe</b> (ludzie, awarie, usunięcia, odnowienia, zgnilizna, ryzyko) jako rój punktów albo mapa ciepła (średnia ważona w oknie ok. 6 m).</li>
<li><b>Przekroje:</b> profil 1,5D wzdłuż linii A–B (rzeźba, budynki, drzewa w pasie i wartości warstwy), przekrój pionowy 2D z polem światła oraz przekrój poziomy 2D na wybranej wysokości nad gruntem.</li>
<li><b>Dane:</b> import NMT, NMPT i warstw ASC, drzew z CSV (albo wykrycie budynków i drzew z NMPT); eksport warstw ASC w ZIP, komórek, drzew, szeregu czasowego i dziennika zdarzeń do CSV, ustawień do JSON i CSV.</li>
<li><b>Hałas → zanieczyszczenie:</b> mapa hałasu drogowego liczona z natężenia ruchu i jego propagacji, z ekranowaniem przez budynki i teren, tłumieniem przez niską roślinność i pochłanianiem nad miękkim gruntem. Wskaźnik NO₂ rośnie z hałasem.</li>
<li><b>Eksperymenty wsadowe:</b> N powtórzeń × M eksperymentów × Q ustawień, liczone równolegle w tle; wyniki jako średnia ± SD, wykresy, CSV i JSON, zapis planów i wyników.</li></ul>
<h3>Jak to liczy</h3>
<ul><li><b>Światło.</b> Korony wypełniają woksele według promieni sektorów i profilu pionowego (najszersze na 40% głębokości od podstawy). Tłumienie w wokselu zależy od przepuszczalności gatunku, kondycji korony, ulistnienia w danej porze i jej głębokości. Promienie z zenitu, ośmiu kierunków nieba rozproszonego i słońca (SE, S, SW, wysokość zależna od pory roku) sumują tłumienie wokseli cudzych koron; budynki i teren zasłaniają.</li>
<li><b>Konkurencja.</b> Nakładające się korony dzielą obszar według siły inwestycji w koronę (konkurs Tullocka); niższa traci więcej. „Sygnał konkurencji” to udział światła odebranego przez korony wyżej. Uruchamia on grę o wysokość: przesunięcie alokacji z grubości na wysokość, czyli wzrost smukłości H/D.</li>
<li><b>Wiatr.</b> Ekspozycja wynika z róży wiatrów i osłony z każdego kierunku do odległości 2H. Zapas pnia to D/D wymagane, a zapas zakotwienia to nośność korzeni do obciążenia przy wietrze odniesienia. Burze sprawdzają oba.</li>
<li><b>Gleba i woda.</b> Drzewa dzielą objętość gleby w kole korzeni proporcjonalnie do potrzeb; uszczelnienie ją ogranicza. Wilgotność zależy od siedliska, wskaźnika TWI (spływ po NMT) i nasłonecznienia stoku.</li>
<li><b>Hałas.</b> Źródła to komórki jezdni o mocy zależnej od natężenia ruchu. Poziom w odbiorniku to suma energii ze źródeł do 220 m, z rozbieżnością geometryczną, ekranem (budynek albo teren na linii), tłumieniem przez korony poniżej 4 m i gruntem miękkim. NO₂ = ((L − próg) / (pełne − próg))^1,2, obcięte do 0–1. Można wczytać własną mapę hałasu zamiast modelu.</li>
<li><b>Ludzie.</b> Obecność to strefa użytkowania, zwiększona w cieniu i zmniejszona przy hałasie powyżej 65 dB. Waży ona ryzyko drzew i wskaźniki narażenia.</li></ul>
<h3>Formaty danych</h3>
<ul><li><b>ASC:</b> nagłówek ncols, nrows, xllcorner/xllcenter, yllcorner/yllcenter, cellsize, NODATA_value; pierwszy wiersz to północ. Wszystkie pliki muszą być w jednym układzie (zakładany EPSG:2180).</li>
<li><b>Kody:</b> nawierzchnia i runo ${SURF_CODES.map((c,i)=>i+' '+c).join(', ')}; siedlisko ${HAB_CODES.map((c,i)=>i+' '+c).join(', ')}; ruch i strefa użytkowania 0–3; solenie 0/1.</li>
<li><b>Drzewa CSV:</b> x, y, gatunek, wysokość, pierśnica albo obwód, promień, średnica albo powierzchnia korony, id. Separator jest rozpoznawany samodzielnie.</li>
<li><b>Ustawienia:</b> JSON <code>{world:{…}, species:{tcor:{…}}}</code> albo CSV <code>zakres;klucz;wartosc</code>.</li>
<li><b>Plan eksperymentu:</b> JSON z polami name, years, reps, seed0, settings, experiments albo CSV <code>typ;nazwa;klucz;wartosc</code> (typ: plan, ustawienie, eksperyment).</li>
<li><b>Linia zestawu w planie:</b> <code>nazwa | inspect=1; windBase.gale=3; species.tcor.sigma=0.8</code>.</li></ul>
<h3>Granice tej wersji</h3>
<p>Wszystkie parametry są robocze i nieskalibrowane, z rozkładami niepewności, jak w wersji 3. Wyniki służą do porównywania wariantów między sobą, nie do prognoz dla konkretnych drzew. Przekrojowe wzorce z gry (np. H/D a konkurencja) nie są testem dynamiki.</p>
<p>W wersjach 4.x nie ma jeszcze gildii grzybów poza zgnilizną pnia, symbiontów, kwitnienia i owocowania, zwierząt, odczuć ludzi, wypadków i kampanii z Okapu Miasto 3.4. Trafią do wersji 4.2. Wczytywanie chmur punktów (LAS) i porównanie z woksalizacją ALS to kolejny krok.</p>`;}

/* ================= pętla gry i start ================= */
let PLAY=false,playT=0;const SPEEDS={wolno:900,'zwykle':300,szybko:0};let SPEED='zwykle';
function afterStep(full){markDirty();updateCards();if(full||S.season===0){updateCharts();treeCard();}if(SEC.show&&S.season===0)drawSection();}
function doSeason(){stepSeason();afterStep(false);}
function doYear(){do{stepSeason();}while(S.season!==0);afterStep(true);}
function playLoop(){if(!PLAY)return;doSeason();playT=setTimeout(playLoop,SPEEDS[SPEED]);}
function setPlay(on){PLAY=on;$('bPlay').textContent=on?'❚❚ Pauza':'▶ Graj';$('bPlay').classList.toggle('pri',!on);clearTimeout(playT);if(on)playLoop();}
function startTerrain(Tn){setPlay(false);const seed=+$('seed').value||7;createSim(Tn,seed);T=S.T;V.sel=null;SEC.a=SEC.b=null;closeSection();terrainPrep();sizeCanvas();fitView();markDirty();updateCards();updateCharts();treeCard();terrInfo();
  $('terrName').textContent=T.name+' · '+T.nx+' × '+T.ny+' po '+T.res+' m';planInfo&&$('xInfo')&&planInfo();}
function showTab(k){document.querySelectorAll('#tabbar button').forEach(b=>b.classList.toggle('on',b.dataset.p===k));document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('on',p.id==='p-'+k));if(k==='ind')requestAnimationFrame(updateCharts);if(k==='tree')requestAnimationFrame(()=>{const t=S&&S.trees.find(x=>x.id===V.sel);if(t)drawStar($('tcStar'),t);});if(k==='exp')requestAnimationFrame(()=>{planInfo();if(EXP.results.length)showResults();});}
function buildLayerPanel(){const g=$('lyrGround');g.innerHTML='';for(const L of LAYERS){if(L.k==='bld')continue;g.append(h('label',{class:'lyr'},h('input',{type:'radio',name:'gl',value:L.k,checked:L.k===V.ground,onchange:()=>{V.ground=L.k;markDirty();if(SEC.show)drawSection();}}),L.n,L.u?h('span',{class:'u'},L.u):null));}
  const c=$('lyrComp');c.innerHTML='';for(const [k,n] of [['relief','cieniowanie rzeźby'],['bld','budynki'],['trees','drzewa'],['labels','skróty gatunków'],['legend','legenda']])c.append(h('label',{class:'lyr'},h('input',{type:'checkbox',checked:V.comp[k],onchange:e=>{V.comp[k]=e.target.checked;markDirty();}}),n));
  const ps=$('ptSet');ps.innerHTML='';for(const k in PTS)ps.append(h('option',{value:k,selected:k===V.pt},PTS[k].n));ps.onchange=()=>{V.pt=ps.value;markDirty();};
  document.querySelectorAll('#ptMode button').forEach(b=>b.onclick=()=>{V.ptMode=b.dataset.p;document.querySelectorAll('#ptMode button').forEach(x=>x.classList.toggle('on',x===b));markDirty();});}
function init(){readCss();if(window.innerWidth<640)V.comp.legend=false;$('verChip').textContent=VERSION+' · '+CODENAME;cv=$('cv');ctx=cv.getContext('2d');scv=$('secCv');sctx=scv.getContext('2d');
  const sp=h('select',{id:'speed',title:'Tempo gry',onchange:e=>{SPEED=e.target.value;}},...Object.keys(SPEEDS).map(k=>h('option',{value:k,selected:k===SPEED},k)));$('bPlay').after(sp);
  $('bPlay').onclick=()=>setPlay(!PLAY);$('bSeason').onclick=()=>{setPlay(false);doSeason();if(S.season===0)afterStep(true);};$('bYear').onclick=()=>{setPlay(false);doYear();};$('bReset').onclick=()=>{startTerrain(T);toast('Nowa gra na tym terenie.');};
  document.querySelectorAll('#modeSeg button').forEach(b=>b.onclick=()=>{V.mode=b.dataset.m;document.querySelectorAll('#modeSeg button').forEach(x=>x.classList.toggle('on',x===b));fitView();});
  $('rotL').onclick=()=>{V.az-=15;fitView();};$('rotR').onclick=()=>{V.az+=15;fitView();};$('tilt').oninput=e=>{V.el=+e.target.value;requestDraw();};$('exag').onchange=e=>{V.exag=+e.target.value;shadePrep();markDirty();};
  $('zIn').onclick=()=>zoomAt(1.3,V.W/2,V.H/2);$('zOut').onclick=()=>zoomAt(1/1.3,V.W/2,V.H/2);$('zFit').onclick=fitView;
  document.querySelectorAll('#toolSeg button').forEach(b=>b.onclick=()=>setTool(b.dataset.t));
  document.querySelectorAll('#tabbar button').forEach(b=>b.onclick=()=>showTab(b.dataset.p));
  document.querySelectorAll('#secSeg button').forEach(b=>b.onclick=()=>openSection(b.dataset.s));$('secClose').onclick=closeSection;
  $('secBand').oninput=e=>{SEC.band=clamp(+e.target.value||4,0.5,30);drawSection();requestDraw();};$('secZ').oninput=e=>{SEC.z=+e.target.value;$('secZv').textContent=fmt(SEC.z,1)+' m';clearTimeout(SEC._t);SEC._t=setTimeout(drawSection,60);};
  $('secCsv').onclick=()=>{const s=sectionCSV();if(s)saveFile('przekroj_'+SEC.mode+'_'+stamp()+'.csv',s);};
  buildLayerPanel();buildCharts();buildRules();buildParams();buildDataPanel();buildExpPanel();initPointer();setTool('pick');
  let fitted=false;new ResizeObserver(()=>{sizeCanvas();if(!fitted&&T){fitted=true;fitView();}requestDraw();if(SEC.show)drawSection();}).observe($('vbox'));
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{readCss();markDirty();updateCharts();});
  sizeCanvas();startTerrain(demoTerrain(1,1));}
init();
