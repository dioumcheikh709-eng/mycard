/* Modèle de carte : éléments (types), cadres, polices, raretés, migration des anciennes cartes. */
import { tr } from './i18n.js';

export const lite=h=>{const n=parseInt(h.slice(1),16);return '#'+[16,8,0].map(q=>{const v=(n>>q)&255;return Math.round(v+(255-v)*.55).toString(16).padStart(2,'0')}).join('')};
export const ICON={
G:'<path d="M4.5 19.5C3.5 10 9 4 20 3.5C20.5 14 14.5 20 4.5 19.5Z"/><path d="M5 19L15 9" stroke="rgba(0,0,0,.28)" stroke-width="1.5" stroke-linecap="round" fill="none"/>',
R:'<path d="M12 2C12.6 6.4 17.5 8.6 17.5 14.2A5.5 5.5 0 0 1 6.5 14.2C6.5 11.6 8 9.8 9 8.2C9.4 9.6 10.2 10.4 11 10.6C11.4 8 11.4 5 12 2Z"/>',
W:'<path d="M12 2.5C9.5 6.5 5.5 10.5 5.5 15A6.5 6.5 0 0 0 18.5 15C18.5 10.5 14.5 6.5 12 2.5Z"/>',
L:'<path d="M13.5 2L5 13.5H11L9.8 22L19 9.8H13Z"/>',
P:'<path d="M1.8 12C4.3 7.3 8 5.2 12 5.2S19.7 7.3 22.2 12C19.7 16.7 16 18.8 12 18.8S4.3 16.7 1.8 12Z"/><circle cx="12" cy="12" r="4.6" fill="rgba(110,20,140,.6)"/><circle cx="12" cy="12" r="2.1"/>',
I:'<g stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"><path d="M12 2.5V21.5M3.8 7.2L20.2 16.8M3.8 16.8L20.2 7.2"/><path d="M9.5 4.5L12 7L14.5 4.5M9.5 19.5L12 17L14.5 19.5"/></g>',
F:'<rect x="5.5" y="7.5" width="13" height="12" rx="4"/><rect x="7" y="4" width="3" height="5" rx="1.5"/><rect x="10.5" y="3" width="3" height="5" rx="1.5"/><rect x="14" y="4" width="3" height="5" rx="1.5"/><path d="M9.8 10V13M14.2 10V13" stroke="rgba(0,0,0,.28)" stroke-width="1.2" fill="none" stroke-linecap="round"/>',
X:'<circle cx="8" cy="9" r="3.2"/><circle cx="17" cy="8" r="2.4"/><circle cx="13.5" cy="17" r="3.6"/><path d="M8 9L17 8M8 9L13.5 17M17 8L13.5 17" stroke="currentColor" stroke-width="1.6" fill="none"/>',
O:'<path d="M2 20L9.5 6.5L13 13L15.5 9.5L22 20Z"/>',
Y:'<path d="M3 17.5C8.5 17.5 13.5 14.5 14.5 5.5C17.5 8.5 19.5 11.5 21.5 11.5C19.5 17 14.5 20.5 8.5 20.5C6 20.5 4 19.5 3 17.5Z"/>',
B:'<ellipse cx="12" cy="14.2" rx="5" ry="6.3"/><circle cx="12" cy="6.4" r="3"/><path d="M5 10.5L9.2 12M19 10.5L14.8 12M5 17.5L9.2 16M19 17.5L14.8 16M9.5 4L7.5 2M14.5 4L16.5 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/>',
K:'<path d="M8 4H16L21 11L17.5 20H7.5L3 12Z"/>',
H:'<path d="M12 3A7 7 0 0 0 5 10V21L8 18.5L10 21L12 18.5L14 21L16 18.5L19 21V10A7 7 0 0 0 12 3Z"/><circle cx="9.5" cy="10.2" r="1.5" fill="rgba(0,0,0,.4)"/><circle cx="14.5" cy="10.2" r="1.5" fill="rgba(0,0,0,.4)"/>',
A:'<path d="M3.5 5.5L9 8C11 7 14 7 16 8L20.5 4.5L19.5 11C20.5 14.5 18 18.5 14 19.5L12 22L10 19.5C6 18.5 3.5 14.5 4.8 10Z"/><circle cx="10" cy="11.5" r="1.1" fill="rgba(0,0,0,.4)"/><circle cx="15" cy="11.5" r="1.1" fill="rgba(0,0,0,.4)"/>',
D:'<path d="M16 3A9 9 0 1 0 21 16A7.5 7.5 0 0 1 16 3Z"/>',
S:'<path d="M12 2.5L20.5 7.3V16.7L12 21.5L3.5 16.7V7.3Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>',
Z:'<path d="M12 2C12.7 8.2 15.8 11.3 22 12C15.8 12.7 12.7 15.8 12 22C11.3 15.8 8.2 12.7 2 12C8.2 11.3 11.3 8.2 12 2Z"/>',
N:'<circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" stroke-width="3.2"/>',
C:'<path d="M12 2.8L14.7 9L21.4 9.6L16.3 14L17.9 20.6L12 17.1L6.1 20.6L7.7 14L2.6 9.6L9.3 9Z"/>'};
export const TY={};
[['G','Sève','#4CAF50'],['R','Braise','#FF7043'],['W','Marée','#42A5F5'],['L','Foudre','#FDD835'],['P','Songe','#AB47BC'],['I','Givre','#4DD0E1'],['F','Ardeur','#EF5350'],['X','Venin','#AB47BC'],['O','Argile','#BCAAA4'],['Y','Zéphyr','#90CAF9'],['B','Essaim','#9CCC65'],['K','Granit','#BDBDBD'],['H','Brume','#9575CD'],['A','Mythe','#5C6BC0'],['D','Ombre','#616161'],['S','Alliage','#90A4AE'],['Z','Lueur','#F48FB1'],['N','Brut','#D7CCC8'],['C','Cristal','#C8C8C8']]
 .forEach(([k,n,c])=>TY[k]={n,c,l:lite(c),ink:(k==='L'||k==='C')?'#222':'#fff'});
TY.C.l='#FFFFFF';
export const TFONTS={cinzel:"'Cinzel',Tajawal,Georgia,serif",unbounded:"'Unbounded',Tajawal,system-ui,sans-serif",fraunces:"'Fraunces',Tajawal,Georgia,serif"};
export const TFLOAD={cinzel:'700 20px Cinzel',unbounded:'700 20px Unbounded',fraunces:'700 20px Fraunces'};
export const FRAMES={
  night:{fr:['#4f6bd8','#24315f','#4fd1c5'],fp:'#0b1024',ink:'#f4f1ff',mute:'#9fb0e8',soft:'#d5dbf5',acc:'#c9b6ff',accInk:'#1b1240',box:'rgba(255,255,255,.06)',line:'rgba(255,255,255,.14)',badge:'#f4f1ff',badgeInk:'#141a3a'},
  ivory:{fr:['#f3ead6','#c9b48a','#f8f2e4'],fp:'#fbf7ee',ink:'#2a2418',mute:'#7a6a4c',soft:'#4a4232',acc:'#9a6b1f',accInk:'#fffaf0',box:'rgba(42,36,24,.05)',line:'rgba(42,36,24,.16)',badge:'#2a2418',badgeInk:'#fbf7ee'},
  coral:{fr:['#ff8a7a','#c2405a','#ffc08a'],fp:'#2a0f17',ink:'#ffe9e4',mute:'#f3a99c',soft:'#f6d3cb',acc:'#ff8a7a',accInk:'#2a0f17',box:'rgba(255,255,255,.06)',line:'rgba(255,233,228,.16)',badge:'#ffe9e4',badgeInk:'#2a0f17'},
  jade:{fr:['#6fe0b0','#1d7a62','#b7f5d9'],fp:'#071f19',ink:'#e4fff3',mute:'#8fd8b8',soft:'#c9efdf',acc:'#6fe0b0',accInk:'#04261b',box:'rgba(255,255,255,.06)',line:'rgba(228,255,243,.16)',badge:'#e4fff3',badgeInk:'#071f19'}};
export const RFRAMES={common:{fr:['#c9ced8','#7d8596','#e3e6ec'],fp:'#151820',acc:'#c9ced8'},uncommon:{fr:['#9af0be','#2f9c62','#c8f7da'],fp:'#0b1d14',acc:'#7fe0a8'},
  rare:{fr:['#9ccbff','#2d6fd1','#cfe4ff'],fp:'#0b1630',acc:'#8cc2ff'},epic:{fr:['#e2b8ff','#7b3fd1','#f0dcff'],fp:'#180c2e',acc:'#d3a6ff'},
  legendary:{fr:['#fff2b0','#b9810f','#ffe17a'],fp:'#140f05',acc:'#ffd35a',ink:'#fff5dc',mute:'#e3c27a',soft:'#f1e2c0',line:'rgba(255,225,122,.22)'}};

/* forme et police choisies dans les Paramètres */
export const LOOK={shape:'cut',font:'cinzel'};
try{const s=JSON.parse(localStorage.getItem('mycard-look')||'{}');if(['cut','arch'].includes(s.shape))LOOK.shape=s.shape;if(TFONTS[s.font])LOOK.font=s.font}catch(e){}
export function setLook(k,v){LOOK[k]=v;document.documentElement.dataset.shape=LOOK.shape;try{localStorage.setItem('mycard-look',JSON.stringify(LOOK))}catch(e){}}
export const lookSig=()=>LOOK.shape+'.'+LOOK.font;

export const RARITIES=[{k:'common',w:60,c:'#9aa4b5'},{k:'uncommon',w:25,c:'#4fd08a'},{k:'rare',w:10,c:'#4aa3ff'},{k:'epic',w:4,c:'#b06bff'},{k:'legendary',w:1,c:'#ffc233'}];
export const rarOf=k=>RARITIES.find(r=>r.k===k)||RARITIES[0];
export const rarName=k=>tr('rarity.'+rarOf(k).k);
export const rarIdx=k=>Math.max(0,RARITIES.findIndex(r=>r.k===k));
export const rarKey=c=>{const k=c&&(c.rar||c.rarity);return RFRAMES[k]?k:null};
export function frameOf(c){const k=rarKey(c);if(!k)return FRAMES[c&&c.frame]||FRAMES.night;const r=RFRAMES[k];return {...FRAMES.night,mute:'#b9c0d6',soft:'#dde2ef',...r,badge:r.acc,badgeInk:'#14110a'}}
export const cssLin=f=>`linear-gradient(160deg,${f.fr[0]},${f.fr[1]} 50%,${f.fr[2]})`;
export function lookVars(c){const f=frameOf(c);return {'--cfr':cssLin(f),'--cfp':f.fp,'--cink':f.ink,'--cmute':f.mute,'--csoft':f.soft,'--cacc':f.acc,'--caccink':f.accInk,'--cbox':f.box,'--cline':f.line,'--cbadge':f.badge,'--cbadgeink':f.badgeInk,'--tf':TFONTS[LOOK.font]}}

/* anciens textes du modèle de carte → nouveaux textes (cartes déjà enregistrées) */
const OLD_TXT={evo:{'Evolves from MyCard':'Série Origine'},special:{'SPECIAL CARD':''},abn:{'Dark Signal':'Signal obscur'},
  abt:{"When you play this Pokémon from your hand to evolve 1 of your Pokémon during your turn, you may switch 1 of your opponent's Benched Pokémon with their Active Pokémon.":'Quand cette carte arrive, échange la place de deux cartes de ton choix.'},
  mvn:{'Max Darkness':'Nuit totale'},rt:{'MyCard rule':'Note du créateur'},rx:{'When your MyCard is Knocked Out, your opponent takes 3 Prize cards.':'Une carte créée avec MyCard.'},num:{'215/203':'0001'}};
export function modernize(c){
  if(!c||typeof c!=='object'||c.m2)return c;c.m2=1;const o=(t,v)=>Object.prototype.hasOwnProperty.call(OLD_TXT[t],v)?OLD_TXT[t][v]:v;
  if(c.evo!=null)c.evo=o('evo',c.evo);if(c.special!=null)c.special=o('special',c.special);
  if(c.ab){c.ab.n=o('abn',c.ab.n);c.ab.t=o('abt',c.ab.t)}
  if(Array.isArray(c.mv))c.mv.forEach(m=>{m.n=o('mvn',m.n)});
  if(c.rule){c.rule.t=o('rt',c.rule.t);c.rule.x=o('rx',c.rule.x)}
  if(c.num!=null)c.num=o('num',String(c.num));if(c.ill==='Keiichiro Ito')c.ill='';
  return c;
}

export const svgOf=(k,sz)=>`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'${sz?` width='${sz}' height='${sz}'`:''} fill='currentColor' color='${(TY[k]||TY.C).ink}'>${ICON[k]||ICON.C}</svg>`;
export const typeName=k=>tr('type.'+(TY[k]?k:'C'));

/* anciens identifiants d'effets (avant la réécriture) → nouveaux effets */
const FX_OLD={regular:'prism',cosmos:'nebula',sitereverse:'mosaic',vfull:'aurora',rainbow:'opal',shinyv:'glitter',amazing:'ripple',vmax:'gold'};
export const fxOf=v=>FX_OLD[v]||v||'classic';
export const FX_LIST=['classic','reverse','prism','nebula','mosaic','aurora','opal','glitter','ripple','metal','gold'];

export const CARDS=[
 {id:'c3',name:'MyCard',hp:310,type:'D',evo:'Série Origine',special:'',
  ab:{on:true,n:'Signal obscur',t:"Quand cette carte arrive, échange la place de deux cartes de ton choix."},
  mv:[{c:'DCC',n:'Nuit totale',d:'160',t:''}],
  weak:['G','×2'],res:null,ret:2,ill:'',num:'0001',
  pal:{'--a1':'#0f6b5a','--a2':'#1f4f9a','--a3':'#150f3a','--a4':'#ffe95a','--glow':'#4ee0b0','--moonx':'32%','--tx':'14%'}}
];
CARDS.forEach(c=>c.rule={t:'Note du créateur',x:'Une carte créée avec MyCard.'});
CARDS.forEach(c=>c.rule={t:'Note du créateur',x:'Une carte créée avec MyCard.'});
export const PALS=[{'--a1':'#0f6b5a','--a2':'#1f4f9a','--a3':'#150f3a','--a4':'#ffe95a','--glow':'#4ee0b0','--moonx':'32%','--tx':'14%'},
 {'--a1':'#6fb6ff','--a2':'#f0c9e8','--a3':'#a45a86','--a4':'#ff6fa8','--glow':'#ff9ad0','--moonx':'76%','--tx':'22%'},
 {'--a1':'#3c2a78','--a2':'#8a4fb0','--a3':'#e0407a','--a4':'#ffc24a','--glow':'#c36bff','--moonx':'64%','--tx':'12%'}];
export const TEMPLATE=JSON.parse(JSON.stringify(CARDS[0]));TEMPLATE.fx='classic';TEMPLATE.k=1;
export const newId=()=>'c'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);

/* les textes de pouvoir et d'attaque sont stockés en HTML échappé avec des <br> : on les relit en texte brut */
export const plain=h=>String(h==null?'':h).replace(/<br\s*\/?>/gi,'\n').replace(/<[^>]*>/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&');
export const esc=x=>String(x).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
export const toStored=v=>esc(v).replace(/\n/g,'<br>');   /* format d'enregistrement d'origine (compatibilité) */
export const clone=o=>JSON.parse(JSON.stringify(o));
