/* SPDX-License-Identifier: MPL-2.0
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.
 * © 2026 Piotr Mędrzycki, Paweł Mędrzycki */
/* ================= teren: siatka, warstwy, pochodne ================= */
// Siatka: wiersz 0 = północ (jak w ASC). Współrzędne lokalne w metrach: x rośnie na wschód, y na północ.
// Komórka i = r*nx + c ma środek (x, y) = ((c+0.5)*res, (ny-r-0.5)*res). Współrzędne układu: X = xll + x, Y = yll + y.
function newTerrain(nx,ny,res,xll,yll,name){const n=nx*ny;const T={name:name||'teren',nx,ny,res,xll:xll||0,yll:yll||0,n,crs:'EPSG:2180 (zakładany)',
  dtm:new Float32Array(n),dsm:null,bld:new Float32Array(n),surf:new Uint8Array(n).fill(1),hab:new Uint8Array(n).fill(1),traffic:new Uint8Array(n),salt:new Uint8Array(n),
  target:new Uint8Array(n).fill(1),noiseImp:null,trees0:[],meta:{}};return T;}
const cellOf=(T,x,y)=>{const c=Math.floor(x/T.res),r=T.ny-1-Math.floor(y/T.res);if(c<0||c>=T.nx||r<0||r>=T.ny)return -1;return r*T.nx+c;};
const cellXY=(T,i)=>{const r=Math.floor(i/T.nx),c=i-r*T.nx;return [(c+0.5)*T.res,(T.ny-r-0.5)*T.res];};
const surfKey=(T,i)=>SURF_CODES[T.surf[i]]||'trawnik';
const habKey=(T,i)=>HAB_CODES[T.hab[i]]||'zs';

// odległość euklidesowa (przybliżenie 3-4 chamfer) od komórek maski, w metrach
function distTransform(T,mask){const {nx,ny,res}=T;const INF=1e9;const d=new Float32Array(nx*ny);for(let i=0;i<nx*ny;i++)d[i]=mask[i]?0:INF;const a=res,b=res*Math.SQRT2;
  for(let r=0;r<ny;r++)for(let c=0;c<nx;c++){const i=r*nx+c;let v=d[i];if(c>0)v=Math.min(v,d[i-1]+a);if(r>0){v=Math.min(v,d[i-nx]+a);if(c>0)v=Math.min(v,d[i-nx-1]+b);if(c<nx-1)v=Math.min(v,d[i-nx+1]+b);}d[i]=v;}
  for(let r=ny-1;r>=0;r--)for(let c=nx-1;c>=0;c--){const i=r*nx+c;let v=d[i];if(c<nx-1)v=Math.min(v,d[i+1]+a);if(r<ny-1){v=Math.min(v,d[i+nx]+a);if(c<nx-1)v=Math.min(v,d[i+nx+1]+b);if(c>0)v=Math.min(v,d[i+nx-1]+b);}d[i]=v;}
  return d;}

// pochodne: spadek, ekspozycja, akumulacja spływu D8, wskaźnik wilgotności TWI, odległości od dróg i budynków
function deriveTerrain(T){const {nx,ny,res,n,dtm}=T;const slope=new Float32Array(n),aspect=new Float32Array(n);
  const at=(r,c)=>dtm[clamp(r,0,ny-1)*nx+clamp(c,0,nx-1)];
  for(let r=0;r<ny;r++)for(let c=0;c<nx;c++){const dzdx=(at(r,c+1)-at(r,c-1))/(2*res),dzdy=(at(r-1,c)-at(r+1,c))/(2*res);const i=r*nx+c;slope[i]=Math.sqrt(dzdx*dzdx+dzdy*dzdy);
    aspect[i]=Math.atan2(-dzdx,-dzdy);} // kierunek spadku (azymut od północy, radiany)
  const order=Array.from({length:n},(_,i)=>i).sort((a,b)=>dtm[b]-dtm[a]);const acc=new Float32Array(n).fill(1);
  for(const i of order){const r=Math.floor(i/nx),c=i-r*nx;let best=-1,bd=0;for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){if(!dr&&!dc)continue;const rr=r+dr,cc=c+dc;if(rr<0||rr>=ny||cc<0||cc>=nx)continue;const j=rr*nx+cc;
      const drop=(dtm[i]-dtm[j])/(res*(dr&&dc?Math.SQRT2:1));if(drop>bd){bd=drop;best=j;}}if(best>=0)acc[best]+=acc[i];}
  const twi=new Float32Array(n);let m=0;for(let i=0;i<n;i++){twi[i]=Math.log(acc[i]*res/Math.max(Math.tan(Math.atan(slope[i])),0.005));m+=twi[i];}m/=n;let sd=0;for(let i=0;i<n;i++)sd+=(twi[i]-m)**2;sd=Math.sqrt(sd/n)||1;
  const twiN=new Float32Array(n),south=new Float32Array(n);for(let i=0;i<n;i++){twiN[i]=clamp((twi[i]-m)/(2*sd),-1,1);south[i]=Math.cos(aspect[i]-Math.PI)*Math.min(1,slope[i]/0.3);}
  const road=new Uint8Array(n),salted=new Uint8Array(n),bm=new Uint8Array(n);for(let i=0;i<n;i++){road[i]=T.traffic[i]>0?1:0;salted[i]=T.traffic[i]>0&&T.salt[i]?1:0;bm[i]=T.bld[i]>2?1:0;}
  T.babs=new Float32Array(n);for(let i=0;i<n;i++)T.babs[i]=T.bld[i]>0?dtm[i]+T.bld[i]:-1e9;
  T.slope=slope;T.aspect=aspect;T.acc=acc;T.twi=twi;T.twiN=twiN;T.south=south;
  T.dRoad=distTransform(T,road);T.dSalt=distTransform(T,salted);T.dBld=distTransform(T,bm);
  // natężenie ruchu najbliższej drogi (dla parowania przy ulicy)
  T.facE=new Float32Array(n);for(let i=0;i<n;i++){const d=T.dBld[i];T.facE[i]=bm[i]?0:d<10.5?clamp(1-(d-1.5)/9,0,1):0;}
  return T;}

/* ================= układ wzorcowy: kwartał przy parku ================= */
// Dane przykładowe (nie pomiar): ulica z aleją, boczna uliczka, bloki, podwórko, park z kohortą lip, łąka, plac zabaw, zagłębienie z olszami, kępa grądowa.
function demoTerrain(seed,res){res=res||1;const W=120,H=90;const nx=Math.round(W/res),ny=Math.round(H/res);const T=newTerrain(nx,ny,res,637400,488600,'Kwartał przy parku (przykład)');const rng=mulberry32(seed||11);
  for(let r=0;r<ny;r++)for(let c=0;c<nx;c++){const i=r*nx+c;const x=(c+0.5)*res,y=(ny-r-0.5)*res;
    let z=86+0.012*(W-x)*0.6+0.01*y;const dx=x-62,dy=y-42;z-=1.6*Math.exp(-(dx*dx/180+dy*dy/90));T.dtm[i]=z;
    let s='trawnik',h='zs',tr=0,sl=0,tg=1;
    if(y<7){s='jezdnia';tr=3;sl=1;tg=0;h='us';}else if(y<11){s='chodnik';tg=3;h='us';}
    if(x>112){s='jezdnia';tr=1;sl=1;tg=0;h='us';}else if(x>108&&y>=7){s='chodnik';tg=3;h='us';}
    if(y>=11&&x<=108){
      if(x>=6&&x<=44&&y>=62&&y<=76){s='budynek';tg=0;}
      else if(x>=70&&x<=100&&y>=70&&y<=84){s='budynek';tg=0;}
      else if(x>=50&&x<=58&&y>=74&&y<=80){s='budynek';tg=0;}
      else if(y>76&&x<50){s=(x>8&&x<20)?'klomb':(x>=20&&x<34?'rabata':'trawnik');tg=2;}
      else if(Math.abs(x-60)<1.6&&y<70){s='chodnik';tg=3;}
      else if(Math.abs(y-30)<1.2&&x<108){s='chodnik';tg=3;}
      else if(x>=84&&x<=102&&y>=40&&y<=56){s='sciolka';tg=3;}
      else if(dx*dx/180+dy*dy/90<1.2){s='leg';h='zw';tg=0;}
      else if(x<26&&y>=34&&y<58){s='grad';tg=0;h='zs';}
      else if(x>=28&&x<52&&y>=36&&y<58){s='laka';tg=1;}
      else tg=y<30?2:1;}
    T.surf[i]=SURF_CODES.indexOf(s);T.hab[i]=HAB_CODES.indexOf(h);T.traffic[i]=tr;T.salt[i]=sl;T.target[i]=tg;
    if(s==='budynek'){T.bld[i]=(x>=50&&x<=58)?3:(x<45?15:12);}}
  const tr=[];const P=(k,x,y,age,Ht,D,die,wound,dr)=>tr.push({k,x,y,age,H:Ht,D,die:die||0,wound:wound||0,dr:dr||0});
  for(let x=4;x<106;x+=8){const old=rng()<0.85;if(old)P(rng()<0.15?'asac':'tcor',x+randn(rng)*0.2,9,38+Math.round(rng()*8),15+rng()*3,38+rng()*9,0.15+rng()*0.2,0.05,0.04);else P('tcor',x,9,5,4.5,8);}
  for(let y=16;y<86;y+=9)P(rng()<0.5?'aneg':'fpen',110,y,20+Math.round(rng()*10),10+rng()*3,22+rng()*6,0.1,0.04,0);
  for(let x=64;x<106;x+=3.4)for(let y=14;y<28;y+=3.4){if(rng()<0.12)continue;P('tcor',x+randn(rng)*0.3,y+randn(rng)*0.3,45,19+randn(rng)*2,30+randn(rng)*6,0.05+rng()*0.15,rng()<0.3?0.05:0,rng()<0.12?0.15:0);}
  P('qrob',20,22,90,24,85,0.15,0.08,0.15);P('qrob',40,18,70,22,62,0.1,0.04,0.05);P('tcor',30,26,70,22,60,0.2,0.06,0.1);
  for(let k=0;k<9;k++){const a=k/9*6.28;P(k%3?'aglu':'ainc',62+Math.cos(a)*9+randn(rng),42+Math.sin(a)*5+randn(rng),25+Math.round(rng()*15),15+rng()*5,20+rng()*10,0.05,0,0);}
  for(let x=3;x<25;x+=4.5)for(let y=36;y<57;y+=5){P(rng()<0.5?'apla':(rng()<0.5?'qrob':'tcor'),x+randn(rng),y+randn(rng),30+Math.round(rng()*20),16+rng()*6,24+rng()*14,0.05,0,rng()<0.1?0.1:0);}
  P('snig',12,45,8,3.5,6);P('snig',20,40,8,3,5);P('cluc',30,40,8,2,3);P('salbu',36,55,8,1.6,2);
  P('pser',14,80,18,6,22,0.05);P('pser',22,80,18,6.2,23,0.1);P('mpur',30,82,15,5,14);P('rpse',47,66,35,17,40,0.1,0.04,0.05);P('bpen',58,64,30,17,26,0.1);
  P('apla',75,62,25,14,28,0.05);P('apla',96,64,25,13,26,0.05);P('qrub',86,36,30,16,34,0.05);
  T.trees0=tr.filter(t=>{const i=cellOf(T,t.x,t.y);return i>=0&&T.bld[i]<=0&&SURF_CODES[T.surf[i]]!=='jezdnia';});
  T.meta.source='przykład';return deriveTerrain(T);}

/* ================= ASC: odczyt, zapis, przepróbkowanie ================= */
function parseASC(text){const lines=text.split(/\r?\n/);const h={};let k=0;
  for(;k<lines.length;k++){const L=lines[k].trim();if(!L)continue;const m=L.match(/^([A-Za-z_]+)\s+(-?[\d.eE+-]+)$/);if(!m)break;h[m[1].toLowerCase()]=parseFloat(m[2]);}
  const nc=h.ncols,nr=h.nrows,cs=h.cellsize;if(!(nc>0&&nr>0&&cs>0))throw new Error('To nie wygląda na plik ASC: brak ncols, nrows albo cellsize w nagłówku.');
  const nd=h.nodata_value!=null?h.nodata_value:-9999;const xll=h.xllcorner!=null?h.xllcorner:(h.xllcenter-cs/2),yll=h.yllcorner!=null?h.yllcorner:(h.yllcenter-cs/2);
  const v=new Float32Array(nc*nr);let p=0;for(;k<lines.length&&p<v.length;k++){const parts=lines[k].trim().split(/\s+/);for(const s of parts){if(!s)continue;const f=parseFloat(s);v[p++]=(f===nd||!isFinite(f))?NaN:f;if(p>=v.length)break;}}
  if(p<v.length)throw new Error('Plik ASC jest niekompletny: '+p+' z '+v.length+' wartości.');
  return {ncols:nc,nrows:nr,xll,yll,cellsize:cs,nodata:nd,data:v};}
function writeASC(T,arr,opts){opts=opts||{};const nd=-9999;const dec=opts.dec!=null?opts.dec:2;let s=`ncols ${T.nx}\nnrows ${T.ny}\nxllcorner ${T.xll.toFixed(3)}\nyllcorner ${T.yll.toFixed(3)}\ncellsize ${T.res}\nNODATA_value ${nd}\n`;
  const rows=[];for(let r=0;r<T.ny;r++){const a=[];for(let c=0;c<T.nx;c++){const v=arr[r*T.nx+c];a.push(v==null||!isFinite(v)?nd:(Number.isInteger(v)?String(v):v.toFixed(dec)));}rows.push(a.join(' '));}return s+rows.join('\n')+'\n';}
// przepróbkowanie rastra źródłowego na siatkę T: średnia (warstwy ciągłe) albo dominanta (klasy)
function resampleTo(T,asc,mode){const out=new Float32Array(T.n).fill(NaN);const {res}=T;const sub=Math.max(1,Math.round(res/asc.cellsize));
  for(let r=0;r<T.ny;r++)for(let c=0;c<T.nx;c++){const X=T.xll+(c+0.5)*res,Y=T.yll+(T.ny-r-0.5)*res;let sum=0,cnt=0;const votes={};
    for(let a=0;a<sub;a++)for(let b=0;b<sub;b++){const xs=X-res/2+(b+0.5)*res/sub,ys=Y+res/2-(a+0.5)*res/sub;const cc=Math.floor((xs-asc.xll)/asc.cellsize),rr=asc.nrows-1-Math.floor((ys-asc.yll)/asc.cellsize);
      if(cc<0||cc>=asc.ncols||rr<0||rr>=asc.nrows)continue;const v=asc.data[rr*asc.ncols+cc];if(isNaN(v))continue;if(mode==='class'){votes[v]=(votes[v]||0)+1;}else{sum+=v;cnt++;}}
    const i=r*T.nx+c;if(mode==='class'){let best=null,bv=0;for(const k in votes)if(votes[k]>bv){bv=votes[k];best=+k;}out[i]=best==null?NaN:best;}else out[i]=cnt?sum/cnt:NaN;}
  return out;}
function fillNaN(a,fallback){let m=0,c=0;for(const v of a)if(!isNaN(v)){m+=v;c++;}m=c?m/c:fallback;for(let i=0;i<a.length;i++)if(isNaN(a[i]))a[i]=m;return a;}

/* ================= CSV drzew ================= */
function splitCSV(text){const lines=text.replace(/^﻿/,'').split(/\r?\n/).filter(l=>l.trim());if(!lines.length)return {head:[],rows:[]};const sep=(lines[0].split(';').length>lines[0].split(',').length)?';':(lines[0].includes('\t')?'\t':',');
  const parse=l=>{const out=[];let cur='',q=false;for(let i=0;i<l.length;i++){const ch=l[i];if(ch==='"'){if(q&&l[i+1]==='"'){cur+='"';i++;}else q=!q;}else if(ch===sep&&!q){out.push(cur);cur='';}else cur+=ch;}out.push(cur);return out.map(s=>s.trim());};
  return {head:parse(lines[0]),rows:lines.slice(1).map(parse),sep};}
const COL_GUESS={x:['x','xcoord','x_2180','east','e','lon_x'],y:['y','ycoord','y_2180','north','n','lat_y'],h:['h','height','wysokosc','wysokość','h_m','tree_height','zmax'],
  r:['r','crown_r','crown_radius','promien','promień','r_korony'],cd:['cd','crown_d','crown_diameter','srednica_korony','średnica_korony','d_korony'],ca:['ca','crown_area','pow_korony','area'],
  dbh:['dbh','d','dbh_cm','piersnica','pierśnica','d13'],circ:['obwod','obwód','circumference','obw'],sp:['species','gatunek','sp','spec','nazwa','latin','nazwa_lac'],cb:['cb','crown_base','podstawa_korony','hcb'],id:['id','nr','numer','tree_id']};
function guessColumns(head){const m={};const low=head.map(h=>h.toLowerCase().replace(/\s+/g,'_'));for(const k in COL_GUESS){const i=low.findIndex(h=>COL_GUESS[k].includes(h));if(i>=0)m[k]=i;}return m;}
// drzewa z CSV do listy startowej; brakujące wielkości szacowane z allometrii gatunku (oznaczone w meta)
function treesFromCSV(T,csv,map,species,defaultSp){const out=[],issues={noSp:0,est:0,outside:0,unknown:{}};const local=v=>v;
  let xs=[],ys=[];for(const row of csv.rows){xs.push(parseFloat(String(row[map.x]).replace(',','.')));ys.push(parseFloat(String(row[map.y]).replace(',','.')));}
  const isGlobal=xs.some(v=>v>T.nx*T.res*2)||ys.some(v=>v>T.ny*T.res*2);
  csv.rows.forEach((row,k)=>{const num=i=>i==null?NaN:parseFloat(String(row[i]).replace(',','.'));let x=xs[k],y=ys[k];if(!isFinite(x)||!isFinite(y))return;if(isGlobal){x-=T.xll;y-=T.yll;}
    const i=cellOf(T,x,y);if(i<0){issues.outside++;return;}let sp=map.sp!=null?matchSpecies(species,row[map.sp]):-1;if(sp<0){if(map.sp!=null&&row[map.sp])issues.unknown[row[map.sp]]=(issues.unknown[row[map.sp]]||0)+1;issues.noSp++;sp=defaultSp;}
    const s=species[sp];let H=num(map.h);let R=num(map.r);if(!isFinite(R)&&isFinite(num(map.cd)))R=num(map.cd)/2;if(!isFinite(R)&&isFinite(num(map.ca)))R=Math.sqrt(num(map.ca)/Math.PI);
    let D=num(map.dbh);if(!isFinite(D)&&isFinite(num(map.circ)))D=num(map.circ)/Math.PI;if(isFinite(D)&&D<3&&isFinite(H)&&H>4)D*=100;
    if(!isFinite(H)&&T.dsm){H=Math.max(1.5,T.dsm[i]-T.dtm[i]);}if(!isFinite(H)){H=10;issues.est++;}
    if(!isFinite(D)){D=estimateDBH(s,H,R);issues.est++;}if(!isFinite(R))R=Math.min(s.crownMax,s.crownA*Math.pow(D,s.crownB))/2;
    out.push({k:s.key,sp,x,y,H:Math.min(H,s.maxH*1.1),D,R,age:Math.round(clamp(D*1.2,3,250)),die:0.1,wound:0,dr:0,id:map.id!=null?row[map.id]:null});});
  return {trees:out,issues};}
// pierśnica z wysokości i korony: średnia geometryczna z odwrotności allometrii korony i prostej zależności od wysokości (oszacowanie)
function estimateDBH(s,H,R){const fromH=1.4*Math.pow(Math.max(H,1.5),1.15);if(!isFinite(R)||R<=0)return fromH;const fromR=Math.pow(Math.max(2*R,0.5)/s.crownA,1/s.crownB);return Math.sqrt(fromH*clamp(fromR,fromH*0.4,fromH*2.5));}

/* ================= wykrywanie budynków i drzew z NMPT ================= */
// budynki: komórki nNMPT > 2,5 m o małej szorstkości, zebrane w płaty ≥ 25 m²; drzewa: lokalne maksima nNMPT w oknie zależnym od wysokości
function detectFromDSM(T,opts){opts=opts||{};const {nx,ny,res,n}=T;const nd=new Float32Array(n);for(let i=0;i<n;i++)nd[i]=Math.max(0,(T.dsm?T.dsm[i]:T.dtm[i])-T.dtm[i]);
  const rough=new Float32Array(n);for(let r=0;r<ny;r++)for(let c=0;c<nx;c++){let s=0,s2=0,k=0;for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const rr=r+a,cc=c+b;if(rr<0||rr>=ny||cc<0||cc>=nx)continue;const v=nd[rr*nx+cc];s+=v;s2+=v*v;k++;}rough[r*nx+c]=s2/k-(s/k)**2;}
  const flat=new Uint8Array(n);for(let i=0;i<n;i++)flat[i]=nd[i]>2.5&&rough[i]<(opts.roughMax||0.25)?1:0;
  const lab=new Int32Array(n).fill(-1);const comps=[];for(let i=0;i<n;i++){if(!flat[i]||lab[i]>=0)continue;const q=[i];lab[i]=comps.length;const cells=[];while(q.length){const j=q.pop();cells.push(j);const r=Math.floor(j/nx),c=j-r*nx;
      for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const rr=r+a,cc=c+b;if(rr<0||rr>=ny||cc<0||cc>=nx)continue;const k=rr*nx+cc;if(flat[k]&&lab[k]<0){lab[k]=comps.length;q.push(k);}}}comps.push(cells);}
  const minA=(opts.minBld||25)/(res*res);let nb=0;for(const cells of comps){if(cells.length<minA)continue;nb++;for(const j of cells){T.bld[j]=nd[j];T.surf[j]=SURF_CODES.indexOf('budynek');T.target[j]=0;}}
  const trees=[];for(let r=0;r<ny;r++)for(let c=0;c<nx;c++){const i=r*nx+c;const h=nd[i];if(h<(opts.minH||4)||T.bld[i]>0)continue;const w=Math.max(1,Math.round(clamp(0.1*h+1.2,1.5,5)/res));let top=true;
    for(let a=-w;a<=w&&top;a++)for(let b=-w;b<=w;b++){if(!a&&!b)continue;const rr=r+a,cc=c+b;if(rr<0||rr>=ny||cc<0||cc>=nx)continue;if(a*a+b*b>w*w)continue;const v=nd[rr*nx+cc];if(v>h||(v===h&&(a<0||(a===0&&b<0)))){top=false;break;}}
    if(!top)continue;let dsum=0;for(let k=0;k<8;k++){const ang=k*Math.PI/4;let d=res;for(;d<15;d+=res){const cc=Math.round(c+Math.cos(ang)*d/res),rr=Math.round(r-Math.sin(ang)*d/res);if(rr<0||rr>=ny||cc<0||cc>=nx)break;const v=nd[rr*nx+cc];if(v<0.55*h||v>h+0.3)break;}dsum+=d;}
    const [x,y]=cellXY(T,i);trees.push({x,y,H:h,R:Math.max(1,dsum/8)});}
  return {buildings:nb,trees};}
