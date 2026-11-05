/* SPDX-License-Identifier: MPL-2.0
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.
 * © 2026 Piotr Mędrzycki, Paweł Mędrzycki */
/* ================= nawierzchnie dodatkowe, kody rastrów ================= */
SURF.jezdnia={name:'jezdnia',seal:1,mow:0,mulch:0,seed:false,compW:0,compN:0,irrig:0,dig:0,weed:0,nect:0,bioV:0,rbh:0,light:0,tall:0,inoc:{ecm:0,am:0,b:0}};
SURF.budynek={name:'budynek',seal:1,mow:0,mulch:0,seed:false,compW:0,compN:0,irrig:0,dig:0,weed:0,nect:0,bioV:0,rbh:0,light:0,tall:0,inoc:{ecm:0,am:0,b:0}};
// kody klas w plikach ASC (warstwa nawierzchni i runa oraz siedliska)
const SURF_CODES=['chodnik','trawnik','laka','rabata','klomb','sciolka','zadrzewienie','grad','leg','ekoton','jezdnia','budynek'];
const HAB_CODES=['zw','zs','uw','us'];
const SOILV={chodnik:0.15,jezdnia:0.03,budynek:0,klomb:0.8,rabata:0.9};   // m³ gleby dostępnej dla korzeni na m² (pozostałe: 1)
const soilvOf=k=>SOILV[k]!=null?SOILV[k]:1;

/* ================= parametry świata ================= */
const WORLD_DEFAULT={
  startYear:2016, eps:0.45, woodCost:14, maintWood:0.08, maintLeaf:0.05, crownGrow:2, crownRatio:0.5,
  gameStrength:1, mechanoStrength:1, qRef:2, kw:0.00008, cb:106, kA:0.036,
  saltDie:0.08, saltOsm:0.35, saltKeep:0.6, saltDecay:6, noxTox:0.3, nfMax:0.25, nRoot:0.6, nFrost:0.03, trafficET:0.25,
  facadeET:0.3, heatDie:0.15, droughtDie:0.25, rakeLoss:0.15, mulchBonus:0.08, slopeDry:0.15, twiWet:0.25,
  mowP:0.15, infK:0.25, decayK:0.012,
  inspect:3, removeMargin:0.7, pruneReduce:1, pruneClear:1, pruneSanitary:1, replant:1, seedRain:0.3, estab:0.08, maxTrees:4000,
  spont:1, suckers:1, closureMin:0.8, closureProt:0.5, minTarget:1, mowKill:0.9, weed:0, basalClean:1,
  h_insp:0.25, h_san:2, h_red:5, h_clr:3, h_rem:6, h_plant:3, h_care:1, h_weed:0.2, h_basal:0.3, h_reseed:0.5,
  uncert:1, genVar:1, cFR:0.012, frTurn:0.35, flush:0.25, herbComp:1, runoRbh:1, trample:0.015, nurseryPath:0.15, irrRoot:1, irrBeds:1, hitK:1, crownPlast:1, shedL:0.15, maxAsym:1.5, zR:15, noReplant:['aalt','rpse','asac'], replantSp:['tcor','aneg'],
  // hałas drogowy i zanieczyszczenie z hałasu
  noiseBg:40, noiseLw1:78, noiseLw2:84, noiseLw3:90, noiseBarrier:15, noiseVeg:0.08, noiseVegMax:5, noiseGround:3, no2Lo:45, no2Hi:75, noiseEvery:5,
  // wiatr: siły kart i róża wiatrów (udziały silnych wiatrów z kierunków)
  windBase:{wind:1.3,storm:2,gale:2.6},
  windRose:{N:0.05,NE:0.05,E:0.1,SE:0.1,S:0.1,SW:0.2,W:0.25,NW:0.15},
  deck:{spring:{calm:55,wind:8,frost:12,drought:8,works:7,wet:10},summer:{calm:44,wind:8,storm:9,drought:14,heat:12,pests:8,wet:5},
        autumn:{calm:50,wind:14,gale:4,wet:18,works:6},winter:{calm:45,winter:18,gale:5,thaw:18,snow:10}}
};
Object.assign(UNC_W,{crownPlast:['ln',0.4],shedL:['lg',20],maxAsym:['ln',0.15],noiseVeg:['ln',0.4],noiseBarrier:['ln',0.2],noiseGround:['ln',0.4],slopeDry:['ln',0.4],twiWet:['ln',0.4],saltDecay:['ln',0.3]});
const logit=p=>Math.log(p/(1-p)),sigm=x=>1/(1+Math.exp(-x));
function applyDist(v,z,spec,scale){if(!scale||!z||typeof v!=='number'||!spec)return v;const d=spec[0],p=spec[1];
  if(d==='ln'){if(v<=0)return v;return v*Math.exp(z*scale*Math.sqrt(Math.log(1+p*p)));}
  if(d==='lg'){if(v<=0||v>=1)return v;const m=clamp(v,0.005,0.995);const sd=Math.sqrt(m*(1-m)/(p+1));return sigm(logit(m)+z*scale*sd/(m*(1-m)));}
  if(d==='n')return v+z*scale*p;return v;}
function applyAlloc(a,zs,kappa,scale){const o={h:a.h,d:a.d,c:a.c,r:a.r};if(!scale||!zs)return o;const sl=Math.sqrt(Math.log(1+1/kappa));const s0=a.h+a.d+a.c+a.r;let sum=0;
  ['h','d','c','r'].forEach((k,i)=>{o[k]=a[k]*Math.exp(zs[i]*scale*sl);sum+=o[k];});['h','d','c','r'].forEach(k=>{o[k]*=s0/(sum||1);});return o;}
function drawZ(rng,keys){const z={};for(const k of keys)z[k]=k==='alloc'?[randn(rng),randn(rng),randn(rng),randn(rng)]:randn(rng);return z;}
const spIdxIn=(list,k)=>list.findIndex(s=>s.key===k);
// dopasowanie gatunku z pliku: klucz, skrót, nazwa łacińska (rodzaj + gatunek) albo polska
function matchSpecies(list,txt){if(txt==null)return -1;const t=String(txt).trim().toLowerCase();if(!t)return -1;
  let i=list.findIndex(s=>s.key===t||String(s.abbr||'').toLowerCase()===t);if(i>=0)return i;
  i=list.findIndex(s=>s.name.toLowerCase()===t||String(s.latin).toLowerCase().startsWith(t)||t.startsWith(String(s.latin).toLowerCase().split(' (')[0]));if(i>=0)return i;
  const w=t.split(/\s+/);i=list.findIndex(s=>{const l=String(s.latin).toLowerCase().split(/\s+/);return l[0]===w[0]&&(w.length<2||l[1]===w[1]);});if(i>=0)return i;
  i=list.findIndex(s=>String(s.latin).toLowerCase().split(/\s+/)[0]===w[0]||s.name.toLowerCase().split(/\s+/)[0]===w[0]);return i;}
