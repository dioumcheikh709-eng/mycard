/* Dessin d'une carte sur un canvas : export PNG, images du GIF et miniatures. Même mise en page que la carte à l'écran. */
import { tr } from './i18n.js';
import { TY, TFONTS, TFLOAD, LOOK, frameOf, rarKey, rarName, typeName, svgOf, fxOf, plain, lookSig } from './cards.js';
import { session } from './store.js';
import { lang } from './i18n.js';

const FC="'Barlow Condensed','Arial Narrow',Impact,sans-serif",FB="Barlow,Arial,sans-serif";
const rr=(c,X,Y,w,h,r)=>{c.beginPath();c.moveTo(X+r,Y);c.arcTo(X+w,Y,X+w,Y+h,r);c.arcTo(X+w,Y+h,X,Y+h,r);c.arcTo(X,Y+h,X,Y,r);c.arcTo(X,Y,X+w,Y,r);c.closePath()};
const rich=h=>plain(h);
function wrap(c,str,maxW){
  const out=[];
  rich(str).split('\n').forEach(par=>{let line='';par.split(/\s+/).filter(Boolean).forEach(w=>{const t=line?line+' '+w:w;if(c.measureText(t).width>maxW&&line){out.push(line);line=w}else line=t});out.push(line)});
  return out.filter((l,i)=>l||i===0);
}
const ICO={};let icoP=null;
function loadIcons(){return icoP||(icoP=Promise.all(Object.keys(TY).map(k=>new Promise(ok=>{const im=new Image();im.onload=()=>{ICO[k]=im;ok()};im.onerror=()=>ok();im.src='data:image/svg+xml,'+encodeURIComponent(svgOf(k,96))}))))}
export async function drawCard(c0,op){
  op=op||{};const c=c0,W=op.W||840,H=Math.round(W*5/3),u=W/100,v=H/100,S=op.state||{mx:55,my:30,rx:0,ry:0,o:.7},k=op.k!=null?op.k:(c.k!=null?c.k:1),fxm=fxOf(op.fx||c.fx),o=S.o,mx=S.mx,my=S.my;
  await Promise.all(['700 20px "Barlow Condensed"','500 20px Barlow','400 20px Barlow','600 20px Barlow','700 20px Barlow',TFLOAD[LOOK.font]].map(f=>document.fonts.load(f).catch(()=>0)));
  await loadIcons();
  const cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');
  const fnt=(w,sz,fam,it)=>x.font=`${it?'italic ':''}${w} ${sz*u}px ${fam}`;
  const fit=(str,w,sz,fam,it,maxW)=>{let z=sz;fnt(w,z,fam,it);while(z>1.6&&x.measureText(str).width>maxW){z-=.2;fnt(w,z,fam,it)}};
  const ico=(cx,cy,r,ty)=>{x.save();const tp=TY[ty]||TY.C,g=x.createRadialGradient(cx-r*.3,cy-r*.4,0,cx,cy,r);g.addColorStop(0,tp.l);g.addColorStop(1,tp.c);
    x.fillStyle=g;x.beginPath();x.arc(cx,cy,r,0,7);x.fill();x.strokeStyle='rgba(255,255,255,.55)';x.lineWidth=.4*u;x.stroke();
    const im=ICO[ty]||ICO.C;if(im)x.drawImage(im,cx-r*.64,cy-r*.64,r*1.28,r*1.28);x.restore()};
  /* carte : cadre, panneau, fenêtre d'illustration — même géométrie que le CSS */
  const F=frameOf(c),shape=LOOK.shape,hv=H/100;
  const shapePath=(X,Y,w,hh,kind)=>{x.beginPath();
    if(shape==='cut'){const cx=w*{card:.08,pan:.075,art:.05}[kind],cy=hh*{card:.048,pan:.044,art:.06}[kind];
      [[X+cx,Y],[X+w-cx,Y],[X+w,Y+cy],[X+w,Y+hh-cy],[X+w-cx,Y+hh],[X+cx,Y+hh],[X,Y+hh-cy],[X,Y+cy]].forEach(([px,py],i)=>i?x.lineTo(px,py):x.moveTo(px,py))}
    else{const r=w/2,br=w*{card:.065,pan:.05,art:.03}[kind];x.moveTo(X,Y+r);x.arc(X+r,Y+r,r,Math.PI,0,false);x.lineTo(X+w,Y+hh-br);x.arcTo(X+w,Y+hh,X+w-br,Y+hh,br);x.lineTo(X+br,Y+hh);x.arcTo(X,Y+hh,X,Y+hh-br,br)}
    x.closePath()};
  shapePath(0,0,W,H,'card');x.clip();
  {const an=160*Math.PI/180,dx=Math.sin(an),dy=-Math.cos(an),L=Math.abs(W*dx)+Math.abs(H*dy),g=x.createLinearGradient(W/2-dx*L/2,H/2-dy*L/2,W/2+dx*L/2,H/2+dy*L/2);
    g.addColorStop(0,F.fr[0]);g.addColorStop(.5,F.fr[1]);g.addColorStop(1,F.fr[2]);x.fillStyle=g;x.fillRect(0,0,W,H)}
  shapePath(3*u,1.8*hv,W-6*u,H-3.6*hv,'pan');x.fillStyle=F.fp;x.fill();
  /* illustration */
  const ax=6.7*u,ay=(shape==='arch'?3.6:4)*hv,aw=W-13.4*u,ah=(shape==='arch'?47.6:49)*hv;
  x.save();shapePath(ax,ay,aw,ah,'art');x.clip();
  if(c.img){
    const im=await new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=c.img});
    const sc=Math.max(aw/im.width,ah/im.height)*(c.zoom||1),dw=im.width*sc,dh=im.height*sc;
    x.fillStyle='#000';x.fillRect(ax,ay,aw,ah);
    x.drawImage(im,ax+(aw-dw)/2+(c.px||0)/100*aw,ay+(ah-dh)/2+(c.py||0)/100*ah,dw,dh);
  }else{
    const P=c.pal,g=x.createLinearGradient(0,ay,0,ay+ah);g.addColorStop(0,P['--a1']);g.addColorStop(.55,P['--a2']);g.addColorStop(1,P['--a3']);
    x.fillStyle=g;x.fillRect(ax,ay,aw,ah);
    const mxp=ax+aw*parseFloat(P['--moonx'])/100,myp=ay+ah*.17,mg=x.createRadialGradient(mxp,myp,0,mxp,myp,aw*.2);
    mg.addColorStop(0,'#fff');mg.addColorStop(.45,'#fff');mg.addColorStop(.55,'#ffffffaa');mg.addColorStop(1,'#fff0');x.fillStyle=mg;x.fillRect(ax,ay,aw,ah);
    x.fillStyle='#fff';for(let i=0;i<40;i++){x.globalAlpha=.8;x.beginPath();x.arc(ax+((Math.sin(i*91.7)*1e4)%1+1)%1*aw,ay+((Math.sin(i*37.3)*1e4)%1+1)%1*ah*.6,1+i%2,0,7);x.fill()}
    x.globalAlpha=1;x.fillStyle='#0b0a18';x.shadowColor=P['--a4'];x.shadowBlur=14;
    const tx=ax+aw*parseFloat(P['--tx'])/100,tw=aw*.15,th=ah*.44,tb=ay+ah*.72;
    x.beginPath();x.moveTo(tx+tw/2,tb-th);x.lineTo(tx+tw,tb);x.lineTo(tx,tb);x.fill();
    x.strokeStyle=P['--a4'];x.lineWidth=2*u/3;x.beginPath();x.ellipse(ax+aw*.65,ay+ah*.52,aw*.23,ah*.17,0,0,7);x.fill();x.stroke();x.shadowBlur=0;
  }
  x.restore();
  const reverseFx=()=>{
    const mk=()=>{const q=document.createElement('canvas');q.width=W;q.height=H;return q};
    const T0=Math.round(W*.235),tile=document.createElement('canvas');tile.width=tile.height=T0;
    const t=tile.getContext('2d');t.scale(T0/80,T0/80);t.strokeStyle='rgba(255,255,255,.35)';t.lineWidth=1.2;t.beginPath();t.moveTo(0,0);t.lineTo(80,80);t.moveTo(80,0);t.lineTo(0,80);t.stroke();
    t.fillStyle='#fff';[[40,40],[0,0],[80,0],[0,80],[80,80]].forEach(([sx,sy])=>{t.beginPath();for(let i=0;i<10;i++){const r=i%2?3.44:9,a=-Math.PI/2+i*Math.PI/5;t.lineTo(sx+r*Math.cos(a),sy+r*Math.sin(a))}t.closePath();t.fill()});
    const reg=mk(),r=reg.getContext('2d');r.fillStyle='#000';r.fillRect(0,0,W,4*v);r.fillRect(0,0,6.7*u,H);r.fillRect(W-6.7*u,0,6.7*u,H);r.fillRect(0,H*.525,W,H*.475);
    const layer=(paint,alpha)=>{const q=mk(),g=q.getContext('2d');paint(g);
      g.globalCompositeOperation='destination-in';g.fillStyle=g.createPattern(tile,'repeat');g.fillRect(0,0,W,H);g.drawImage(reg,0,0);
      x.save();x.globalCompositeOperation='screen';x.globalAlpha=Math.min(1,alpha);x.drawImage(q,0,0);x.restore()};
    layer(g=>{const L=W*.7,an=115*Math.PI/180,dx=Math.sin(an),dy=-Math.cos(an),cx=W/2+(mx/100-.5)*W*.9,cy=H/2+(my/100-.5)*W*.4;
      const gr=g.createLinearGradient(cx-dx*L*1.5,cy-dy*L*1.5,cx+dx*L*1.5,cy+dy*L*1.5);
      ['#ff0080','#ff8c00','#ffe600','#00ff9d','#00c8ff','#7a5cff','#ff0080'].forEach((col,i,a)=>{for(let q=0;q<3;q++)gr.addColorStop((q*6+i)/18,col)});
      g.fillStyle=gr;g.fillRect(0,0,W,H)},(.35+o*.55)*k);
    layer(g=>{const sp=g.createRadialGradient(mx/100*W,my/100*H,0,mx/100*W,my/100*H,Math.hypot(W,H)*.3);sp.addColorStop(0,'#fff');sp.addColorStop(.4,'#ffffff88');sp.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=sp;g.fillRect(0,0,W,H)},(.1+o*.7)*k);
  };
  /* holo */
  if(fxm==='reverse')reverseFx();else{
  const ev=(arr)=>arr.map((c0,i)=>[c0,i/(arr.length-1)]);
  /* même esprit que les calques de l'écran, en une image fixe */
  const rep=(a,n)=>[].concat(...Array(n).fill(a));
  const CFG={classic:{mode:'band',blend:'color-dodge',an:115,sz:2.6,st:[['#ff6b6b',0],['#ffd86b',.18],['#6bffa8',.36],['#6bd6ff',.54],['#8f7bff',.72],['#ff6bd6',.9],['#ff6b6b',1]],sheen:1,glit:1,al:.5,gn:900},
    prism:{mode:'band',blend:'color-dodge',an:100,sz:5,st:ev(rep(['#ff5f6d','#ffc371','#47ffb2','#3ec9ff','#a46bff'],6).concat('#ff5f6d')),sheen:1,lines:1,al:.55,gn:0},
    nebula:{mode:'clouds',blend:'screen',glit:2,al:.8,gn:700},
    mosaic:{mode:'tiles',blend:'overlay',al:.9,gn:0},
    aurora:{mode:'aurora',blend:'screen',al:.8,gn:0},
    opal:{mode:'opal',blend:'screen',al:.7,gn:260,glit:3},
    glitter:{mode:'band',blend:'screen',an:120,sz:2.5,st:[['rgba(200,210,255,0)',0],['rgba(222,226,255,.35)',.5],['rgba(255,255,255,0)',1]],sheen:0,glit:3,al:.9,gn:2600},
    ripple:{mode:'rings',blend:'color-dodge',al:.5,gn:0},
    gold:{mode:'band',blend:'hard-light',an:115,sz:2.6,st:[['#5b3a07',0],['#c8961e',.18],['#fff1a8',.32],['#b07a12',.46],['#ffe27a',.6],['#7a5208',.76],['#f4cf5b',.9],['#5b3a07',1]],sheen:1,brush:1,al:.95,gn:0},
    metal:{mode:'band',blend:'overlay',an:115,sz:2.6,st:[['#4a4d55',0],['#e6e9f0',.15],['#7b808b',.3],['#fafbfd',.45],['#5a5f6b',.6],['#d5d9e2',.75],['#868b97',.9],['#4a4d55',1]],sheen:1,brush:1,al:.9,gn:0}};
  const C=CFG[fxm]||CFG.classic,PX=mx/100*W,PY=my/100*H,DIAG=Math.hypot(W,H);
  const an=(C.an||115)*Math.PI/180,dx=Math.sin(an),dy=-Math.cos(an),hq=document.createElement('canvas');hq.width=W;hq.height=H;
  const h=hq.getContext('2d'),Lc=W*Math.abs(dx)+H*Math.abs(dy),sx=W/2-dx*Lc/2,sy=H/2-dy*Lc/2,tt=mx/100,pt=t=>[sx+dx*Lc*t,sy+dy*Lc*t];
  const blob=(cx,cy,rx,ry,col)=>{h.save();h.translate(cx,cy);h.scale(1,ry/rx);const g=h.createRadialGradient(0,0,0,0,0,rx);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');h.fillStyle=g;h.fillRect(-rx,-rx,rx*2,rx*2);h.restore()};
  if(C.mode==='band'){
    const bw=C.sz*W,bh=C.sz*H,ccx=-(C.sz-1)*W*mx/100+bw/2,ccy=-(C.sz-1)*H*my/100+bh/2,Lg=bw*Math.abs(dx)+bh*Math.abs(dy);
    const hg=h.createLinearGradient(ccx-dx*Lg/2,ccy-dy*Lg/2,ccx+dx*Lg/2,ccy+dy*Lg/2);C.st.forEach(([c0,p0])=>hg.addColorStop(p0,c0));
    h.fillStyle=hg;h.fillRect(0,0,W,H);
    if(C.lines){h.save();h.globalCompositeOperation='destination-out';h.globalAlpha=.55;h.lineWidth=.3*u;h.translate(W/2,H/2);h.rotate(12*Math.PI/180);
      for(let y=-DIAG;y<DIAG;y+=1.05*u){h.beginPath();h.moveTo(-DIAG,y);h.lineTo(DIAG,y);h.stroke()}h.restore()}
    if(C.brush){h.save();for(let y=0;y<H;y+=.45*u){h.fillStyle=(y/(.45*u))%2<1?'rgba(255,255,255,.1)':'rgba(0,0,0,.1)';h.fillRect(0,y,W,.22*u)}h.restore()}
    if(C.sheen){const p1=pt(tt-.16),p2=pt(tt+.16),sg=h.createLinearGradient(p1[0],p1[1],p2[0],p2[1]);sg.addColorStop(0,'rgba(255,255,255,0)');sg.addColorStop(.5,'#fff');sg.addColorStop(1,'rgba(255,255,255,0)');
      h.globalCompositeOperation='soft-light';h.globalAlpha=.9;h.fillStyle=sg;h.fillRect(0,0,W,H);h.globalCompositeOperation='source-over';h.globalAlpha=1}
  }else if(C.mode==='clouds'){
    const ox=(mx/100-.5)*W*.12,oy=(my/100-.5)*H*.12;
    [[.24,.3,.38,.28,'hsla(285,90%,62%,.6)'],[.76,.58,.44,.34,'hsla(195,95%,56%,.55)'],[.4,.84,.34,.26,'hsla(330,90%,62%,.5)'],[.86,.16,.28,.22,'hsla(42,95%,62%,.4)']]
      .forEach(([bx,by,rx,ry,col])=>blob(bx*W+ox,by*H+oy,rx*W,ry*H,col));
  }else if(C.mode==='tiles'){
    const T=6*u;for(let r=0;r*T<H;r++)for(let q=0;q*T<W;q++){const cx=q*T+T/2,cy=r*T+T/2,near=Math.max(.35,1-Math.hypot(cx-PX,cy-PY)/(W*.7));
      h.fillStyle=`hsla(${(q*37+r*53+mx*3+my*1.4)%360},90%,66%,${near.toFixed(2)})`;h.fillRect(q*T+.28*u,r*T+.28*u,T-.28*u,T-.28*u)}
  }else if(C.mode==='aurora'){
    const g=h.createLinearGradient(0,0,W,0),cols=['hsla(150,100%,62%,0)','hsla(150,100%,62%,.7)','hsla(175,100%,60%,0)','hsla(275,100%,70%,.55)','hsla(300,100%,70%,0)'];
    const off=mx/100;for(let i=0;i<=20;i++)g.addColorStop(i/20,cols[(i+Math.round(off*10))%cols.length]);
    h.save();h.setTransform(1,0,Math.tan((mx/100-.5)*-18*Math.PI/180),1,0,0);h.fillStyle=g;h.fillRect(-W,0,W*3,H);h.restore();
    h.globalCompositeOperation='destination-in';const m=h.createLinearGradient(0,0,0,H);m.addColorStop(.02,'rgba(0,0,0,0)');m.addColorStop(.22,'#000');m.addColorStop(.55,'rgba(0,0,0,.6)');m.addColorStop(.85,'rgba(0,0,0,0)');
    h.fillStyle=m;h.fillRect(0,0,W,H);h.globalCompositeOperation='source-over';
  }else if(C.mode==='opal'){
    const sh=mx*1.6-my*.9;[[.18,.22,330],[.62,.18,190],[.82,.48,140],[.35,.58,260],[.7,.82,45],[.15,.85,170]].forEach(([bx,by,hu])=>blob(bx*W,by*H,.23*W,.19*H,`hsla(${(hu+sh+360)%360},90%,78%,.55)`));
    const sg=h.createLinearGradient(0,0,W,H);sg.addColorStop(.22,'rgba(255,255,255,0)');sg.addColorStop(.5,'rgba(255,255,255,.4)');sg.addColorStop(.78,'rgba(255,255,255,0)');h.fillStyle=sg;h.fillRect(0,0,W,H);
  }else if(C.mode==='rings'){
    const st=1.6*u,R=Math.hypot(Math.max(PX,W-PX),Math.max(PY,H-PY));h.lineWidth=st;
    for(let r=st/2,i=0;r<R;r+=st,i++){h.strokeStyle=`hsla(${(i*60)%360},95%,64%,${Math.max(.1,1-r/(W*.75)).toFixed(2)})`;h.beginPath();h.arc(PX,PY,r,0,7);h.stroke()}
    blob(PX,PY,W*.16,W*.16,'rgba(255,255,255,.6)');
  }
  x.save();x.globalCompositeOperation=C.blend;x.globalAlpha=Math.min(1,(.3+o*.5)*k*C.al);x.drawImage(hq,0,0);
  x.fillStyle='#fff';
  for(let i=0;i<C.gn;i++){
    const px=((Math.sin(i*12.9898)*43758.5453)%1+1)%1*W,py=((Math.sin(i*78.233)*12345.678)%1+1)%1*H,t=((px-sx)*dx+(py-sy)*dy)/Lc,
      near=C.glit===2?.7:C.glit===3?Math.max(0,1-Math.hypot(px-PX,py-PY)/(W*.45)):Math.max(0,1-Math.abs(t-tt)/.22);
    if(near<=0)continue;x.globalAlpha=Math.min(1,o*.9*k*near);x.beginPath();x.arc(px,py,.8+(i%3)*.6,0,7);x.fill();
  }
  x.restore();}
  /* textes : même mise en page que l'écran (u = 1 % de la largeur, comme cqw) */
  const TFc=TFONTS[LOOK.font],FBc='Barlow,Tajawal,Arial,sans-serif';
  x.shadowColor='transparent';x.shadowBlur=0;x.shadowOffsetY=0;
  const T=(str,X,Y,col,al)=>{x.fillStyle=col;x.textAlign=al||'left';x.fillText(str,X,Y)};
  const font=(w,sz,fam,it)=>x.font=`${it?'italic ':''}${w} ${sz*u}px ${fam}`;
  const ell=(str,maxW)=>{str=String(str==null?'':str);if(x.measureText(str).width<=maxW)return str;while(str.length&&x.measureText(str+'…').width>maxW)str=str.slice(0,-1);return str+'…'};
  const lines=(str,maxW,n)=>{if(!str)return [];const a=wrap(x,str,maxW);if(a.length<=n)return a;const b=a.slice(0,n);b[n-1]=ell(b[n-1]+' …',maxW);return b};
  /* pastille d'élément */
  {const en=typeName(c.type),cx0=(shape==='arch'?10:9.5)*u,cy0=(shape==='arch'?43.5:6.4)*hv;font(700,3.6,FBc);
    const cw=1.4*u+5*u+1.4*u+x.measureText(en).width+3*u+.6*u,ch=7.4*u;
    x.fillStyle='rgba(11,16,36,.72)';rr(x,cx0,cy0,cw,ch,ch/2);x.fill();x.strokeStyle='rgba(255,255,255,.3)';x.lineWidth=.3*u;x.stroke();
    ico(cx0+1.7*u+2.5*u,cy0+ch/2,2.5*u,c.type);x.textBaseline='middle';font(700,3.6,FBc);T(en,cx0+1.7*u+5*u+1.4*u,cy0+ch/2,'#fff')}
  /* vitalité */
  {const arch=shape==='arch',vw=(arch?19:20)*u,vh=(arch?19:17.6)*u,vx=arch?W/2-vw/2:W-9.5*u-vw,vy=arch?51.2*hv-vh/2:40.8*hv;
    if(arch){x.beginPath();x.arc(W/2,51.2*hv,vw/2+.8*u,0,7);x.fillStyle=F.fp;x.fill();x.beginPath();x.arc(W/2,51.2*hv,vw/2,0,7)}
    else{x.beginPath();[[.25,0],[.75,0],[1,.5],[.75,1],[.25,1],[0,.5]].forEach(([px,py],i)=>i?x.lineTo(vx+px*vw,vy+py*vh):x.moveTo(vx+px*vw,vy+py*vh));x.closePath()}
    x.fillStyle=F.badge;x.fill();x.textBaseline='alphabetic';
    font(700,2.7,FBc);T(tr('card.vit'),vx+vw/2,vy+vh/2-1.1*u,F.badgeInk,'center');font(700,6.2,TFc);T(String(c.hp),vx+vw/2,vy+vh/2+5*u,F.badgeInk,'center')}
  /* bloc du bas */
  const LX=7.5*u,LW=W-15*u,cen=shape==='arch',X0=cen?W/2:LX,AL=cen?'center':'left',bottom=H-3.2*hv;
  let y=(cen?58.6:55)*hv;
  const lowTop=y,limit=bottom-3.4*u-1.6*u-.8*u;x.save();x.beginPath();x.rect(0,lowTop,W,limit-lowTop);x.clip();   /* comme à l'écran : rien ne déborde sur le pied */
  {const rk=rarKey(c),tg=[];if(rk)tg.push([rarName(rk),1]);if(c.special)tg.push([c.special,0]);
    if(tg.length){font(700,2.8,FBc);const ws=tg.map(t=>x.measureText(String(t[0]).toUpperCase()).width+4.6*u),tw=ws.reduce((a,b)=>a+b,0)+1.4*u*(tg.length-1);let tx=cen?W/2-tw/2:LX;
      tg.forEach((t,i)=>{rr(x,tx,y,ws[i],4.4*u,u);if(t[1]){x.fillStyle=F.acc;x.fill()}else{x.strokeStyle=F.line;x.lineWidth=.3*u;x.stroke()}
        x.textBaseline='middle';T(String(t[0]).toUpperCase(),tx+2.3*u,y+2.2*u,t[1]?'#14110a':F.ink);tx+=ws[i]+1.4*u});
      y+=4.4*u+1.8*u}}
  x.textBaseline='alphabetic';font(700,8,TFc);T(ell(c.name,LW),X0,y+6.6*u,F.ink,AL);y+=8.4*u;
  {const ser=[c.evo,c.num?'№ '+c.num:''].filter(Boolean).join(' · ');if(ser){y+=.6*u;font(600,3.2,FBc);T(ell(ser.toUpperCase(),LW),X0,y+3*u,F.mute,AL);y+=3.84*u}}
  y+=1.8*u;
  if(c.ab.on){
    font(400,3.4,FBc);const ls=lines(c.ab.t,LW-5.8*u,4),bh=2*u+4.6*u+(ls.length?.9*u+ls.length*4.6*u:0)+2*u;
    x.fillStyle=F.box;rr(x,LX,y,LW,bh,2*u);x.fill();x.strokeStyle=F.line;x.lineWidth=.3*u;x.stroke();
    font(700,2.9,FBc);const pt=tr('card.power'),pw=x.measureText(pt).width+4*u;font(700,4.6,TFc);const nm=ell(c.ab.n,LW-pw-8*u),nw=x.measureText(nm).width;
    const hx=cen?W/2-(pw+2.2*u+nw)/2:LX+2.6*u,hy=y+2*u+2.3*u;
    x.fillStyle=F.acc;rr(x,hx,hy-2.15*u,pw,4.3*u,u);x.fill();x.textBaseline='middle';font(700,2.9,FBc);T(pt,hx+2*u,hy,F.accInk);font(700,4.6,TFc);T(nm,hx+pw+2.2*u,hy,F.ink);
    x.textBaseline='alphabetic';font(400,3.4,FBc);ls.forEach((l,i)=>T(l,cen?W/2:LX+2.6*u,y+2*u+4.6*u+.9*u+i*4.6*u+3.5*u,F.soft,AL));
    y+=bh+1.8*u;
  }
  c.mv.forEach(m=>{
    const hy=y+3.2*u,cs=[...(m.c||'')];
    cs.forEach((t,i)=>{const d=2.8*u;x.save();x.translate(LX+1.4*u+i*4*u,hy);x.rotate(Math.PI/4);x.fillStyle=(TY[t]||TY.C).c;x.fillRect(-d/2,-d/2,d,d);x.restore()});
    const nx=LX+(cs.length?cs.length*2.8*u+(cs.length-1)*1.2*u+2.6*u:0);let rx=W-LX;x.textBaseline='middle';
    if(m.d){font(700,6.4,TFc);const dw=x.measureText(m.d).width;T(m.d,rx,hy,F.ink,'right');font(700,2.9,FBc);const fl=tr('card.force');T(fl,rx-dw-2.6*u,hy,F.mute,'right');rx-=dw+2.6*u+x.measureText(fl).width+2.6*u}
    font(700,4.8,TFc);T(ell(m.n,rx-nx),nx,hy,F.ink);y+=6.4*u;
    if(m.t){font(400,3.3,FBc);const ls=lines(m.t,LW,3);x.textBaseline='alphabetic';ls.forEach((l,i)=>T(l,LX,y+.6*u+i*4.45*u+3.4*u,F.soft));y+=.6*u+ls.length*4.45*u}
    y+=1.8*u;
  });
  if(c.rule&&(c.rule.t||c.rule.x)){
    x.textBaseline='alphabetic';if(c.rule.t){font(700,2.9,FBc);T(ell(c.rule.t,LW),X0,y+3*u,F.ink,AL);y+=3.9*u}
    font(400,2.9,FBc,1);lines(c.rule.x,LW,3).forEach(l=>{T(l,X0,y+3*u,F.soft,AL);y+=3.9*u});
  }
  x.restore();
  {const fy=bottom-3.4*u;x.strokeStyle=F.line;x.lineWidth=.3*u;x.beginPath();x.moveTo(LX,fy-1.6*u);x.lineTo(W-LX,fy-1.6*u);x.stroke();
    font(400,2.8,FBc);x.textBaseline='top';T(ell(tr('card.weak',{e:typeName(c.weak[0])+' '+(c.weak[1]||'')}),LW*.55),LX,fy,F.mute);T(ell(tr('card.illus',{n:c.ill||session.user}),LW*.42),W-LX,fy,F.mute,'right')}
  /* reflet */
  x.save();x.shadowColor='transparent';x.globalCompositeOperation='overlay';
  const gx=mx/100*W,gy2=my/100*H,gr=Math.hypot(Math.max(gx,W-gx),Math.max(gy2,H-gy2)),gg=x.createRadialGradient(gx,gy2,0,gx,gy2,gr);
  gg.addColorStop(0,'#fff');gg.addColorStop(.25,'#ffffff55');gg.addColorStop(.6,'#fff0');
  x.globalAlpha=Math.min(1,(.25+o*.5)*k);x.fillStyle=gg;x.fillRect(0,0,W,H);x.restore();
  return cv;
}

/* miniatures (bibliothèque, boosters, concours) : assez de pixels pour un écran 2× ou 3× */
export const THUMB_W=Math.round(Math.min(760,Math.max(480,240*(window.devicePixelRatio||1))));
export const thumbSig=()=>lookSig()+'@'+THUMB_W+'.'+lang;
const THUMB_STATE={mx:55,my:30,rx:0,ry:0,o:.7};
const thumbMem=new Map();let thumbQ=Promise.resolve();
/* une miniature à la fois (le dessin d'une carte est coûteux), avec mémoire */
export function thumbUrl(key,c,img){
  key=thumbSig()+'|'+key;
  if(thumbMem.has(key))return Promise.resolve(thumbMem.get(key));
  const p=thumbQ.then(async()=>{const cv=await drawCard({...c,img:img||undefined},{W:THUMB_W,fx:c.fx||'classic',k:c.k!=null?c.k:1,state:THUMB_STATE});
    const u=cv.toDataURL('image/webp',.9);thumbMem.set(key,u);return u}).catch(()=>'');
  thumbQ=p;return p;
}
export const clearThumbMem=()=>thumbMem.clear();
