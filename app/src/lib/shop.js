/* Boutique : boosters à acheter, Card Coins, tirage des cartes et « chance » du booster. */
import { RARITIES, rarOf, rarIdx } from './cards.js';
export const PACK_SIZE=5,RN=RARITIES.length-1;
export const SHOP=[{k:'normal',price:100},{k:'uncommon',price:180,min:'uncommon'},{k:'rare',price:450,min:'rare'},{k:'epic',price:1500,min:'epic'}];   /* pas de booster légendaire à vendre */
/* Card Coins achetables avec de l'argent réel : sur le modèle des gemmes de Brawl Stars (plus le paquet est gros, plus le bonus offert est grand).
   Les prix sont en euros. En mode démo `payments.buy` ne débite personne : le vrai paiement (Stripe, App Store, Google Play) viendra avec le serveur. */
export const COIN_PACKS=[{id:'cc1',coins:100,bonus:0,eur:.99},{id:'cc2',coins:300,bonus:30,eur:2.99},{id:'cc3',coins:500,bonus:100,eur:4.99,tag:'popular'},
  {id:'cc4',coins:1000,bonus:300,eur:9.99},{id:'cc5',coins:2000,bonus:800,eur:19.99},{id:'cc6',coins:5000,bonus:2500,eur:49.99,tag:'best'}];
export const packTotal=p=>p.coins+p.bonus;

/* à remplacer : doit renvoyer true seulement quand le paiement est confirmé, et créditer le solde côté serveur */
export const payments={async buy(pack){return true}};
function rollRarity(keys){                         /* tirage pondéré parmi les raretés qui ont au moins une carte */
  const pool=RARITIES.filter(r=>keys.includes(r.k));let x=Math.random()*pool.reduce((a,r)=>a+r.w,0);
  for(const r of pool)if((x-=r.w)<0)return r.k;
  return pool[pool.length-1].k;
}
export function rollPack(cat,min){                           /* min : rareté plancher d'un booster de la boutique (jamais de légendaire) */
  const by={};cat.forEach(c=>(by[c.rarity]=by[c.rarity]||[]).push(c));
  const keys=Object.keys(by),out=[],used=new Set();let legend=false,allowed=null;
  if(min){const mi=rarIdx(min);allowed=keys.filter(k=>k!=='legendary'&&rarIdx(k)>=mi);
    if(!allowed.length){const nl=keys.filter(k=>k!=='legendary').sort((a,b)=>rarIdx(b)-rarIdx(a));allowed=nl.length?[nl[0]]:keys}}   /* pas assez de cartes à cette rareté : la meilleure disponible */
  for(let i=0;i<PACK_SIZE;i++){
    let ks=allowed||(legend?keys.filter(k=>k!=='legendary'):keys);if(!ks.length)ks=keys;     /* une légendaire déjà tirée : plus d'autre dans ce booster */
    const rk=rollRarity(ks);if(rk==='legendary')legend=true;
    let pool=by[rk].filter(c=>!used.has(c.id));if(!pool.length)pool=by[rk];       /* pas deux fois la même carte si possible */
    const c=pool[Math.floor(Math.random()*pool.length)];used.add(c.id);out.push(c);
  }
  return out.map(c=>[c,Math.random()]).sort((a,b)=>rarIdx(a[0].rarity)-rarIdx(b[0].rarity)||a[1]-b[1]).map(x=>x[0]);   /* du moins rare au plus rare */
}
/* chance du booster (0 → 1) : surtout sa meilleure carte, un peu le total ; la couleur glisse du gris vers le doré légendaire */
export function packLuck(cards){
  const tot=RARITIES.reduce((a,r)=>a+r.w,0),bits=k=>Math.log2(tot/rarOf(k).w),best=Math.max(...cards.map(c=>rarIdx(c.rarity)));
  const lo=PACK_SIZE*bits(RARITIES[0].k),hi=bits(RARITIES[RN].k)+(PACK_SIZE-1)*bits(RARITIES[Math.max(0,RN-1)].k);
  const norm=Math.min(1,Math.max(0,(cards.reduce((a,c)=>a+bits(c.rarity),0)-lo)/(hi-lo||1))),floor=.04+.96*best/(RN||1);
  return Math.min(1,floor+(1-floor)*.5*norm);
}
export const hex2rgb=x=>[1,3,5].map(i=>parseInt(x.slice(i,i+2),16));
export function luckRGB(l){const st=RARITIES.map(r=>hex2rgb(r.c)),p=Math.min(RN,Math.max(0,l*RN)),i=Math.min(RN-1,Math.floor(p)),f=p-i;return st[i].map((v,q)=>Math.round(v+(st[i+1][q]-v)*f))}
export const flashOf=i=>.08+.72*Math.pow(i/(RN||1),1.6);

/* Thèmes de l'appli : noir et blanc (classiques) sont gratuits, les autres s'achètent avec des Card Coins. */
export const THEME_SHOP=[{k:'black',price:0},{k:'white',price:0},{k:'blue',price:250},{k:'red',price:250},{k:'violet',price:350},{k:'green',price:350},{k:'rainbow',price:600}];
export const themePrice=k=>(THEME_SHOP.find(t=>t.k===k)||{price:0}).price;

/* MyCard+ : abonnement mensuel. 9 boosters gratuits par jour, tous les thèmes, −15 % sur les Card Coins.
   En mode démo, `payments.subscribe` ne débite personne : le vrai abonnement passera par l'App Store et Google Play. */
export const MEMBER={eur:4.99,days:30,discount:.15};
export const packEur=(p,member)=>member?Math.round(p.eur*(1-MEMBER.discount)*100)/100:p.eur;
payments.subscribe=async()=>true;
