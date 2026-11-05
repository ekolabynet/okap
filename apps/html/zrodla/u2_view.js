/* SPDX-License-Identifier: MPL-2.0
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.
 * © 2026 Piotr Mędrzycki, Paweł Mędrzycki */
/* ================= widok 2,5D: aksonometria i mapa ================= */
const V={mode:'axo',az:-30,el:38,exag:1.5,k:4,px:0,py:0,W:600,H:400,dpr:1,cx:0,cy:0,z0:0,ground:'surf',
  comp:{relief:true,bld:true,trees:true,labels:false,legend:true},pt:'people',ptMode:'off',sel:null,secA:null};
let cv,ctx,TR,CZ=null,SHADE=null,STR=null,COLRGB=null,colDirty=true,needDraw=false,HEAT=null,SWARM=null,swarmKey='',BLDB=null,LODB=1;
const SEASON_UI=()=>S&&S.lastSeason>=0?S.lastSeason:1;
function requestDraw(){if(needDraw)return;needDraw=true;requestAnimationFrame(()=>{needDraw=false;draw();});}
function markDirty(){colDirty=true;swarmKey='';GLV.dirty=true;requestDraw();}
function setTrig(){const a=V.az*Math.PI/180,e=(V.mode==='map'?90:V.el)*Math.PI/180;TR={ca:Math.cos(a),sa:Math.sin(a),se:Math.sin(e),ce:Math.cos(e)};}
function P3(x,y,z){const dx=x-V.cx,dy=y-V.cy;const u=dx*TR.ca-dy*TR.sa,v=dx*TR.sa+dy*TR.ca;return [V.W/2+V.px+u*V.k,V.H/2+V.py-(v*TR.se+(z-V.z0)*V.exag*TR.ce)*V.k,v];}
function screenToGround(sx,sy){let z=V.z0,x=0,y=0,i=-1;for(let it=0;it<6;it++){const u=(sx-V.W/2-V.px)/V.k,Y=(V.H/2+V.py-sy)/V.k;const v=(Y-(z-V.z0)*V.exag*TR.ce)/TR.se;
    x=V.cx+u*TR.ca+v*TR.sa;y=V.cy-u*TR.sa+v*TR.ca;i=cellOf(T,x,y);if(i<0||TR.ce<1e-6)break;const nz=T.bld[i]>0&&V.comp.bld?T.babs[i]:T.dtm[i];if(Math.abs(nz-z)<0.02)break;z=nz;}return {x,y,i};}
function sizeCanvas(){const r=cv.getBoundingClientRect();V.dpr=Math.min(2,window.devicePixelRatio||1);V.W=Math.max(50,r.width);V.H=Math.max(50,r.height);cv.width=Math.round(V.W*V.dpr);cv.height=Math.round(V.H*V.dpr);}
function terrainPrep(){const {nx,ny,n}=T;V.cx=nx*T.res/2;V.cy=ny*T.res/2;let m=0;for(let i=0;i<n;i++)m+=T.dtm[i];V.z0=m/n;
  CZ=new Float32Array((nx+1)*(ny+1));for(let r=0;r<=ny;r++)for(let c=0;c<=nx;c++){let s=0,k=0;for(const [a,b] of [[r-1,c-1],[r-1,c],[r,c-1],[r,c]]){if(a<0||a>=ny||b<0||b>=nx)continue;s+=T.dtm[a*nx+b];k++;}CZ[r*(nx+1)+c]=s/k;}
  LODB=1;while((nx/LODB)*(ny/LODB)>32000)LODB++;BLDB=null;shadePrep();markDirty();}
function shadePrep(){const n=T.n;SHADE=new Float32Array(n);const zen=45*Math.PI/180,azL=315*Math.PI/180;for(let i=0;i<n;i++){const s=Math.atan(T.slope[i]*V.exag);const hs=Math.cos(zen)*Math.cos(s)+Math.sin(zen)*Math.sin(s)*Math.cos(azL-T.aspect[i]);SHADE[i]=clamp(0.62+0.38*hs/Math.cos(zen),0.5,1.2);}}
// barwy komórek: warstwa podłoża, cieniowanie rzeźby, pora roku, śnieg, mapa ciepła
function rebuildColors(){const n=T.n;COLRGB=COLRGB&&COLRGB.length===n*3?COLRGB:new Uint8ClampedArray(n*3);STR=STR&&STR.length===n?STR:new Array(n);const L=LBYK[V.ground];const si=SEASON_UI();
  let classes=null,lo=0,hi=1;if(L.cat)classes=catClasses(L.cat).map(c=>hex2rgb(c.col));else[lo,hi]=layerRange(L);V.range=[lo,hi];
  const snow=si===3&&S&&S.event&&(S.event.type==='snow'||S.event.type==='winter'||S.event.type==='gale'||S.event.type==='calm');const white=[246,248,250];const bldTop=hex2rgb(CSSV['bld-top']);
  const heat=V.ptMode==='heat'?computeHeat():null;HEAT=heat;
  for(let i=0;i<n;i++){let c;const v=L.val(i);
    if(classes){c=classes[v]||[128,128,128];if(L.cat==='surf'&&si===2&&SURF[surfKey(T,i)].seal<0.5)c=mix(c,[178,140,70],0.18);if(L.cat==='surf'&&si===0&&SURF[surfKey(T,i)].seal<0.5)c=mix(c,[150,205,110],0.12);}
    else c=isFinite(v)?rampRGB(L.ramp,(v-lo)/(hi-lo||1)):[150,150,150];
    if(V.comp.bld&&T.bld[i]>0&&L.k!=='bld')c=mix(bldTop,[40,40,40],clamp(T.bld[i]/60,0,0.4));
    if(snow&&L.cat==='surf'){const sf=SURF[surfKey(T,i)];c=mix(c,white,sf.seal>0.8&&T.traffic[i]>0?0.15:0.62);}
    if(heat&&heat[i]>0.02)c=mix(c,rampRGB('heat',0.15+0.85*heat[i]),Math.min(0.85,0.25+0.6*heat[i]));
    const f=V.comp.relief?SHADE[i]:1;COLRGB[i*3]=c[0]*f;COLRGB[i*3+1]=c[1]*f;COLRGB[i*3+2]=c[2]*f;STR[i]=`rgb(${COLRGB[i*3]},${COLRGB[i*3+1]},${COLRGB[i*3+2]})`;}
  colDirty=false;mapImg=null;GLV.dirty=true;updateLegend();}
// mapa ciepła: średnia ważona w oknie ~6 m (pole) albo gęstość jądrowa (punkty), znormalizowana do 0–1
function boxBlur(a,nx,ny,r){const t=new Float32Array(a.length);for(let y=0;y<ny;y++){let s=0;const o=y*nx;for(let x=-r;x<nx;x++){if(x+r<nx)s+=a[o+x+r];if(x-r-1>=0)s-=a[o+x-r-1];if(x>=0)t[o+x]=s;}}
  const u=new Float32Array(a.length);for(let x=0;x<nx;x++){let s=0;for(let y=-r;y<ny;y++){if(y+r<ny)s+=t[(y+r)*nx+x];if(y-r-1>=0)s-=t[(y-r-1)*nx+x];if(y>=0)u[y*nx+x]=s;}}return u;}
function ptWeights(){const P=PTS[V.pt];const w=new Float32Array(T.n);if(!S)return w;
  if(P.field){for(let i=0;i<T.n;i++)w[i]=P.field(i);}
  else if(P.log){const now=S.year0+S.year;for(const e of S.log){if(!P.log.includes(e.k))continue;const age=now-e.yr;if(age>10)continue;const i=cellOf(T,e.x,e.y);if(i>=0)w[i]+=1-age/11;}}
  else{for(const t of S.trees){if(!t.alive||!P.trees(t))continue;const i=t.ci;if(i>=0)w[i]+=P.w?P.w(t):1;}}return w;}
function computeHeat(){const w=ptWeights();const r=Math.max(1,Math.round(6/T.res));let b=boxBlur(boxBlur(w,T.nx,T.ny,r),T.nx,T.ny,r);let mx=0;for(const v of b)if(v>mx)mx=v;if(mx<=0)return null;for(let i=0;i<b.length;i++)b[i]/=mx;return b;}
function buildSwarm(){const key=V.pt+'|'+(S?S.year+'.'+S.lastSeason:'');if(swarmKey===key&&SWARM)return SWARM;swarmKey=key;const P=PTS[V.pt];const out=[];const rng=mulberry32(97+(S?S.year*7+S.lastSeason:0));
  if(P.field){const w=ptWeights();let sum=0;for(const v of w)sum+=v;const N=Math.round(clamp(sum*T.res*T.res/40,30,1500));const cum=new Float32Array(T.n);let s=0;for(let i=0;i<T.n;i++){s+=w[i];cum[i]=s;}
    for(let k=0;k<N&&s>0;k++){const q=rng()*s;let lo=0,hi=T.n-1;while(lo<hi){const m=(lo+hi)>>1;if(cum[m]<q)lo=m+1;else hi=m;}const [x,y]=cellXY(T,lo);out.push({x:x+(rng()-0.5)*T.res,y:y+(rng()-0.5)*T.res,a:1});}}
  else if(P.log){const now=S.year0+S.year;for(const e of S.log){if(!P.log.includes(e.k))continue;const age=now-e.yr;if(age>10)continue;out.push({x:e.x+(rng()-0.5)*0.8,y:e.y+(rng()-0.5)*0.8,a:1-age/11,k:e.k});}}
  else for(const t of S.trees){if(t.alive&&P.trees(t))out.push({x:t.x,y:t.y,a:1});}
  SWARM=out;return out;}
const PT_COL={people:'w4',fails:'crit',removed:'ink-soft',regen:'good',rot:'warn',risk:'crit'};

/* ---------- rysowanie ---------- */
let mapImg=null;
function skyColors(){const si=SEASON_UI();const dark=isDark();const base=dark?[['#16232B','#121A16'],['#14222C','#121815'],['#211D18','#15130F'],['#1A1E23','#121416']]:[['#CFE3EC','#EEF3EA'],['#BCD9EA','#F1F3EA'],['#DCD3C2','#F2EEE4'],['#CDD3DA','#EEF0F2']];
  const b=clamp(SUN_EL[si]/60,0.35,1);const c=base[si].map(hex2rgb).map(c=>dark?c:mix([120,128,136],c,0.55+0.45*b));return c.map(x=>rgbs(x));}
function draw(){if(!ctx)return;setTrig();const d=V.dpr;ctx.setTransform(d,0,0,d,0,0);
  let vox=V.mode==='vox';if(vox&&!glInit()){V.mode='axo';vox=false;document.querySelectorAll('#modeSeg button').forEach(x=>x.classList.toggle('on',x.dataset.m==='axo'));toast('Widok wokselowy wymaga WebGL2, którego ta przeglądarka nie udostępnia.',4000);}
  $('gl').style.display=vox?'block':'none';
  if(vox)ctx.clearRect(0,0,V.W,V.H);else{if(V.mode==='axo'){const sc=skyColors();const g=ctx.createLinearGradient(0,0,0,V.H);g.addColorStop(0,sc[0]);g.addColorStop(1,sc[1]);ctx.fillStyle=g;}else ctx.fillStyle=CSSV['surface-2'];ctx.fillRect(0,0,V.W,V.H);}
  if(!T)return;if(colDirty||!STR)rebuildColors();
  if(vox)glRender();else if(V.mode==='map')drawGroundMap();else drawGroundAxo();
  drawSectionLine();if(V.ptMode==='swarm')drawSwarm();drawObjects();drawHUD();}
function drawGroundMap(){const {nx,ny,res}=T;if(!mapImg){mapImg=document.createElement('canvas');mapImg.width=nx;mapImg.height=ny;const c2=mapImg.getContext('2d');const id=c2.createImageData(nx,ny);for(let i=0;i<T.n;i++){id.data[i*4]=COLRGB[i*3];id.data[i*4+1]=COLRGB[i*3+1];id.data[i*4+2]=COLRGB[i*3+2];id.data[i*4+3]=255;}c2.putImageData(id,0,0);}
  const k=V.k,ca=TR.ca,sa=TR.sa;const ex=V.W/2+V.px+k*(-ca*V.cx-sa*(ny*res-V.cy)),ey=V.H/2+V.py-k*(-sa*V.cx+ca*(ny*res-V.cy));const d=V.dpr;
  ctx.save();ctx.setTransform(d*k*res*ca,-d*k*res*sa,d*k*res*sa,d*k*res*ca,d*ex,d*ey);ctx.imageSmoothingEnabled=false;ctx.drawImage(mapImg,0,0);ctx.restore();}
function drawGroundAxo(){const {nx,ny}=T;const B=LODB;const W1=nx+1;const rows=[],cols=[];for(let r=0;r<ny;r+=B)rows.push(r);for(let c=0;c<nx;c+=B)cols.push(c);
  if(TR.ca<0)rows.reverse();if(TR.sa>0)cols.reverse();ctx.lineWidth=0.8;ctx.lineJoin='round';
  for(const r of rows){const r2=Math.min(ny,r+B);for(const c of cols){const c2=Math.min(nx,c+B);const i=Math.min(ny-1,r+(B>>1))*nx+Math.min(nx-1,c+(B>>1));
    const x0=c*T.res,x1=c2*T.res,y0=(ny-r)*T.res,y1=(ny-r2)*T.res;const a=P3(x0,y0,CZ[r*W1+c]),b=P3(x1,y0,CZ[r*W1+c2]),e=P3(x1,y1,CZ[r2*W1+c2]),f=P3(x0,y1,CZ[r2*W1+c]);
    ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.lineTo(e[0],e[1]);ctx.lineTo(f[0],f[1]);ctx.closePath();ctx.fillStyle=STR[i];ctx.fill();ctx.strokeStyle=STR[i];ctx.stroke();}}}
function bldBlocks(){if(BLDB)return BLDB;const {nx,ny}=T,B=LODB;const out=[];for(let r=0;r<ny;r+=B)for(let c=0;c<nx;c+=B){let hmax=0,cnt=0;for(let a=r;a<Math.min(ny,r+B);a++)for(let b=c;b<Math.min(nx,c+B);b++){const i=a*nx+b;if(T.bld[i]>0){cnt++;if(T.babs[i]>hmax||!hmax)hmax=T.babs[i];}}
    if(cnt*2>=B*B||(B===1&&cnt)){const x0=c*T.res,x1=Math.min(nx,c+B)*T.res,y0=(ny-r)*T.res,y1=(ny-Math.min(ny,r+B))*T.res;const zg=T.dtm[Math.min(ny-1,r+(B>>1))*nx+Math.min(nx-1,c+(B>>1))];out.push({r,c,x0,x1,y0,y1,z:hmax,zg,x:(x0+x1)/2,y:(y0+y1)/2});}}
  const key=new Map(out.map(o=>[o.r+','+o.c,o]));for(const o of out){o.nE=key.get(o.r+','+(o.c+B));o.nW=key.get(o.r+','+(o.c-B));o.nN=key.get((o.r-B)+','+o.c);o.nS=key.get((o.r+B)+','+o.c);}BLDB=out;return out;}
function drawObjects(){const items=[];const axo=V.mode!=='map';const vox=V.mode==='vox';
  if(axo&&V.comp.bld)for(const o of bldBlocks()){const dx=o.x-V.cx,dy=o.y-V.cy;items.push({v:dx*TR.sa+dy*TR.ca,b:o});}
  if(V.comp.trees&&S)for(const t of S.trees){if(!t.alive)continue;const dx=t.x-V.cx,dy=t.y-V.cy;items.push({v:axo?dx*TR.sa+dy*TR.ca:-t.H,t});}
  if(vox)items.length=0;items.sort((a,b)=>b.v-a.v);const top=hex2rgb(CSSV['bld-top']),side=hex2rgb(CSSV.bld);const si=SEASON_UI();
  for(const it of items){if(it.b)drawBld(it.b,top,side);else drawTree(it.t,si,axo);}
  if(V.comp.labels&&S&&V.comp.trees){ctx.font='600 10px '+getComputedStyle(document.body).getPropertyValue('--f-mono');ctx.textAlign='center';ctx.textBaseline='bottom';
    for(const t of S.trees){if(!t.alive||t.H<1.5)continue;const p=P3(t.x,t.y,axo?zTop(t):t.z0);const rx=Math.max(t.Reff,0.4)*V.k;if(rx<5)continue;const lb=abbrOf(P.species[t.sp]);const y=axo?p[1]-2:p[1]+4;
      ctx.lineWidth=3;ctx.strokeStyle=isDark()?'rgba(0,0,0,.65)':'rgba(255,255,255,.8)';ctx.strokeText(lb,p[0],y);ctx.fillStyle=CSSV.ink;ctx.fillText(lb,p[0],y);}}}
function quad(a,b,c,d,fill){ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.lineTo(c[0],c[1]);ctx.lineTo(d[0],d[1]);ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=fill;ctx.lineWidth=0.6;ctx.stroke();}
function drawBld(o,top,side){const z=o.z,zg=o.zg;const faces=[['nS',o.x0,o.y1,o.x1,o.y1,0,-1],['nE',o.x1,o.y1,o.x1,o.y0,1,0],['nN',o.x1,o.y0,o.x0,o.y0,0,1],['nW',o.x0,o.y0,o.x0,o.y1,-1,0]];
  for(let [k,ax,ay,bx,by,nx_,ny_] of faces){const vn=nx_*TR.sa+ny_*TR.ca;if(vn>=0)continue;const nb=o[k];const zb=nb?Math.min(nb.z,z):zg;if(zb>=z-0.05)continue;
    const ex=0.04*T.res;const ux=Math.sign(bx-ax),uy=Math.sign(by-ay);ax-=ux*ex;ay-=uy*ex;bx+=ux*ex;by+=uy*ex;
    const lit=clamp(0.9+0.12*(-nx_*0.7+ny_*0.7),0.78,1.04);quad(P3(ax,ay,z),P3(bx,by,z),P3(bx,by,zb),P3(ax,ay,zb),rgbs(side.map(v=>v*lit)));}
  quad(P3(o.x0,o.y0,z),P3(o.x1,o.y0,z),P3(o.x1,o.y1,z),P3(o.x0,o.y1,z),rgbs(top));}
function crownColor(t,si){const s=P.species[t.sp];let c=hex2rgb(s.color);if(si===0)c=mix(c,[150,205,105],0.35);else if(si===2)c=mix(c,[214,160,60],0.5);if(t.ds>0.4&&si===1)c=mix(c,[170,150,90],0.3*t.ds);return c;}
function drawTree(t,si,axo){const k=V.k;const sel=V.sel===t.id;
  if(!axo){const p=P3(t.x,t.y,t.z0);const r=Math.max(1.2,t.Reff*k);const sk=Math.sqrt(t.keep||1);const star=()=>{ctx.beginPath();if(!t.cr||r<3){ctx.arc(p[0],p[1],r,0,6.283);return;}for(let q=0;q<=8;q++){const kk=q%8;const a=P3(t.x+SEC_DX[kk]*t.cr[kk]*sk,t.y+SEC_DY[kk]*t.cr[kk]*sk,t.z0);if(q)ctx.lineTo(a[0],a[1]);else ctx.moveTo(a[0],a[1]);}ctx.closePath();};
    if(t.dead){ctx.strokeStyle=CSSV.dead;ctx.lineWidth=1;ctx.beginPath();ctx.arc(p[0],p[1],r,0,6.283);ctx.stroke();}
    else{const c=crownColor(t,si);const a=si===3?0.18:0.35+0.5*t.cf*t.leafOut;ctx.fillStyle=rgbs(c,a);star();ctx.fill();ctx.strokeStyle=rgbs(c.map(v=>v*0.6),0.9);ctx.lineWidth=si===3?1:0.8;ctx.stroke();}
    ctx.fillStyle=CSSV.trunk;ctx.beginPath();ctx.arc(p[0],p[1],Math.max(1,t.D/200*k),0,6.283);ctx.fill();if(sel){ctx.strokeStyle=CSSV.accent;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(p[0],p[1],r+3,0,6.283);ctx.stroke();}return;}
  const zt=zTop(t),zb=Math.max(t.z0+0.2,zBot(S,t));const base=P3(t.x,t.y,t.z0),cc=P3(t.x+(t.ox||0),t.y+(t.oy||0),(zt+zb)/2);const R=Math.max(t.Reff,0.25);const rx=R*k,ry=Math.sqrt((R*TR.se)**2+((zt-zb)/2*V.exag*TR.ce)**2)*k;
  ctx.strokeStyle=t.dead?CSSV.dead:CSSV.trunk;ctx.lineWidth=Math.max(1,t.D/100*k);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(base[0],base[1]);ctx.lineTo(cc[0],t.dead?P3(t.x,t.y,zt)[1]:cc[1]);ctx.stroke();
  if(t.dead){ctx.lineWidth=1;const tp=P3(t.x,t.y,zt);for(let q=-1;q<=1;q+=2){ctx.beginPath();ctx.moveTo(cc[0],cc[1]);ctx.lineTo(cc[0]+q*rx*0.6,tp[1]+ry*0.3);ctx.stroke();}return;}
  const c=crownColor(t,si);const bare=si===3;const a=bare?0.16:clamp(0.3+0.62*t.cf*t.leafOut,0.25,0.95);
  if(bare){ctx.strokeStyle=rgbs(c.map(v=>v*0.7),0.8);ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(cc[0],cc[1],rx,ry,0,0,6.283);ctx.fillStyle=rgbs(c,a);ctx.fill();ctx.stroke();
    ctx.strokeStyle=CSSV.trunk;ctx.lineWidth=Math.max(0.8,t.D/250*k);ctx.beginPath();ctx.moveTo(cc[0],cc[1]+ry*0.5);ctx.lineTo(cc[0],cc[1]-ry*0.8);ctx.moveTo(cc[0],cc[1]);ctx.lineTo(cc[0]-rx*0.6,cc[1]-ry*0.5);ctx.moveTo(cc[0],cc[1]);ctx.lineTo(cc[0]+rx*0.6,cc[1]-ry*0.4);ctx.stroke();}
  else{const g=ctx.createRadialGradient(cc[0]-rx*0.35,cc[1]-ry*0.4,Math.max(1,rx*0.1),cc[0],cc[1],Math.max(rx,ry));g.addColorStop(0,rgbs(mix(c,[255,255,240],0.28),a));g.addColorStop(1,rgbs(c.map(v=>v*0.72),a));
    ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(cc[0],cc[1],rx,ry,0,0,6.283);ctx.fill();ctx.strokeStyle=rgbs(c.map(v=>v*0.55),Math.min(1,a+0.1));ctx.lineWidth=0.7;ctx.stroke();}
  if(sel){ctx.strokeStyle=CSSV.accent;ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(cc[0],cc[1],rx+3,ry+3,0,0,6.283);ctx.stroke();}}
function drawSwarm(){const pts=buildSwarm();const col=hex2rgb(CSSV[PT_COL[V.pt]]||CSSV.accent);const axo=V.mode!=='map';
  for(const p of pts){const i=cellOf(T,p.x,p.y);if(i<0)continue;const z=T.dtm[i];const a=P3(p.x,p.y,z);ctx.fillStyle=rgbs(col,0.25+0.7*p.a);
    if(V.pt==='people'&&axo){const b=P3(p.x,p.y,z+1.7);ctx.strokeStyle=rgbs(col,0.9);ctx.lineWidth=Math.max(1.2,0.35*V.k);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]+Math.max(1.5,0.3*V.k));ctx.stroke();ctx.beginPath();ctx.arc(b[0],b[1],Math.max(1.4,0.25*V.k),0,6.283);ctx.fill();}
    else{ctx.beginPath();ctx.arc(a[0],a[1],p.k==='konar'?2:2.6,0,6.283);ctx.fill();}}}
function drawSectionLine(){const A=V.secA,SC=SEC;const pts=[];if(A&&!SC.b)pts.push(A);
  const mark=(p,l)=>{const i=cellOf(T,p.x,p.y);const q=P3(p.x,p.y,i>=0?T.dtm[i]:V.z0);ctx.fillStyle=CSSV.accent;ctx.beginPath();ctx.arc(q[0],q[1],5,0,6.283);ctx.fill();ctx.fillStyle=CSSV['card']||'#fff';ctx.font='700 10px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(l,q[0],q[1]+0.5);};
  if(SC.a&&SC.b&&SC.show){const line=(off,dash,w)=>{const L=Math.hypot(SC.b.x-SC.a.x,SC.b.y-SC.a.y)||1;const nx_=-(SC.b.y-SC.a.y)/L,ny_=(SC.b.x-SC.a.x)/L;ctx.setLineDash(dash);ctx.lineWidth=w;ctx.strokeStyle=CSSV.accent;ctx.beginPath();
      for(let k=0;k<=40;k++){const f=k/40;const x=SC.a.x+(SC.b.x-SC.a.x)*f+nx_*off,y=SC.a.y+(SC.b.y-SC.a.y)*f+ny_*off;const i=cellOf(T,x,y);const p=P3(x,y,(i>=0?T.dtm[i]:V.z0)+0.1);if(k)ctx.lineTo(p[0],p[1]);else ctx.moveTo(p[0],p[1]);}ctx.stroke();ctx.setLineDash([]);};
    line(0,[],2.2);if(SC.mode!=='horz'){line(SC.band,[4,4],1);line(-SC.band,[4,4],1);}mark(SC.a,'A');mark(SC.b,'B');}
  else if(A)mark(A,'A');}
function drawHUD(){const si=SEASON_UI();const ev=S&&S.event?EV[S.event.type]:null;const y=S?S.year0+S.year:'';
  $('hud').innerHTML=S?`<b>${S.lastSeason<0?'Start':SEAS[si]} ${y}</b> · ${S.trees.filter(t=>!t.dead).length} drzew${ev&&S.lastSeason>=0?` · ${esc(ev.t)} <span class="mono">(kość ${S.event.die})</span>`:''}`:'';}
function updateLegend(){$('legend').style.display=V.comp.legend?'':'none';const L=LBYK[V.ground];let s='<div style="font-weight:700;margin-bottom:2px">'+esc(L.n)+'</div>';
  if(L.cat){const cl=catClasses(L.cat);const used=new Set();for(let i=0;i<T.n;i++)used.add(L.val(i));s+='<div class="lgrid">'+cl.filter(c=>used.has(c.v)).map(c=>`<span><span class="sw" style="background:${c.col}"></span>${esc(c.n.split(',')[0])}</span>`).join('')+'</div>';}
  else{const [lo,hi]=V.range||[0,1];s+=`<div class="ramp" style="background:${rampCSS(L.ramp)}"></div><div class="rl"><span>${fmt(lo,lo%1?1:0)}</span><span>${esc(L.u||'')}</span><span>${fmt(hi,hi%1?1:0)}</span></div>`;}
  if(V.ptMode==='heat'){s+=`<div style="margin-top:6px;font-weight:700">Mapa ciepła: ${esc(PTS[V.pt].n)}</div><div class="ramp" style="background:${rampCSS('heat')}"></div><div class="rl"><span>mało</span><span>dużo</span></div>`;}
  $('legend').innerHTML=s;}
function fitView(){if(!T)return;setTrig();const xs=[0,T.nx*T.res],ys=[0,T.ny*T.res];let zmin=1e9,zmax=-1e9;for(let i=0;i<T.n;i++){if(T.dtm[i]<zmin)zmin=T.dtm[i];const z=T.bld[i]>0?T.babs[i]:T.dtm[i];if(z>zmax)zmax=z;}zmax+=V.mode!=='map'?18:0;
  let u0=1e9,u1=-1e9,s0=1e9,s1=-1e9;for(const x of xs)for(const y of ys)for(const z of [zmin,zmax]){const dx=x-V.cx,dy=y-V.cy;const u=dx*TR.ca-dy*TR.sa,v=dx*TR.sa+dy*TR.ca;const s=-(v*TR.se+(z-V.z0)*V.exag*TR.ce);u0=Math.min(u0,u);u1=Math.max(u1,u);s0=Math.min(s0,s);s1=Math.max(s1,s);}
  V.k=Math.max(0.05,Math.min((V.W-30)/(u1-u0),(V.H-30)/(s1-s0)));V.px=-V.k*(u0+u1)/2;V.py=-V.k*(s0+s1)/2;requestDraw();}
function zoomAt(f,sx,sy){const u=(sx-V.W/2-V.px)/V.k,Y=(V.H/2+V.py-sy)/V.k;V.k=clamp(V.k*f,0.05,200);V.px=sx-V.W/2-u*V.k;V.py=sy-V.H/2+Y*V.k;requestDraw();}
function pickTree(sx,sy){if(!S)return null;const axo=V.mode!=='map';let best=null,bv=1e9;
  for(const t of S.trees){if(!t.alive)continue;let cx,cy,rx,ry;if(axo){const zt=zTop(t),zb=Math.max(t.z0+0.2,zBot(S,t));const c=P3(t.x+(t.ox||0),t.y+(t.oy||0),(zt+zb)/2);cx=c[0];cy=c[1];const R=Math.max(t.Reff,0.4);rx=R*V.k;ry=Math.sqrt((R*TR.se)**2+((zt-zb)/2*V.exag*TR.ce)**2)*V.k;}
    else{const c=P3(t.x,t.y,t.z0);cx=c[0];cy=c[1];rx=ry=Math.max(t.Reff,0.4)*V.k;}rx=Math.max(rx,4);ry=Math.max(ry,4);const q=((sx-cx)/rx)**2+((sy-cy)/ry)**2;if(q>1)continue;
    const v=axo?(t.x-V.cx)*TR.sa+(t.y-V.cy)*TR.ca:t.H*-1;if(v<bv){bv=v;best=t;}}return best;}
