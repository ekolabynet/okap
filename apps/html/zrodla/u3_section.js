/* ================= przekroje: profil 1,5D, przekrój pionowy 2D, przekrój poziomy 2D ================= */
const SEC={a:null,b:null,show:false,mode:'prof',band:4,z:1.6,last:null};
let scv,sctx;
function openSection(mode){if(mode)SEC.mode=mode;SEC.show=true;$('secPanel').hidden=false;document.querySelectorAll('#secSeg button').forEach(b=>b.classList.toggle('on',b.dataset.s===SEC.mode));
  $('secBandL').style.display=SEC.mode==='prof'||SEC.mode==='vert'?'':'none';$('secZL').style.display=SEC.mode==='horz'?'':'none';
  requestAnimationFrame(()=>{drawSection();$('secPanel').scrollIntoView({block:'nearest',behavior:'smooth'});});requestDraw();}
function closeSection(){SEC.show=false;$('secPanel').hidden=true;requestDraw();}
function secSize(){const r=scv.getBoundingClientRect();const d=Math.min(2,window.devicePixelRatio||1);scv.width=Math.round(r.width*d);scv.height=Math.round(r.height*d);sctx.setTransform(d,0,0,d,0,0);return [r.width,r.height];}
function secSamples(){const A=SEC.a,B=SEC.b;const L=Math.hypot(B.x-A.x,B.y-A.y);const N=Math.min(600,Math.max(2,Math.ceil(L/(T.res/2))+1));const out=[];
  for(let k=0;k<N;k++){const f=k/(N-1);const x=A.x+(B.x-A.x)*f,y=A.y+(B.y-A.y)*f;out.push({s:L*f,x,y,i:cellOf(T,x,y)});}return {L,pts:out};}
function treesInBand(){const A=SEC.a,B=SEC.b;const L=Math.hypot(B.x-A.x,B.y-A.y)||1;const ux=(B.x-A.x)/L,uy=(B.y-A.y)/L;const out=[];
  for(const t of S.trees){if(!t.alive)continue;const dx=t.x-A.x,dy=t.y-A.y;const s=dx*ux+dy*uy,d=-dx*uy+dy*ux;if(s<-t.Reff||s>L+t.Reff||Math.abs(d)>SEC.band+t.Reff*0.5)continue;out.push({t,s,d});}
  return out.sort((a,b)=>Math.abs(b.d)-Math.abs(a.d));}
function drawSection(){if(!SEC.show||!T)return;const [W,H]=secSize();const c=sctx;c.fillStyle=CSSV.card;c.fillRect(0,0,W,H);c.font='12px '+getComputedStyle(document.body).fontFamily;
  if(SEC.mode==='horz')return drawHorz(W,H);if(!SEC.a||!SEC.b){c.fillStyle=CSSV['ink-soft'];c.fillText('Wybierz narzędzie „Przekrój” i kliknij dwa punkty na widoku (A, potem B).',14,24);return;}
  $('secTitle').textContent='Przekrój A–B · '+fmt(Math.hypot(SEC.b.x-SEC.a.x,SEC.b.y-SEC.a.y),0)+' m';
  if(SEC.mode==='vert')return drawVert(W,H);drawProf(W,H);}
function profFrame(W,H,top,bot,smp,extraTop){let zmin=1e9,zmax=-1e9;for(const p of smp.pts){if(p.i<0)continue;const z=T.dtm[p.i];zmin=Math.min(zmin,z);zmax=Math.max(zmax,T.bld[p.i]>0?T.babs[p.i]:z);}zmax=Math.max(zmax,extraTop||zmax);zmin-=1;zmax+=1.5;
  const m={l:44,r:12,t:top,b:bot};const sx=s=>m.l+s/smp.L*(W-m.l-m.r),sy=z=>m.t+(1-(z-zmin)/(zmax-zmin))*(H-m.t-m.b);return {zmin,zmax,sx,sy,m};}
function drawAxesZ(F,W,H){const c=sctx;c.strokeStyle=CSSV.line;c.fillStyle=CSSV['ink-soft'];c.lineWidth=1;c.textAlign='right';c.textBaseline='middle';const st=niceStep((F.zmax-F.zmin)/5);
  for(let z=Math.ceil(F.zmin/st)*st;z<=F.zmax;z+=st){const y=F.sy(z);c.beginPath();c.moveTo(F.m.l,y);c.lineTo(W-F.m.r,y);c.globalAlpha=0.5;c.stroke();c.globalAlpha=1;c.fillText(fmt(z,st<1?1:0),F.m.l-4,y);}}
const niceStep=r=>{const p=Math.pow(10,Math.floor(Math.log10(r||1)));const f=r/p;return (f<1.5?1:f<3.5?2:f<7.5?5:10)*p;};
function drawGroundProfile(F,smp,H){const c=sctx;const sc=catClasses('surf');
  c.beginPath();c.moveTo(F.sx(0),H-F.m.b);for(const p of smp.pts)if(p.i>=0)c.lineTo(F.sx(p.s),F.sy(T.dtm[p.i]));c.lineTo(F.sx(smp.L),H-F.m.b);c.closePath();c.fillStyle=isDark()?'#3A2F25':'#CDB89A';c.fill();
  for(let k=0;k<smp.pts.length-1;k++){const p=smp.pts[k],q=smp.pts[k+1];if(p.i<0)continue;const x0=F.sx(p.s),x1=F.sx(q.s);
    if(T.bld[p.i]>0){c.fillStyle=CSSV.bld;c.fillRect(x0,F.sy(T.babs[p.i]),x1-x0+0.6,F.sy(T.dtm[p.i])-F.sy(T.babs[p.i]));}
    c.strokeStyle=(sc[T.surf[p.i]]||{}).col||'#888';c.lineWidth=4;c.beginPath();c.moveTo(x0,F.sy(T.dtm[p.i])+1);c.lineTo(x1,F.sy(T.dtm[q.i>=0?q.i:p.i])+1);c.stroke();}}
function drawBandTrees(F,list,si,fillA){const c=sctx;for(const {t,s,d} of list){const fade=1-0.6*Math.min(1,Math.abs(d)/Math.max(0.5,SEC.band));const x=F.sx(s);const zt=zTop(t),zb=Math.max(t.z0+0.2,zBot(S,t));
    const rx=Math.max(1.5,t.Reff/((SEC.b?Math.hypot(SEC.b.x-SEC.a.x,SEC.b.y-SEC.a.y):1))*(scv.getBoundingClientRect().width-F.m.l-F.m.r));
    c.strokeStyle=t.dead?CSSV.dead:CSSV.trunk;c.globalAlpha=fade;c.lineWidth=Math.max(1.2,t.D/100/((SEC.b?Math.hypot(SEC.b.x-SEC.a.x,SEC.b.y-SEC.a.y):1))*(scv.getBoundingClientRect().width-F.m.l-F.m.r));
    c.beginPath();c.moveTo(x,F.sy(t.z0));c.lineTo(x,F.sy(t.dead?zt:(zt+zb)/2));c.stroke();
    if(!t.dead){const col=crownColor(t,si);if(fillA>0){c.fillStyle=rgbs(col,(si===3?0.15:0.25+0.55*t.cf)*fillA);c.strokeStyle=rgbs(col.map(v=>v*0.6),0.9);c.lineWidth=1;c.beginPath();c.ellipse(x,(F.sy(zt)+F.sy(zb))/2,rx,Math.max(2,(F.sy(zb)-F.sy(zt))/2),0,0,6.283);c.fill();c.stroke();}
      if(rx>12){c.fillStyle=CSSV.ink;c.textAlign='center';c.textBaseline='bottom';c.font='600 10px monospace';c.fillText(abbrOf(P.species[t.sp]),x,F.sy(zt)-2);}}
    c.globalAlpha=1;}}
// woksele koron w pasie wzdłuż linii (rzut na płaszczyznę przekroju; dalsze od linii jaśniejsze)
function drawBandVox(F,band,aMax){const c=sctx;const X=S.vx,A=SEC.a,B=SEC.b;const L=Math.hypot(B.x-A.x,B.y-A.y)||1;const ux=(B.x-A.x)/L,uy=(B.y-A.y)/L,nx=-uy,ny=ux;const st=T.res;const byId=new Map(S.trees.map(t=>[t.id,t]));const si=SEASON_UI();const cols=new Map();
  const W_=scv.getBoundingClientRect().width;const cw=Math.max(1,st*(W_-F.m.l-F.m.r)/L);const nOff=Math.max(1,Math.round(band/st));
  for(let s=0;s<=L+1e-6;s+=st)for(let q=-nOff;q<=nOff;q++){const o=q*st;if(Math.abs(o)>band+1e-6)continue;const x=A.x+ux*s+nx*o,y=A.y+uy*s+ny*o;const i=cellOf(T,x,y);if(i<0||X.hi[i]<0)continue;const fade=1-0.6*Math.abs(o)/Math.max(0.5,band);
    for(let k=X.lo[i];k<=X.hi[i];k++){const j=X.off[i]+k-X.lo[i];if(X.mu[j]<=0)continue;const id=X.own[j];let col=cols.get(id);if(!col){const t=byId.get(id);col=t?crownColor(t,si):[100,140,90];cols.set(id,col);}
      const z0=T.dtm[i]+k*X.dz;const y0=F.sy(z0+X.dz),y1=F.sy(z0);c.fillStyle=rgbs(col,aMax*fade);c.fillRect(F.sx(s)-cw/2,y0,cw,y1-y0);}}}
function drawProf(W,H){const c=sctx;const smp=secSamples();const list=treesInBand();let ztop=-1e9;for(const o of list)ztop=Math.max(ztop,zTop(o.t));const split=Math.round(H*0.64);
  const F=profFrame(W,split,10,4,smp,ztop);drawAxesZ(F,W,split);drawGroundProfile(F,smp,split);c.save();c.beginPath();c.rect(F.m.l,0,W-F.m.l-F.m.r,split);c.clip();drawBandVox(F,SEC.band,0.22);drawBandTrees(F,list,SEASON_UI(),0);c.restore();
  c.fillStyle=CSSV.ink;c.textAlign='left';c.textBaseline='top';c.font='700 12px '+getComputedStyle(document.body).fontFamily;c.fillText('A',F.m.l+2,12);c.textAlign='right';c.fillText('B',W-F.m.r-2,12);
  // profil wartości warstwy (1,5D)
  const L=LBYK[V.ground];const y0=split+18,y1=H-22;c.fillStyle=CSSV['ink-soft'];c.textAlign='left';c.font='12px '+getComputedStyle(document.body).fontFamily;c.fillText('Profil: '+L.n+(L.u?' ['+L.u+']':''),F.m.l,split+4);
  if(L.cat){const cl=catClasses(L.cat);for(let k=0;k<smp.pts.length-1;k++){const p=smp.pts[k];if(p.i<0)continue;c.fillStyle=(cl[L.val(p.i)]||{}).col||'#888';c.fillRect(F.sx(p.s),y0+8,F.sx(smp.pts[k+1].s)-F.sx(p.s)+0.6,(y1-y0)-16);}}
  else{let lo=1e9,hi=-1e9;const vals=smp.pts.map(p=>p.i>=0?L.val(p.i):NaN);for(const v of vals)if(isFinite(v)){lo=Math.min(lo,v);hi=Math.max(hi,v);}if(!(hi>lo)){hi=lo+1;}const pad=(hi-lo)*0.1;lo-=pad;hi+=pad;
    const yy=v=>y1-(v-lo)/(hi-lo)*(y1-y0);c.strokeStyle=CSSV.line;c.beginPath();c.moveTo(F.m.l,y1);c.lineTo(W-F.m.r,y1);c.stroke();c.fillStyle=CSSV['ink-soft'];c.textAlign='right';c.textBaseline='middle';c.fillText(fmt(hi,1),F.m.l-4,y0);c.fillText(fmt(lo,1),F.m.l-4,y1);
    c.strokeStyle=CSSV.accent;c.lineWidth=2;c.beginPath();let st=false;smp.pts.forEach((p,k)=>{const v=vals[k];if(!isFinite(v)){st=false;return;}const x=F.sx(p.s),y=yy(v);if(st)c.lineTo(x,y);else{c.moveTo(x,y);st=true;}});c.stroke();}
  c.fillStyle=CSSV['ink-soft'];c.textAlign='center';c.textBaseline='bottom';c.fillText('0 m',F.sx(0),H-4);c.fillText(fmt(smp.L,0)+' m',F.sx(smp.L),H-4);c.fillText('pas ±'+fmt(SEC.band,1)+' m · drzewa dalej od linii są jaśniejsze',W/2,H-4);
  SEC.last={mode:'prof',smp};}
function drawVert(W,H){const c=sctx;const smp=secSamples();const list=treesInBand();let ztop=-1e9;for(const o of list)ztop=Math.max(ztop,zTop(o.t));const F=profFrame(W,H,10,26,smp,ztop);
  const si=SEASON_UI();const LD=lightDirs(si===3?1:si);const nc=Math.min(170,Math.round((W-F.m.l-F.m.r)/4)),nr=Math.min(70,Math.round((H-36)/4));const cw=(W-F.m.l-F.m.r)/nc,ch=(H-F.m.t-F.m.b)/nr;const grid=[];
  for(let a=0;a<nr;a++)for(let b=0;b<nc;b++){const f=(b+0.5)/nc;const x=SEC.a.x+(SEC.b.x-SEC.a.x)*f,y=SEC.a.y+(SEC.b.y-SEC.a.y)*f;const z=F.zmax-(a+0.5)/nr*(F.zmax-F.zmin);const i=cellOf(T,x,y);if(i<0)continue;
    if(z<T.dtm[i]||(T.bld[i]>0&&z<T.babs[i]))continue;const l=lightAt(S,LD,x,y,z,-9)[0];grid.push([b,a,l,x,y,z]);c.fillStyle=rgbs(rampRGB('light',l));c.fillRect(F.m.l+b*cw,F.m.t+a*ch,cw+0.6,ch+0.6);}
  drawGroundProfile(F,smp,H-F.m.b);c.save();c.beginPath();c.rect(F.m.l,0,W-F.m.l-F.m.r,H);c.clip();drawBandVox(F,0,0.45);drawBandTrees(F,list.filter(o=>Math.abs(o.d)<=SEC.band),si,0);c.restore();drawAxesZ(F,W,H);
  c.fillStyle=CSSV['ink-soft'];c.textAlign='left';c.textBaseline='bottom';c.fillText('Światło względne w płaszczyźnie przekroju ('+SEAS[si===3?1:si].toLowerCase()+'): ciemne = cień, jasne = pełne światło',F.m.l,H-6);SEC.last={mode:'vert',grid};}
function drawHorz(W,H){const c=sctx;$('secTitle').textContent='Przekrój poziomy · '+fmt(SEC.z,1)+' m nad gruntem';const si=SEASON_UI();const LD=lightDirs(si===3?1:si);
  let st=1;while((T.nx/st)*(T.ny/st)>16000)st++;const gx=Math.ceil(T.nx/st),gy=Math.ceil(T.ny/st);const sc=Math.min((W-20)/gx,(H-36)/gy);const ox=(W-gx*sc)/2,oy=8;const byId=new Map(S.trees.map(t=>[t.id,t]));const grid=[];
  for(let a=0;a<gy;a++)for(let b=0;b<gx;b++){const r=Math.min(T.ny-1,a*st),cc=Math.min(T.nx-1,b*st);const i=r*T.nx+cc;const [x,y]=cellXY(T,i);const z=T.dtm[i]+SEC.z;let col,l=NaN,own=0;
    if(T.bld[i]>0&&T.babs[i]>z)col=hex2rgb(CSSV.bld);else{l=lightAt(S,LD,x,y,z,-9)[0];col=rampRGB('light',l);
      const jv=voxJ(S,i,z);if(jv>=0&&S.vx.mu[jv]>0)own=S.vx.own[jv];if(own>0){const t=byId.get(own);if(t)col=mix(col,crownColor(t,si),0.65);}}
    grid.push([x,y,z,l,own]);c.fillStyle=rgbs(col);c.fillRect(ox+b*sc,oy+a*sc,sc+0.6,sc+0.6);}
  if(SEC.a&&SEC.b){const tp=p=>[ox+p.x/T.res/st*sc,oy+(T.ny-p.y/T.res)/st*sc];const A=tp(SEC.a),B=tp(SEC.b);c.strokeStyle=CSSV.accent;c.lineWidth=2;c.beginPath();c.moveTo(A[0],A[1]);c.lineTo(B[0],B[1]);c.stroke();}
  c.fillStyle=CSSV.ink;c.font='700 12px sans-serif';c.textAlign='center';c.fillText('N ↑',ox+gx*sc-14,oy+14);
  c.fillStyle=CSSV['ink-soft'];c.font='12px '+getComputedStyle(document.body).fontFamily;c.textAlign='left';c.textBaseline='bottom';c.fillText('Światło na wysokości '+fmt(SEC.z,1)+' m nad gruntem; barwą gatunku zaznaczone woksele koron na tej wysokości, szarym budynki.',8,H-6);
  SEC.last={mode:'horz',grid};}
function sectionCSV(){const L=SEC.last;if(!L)return null;const X=v=>(v).toFixed(2);
  if(L.mode==='prof'){const ks=LAYERS.filter(l=>!l.sim||S);const head=['s_m','x','y','X','Y',...ks.map(l=>l.k)];const rows=L.smp.pts.filter(p=>p.i>=0).map(p=>[X(p.s),X(p.x),X(p.y),X(p.x+T.xll),X(p.y+T.yll),...ks.map(l=>{const v=l.val(p.i);return isFinite(v)?+v.toFixed(3):''})]);return [head,...rows].map(r=>r.join(';')).join('\n');}
  if(L.mode==='vert'){return ['kol;wiersz;x;y;X;Y;z;swiatlo',...L.grid.map(g=>[g[0],g[1],X(g[3]),X(g[4]),X(g[3]+T.xll),X(g[4]+T.yll),X(g[5]),g[2].toFixed(3)].join(';'))].join('\n');}
  return ['x;y;X;Y;z;swiatlo;korona_id',...L.grid.map(g=>[X(g[0]),X(g[1]),X(g[0]+T.xll),X(g[1]+T.yll),X(g[2]),isFinite(g[3])?g[3].toFixed(3):'',g[4]||''].join(';'))].join('\n');}
