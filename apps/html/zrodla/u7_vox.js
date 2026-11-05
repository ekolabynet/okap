/* SPDX-License-Identifier: MPL-2.0
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.
 * © 2026 Piotr Mędrzycki, Paweł Mędrzycki */
/* ================= widok wokselowy (WebGL2, bloki instancjonowane, ta sama aksonometria co widok 2D) ================= */
const GLV={gl:null,prog:null,ok:null,vao:null,ibuf:null,count:0,dirty:true,loc:{}};
function glInit(){if(GLV.ok!==null)return GLV.ok;const c=$('gl');let gl=null;try{gl=c.getContext('webgl2',{antialias:true});}catch(e){gl=null;}if(!gl){GLV.ok=false;return false;}
  const vs=`#version 300 es
in vec3 a_p;in vec3 a_n;in vec3 i_o;in vec3 i_s;in vec3 i_c;
uniform vec4 u_cam;uniform vec4 u_rot;uniform vec4 u_scr;uniform vec4 u_pd;
out vec3 v_c;
void main(){vec3 w=i_o+a_p*i_s;float dx=w.x-u_cam.x,dy=w.y-u_cam.y;float u=dx*u_rot.x-dy*u_rot.y;float v=dx*u_rot.y+dy*u_rot.x;float zz=(w.z-u_cam.z)*u_cam.w;
float sx=u_scr.x*0.5+u_pd.x+u*u_scr.z;float sy=u_scr.y*0.5+u_pd.y-(v*u_rot.z+zz*u_rot.w)*u_scr.z;float d=v*u_rot.w-zz*u_rot.z;
gl_Position=vec4(sx/u_scr.x*2.0-1.0,1.0-sy/u_scr.y*2.0,clamp((d-u_pd.z)/u_pd.w,-0.999,0.999),1.0);
vec3 L=normalize(vec3(-0.45,0.35,0.82));v_c=i_c*(0.58+0.42*max(dot(a_n,L),0.0))+i_c*0.06*a_n.z;}`;
  const fs=`#version 300 es
precision mediump float;in vec3 v_c;out vec4 o;void main(){o=vec4(v_c,1.0);}`;
  const sh=(t,src)=>{const s=gl.createShader(t);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
  try{const p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,vs));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));GLV.prog=p;}
  catch(e){console.error(e);GLV.ok=false;return false;}
  const P_=gl.getAttribLocation.bind(gl,GLV.prog);const vao=gl.createVertexArray();gl.bindVertexArray(vao);
  // sześcian jednostkowy: 6 ścian × 2 trójkąty, z normalnymi
  const F=[[[1,0,0],[1,0,0,1,1,0,1,1,1,1,0,1]],[[-1,0,0],[0,0,0,0,0,1,0,1,1,0,1,0]],[[0,1,0],[0,1,0,0,1,1,1,1,1,1,1,0]],[[0,-1,0],[0,0,0,1,0,0,1,0,1,0,0,1]],[[0,0,1],[0,0,1,1,0,1,1,1,1,0,1,1]],[[0,0,-1],[0,0,0,0,1,0,1,1,0,1,0,0]]];
  const vtx=[];for(const [n,q] of F){const P4=[0,1,2,3].map(i=>q.slice(i*3,i*3+3));for(const i of [0,1,2,0,2,3])vtx.push(...P4[i],...n);}
  const vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vtx),gl.STATIC_DRAW);
  const ap=P_('a_p'),an=P_('a_n');gl.enableVertexAttribArray(ap);gl.vertexAttribPointer(ap,3,gl.FLOAT,false,24,0);gl.enableVertexAttribArray(an);gl.vertexAttribPointer(an,3,gl.FLOAT,false,24,12);
  GLV.ibuf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,GLV.ibuf);for(const [nm,off] of [['i_o',0],['i_s',12],['i_c',24]]){const l=P_(nm);gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,3,gl.FLOAT,false,36,off);gl.vertexAttribDivisor(l,1);}
  gl.bindVertexArray(null);GLV.vao=vao;GLV.gl=gl;for(const u of ['u_cam','u_rot','u_scr','u_pd'])GLV.loc[u]=gl.getUniformLocation(GLV.prog,u);GLV.ok=true;return true;}
const vhash=(a,b)=>{let x=(a*374761393+b*668265263)|0;x=(x^(x>>>13))*1274126177|0;return ((x^(x>>>16))>>>0)/4294967296;};
// instancje: kolumny terenu (barwa warstwy podłoża), budynki, pnie, woksele liści (tylko widoczne z zewnątrz)
function glBuild(){const X=S&&S.vx;const {nx,ny,res}=T;const out=[];const push=(x,y,z,sx,sy,sz,c)=>{out.push(x,y,z,sx,sy,sz,c[0]/255,c[1]/255,c[2]/255);};
  let zmin=1e9;for(let i=0;i<T.n;i++)if(T.dtm[i]<zmin)zmin=T.dtm[i];const zb=zmin-2;GLV.zb=zb;let B=1;while((nx/B)*(ny/B)>160000)B++;const bt=hex2rgb(CSSV['bld-top']);
  for(let r=0;r<ny;r+=B)for(let c=0;c<nx;c+=B){const i=r*nx+c;const x0=c*res,y0=(ny-Math.min(ny,r+B))*res;const w=Math.min(B,nx-c)*res,hh=Math.min(B,ny-r)*res;const z=T.dtm[i];
    push(x0,y0,zb,w,hh,z-zb,[COLRGB[i*3],COLRGB[i*3+1],COLRGB[i*3+2]]);if(V.comp.bld&&T.bld[i]>0)push(x0,y0,z,w,hh,T.bld[i],bt.map(v=>v*(0.92+0.08*vhash(r,c))));}
  if(S&&V.comp.trees){const si=SEASON_UI();const byId=new Map();const tc=hex2rgb(CSSV.trunk),dc=hex2rgb(CSSV.dead);const acc=hex2rgb(CSSV.accent);
    for(const t of S.trees){if(!t.alive)continue;byId.set(t.id,t);if(t.H<0.8)continue;const w=Math.max(0.22,Math.min(1.2,t.D/100))*(T.res>2?2:1);const zt=t.dead?zTop(t):Math.max(t.z0+0.3,zBot(S,t)+0.5);push(t.x-w/2,t.y-w/2,t.z0,w,w,zt-t.z0,V.sel===t.id?acc:t.dead?dc:tc);}
    const cols=new Map();const colOf=id=>{let c=cols.get(id);if(!c){const t=byId.get(id);c=t?crownColor(t,si):[110,140,90];if(t&&V.sel===t.id)c=mix(c,acc,0.55);cols.set(id,c);}return c;};
    const dz=X.dz;const occ=(i,k)=>{if(i<0)return false;if(X.hi[i]<0||k<X.lo[i]||k>X.hi[i])return false;return X.mu[X.off[i]+k-X.lo[i]]>0;};
    for(let r=0;r<ny;r++)for(let c=0;c<nx;c++){const i=r*nx+c;if(X.hi[i]<0)continue;const g=T.dtm[i];const x0=c*res,y0=(ny-r-1)*res;
      const iE=c<nx-1?i+1:-1,iW=c>0?i-1:-1,iN=r>0?i-nx:-1,iS=r<ny-1?i+nx:-1;
      for(let k=X.lo[i];k<=X.hi[i];k++){const j=X.off[i]+k-X.lo[i];if(X.mu[j]<=0)continue;
        if(si!==3&&occ(i,k+1)&&occ(i,k-1)&&occ(iE,k)&&occ(iW,k)&&occ(iN,k)&&occ(iS,k))continue;
        const h_=vhash(i,k);let col=colOf(X.own[j]);
        if(si===3){if(h_>0.3)continue;const q=res*0.45;push(x0+(res-q)/2,y0+(res-q)/2,g+k*dz+dz*0.25,q,q,dz*0.5,mix(col,[120,105,90],0.7));continue;}
        const f=0.86+0.2*h_;push(x0,y0,g+k*dz,res,res,dz,[col[0]*f,col[1]*f,col[2]*f]);}}}
  const gl=GLV.gl;gl.bindBuffer(gl.ARRAY_BUFFER,GLV.ibuf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(out),gl.DYNAMIC_DRAW);GLV.count=out.length/9;GLV.dirty=false;}
function glRender(){const gl=GLV.gl,c=$('gl');const d=V.dpr;const w=Math.round(V.W*d),hh=Math.round(V.H*d);if(c.width!==w||c.height!==hh){c.width=w;c.height=hh;}
  if(GLV.dirty)glBuild();gl.viewport(0,0,w,hh);const sky=skyColors().map(hex2rgb);const bg=mix(sky[0],sky[1],0.5);gl.clearColor(bg[0]/255,bg[1]/255,bg[2]/255,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.useProgram(GLV.prog);
  const diag=Math.hypot(T.nx*T.res,T.ny*T.res)/2;const zr=Math.max(Math.abs((GLV.zb-V.z0)*V.exag),Math.abs(((S?S.maxZ:V.z0+30)+2-V.z0)*V.exag));const dr=(diag*TR.ce+zr*TR.se)*1.15+2;
  gl.uniform4f(GLV.loc.u_cam,V.cx,V.cy,V.z0,V.exag);gl.uniform4f(GLV.loc.u_rot,TR.ca,TR.sa,TR.se,TR.ce);gl.uniform4f(GLV.loc.u_scr,V.W,V.H,V.k,0);gl.uniform4f(GLV.loc.u_pd,V.px,V.py,0,dr);
  gl.bindVertexArray(GLV.vao);gl.drawArraysInstanced(gl.TRIANGLES,0,36,GLV.count);gl.bindVertexArray(null);}
