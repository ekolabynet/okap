/* SPDX-License-Identifier: MPL-2.0
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.
 * © 2026 Piotr Mędrzycki, Paweł Mędrzycki */
/* ================= dane: wczytywanie terenu, zapis warstw, tabel i ustawień ================= */
let DL=null;
async function saveFile(name,data){try{if(!DL&&window.claude&&claude.use)DL=await claude.use('downloads');}catch(e){DL=null;}
  if(DL){try{await DL.save({filename:name,data});toast('Zapisano: '+name);return true;}catch(e){if(e&&e.code==='user_declined'){toast('Zapis anulowany.');return false;}toast('Nie udało się zapisać pliku ('+(e&&e.code||'błąd')+').');return false;}}
  try{const blob=data instanceof Blob?data:new Blob([data]);const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},2000);return true;}catch(e){toast('Pobieranie plików nie jest tu dostępne.');return false;}}
const csvJoin=rows=>rows.map(r=>r.map(v=>{if(v==null)return '';const s=typeof v==='number'?(Number.isInteger(v)?String(v):String(+v.toFixed(4))):String(v);return /[;"\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}).join(';')).join('\n');
const stamp=()=>{const d=new Date();const p=n=>String(n).padStart(2,'0');return d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'_'+p(d.getHours())+p(d.getMinutes());};
const baseName=()=>(T&&T.name||'teren').toLowerCase().replace(/[^a-z0-9ąćęłńóśźż]+/gi,'_').replace(/^_|_$/g,'').slice(0,40)||'teren';

/* ---------- eksport ---------- */
function treesRows(){const head=['id','X','Y','x','y','gatunek','lacina','skrot','pochodzenie','wiek','H_m','DBH_cm','HD','R_m','Rp_m','kondycja_korony','swiatlo_korony','sygnal_konkurencji','ekspozycja','zapas_pnia','zapas_zakotwienia','p_awarii_rok','ryzyko','korzenie_RC','gleba_sv','stres_wodny','zgnilizna','rany','zakazenie','martwe','uslugi_razem','id_zrodlowe',...SEC_NAMES.map(n=>'r_'+n),'przesuniecie_korony_m','zstar_m','H_minus_zstar_m','woksele'];
  const rows=S.trees.filter(t=>t.alive).map(t=>{const s=P.species[t.sp];return [t.id,t.x+T.xll,t.y+T.yll,t.x,t.y,s.key,s.latin,abbrOf(s),t.origin,t.age,t.H,t.D,t.D>0?t.H/(t.D/100):'',t.Reff,t.Rp,t.cf,t.lf,t.cue,t.exp,t.margin,t.anch,t.pf,t.risk,t.RC,t.sv,t.ds,t.dr,t.wound,t.inf?1:0,t.dead?1:0,t.serv?t.serv.tot:'',t.srcId==null?'':t.srcId,...(t.cr?Array.from(t.cr):new Array(8).fill('')),Math.hypot(t.ox||0,t.oy||0),isFinite(t.zs)?t.zs:'',isFinite(t.zs)?t.H-t.zs:'',t.nvox||0];});return [head,...rows];}
// woksele okapu: tylko niepuste; z_wzgl = wysokość dolnej ściany nad gruntem komórki
function voxRows(){const X=S.vx;const byId=new Map(S.trees.map(t=>[t.id,t]));const rows=[['r','c','k','X','Y','z_abs','z_wzgl','dz','lad_wsk','id_dominujacego','gatunek','liczba_koron_wsk']];for(let i=0;i<T.n;i++){if(X.hi[i]<0)continue;const r=Math.floor(i/T.nx),c=i-r*T.nx;const [x,y]=cellXY(T,i);
  for(let k=X.lo[i];k<=X.hi[i];k++){const j=X.off[i]+k-X.lo[i];if(X.mu[j]<=0)continue;const t=byId.get(X.own[j]);rows.push([r,c,k,x+T.xll,y+T.yll,T.dtm[i]+k*X.dz,k*X.dz,X.dz,X.mu[j]/0.5,X.own[j],t?P.species[t.sp].key:'',X.mu[j]>X.muO[j]*1.001?2:1]);}}return rows;}
function profRows(){const vp=vertProfile();const rows=[['z_od_m','z_do_m','lad_wsk_srednia','pokrycie']];vp.lad.forEach((v,k)=>rows.push([k*vp.dz,(k+1)*vp.dz,v,vp.cov[k]]));return rows;}
function cellsRows(){const ls=LAYERS.filter(l=>!l.sim||S);const head=['r','c','X','Y','x','y',...ls.map(l=>l.k)];const rows=[];for(let i=0;i<T.n;i++){const r=Math.floor(i/T.nx),c=i-r*T.nx;const [x,y]=cellXY(T,i);rows.push([r,c,x+T.xll,y+T.yll,x,y,...ls.map(l=>{const v=l.val(i);return isFinite(v)?v:'';})]);}return [head,...rows];}
function seriesRows(){const sp=P.species.map(s=>s.key);const head=['rok','drzewa','pokrycie_koron','kondycja','HD_sr','zstar_mediana','udzial_otwartych','udzial_tuz_pod_zstar','HD_tuz_pod_zstar','HD_w_okapie','HD_otwarte','LAI_wsk','zapas_pnia_lt1','zapas_zak_lt1','awarie_rok','awarie_suma','rbh_rok','rbh_suma','uslugi','chlodzenie','co2_kg','no2_usuwanie','retencja','bioroznorodnosc','halas_przy_ludziach_dB','no2_przy_ludziach','cien_przy_ludziach','ryzyko','samosiewy','odrosty','odnowienia_H4','usuniecia_suma','zdarzenia',...sp.map(k=>'n_'+k)];
  return [head,...S.hist.map(h=>[h.y,h.n,h.canopy,h.cf,h.hd,h.zsM,h.openF,h.belowF,h.hdBelow,h.hdCanopy,h.hdOpen,h.lai,h.mlow,h.alow,h.fails,h.cumFail,h.rbh,h.cumRbh,h.serv.tot,h.serv.cool,h.serv.co2,h.serv.no2,h.serv.rain,h.serv.bio,h.noiseP,h.no2P,h.shadeP,h.risk,h.spA,h.suA,h.recBig,h.cumRem,h.ev,...sp.map((k,j)=>h.comp[j]||0)])];}
function logRows(){return [['rok','pora','zdarzenie','X','Y','x','y','gatunek','H_m','id_drzewa'],...S.log.map(e=>[e.yr,SEAS[e.s],e.k,e.x+T.xll,e.y+T.yll,e.x,e.y,P.species[e.sp].key,e.H,e.id])];}
function exportVal(L){const a=new Float32Array(T.n);for(let i=0;i<T.n;i++)a[i]=L.val(i);return a;}
function dsmNow(){const a=new Float32Array(T.n);for(let i=0;i<T.n;i++)a[i]=T.dtm[i]+chmAt(i);return a;}
async function exportZip(keys){if(typeof JSZip==='undefined'){toast('Biblioteka ZIP się nie wczytała — zapisz warstwy jako CSV komórek.');return;}const z=new JSZip();const dir=baseName()+'_'+(S?S.year0+S.year:'')+'/';
  z.file(dir+'nmt.asc',writeASC(T,T.dtm,{dec:2}));z.file(dir+'nmpt.asc',writeASC(T,dsmNow(),{dec:2}));
  for(const k of keys){const L=LBYK[k];if(!L||k==='dtm')continue;z.file(dir+k+'.asc',writeASC(T,exportVal(L),{dec:L.dec!=null?L.dec:3}));}
  if(S&&S.vx){const X=S.vx;let nk=0;for(let i=0;i<T.n;i++)if(X.hi[i]+1>nk)nk=X.hi[i]+1;for(let k=0;k<nk;k++){const a=new Float32Array(T.n);for(let i=0;i<T.n;i++){if(X.hi[i]<0||k<X.lo[i]||k>X.hi[i])continue;a[i]=X.mu[X.off[i]+k-X.lo[i]]/0.5;}
    z.file(dir+'woksele/lad_'+String(k).padStart(2,'0')+'_'+(k*X.dz)+'-'+((k+1)*X.dz)+'m.asc',writeASC(T,a,{dec:3}));}z.file(dir+'woksele/profil_pionowy.csv',csvJoin(profRows()));}
  if(S){z.file(dir+'drzewa.csv',csvJoin(treesRows()));z.file(dir+'szereg_czasowy.csv',csvJoin(seriesRows()));z.file(dir+'zdarzenia.csv',csvJoin(logRows()));}
  z.file(dir+'ustawienia.json',JSON.stringify(settingsObj(),null,1));z.file(dir+'CZYTAJ.txt',readmeTxt(keys));
  const blob=await z.generateAsync({type:'blob',compression:'DEFLATE'});await saveFile(baseName()+'_warstwy_'+stamp()+'.zip',blob);}
function readmeTxt(keys){return `Okap Teren ${VERSION} (${CODENAME}) — eksport warstw
Teren: ${T.name}; siatka ${T.nx} × ${T.ny} komórek po ${T.res} m; lewy dolny róg X=${T.xll}, Y=${T.yll} (${T.crs}).
Rok symulacji: ${S?S.year0+S.year:'-'}; ziarno: ${S?S.seed:'-'}.
Rastry ESRI ASCII grid (ASC), NODATA = -9999, wiersz pierwszy = północ.
nmt.asc – wysokość terenu; nmpt.asc – teren + wysokość pokrycia (budynki, korony modelowe).
Kody nawierzchni i runa (surf.asc): ${SURF_CODES.map((c,i)=>i+'='+c).join(', ')}.
Kody siedliska (hab.asc): ${HAB_CODES.map((c,i)=>i+'='+c+' ('+HAB[c].name+')').join(', ')}.
Katalog woksele/: gęstość ulistnienia (wskaźnik roboczy = tłumienie / 0,5, m²/m³) na kolejnych poziomach ${S&&S.vx?S.vx.dz:1} m nad gruntem komórki; profil_pionowy.csv – średnia gęstość i pokrycie na poziomach (bez budynków i jezdni).
Pozostałe warstwy: ${keys.map(k=>k+' – '+LBYK[k].n+(LBYK[k].u?' ['+LBYK[k].u+']':'')).join('; ')}.
drzewa.csv – stan drzew (separator ;, kropka dziesiętna); kolumny X,Y w układzie terenu, x,y lokalne w metrach.
Wartości modelu są robocze i nieskalibrowane: to narzędzie do eksperymentów myślowych, nie pomiar.
`;}
function settingsObj(){const world={};for(const k in P.world)world[k]=P.world[k];const species={};P.species.forEach((s,i)=>{const b=LIB.find(x=>x.key===s.key);if(!b)return;const d={};for(const k in s){if(JSON.stringify(s[k])!==JSON.stringify(b[k]))d[k]=s[k];}if(Object.keys(d).length)species[s.key]=d;});
  return {format:'okap-teren/ustawienia',wersja:VERSION,zapisano:new Date().toISOString(),world,species};}
function settingsCSV(){const o=settingsObj();const rows=[['zakres','klucz','wartosc']];for(const k in o.world)rows.push(['world',k,typeof o.world[k]==='object'?JSON.stringify(o.world[k]):o.world[k]]);for(const sk in o.species)for(const k in o.species[sk])rows.push(['species:'+sk,k,typeof o.species[sk][k]==='object'?JSON.stringify(o.species[sk][k]):o.species[sk][k]]);return csvJoin(rows);}
const parseVal=v=>{const s=String(v).trim();if(s==='')return s;try{return JSON.parse(s);}catch(e){}const n=Number(s.replace(',','.'));return isFinite(n)?n:s;};
// ustawienia z JSON albo CSV -> {world, species} (nadpisania na wartości domyślne)
function parseSettings(text,name){text=text.replace(/^﻿/,'');if(/\.json$/i.test(name)||text.trim().startsWith('{')){const o=JSON.parse(text);return {world:o.world||{},species:o.species||{}};}
  const C=splitCSV(text);const out={world:{},species:{}};const hi=C.head.map(x=>x.toLowerCase());const iz=hi.indexOf('zakres'),ik=hi.indexOf('klucz'),iv=hi.indexOf('wartosc')>=0?hi.indexOf('wartosc'):hi.indexOf('wartość');if(iz<0||ik<0||iv<0)throw new Error('CSV ustawień musi mieć kolumny: zakres; klucz; wartosc.');
  for(const r of C.rows){const z=r[iz],k=r[ik],v=parseVal(r[iv]);if(!k)continue;if(z==='world')setK(out.world,k,v);else if(z.startsWith('species:')){const sk=z.slice(8);(out.species[sk]=out.species[sk]||{});setK(out.species[sk],k,v);}}return out;}
function applySettings(ov){P={world:deep(WORLD_DEFAULT),species:deep(LIB)};applyOverrides(P,ov);if(S){refreshParams();}buildParams();toast('Wczytano ustawienia.');}

/* ---------- import ---------- */
const IMP={files:{},csv:null,map:{},asc:{}};
const IMP_LAYERS=[['dtm','NMT – numeryczny model terenu (wymagany)'],['dsm','NMPT – model pokrycia terenu'],['surf','Nawierzchnia i runo (kody)'],['hab','Siedlisko (kody 0–3)'],['traffic','Natężenie ruchu (0–3)'],['target','Strefa użytkowania (0–3)'],['salt','Solenie (0/1)'],['bld','Wysokość budynków (m)'],['noise','Hałas (dB, zamiast modelu)']];
function readText(f){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(r.error);r.readAsText(f);});}
function buildDataPanel(){const p=$('p-data');p.innerHTML='';
  const spSel=()=>{const s=h('select',{id:'impSp'});P.species.forEach((x,i)=>s.append(h('option',{value:i},x.name+' ('+abbrOf(x)+')')));s.value=String(Math.max(0,spIdx('tcor')));return s;};
  const fileRow=([k,n])=>{const inp=h('input',{type:'file',accept:'.asc,.txt,.grd',id:'imp_'+k,onchange:async e=>{const f=e.target.files[0];if(!f){delete IMP.asc[k];return;}try{IMP.asc[k]=parseASC(await readText(f));IMP.files[k]=f.name;const a=IMP.asc[k];impMsg(`${n.split(' (')[0]}: ${a.ncols} × ${a.nrows} komórek po ${a.cellsize} m.`,'ok');}catch(err){delete IMP.asc[k];impMsg(f.name+': '+err.message,'err');}}});
    return h('div',{class:'row'},h('span',{style:'min-width:220px;font-size:13.5px'},n),inp);};
  const csvIn=h('input',{type:'file',accept:'.csv,.txt',onchange:async e=>{const f=e.target.files[0];if(!f){IMP.csv=null;$('impMap').innerHTML='';return;}IMP.csv=splitCSV(await readText(f));IMP.files.csv=f.name;IMP.map=guessColumns(IMP.csv.head);renderMap();impMsg(`Drzewa: ${IMP.csv.rows.length} wierszy, kolumny: ${IMP.csv.head.join(', ')}.`,'ok');}});
  const col1=h('div',{class:'box'},h('h3',null,'Wczytaj teren'),
    h('p',{class:'note'},'Rastry w formacie ESRI ASCII grid (ASC) w jednym układzie współrzędnych (zakładany EPSG:2180). Wszystkie warstwy są przepróbkowane na siatkę o wybranej rozdzielczości: ciągłe średnią, klasy dominantą.'),
    h('div',{class:'row'},h('label',{class:'inl'},'Rozdzielczość siatki ',h('select',{id:'impRes'},h('option',{value:1},'1 m'),h('option',{value:2,selected:true},'2 m'),h('option',{value:5},'5 m')))),
    ...IMP_LAYERS.map(fileRow),
    h('div',{class:'row'},h('label',{class:'inl'},h('input',{type:'checkbox',id:'impDetB',checked:true}),'wykryj budynki z NMPT (gdy brak warstwy budynków)')),
    h('div',{class:'row'},h('label',{class:'inl'},h('input',{type:'checkbox',id:'impDetT',checked:true}),'wykryj drzewa z NMPT (gdy brak pliku drzew)')),
    h('h4',null,'Drzewa (CSV)'),h('div',{class:'row'},csvIn),h('div',{id:'impMap'}),
    h('div',{class:'row'},h('label',{class:'inl'},'gatunek domyślny ',spSel())),
    h('h4',null,'Przycięcie (opcjonalne, współrzędne układu)'),
    h('div',{class:'row'},...['xmin','ymin','xmax','ymax'].map(k=>h('label',{class:'inl'},k,h('input',{type:'number',id:'clip_'+k,style:'width:110px'})))),
    h('div',{class:'row'},h('button',{class:'btn pri',onclick:buildFromImport},'Zbuduj teren i zacznij'),h('button',{class:'btn',onclick:()=>{startTerrain(demoTerrain(1,+$('impRes').value===5?2:+$('impRes').value));toast('Wczytano teren przykładowy.');}},'Teren przykładowy')),
    h('div',{id:'impMsgs'}),
    h('details',null,h('summary',null,'Kody klas i kolumny CSV'),h('div',{class:'note',html:
      '<p><b>Nawierzchnia i runo:</b> '+SURF_CODES.map((c,i)=>i+' – '+esc(SURF[c].name)).join('; ')+'.</p><p><b>Siedlisko:</b> '+HAB_CODES.map((c,i)=>i+' – '+esc(HAB[c].name)).join('; ')+'.</p>'+
      '<p><b>Natężenie ruchu:</b> 0 brak, 1 uliczka, 2 ulica, 3 arteria. <b>Strefa użytkowania:</b> 0 rzadko, 1 zwykle, 2 często, 3 bardzo często (ludzie pod drzewami).</p>'+
      '<p><b>Drzewa CSV:</b> separator przecinek, średnik albo tabulator. Rozpoznawane kolumny: x, y (lokalne albo w układzie), gatunek (klucz, skrót, nazwa polska albo łacińska), wysokość [m], pierśnica [cm] albo obwód [cm], promień albo średnica korony [m], id. Braki szacowane z allometrii gatunku albo z NMPT.</p>'})));
  const lk=LAYERS.map(l=>l.k);
  const col2=h('div',{class:'box'},h('h3',null,'Zapisz dane'),
    h('p',{class:'note'},'Warstwy jako osobne rastry ASC w archiwum ZIP (razem z NMT, NMPT, stosem wokseli okapu, drzewami, szeregiem czasowym, dziennikiem zdarzeń i ustawieniami) albo jako tabele CSV.'),
    h('div',{class:'pgrid',id:'expKeys'},...lk.filter(k=>k!=='dtm').map(k=>h('label',null,LBYK[k].n,h('input',{type:'checkbox',value:k,checked:true,style:'width:auto'})))),
    h('div',{class:'row'},h('button',{class:'btn pri',onclick:()=>exportZip([...document.querySelectorAll('#expKeys input:checked')].map(x=>x.value))},'Warstwy ASC (ZIP)'),
      h('button',{class:'btn',onclick:()=>saveFile(baseName()+'_komorki_'+stamp()+'.csv',csvJoin(cellsRows()))},'Komórki CSV'),
      h('button',{class:'btn',onclick:()=>S&&saveFile(baseName()+'_drzewa_'+stamp()+'.csv',csvJoin(treesRows()))},'Drzewa CSV'),
      h('button',{class:'btn',onclick:()=>S&&saveFile(baseName()+'_szereg_'+stamp()+'.csv',csvJoin(seriesRows()))},'Szereg czasowy CSV'),
      h('button',{class:'btn',onclick:()=>S&&saveFile(baseName()+'_zdarzenia_'+stamp()+'.csv',csvJoin(logRows()))},'Zdarzenia CSV'),
      h('button',{class:'btn',onclick:()=>S&&saveFile(baseName()+'_woksele_'+stamp()+'.csv',csvJoin(voxRows()))},'Woksele CSV'),
      h('button',{class:'btn',onclick:()=>S&&saveFile(baseName()+'_profil_pionowy_'+stamp()+'.csv',csvJoin(profRows()))},'Profil pionowy CSV')),
    h('h4',null,'Ustawienia'),h('p',{class:'note'},'Parametry świata i zmiany parametrów gatunków. JSON zapisuje strukturę, CSV ma wiersze „zakres; klucz; wartość” (zakres: world albo species:klucz_gatunku).'),
    h('div',{class:'row'},h('button',{class:'btn',onclick:()=>saveFile('okap_ustawienia_'+stamp()+'.json',JSON.stringify(settingsObj(),null,1))},'Ustawienia JSON'),
      h('button',{class:'btn',onclick:()=>saveFile('okap_ustawienia_'+stamp()+'.csv',settingsCSV())},'Ustawienia CSV'),
      h('label',{class:'btn'},'Wczytaj ustawienia…',h('input',{type:'file',accept:'.json,.csv,.txt',hidden:true,onchange:async e=>{const f=e.target.files[0];if(!f)return;try{applySettings(parseSettings(await readText(f),f.name));}catch(err){toast('Błąd ustawień: '+err.message,4000);}e.target.value='';}}))),
    h('h4',null,'Teren'),h('div',{class:'kv',id:'terrInfo'}));
  p.append(h('div',{class:'cols'},col1,col2));terrInfo();}
function terrInfo(){const el=$('terrInfo');if(!el||!T)return;const area=T.nx*T.ny*T.res*T.res;el.innerHTML=[['nazwa',T.name],['siatka',T.nx+' × '+T.ny+' po '+T.res+' m'],['powierzchnia',fmt(area/1e4,2)+' ha'],['lewy dolny róg',fmt(T.xll,1)+'; '+fmt(T.yll,1)],['układ',T.crs],['źródło',T.meta.source||'–'],['drzewa startowe',T.trees0.length]].map(([a,b])=>`<span>${esc(a)}</span><span>${esc(b)}</span>`).join('');}
function renderMap(){const el=$('impMap');el.innerHTML='';if(!IMP.csv)return;const keys=[['x','x'],['y','y'],['sp','gatunek'],['h','wysokość'],['dbh','pierśnica'],['circ','obwód'],['r','promień korony'],['cd','średnica korony'],['ca','pow. korony'],['id','id']];
  el.append(h('div',{class:'pgrid'},...keys.map(([k,n])=>{const s=h('select',{onchange:e=>{const v=e.target.value;if(v==='')delete IMP.map[k];else IMP.map[k]=+v;}},h('option',{value:''},'—'),...IMP.csv.head.map((c,i)=>h('option',{value:i,selected:IMP.map[k]===i},c)));return h('label',null,n,s);})));}
function impMsg(m,cls){$('impMsgs').append(h('div',{class:'msg '+(cls||'')},m));}
function fillFrom(arr,src){for(let i=0;i<arr.length;i++)if(isNaN(arr[i]))arr[i]=src[i];return arr;}
async function buildFromImport(){$('impMsgs').innerHTML='';const A=IMP.asc.dtm;if(!A){impMsg('Najpierw wskaż plik NMT (ASC).','err');return;}const res=+$('impRes').value;
  let x0=A.xll,y0=A.yll,x1=A.xll+A.ncols*A.cellsize,y1=A.yll+A.nrows*A.cellsize;const cv_=k=>{const v=parseFloat($('clip_'+k).value);return isFinite(v)?v:null;};
  if(cv_('xmin')!=null)x0=Math.max(x0,cv_('xmin'));if(cv_('ymin')!=null)y0=Math.max(y0,cv_('ymin'));if(cv_('xmax')!=null)x1=Math.min(x1,cv_('xmax'));if(cv_('ymax')!=null)y1=Math.min(y1,cv_('ymax'));
  const nx=Math.floor((x1-x0)/res),ny=Math.floor((y1-y0)/res);if(nx<10||ny<10){impMsg('Obszar po przycięciu jest za mały (mniej niż 10 komórek w którymś kierunku).','err');return;}
  if(nx*ny>400000){impMsg(`Siatka miałaby ${(nx*ny).toLocaleString('pl-PL')} komórek. Granica to 400 000 — wybierz większą komórkę albo przytnij obszar.`,'err');return;}
  if(nx*ny>120000)impMsg(`Duża siatka (${(nx*ny).toLocaleString('pl-PL')} komórek): symulacja będzie wolniejsza, rok może trwać kilka sekund.`,'warn');
  impMsg('Przeliczam warstwy…');await new Promise(r=>setTimeout(r,20));
  try{const Tn=newTerrain(nx,ny,res,x0,y0,(IMP.files.dtm||'teren').replace(/\.[^.]+$/,''));Tn.dtm=fillNaN(resampleTo(Tn,A,'mean'),0);const nanAll=Tn.dtm.every(v=>v===0);if(nanAll)throw new Error('NMT nie pokrywa wybranego obszaru.');
    if(IMP.asc.dsm){Tn.dsm=fillFrom(resampleTo(Tn,IMP.asc.dsm,'mean'),Tn.dtm);for(let i=0;i<Tn.n;i++)if(Tn.dsm[i]<Tn.dtm[i])Tn.dsm[i]=Tn.dtm[i];}
    const cls=(k,max,def)=>{if(!IMP.asc[k])return false;const a=resampleTo(Tn,IMP.asc[k],'class');let bad=0;for(let i=0;i<Tn.n;i++){let v=a[i];if(isNaN(v)||v<0||v>max||v%1){if(!isNaN(v))bad++;v=def;}Tn[k][i]=v;}if(bad)impMsg(`${k}: ${bad} komórek z kodem spoza zakresu 0–${max} zastąpiono wartością domyślną.`,'warn');return true;};
    const hasSurf=cls('surf',SURF_CODES.length-1,1);cls('hab',3,1);cls('traffic',3,0);cls('target',3,1);
    if(IMP.asc.salt){const a=resampleTo(Tn,IMP.asc.salt,'class');for(let i=0;i<Tn.n;i++)Tn.salt[i]=a[i]>0?1:0;}else for(let i=0;i<Tn.n;i++)Tn.salt[i]=Tn.traffic[i]>=2?1:0;
    if(IMP.asc.noise){Tn.noiseImp=resampleTo(Tn,IMP.asc.noise,'mean');}
    let det=null;
    if(IMP.asc.bld){const a=resampleTo(Tn,IMP.asc.bld,'mean');let nb=0;for(let i=0;i<Tn.n;i++){if(a[i]>2){Tn.bld[i]=a[i];Tn.surf[i]=SURF_CODES.indexOf('budynek');Tn.target[i]=0;nb++;}}impMsg(`Budynki z warstwy: ${nb} komórek.`,'ok');}
    const wantB=$('impDetB').checked&&!IMP.asc.bld,wantT=$('impDetT').checked&&!IMP.csv;
    if(Tn.dsm&&(wantB||wantT)){const bkB=Tn.bld.slice(),bkS=Tn.surf.slice(),bkT=Tn.target.slice();det=detectFromDSM(Tn,{});if(!wantB){Tn.bld=bkB;Tn.surf=bkS;Tn.target=bkT;}else impMsg(`Wykryto ${det.buildings} budynków z NMPT.`,'ok');}
    if(!hasSurf){for(let i=0;i<Tn.n;i++){if(Tn.bld[i]>0)Tn.surf[i]=SURF_CODES.indexOf('budynek');else if(Tn.traffic[i]>0)Tn.surf[i]=SURF_CODES.indexOf('jezdnia');}impMsg('Brak warstwy nawierzchni: przyjęto trawnik, jezdnie z warstwy ruchu i budynki.','warn');}
    if(!IMP.asc.traffic&&!IMP.asc.noise)impMsg('Brak warstwy ruchu i hałasu: hałas będzie tłem (bez źródeł drogowych).','warn');
    const defSp=+$('impSp').value;let trees=[];
    if(IMP.csv){if(IMP.map.x==null||IMP.map.y==null){impMsg('Wskaż kolumny x i y w pliku drzew.','err');return;}const r=treesFromCSV(Tn,IMP.csv,IMP.map,P.species,defSp);trees=r.trees;const iss=r.issues;
      impMsg(`Drzewa z CSV: ${trees.length}; poza obszarem: ${iss.outside}; bez rozpoznanego gatunku: ${iss.noSp}; z oszacowanymi wymiarami: ${iss.est}.`,iss.noSp||iss.outside?'warn':'ok');
      const un=Object.entries(iss.unknown).sort((a,b)=>b[1]-a[1]).slice(0,8);if(un.length)impMsg('Nierozpoznane nazwy gatunków (przyjęto domyślny): '+un.map(([k,v])=>k+' ×'+v).join(', '),'warn');}
    else if(det&&$('impDetT').checked){const s=P.species[defSp];trees=det.trees.map(d=>{const D=estimateDBH(s,d.H,d.R);return {k:s.key,sp:defSp,x:d.x,y:d.y,H:Math.min(d.H,s.maxH*1.1),D,R:d.R,age:Math.round(clamp(D*1.2,3,250)),die:0.1,wound:0,dr:0};});impMsg(`Wykryto ${trees.length} drzew z NMPT (gatunek domyślny, pierśnica szacowana).`,'ok');}
    if(trees.length>(P.world.maxTrees||4000)){trees=trees.slice(0,P.world.maxTrees);impMsg('Przycięto listę drzew do limitu '+P.world.maxTrees+'.','warn');}
    Tn.trees0=trees;Tn.meta={source:'import',files:deep(IMP.files)};deriveTerrain(Tn);startTerrain(Tn);impMsg('Teren gotowy: '+Tn.nx+' × '+Tn.ny+' komórek.','ok');}
  catch(err){impMsg('Nie udało się zbudować terenu: '+err.message,'err');console.error(err);}}
