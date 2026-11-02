/* ================= środowisko 2,5D: korony, światło, wiatr, hałas ================= */
function lensArea(r1,r2,d){if(d>=r1+r2)return 0;if(d<=Math.abs(r1-r2))return Math.PI*Math.min(r1,r2)**2;
  const a=r1*r1*Math.acos(clamp((d*d+r1*r1-r2*r2)/(2*d*r1),-1,1)),b=r2*r2*Math.acos(clamp((d*d+r2*r2-r1*r1)/(2*d*r2),-1,1));return a+b-0.5*Math.sqrt(Math.max(0,(-d+r1+r2)*(d+r1-r2)*(d-r1+r2)*(d+r1+r2)));}
// siatka kubełków do szukania sąsiadów
function bucketTrees(S,size){const B=new Map();for(const t of S.trees){if(!t.alive)continue;const k=Math.floor(t.x/size)+','+Math.floor(t.y/size);let l=B.get(k);if(!l){l=[];B.set(k,l);}l.push(t);}
  return {size,near(x,y,r){const out=[];const a=Math.floor((x-r)/size),b=Math.floor((x+r)/size),c=Math.floor((y-r)/size),d=Math.floor((y+r)/size);for(let i=a;i<=b;i++)for(let j=c;j<=d;j++){const l=B.get(i+','+j);if(l)for(const t of l)out.push(t);}return out;}};}
const zTop=t=>t.z0+t.H, zBot=(S,t)=>t.z0+t.H*(1-S.W.crownRatio);
// kontest koron w 2D: nakładające się korony o podobnej wysokości dzielą soczewkę wspólnej powierzchni według wkładu w koronę (Tullock);
// niższa korona, której szczyt sięga w głąb wyższej, traci soczewkę w całości; budynki ucinają koronę.
function crowns(S){const T=S.T;let maxR=0;for(const t of S.trees){if(!t.alive)continue;syncSec(t);let m2=0,ox=0,oy=0,w=0;for(let k=0;k<8;k++){const r=t.cr[k];m2+=r*r;const q=r*r*r;ox+=q*SEC_DX[k];oy+=q*SEC_DY[k];w+=r*r;}
    t.Rp=Math.max(0.15,Math.sqrt(m2/8));t.ox=w>0?(2/3)*ox/w:0;t.oy=w>0?(2/3)*oy/w:0;if(t.Rp+Math.hypot(t.ox,t.oy)>maxR)maxR=t.Rp+Math.hypot(t.ox,t.oy);}
  const bk=bucketTrees(S,Math.max(4,2*maxR));
  for(const t of S.trees){if(!t.alive)continue;t.loss=0;}
  for(const A of S.trees){if(!A.alive||A.dead)continue;const near=bk.near(A.x,A.y,A.Rp+maxR);
    for(const B of near){if(B.id<=A.id||B.dead)continue;const d=Math.hypot(A.x+A.ox-B.x-B.ox,A.y+A.oy-B.y-B.oy);if(d>=A.Rp+B.Rp)continue;
      const aT=zTop(A),aB=zBot(S,A),bT=zTop(B),bB=zBot(S,B);if(aB>=bT||bB>=aT)continue;const L=lensArea(A.Rp,B.Rp,Math.max(d,0.01));
      const ratio=Math.min(A.H,B.H)/Math.max(A.H,B.H);let sA;if(ratio>=0.8){const ea=A.bid+0.01,eb=B.bid+0.01;sA=ea/(ea+eb);}else sA=A.H>B.H?1:0;
      A.loss+=L*(1-sA);B.loss+=L*sA;}}
  for(const t of S.trees){if(!t.alive)continue;const area=Math.PI*t.Rp*t.Rp;let cut=0,tot=0;const r=t.Rp,res=T.res;const zb=zBot(S,t);
    for(let dx=-r;dx<=r;dx+=res)for(let dy=-r;dy<=r;dy+=res){if(dx*dx+dy*dy>r*r)continue;const i=cellOf(T,t.x+t.ox+dx,t.y+t.oy+dy);tot++;if(i<0)continue;if(T.babs[i]>zb)cut++;}
    const keep=clamp(1-t.loss/area-(tot?cut/tot:0),0.12,1);t.keep=keep;t.Reff=t.Rp*Math.sqrt(keep);t.weq=2*t.Reff;}}
/* ================= korony sektorowe i okap wokselowy ================= */
// Korona = 8 promieni sektorów (N, NE, E, SE, S, SW, W, NW) nad punktem pnia; profil pionowy: najszersza na 40% głębokości od podstawy.
const SEC_N=8,SEC_NAMES=['N','NE','E','SE','S','SW','W','NW'],SEC_DX=[],SEC_DY=[];for(let k=0;k<8;k++){SEC_DX.push(Math.sin(k*Math.PI/4));SEC_DY.push(Math.cos(k*Math.PI/4));}
function syncSec(t){const target=Math.max(0.15,t.Wc/2);if(!t.cr||t.cr.length!==8){t.cr=new Float32Array(8).fill(target);return;}let m=0;for(let k=0;k<8;k++)m+=t.cr[k];m/=8;
  if(!(m>0)){t.cr.fill(target);return;}if(Math.abs(m-target)>1e-5){const f=target/m;for(let k=0;k<8;k++)t.cr[k]*=f;}}
function crownR(t,dx,dy){let a=Math.atan2(dx,dy);if(a<0)a+=2*Math.PI;const f=a/(Math.PI/4);const k0=Math.floor(f)%8,w=f-Math.floor(f);return t.cr[k0]*(1-w)+t.cr[(k0+1)%8]*w;}
const crownShape=h=>h<0.4?0.5+0.5*Math.sqrt(Math.max(0,1-((0.4-h)/0.4)**2)):Math.sqrt(Math.max(0,1-((h-0.4)/0.6)**2));
// przegląd wokseli korony (i = komórka, k = poziom nad gruntem tej komórki)
function eachVox(S,t,f){const T=S.T,dz=S.vx.dz,res=T.res;const zb=zBot(S,t),zt=zTop(t);let rm=0;for(let k=0;k<8;k++)if(t.cr[k]>rm)rm=t.cr[k];const half=res*0.5;let n=0;
  const c0=Math.floor((t.x-rm)/res),c1=Math.floor((t.x+rm)/res),r0=T.ny-1-Math.floor((t.y+rm)/res),r1=T.ny-1-Math.floor((t.y-rm)/res);
  for(let r=Math.max(0,r0);r<=Math.min(T.ny-1,r1);r++)for(let c=Math.max(0,c0);c<=Math.min(T.nx-1,c1);c++){const i=r*T.nx+c;const cx=(c+0.5)*res,cy=(T.ny-r-0.5)*res;const dx=cx-t.x,dy=cy-t.y;const d=Math.hypot(dx,dy);
    const own=d<=half*1.01;const R=own?rm:crownR(t,dx,dy);if(!own&&d>R+half)continue;const g=T.dtm[i];
    const ka=Math.max(0,Math.floor((zb-g)/dz)),kb=Math.floor((zt-g)/dz-1e-6);
    for(let k=ka;k<=kb;k++){const zc=g+(k+0.5)*dz;const hh=(zc-zb)/Math.max(0.05,zt-zb);if(hh<-0.5/Math.max(1,(zt-zb)/dz)||hh>1.0001)continue;if(T.babs[i]>zc)continue;
      if(!own&&d>R*crownShape(clamp(hh,0,1))+half)continue;f(i,k);n++;}}
  if(!n){const i=cellOf(T,t.x,t.y);if(i>=0&&T.babs[i]<=zt){const k=Math.max(0,Math.floor((zt-T.dtm[i])/dz-1e-6));f(i,k);}}}
// okap wokselowy: rzadkie kolumny (zakres poziomów w każdej komórce), w wokselu suma tłumienia i właściciel o największym udziale
function canopyRaster(S){const T=S.T,n=T.n;let X=S.vx;if(!X||X.n!==n){X=S.vx={dz:T.res<=2?1:2,n,lo:new Int16Array(n),hi:new Int16Array(n),off:new Int32Array(n),top:new Float32Array(n),topO:new Int32Array(n),mu:new Float32Array(1024),muO:new Float32Array(1024),own:new Int32Array(1024),tot:0};}
  const lo=X.lo,hi=X.hi;lo.fill(32767);hi.fill(-1);const live=[];for(const t of S.trees){if(t.alive&&!t.dead){syncSec(t);live.push(t);}}
  for(const t of live){let nv=0;eachVox(S,t,(i,k)=>{if(k<lo[i])lo[i]=k;if(k>hi[i])hi[i]=k;nv++;});t.nvox=nv;}
  let tot=0;for(let i=0;i<n;i++){if(hi[i]>=0){X.off[i]=tot;tot+=hi[i]-lo[i]+1;}}
  if(tot>X.mu.length){const cap=Math.ceil(tot*1.4)+1024;X.mu=new Float32Array(cap);X.muO=new Float32Array(cap);X.own=new Int32Array(cap);}X.mu.fill(0,0,tot);X.muO.fill(0,0,tot);X.own.fill(-1,0,tot);X.tot=tot;
  for(const t of live){const s=IND(t);const tr=1-(1-s.trans)*Math.max(0.05,t.cf*t.leafOut);const dep=zTop(t)-zBot(S,t);const m=-Math.log(Math.max(tr,1e-3))/Math.max(2,1.3*dep)*(0.5+0.5*(t.keep==null?1:t.keep));t.mu=m;
    eachVox(S,t,(i,k)=>{const j=X.off[i]+k-lo[i];X.mu[j]+=m;if(m>X.muO[j]){X.muO[j]=m;X.own[j]=t.id;}});}
  let maxZ=-1e9;for(let i=0;i<n;i++){if(T.babs[i]>maxZ)maxZ=T.babs[i];if(hi[i]>=0){X.top[i]=T.dtm[i]+(hi[i]+1)*X.dz;X.topO[i]=X.own[X.off[i]+hi[i]-lo[i]];if(X.top[i]>maxZ)maxZ=X.top[i];}else{X.top[i]=-1e9;X.topO[i]=-1;}}
  S.maxZ=maxZ+0.5;return X;}
// woksel w komórce i na wysokości bezwzględnej z (indeks albo -1)
function voxJ(S,i,z){const X=S.vx;if(X.hi[i]<0)return -1;const k=Math.floor((z-S.T.dtm[i])/X.dz);if(k<X.lo[i]||k>X.hi[i])return -1;return X.off[i]+k-X.lo[i];}
// najwyższy woksel cudzej korony w kolumnie (dla osłony od wiatru)
function topOther(S,i,selfId){const X=S.vx;if(X.hi[i]<0)return -1e9;for(let k=X.hi[i];k>=X.lo[i];k--){const j=X.off[i]+k-X.lo[i];if(X.mu[j]<=0)continue;if(X.own[j]!==selfId||X.mu[j]-X.muO[j]>1e-6)return S.T.dtm[i]+(k+1)*X.dz;}return -1e9;}
// kierunki światła: zenit, 8 kierunków nieba rozproszonego (45°) i słońce z SE, S, SW na wysokości zależnej od pory roku (Warszawa, 52°N)
const SUN_EL=[50,60,33,15];
function lightDirs(si){const D=[];const add=(az,el,w)=>{const a=az*Math.PI/180,e=el*Math.PI/180;D.push({dx:Math.sin(a),dy:Math.cos(a),tanE:Math.tan(e),invCos:1/Math.cos(e),w});};
  for(let k=0;k<8;k++)add(k*45,45,0.45/8);const E=SUN_EL[si];add(180,E,0.4/3);add(135,E*0.7,0.4/3);add(225,E*0.7,0.4/3);return {dirs:D,wz:0.15};}
function rayT(S,x,y,z,d,selfId){const T=S.T,X=S.vx,res=T.res;let la=0,blocked=false;const ns=Math.max(1,Math.ceil(res*d.tanE/X.dz-1e-6));const hs=res/ns;const step=hs*d.invCos;
  let px=x,py=y,pz=z;for(let k=0;k<1200;k++){px+=d.dx*hs;py+=d.dy*hs;pz+=hs*d.tanE;if(pz>S.maxZ)break;const i=cellOf(T,px,py);if(i<0)break;
    if(!blocked&&(T.babs[i]>pz||T.dtm[i]>pz))blocked=true;
    if(X.top[i]>pz){const kk=Math.floor((pz-T.dtm[i])/X.dz);if(kk>=X.lo[i]&&kk<=X.hi[i]){const j=X.off[i]+kk-X.lo[i];let m=X.mu[j];if(X.own[j]===selfId)m-=X.muO[j];if(m>0)la-=m*step;}}
    if(la<-7)break;}
  return [blocked?0:Math.exp(la),Math.exp(la)];}
function zenT(S,i,z,selfId){const X=S.vx,T=S.T;let l=0;if(X.hi[i]>=0&&X.top[i]>z){const k0=Math.max(X.lo[i],Math.floor((z-T.dtm[i])/X.dz));for(let k=k0;k<=X.hi[i];k++){const j=X.off[i]+k-X.lo[i];let m=X.mu[j];if(X.own[j]===selfId)m-=X.muO[j];if(m>0)l+=m;}l*=X.dz;}
  const blk=T.babs[i]>z;return [blk?0:Math.exp(-l),Math.exp(-l)];}
function lightAt(S,LD,x,y,z,selfId){const i=cellOf(S.T,x,y);if(i<0)return [1,1];const zt=zenT(S,i,z,selfId);let a=LD.wz*zt[0],p=LD.wz*zt[1];for(const d of LD.dirs){const r=rayT(S,x,y,z,d,selfId);a+=d.w*r[0];p+=d.w*r[1];}return [a,p];}
// światło koron (środek i 4 punkty boczne) oraz światło przy ziemi dla siewek i runa
function computeLight(S,si,noGround){const LD=lightDirs(si);
  for(const t of S.trees){if(!t.alive)continue;syncSec(t);const s=IND(t);const top=zTop(t),dep=t.H*S.W.crownRatio;const c=lightAt(S,LD,t.x,t.y,top-0.05*dep,t.id);let a=0,p=0;const sl=t.secL||(t.secL=new Float32Array(8));
    for(let k=0;k<8;k++){const r=0.85*t.cr[k];const q=lightAt(S,LD,t.x+SEC_DX[k]*r,t.y+SEC_DY[k]*r,top-0.4*dep,t.id);a+=q[0];p+=q[1];if(si===1||!t.secOk)sl[k]=q[0];}if(si===1)t.secOk=true;
    t.lf=0.2*c[0]+0.8*a/8;t.cue=1-(0.2*c[1]+0.8*p/8);t.light=t.lf*t.weq*(1-s.trans)*Math.max(0,t.cf)*t.leafOut;}
  const T=S.T;if(noGround&&S.ground)return;let st=Math.max(1,Math.round(2/T.res));while(T.n/(st*st)>12000)st++;const g=S.ground||(S.ground=new Float32Array(T.n));
  for(let r=0;r<T.ny;r+=st)for(let c=0;c<T.nx;c+=st){const i=r*T.nx+c;const [x,y]=cellXY(T,i);const v=T.bld[i]>0?0:lightAt(S,LD,x,y,T.dtm[i]+0.3,-9)[0];
    for(let a=0;a<st&&r+a<T.ny;a++)for(let b=0;b<st&&c+b<T.nx;b++)g[(r+a)*T.nx+c+b]=v;}}
// ekspozycja na wiatr: osłona z każdego kierunku róży wiatrów, słabnąca z odległością (do 2H)
const ROSE_DIR={N:0,NE:45,E:90,SE:135,S:180,SW:225,W:270,NW:315};
function exposure(S){const T=S.T,rose=S.W.windRose||WORLD_DEFAULT.windRose;let wsum=0;for(const k in rose)wsum+=rose[k];
  for(const t of S.trees){if(!t.alive)continue;const H=Math.max(t.H,0.5);const step=Math.max(T.res,H/12);let e=0;
    for(const k in rose){const a=ROSE_DIR[k]*Math.PI/180,dx=Math.sin(a),dy=Math.cos(a);let sh=0;for(let r=step;r<=2*H;r+=step){const i=cellOf(T,t.x+dx*r,t.y+dy*r);if(i<0)break;
        let h=T.babs[i];if(S.vx.top[i]>h){const o=topOther(S,i,t.id);if(o>h)h=o;}const v=clamp((h-t.z0)/H,0,1)*(1-r/(2*H));if(v>sh)sh=v;}
      e+=rose[k]/wsum*(1-0.6*sh);}
    t.exp=clamp(e,0.4,1);}}
// mapa hałasu drogowego: źródła = komórki jezdni (moc akustyczna na metr zależna od natężenia ruchu), propagacja z rozbieżnością geometryczną,
// ekranowaniem przez budynki i teren, tłumieniem przez gęstą roślinność niską i pochłanianiem nad miękkim podłożem. Zanieczyszczenie (wskaźnik NO2) z hałasu.
function computeNoise(S){const T=S.T,W=S.W;const n=T.n;const L=S.noise||(S.noise=new Float32Array(n));const NO2=S.no2||(S.no2=new Float32Array(n));
  if(T.noiseImp){for(let i=0;i<n;i++)L[i]=isNaN(T.noiseImp[i])?W.noiseBg:T.noiseImp[i];}
  else{const src=[];for(let i=0;i<n;i++)if(T.traffic[i]>0)src.push(i);let ss=1;while(src.length/(ss*ss)>320)ss++;
    const S2=[];for(const i of src){const r=Math.floor(i/T.nx),c=i-r*T.nx;if(r%ss||c%ss)continue;const [x,y]=cellXY(T,i);const Lw=[0,W.noiseLw1,W.noiseLw2,W.noiseLw3][T.traffic[i]]+10*Math.log10(ss*ss*T.res*T.res/7);S2.push({x,y,z:T.dtm[i]+0.5,Lw});}
    let rs=1;while((T.nx/rs)*(T.ny/rs)>3000)rs++;const gx=Math.ceil(T.nx/rs),gy=Math.ceil(T.ny/rs);const G=new Float32Array(gx*gy);
    for(let a=0;a<gy;a++)for(let b=0;b<gx;b++){const r=Math.min(T.ny-1,a*rs),c=Math.min(T.nx-1,b*rs);const ir=r*T.nx+c;const [xr,yr]=cellXY(T,ir);const zr=T.dtm[ir]+1.6;let E=Math.pow(10,W.noiseBg/10);
      for(const s of S2){const dx=xr-s.x,dy=yr-s.y;const d=Math.max(1,Math.hypot(dx,dy));if(d>220)continue;const nst=Math.min(40,Math.ceil(d/T.res));let barrier=false,veg=0,soft=0;
        for(let k=1;k<nst;k++){const f=k/nst;const px=s.x+dx*f,py=s.y+dy*f,pz=s.z+(zr-s.z)*f;const i=cellOf(T,px,py);if(i<0)continue;if(T.babs[i]>pz||T.dtm[i]>pz+0.2)barrier=true;
          const gz=pz-T.dtm[i];if(gz<4&&voxJ(S,i,pz)>=0)veg+=d/nst;if(SURF[surfKey(T,i)].seal<0.5)soft++;}
        const att=(barrier?W.noiseBarrier:0)+Math.min(W.noiseVegMax,W.noiseVeg*veg)+W.noiseGround*(soft/Math.max(1,nst-1))*Math.min(1,d/10);
        E+=Math.pow(10,(s.Lw-20*Math.log10(d)-11-att)/10);}
      G[a*gx+b]=10*Math.log10(E);}
    for(let r=0;r<T.ny;r++)for(let c=0;c<T.nx;c++){const fa=r/rs,fb=c/rs;const a0=Math.min(gy-1,Math.floor(fa)),b0=Math.min(gx-1,Math.floor(fb)),a1=Math.min(gy-1,a0+1),b1=Math.min(gx-1,b0+1);const u=fa-a0,v=fb-b0;
      L[r*T.nx+c]=(G[a0*gx+b0]*(1-u)*(1-v)+G[a0*gx+b1]*(1-u)*v+G[a1*gx+b0]*u*(1-v)+G[a1*gx+b1]*u*v);}}
  for(let i=0;i<n;i++)NO2[i]=Math.pow(clamp((L[i]-W.no2Lo)/(W.no2Hi-W.no2Lo),0,1),1.2);
  S.noiseYear=S.year;}
// osłona przed koszeniem: niskie korony (krzewy, młode drzewa) albo zwarcie okapu drzew ≥ 10 m w promieniu 4 m
function computeCover(S){const T=S.T,n=T.n;const low=S.coverLow||(S.coverLow=new Uint8Array(n)),clo=S.coverClo||(S.coverClo=new Float32Array(n));low.fill(0);
  for(const t of S.trees){if(!t.alive||t.dead||t.H<1.5||zBot(S,t)-t.z0>1.6)continue;const r=Math.max(t.Reff,T.res*0.5);for(let dx=-r;dx<=r;dx+=T.res)for(let dy=-r;dy<=r;dy+=T.res){if(dx*dx+dy*dy>r*r)continue;const i=cellOf(T,t.x+dx,t.y+dy);if(i>=0)low[i]=1;}}
  const can=new Uint8Array(n);const X=S.vx;for(let i=0;i<n;i++)can[i]=(X.hi[i]>=0&&X.top[i]-T.dtm[i]>=10)?1:0;const w=Math.max(1,Math.round(4/T.res));
  for(let r=0;r<T.ny;r++)for(let c=0;c<T.nx;c++){let s=0,k=0;for(let a=-w;a<=w;a+=Math.max(1,Math.floor(w/2)))for(let b=-w;b<=w;b+=Math.max(1,Math.floor(w/2))){const rr=r+a,cc=c+b;if(rr<0||rr>=T.ny||cc<0||cc>=T.nx)continue;s+=can[rr*T.nx+cc];k++;}clo[r*T.nx+c]=k?s/k:0;}}
function protAt(S,i){const W=S.W;if(!W.spont||i<0)return 0;return S.coverLow[i]?1:(S.coverClo[i]>=W.closureMin?W.closureProt:0);}
