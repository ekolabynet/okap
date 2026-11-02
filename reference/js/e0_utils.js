'use strict';
/* ================= Okap Teren · silnik (bez DOM: strona, workery, node) ================= */
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const deep=o=>JSON.parse(JSON.stringify(o));
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function randn(r){let u=0,v=0;while(u===0)u=r();while(v===0)v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
const getK=(o,k)=>k.split('.').reduce((a,b)=>a==null?a:a[b],o);
const setK=(o,k,v)=>{const p=k.split('.');let a=o;for(let i=0;i<p.length-1;i++){if(a[p[i]]==null||typeof a[p[i]]!=='object')a[p[i]]={};a=a[p[i]];}a[p[p.length-1]]=v;};
