/* Concours, bibliothèque universelle et modérateur.
   Tout ce qui est partagé passe par `cloud`. Ici c'est une version locale (démo) : rien n'est envoyé ni partagé.
   Pour un vrai concours en ligne, remplacer `cloud` par un client serveur (mêmes méthodes). */
import { tr } from './i18n.js';
import { RARITIES, modernize, clone } from './cards.js';
import { lsSet, media } from './store.js';

export const demoOff=()=>{try{return +localStorage.getItem('mycard-demo-off')||0}catch(e){return 0}};
export const nowD=()=>new Date(Date.now()+demoOff()*6048e5);                     /* « maintenant », décalé de semaines en démo */
export const weekId=()=>{const d=nowD(),t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())),day=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-day);
  const y=t.getUTCFullYear();return y+'-W'+String(Math.ceil(((t-Date.UTC(y,0,1))/864e5+1)/7)).padStart(2,'0')};
export const weekEnd=()=>{const d=nowD(),e=new Date(d.getFullYear(),d.getMonth(),d.getDate());e.setDate(e.getDate()+(8-(e.getDay()||7)));return e};   /* prochain lundi 00:00 */
export const fmtLeft=ms=>{const m=Math.max(0,Math.floor(ms/6e4)),d=Math.floor(m/1440),h=Math.floor(m%1440/60);return d?`${d} ${tr('time.d')} ${h} ${tr('time.h')}`:`${h} ${tr('time.h')} ${m%60} ${tr('time.m')}`};

/* Mode modérateur : identifiant + code. Seule l'empreinte (PBKDF2) est dans le code. Protection légère, côté navigateur. */
export const MOD_SALT='dd9e081f7bc3776603c8f5faadf4c6ab',MOD_HASH='e21a3e70d4100e3da15949d13875acbd35827edac31f74df596f6a82e8171604',MOD_ITER=210000;
export const isMod=()=>{try{return localStorage.getItem('mycard-mod')===MOD_HASH}catch(e){return false}};
export async function modHash(user,code){
  const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(user+'\n'+code),'PBKDF2',false,['deriveBits']);
  const b=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:new Uint8Array(MOD_SALT.match(/../g).map(x=>parseInt(x,16))),iterations:MOD_ITER},k,256);
  return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
export const cloud=(()=>{
  const rd=(k,d)=>{try{const v=JSON.parse(localStorage.getItem('mycard-cloud:'+k));return v==null?d:v}catch(e){return d}};
  const wr=(k,v)=>lsSet('mycard-cloud:'+k,JSON.stringify(v));
  return {
    async allEntries(){return rd('entries',{})},
    async entries(wk){return rd('entries',{})[wk]||[]},
    async submit(wk,e){const a=rd('entries',{});a[wk]=(a[wk]||[]).filter(x=>x.uk!==e.uk).concat(e);wr('entries',a)},
    async withdraw(wk,u){const a=rd('entries',{}),v=rd('votes',{}),gone=(a[wk]||[]).filter(x=>x.uk===u);
      a[wk]=(a[wk]||[]).filter(x=>x.uk!==u);for(const k in (v[wk]||{}))if(gone.some(g=>g.id===v[wk][k]))delete v[wk][k];wr('entries',a);wr('votes',v);return gone},
    async votes(wk){return rd('votes',{})[wk]||{}},
    async vote(wk,voter,id){const a=rd('entries',{}),v=rd('votes',{}),e=(a[wk]||[]).find(x=>x.id===id);
      if(!e||e.uk===voter)return false;v[wk]=v[wk]||{};if(v[wk][voter]===id)delete v[wk][voter];else v[wk][voter]=id;wr('votes',v);return true},
    async results(){return rd('results',{})},
    async setResult(wk,r){const a=rd('results',{});a[wk]=r;wr('results',a)},
    async extras(){return rd('extras',[])},
    async addExtra(c){const a=rd('extras',[]).filter(x=>x.id!==c.id);a.push(c);wr('extras',a)},
    async clear(){const ks=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith('mycard-cloud:'))ks.push(k)}ks.forEach(k=>localStorage.removeItem(k))}
  };
})();

const UNIVERSAL=Array.isArray(window.UNIVERSAL_CARDS)?window.UNIVERSAL_CARDS:[];
export const catalog=async()=>[...UNIVERSAL,...await cloud.extras()].map(c=>modernize(clone(c))).map(c=>({...c,rarity:RARITIES.some(r=>r.k===c.rarity)?c.rarity:'common'}));
export const catImg=async c=>c.img||(c.hasImg?await media.get('ext:'+c.id):null);

/* une semaine terminée désigne son n°1 (côté serveur dans la vraie version) */
export async function settleWeeks(){
  const cur=weekId(),all=await cloud.allEntries(),res=await cloud.results();
  for(const wk of Object.keys(all)){
    if(wk>=cur||res[wk])continue;
    const cnt={};Object.values(await cloud.votes(wk)).forEach(id=>cnt[id]=(cnt[id]||0)+1);
    const w=[...all[wk]].sort((a,b)=>(cnt[b.id]||0)-(cnt[a.id]||0)||a.t-b.t)[0];
    await cloud.setResult(wk,w&&cnt[w.id]?{entryId:w.id,votes:cnt[w.id],status:'pending'}:{status:'none'});
  }
}

/* Touch ID / Face ID (WebAuthn) pour le modérateur : la signature est vérifiée ici, avec la clé publique gardée sur l'appareil. */
export const BIO_KEY='mycard-mod-bio';
const b64u=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const unb64u=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
export const bioGet=()=>{try{return JSON.parse(localStorage.getItem(BIO_KEY))}catch(e){return null}};
export async function bioSupported(){try{return !!(window.PublicKeyCredential&&navigator.credentials&&await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())}catch(e){return false}}
export async function bioEnroll(){
  const cred=await navigator.credentials.create({publicKey:{rp:{name:'MyCard'},user:{id:crypto.getRandomValues(new Uint8Array(16)),name:'moderateur',displayName:'Modérateur'},
    challenge:crypto.getRandomValues(new Uint8Array(32)),pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],
    authenticatorSelection:{authenticatorAttachment:'platform',userVerification:'required',residentKey:'discouraged'},timeout:60000,attestation:'none'}});
  const r=cred.response;if(!r.getPublicKey)throw new Error('no-pk');
  localStorage.setItem(BIO_KEY,JSON.stringify({id:b64u(cred.rawId),pk:b64u(r.getPublicKey()),alg:r.getPublicKeyAlgorithm?r.getPublicKeyAlgorithm():-7}));
}
function derToRaw(d){                                    /* signature ECDSA DER → r||s (64 octets) pour WebCrypto */
  let i=2;const part=()=>{const l=d[i+1];let x=d.slice(i+2,i+2+l);i+=2+l;while(x.length>32&&x[0]===0)x=x.slice(1);const o=new Uint8Array(32);o.set(x,32-x.length);return o};
  const r=part(),s=part(),o=new Uint8Array(64);o.set(r);o.set(s,32);return o;
}
export async function bioVerify(){
  const s=bioGet();if(!s)return false;
  const ch=crypto.getRandomValues(new Uint8Array(32));
  const a=await navigator.credentials.get({publicKey:{challenge:ch,allowCredentials:[{type:'public-key',id:unb64u(s.id)}],userVerification:'required',timeout:60000}});
  const r=a.response,cd=JSON.parse(new TextDecoder().decode(r.clientDataJSON));
  if(cd.type!=='webauthn.get'||cd.challenge!==b64u(ch)||cd.origin!==location.origin)return false;
  const ad=new Uint8Array(r.authenticatorData);if(!(ad[32]&4))return false;          /* l'utilisateur a bien été vérifié (empreinte / visage) */
  const hash=new Uint8Array(await crypto.subtle.digest('SHA-256',r.clientDataJSON)),data=new Uint8Array(ad.length+32);data.set(ad);data.set(hash,ad.length);
  const es=s.alg===-7;
  const key=await crypto.subtle.importKey('spki',unb64u(s.pk),es?{name:'ECDSA',namedCurve:'P-256'}:{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  return crypto.subtle.verify(es?{name:'ECDSA',hash:'SHA-256'}:{name:'RSASSA-PKCS1-v1_5'},key,es?derToRaw(new Uint8Array(r.signature)):r.signature,data);
}
