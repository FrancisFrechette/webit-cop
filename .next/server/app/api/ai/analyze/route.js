"use strict";(()=>{var e={};e.id=6233,e.ids=[6233],e.modules={72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},92048:e=>{e.exports=require("fs")},32615:e=>{e.exports=require("http")},35240:e=>{e.exports=require("https")},55315:e=>{e.exports=require("path")},68621:e=>{e.exports=require("punycode")},76162:e=>{e.exports=require("stream")},17360:e=>{e.exports=require("url")},21764:e=>{e.exports=require("util")},6162:e=>{e.exports=require("worker_threads")},71568:e=>{e.exports=require("zlib")},3263:e=>{e.exports=import("firebase-admin/app")},79637:e=>{e.exports=import("firebase-admin/auth")},72929:e=>{e.exports=import("firebase-admin/firestore")},87561:e=>{e.exports=require("node:fs")},84492:e=>{e.exports=require("node:stream")},72477:e=>{e.exports=require("node:stream/web")},1586:(e,t,r)=>{r.a(e,async(e,n)=>{try{r.r(t),r.d(t,{originalPathname:()=>m,patchFetch:()=>l,requestAsyncStorage:()=>p,routeModule:()=>u,serverHooks:()=>x,staticGenerationAsyncStorage:()=>d});var a=r(49303),o=r(88716),i=r(60670),s=r(34226),c=e([s]);s=(c.then?(await c)():c)[0];let u=new a.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/api/ai/analyze/route",pathname:"/api/ai/analyze",filename:"route",bundlePath:"app/api/ai/analyze/route"},resolvedPagePath:"C:\\Projets - Developpement\\cursor-webit-cop\\app\\api\\ai\\analyze\\route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:p,staticGenerationAsyncStorage:d,serverHooks:x}=u,m="/api/ai/analyze/route";function l(){return(0,i.patchFetch)({serverHooks:x,staticGenerationAsyncStorage:d})}n()}catch(e){n(e)}})},34226:(e,t,r)=>{r.a(e,async(e,n)=>{try{r.r(t),r.d(t,{POST:()=>u});var a=r(90455),o=r(18027),i=r(26729),s=r(55717),c=r(87070),l=e([a]);async function u(e){let t;try{await (0,a.mk)()}catch{return c.NextResponse.json({error:"Non autoris\xe9"},{status:401})}try{t=await e.json()}catch{return c.NextResponse.json({error:"Body JSON invalide"},{status:400})}if(!t.blocks||!Array.isArray(t.blocks)||0===t.blocks.length)return c.NextResponse.json({error:"blocks doit \xeatre un tableau non vide"},{status:400});let r=(0,i.u)(t);try{let e;let t=(await o.w.messages.create({model:"claude-3-5-sonnet-20241022",max_tokens:512,messages:[{role:"user",content:r}]})).content.map(e=>"text"in e?e.text:"").join("\n").trim();try{e=JSON.parse(t)}catch{e={geoScore:60,suggestions:["Impossible de parser la r\xe9ponse IA, veuillez r\xe9essayer."]}}return"number"==typeof e.geoScore&&Array.isArray(e.suggestions)||(e={geoScore:60,suggestions:["R\xe9ponse IA invalide, utilisez ce r\xe9sultat avec prudence."]}),c.NextResponse.json(e)}catch(e){return e instanceof s.Hx?console.error("Claude API error",e.status,e.message):console.error("Unexpected AI error",e),c.NextResponse.json({geoScore:50,suggestions:["Impossible de contacter le moteur IA pour le moment.","Ajoutez une FAQ cibl\xe9e sur les questions locales fr\xe9quentes.","Mentionnez explicitement la ville / r\xe9gion dans le Hero et les titres."]},{status:200})}}a=(l.then?(await l)():l)[0],n()}catch(e){n(e)}})},26729:(e,t,r)=>{function n(e){let{blocks:t,url:r,locale:n}=e,a=t.map((e,t)=>{switch(e.type){case"hero":return`Bloc #${t+1} (Hero): titre="${e.title}", sous-titre="${e.subtitle??""}"`;case"richText":return`Bloc #${t+1} (Texte riche): extrait="${e.html.slice(0,200)}"`;case"faq":return`Bloc #${t+1} (FAQ): ${e.items.length} questions (ex: "${e.items[0]?.question??""}")`;case"cta":return`Bloc #${t+1} (CTA): label="${e.label}", url="${e.url}"`;default:return`Bloc #${t+1} (type inconnu)`}}).join("\n");return`
Tu es un expert SEO/GEO francophone sp\xe9cialis\xe9 en contenus multi-localis\xe9s.

Contexte:
- URL cible: ${r??"URL non sp\xe9cifi\xe9e"}
- Langue de la page: ${n??"fr"}

Le contenu de la page est structur\xe9 en blocs de type Hero, Texte riche, FAQ et CTA.
Voici un r\xe9sum\xe9 des blocs:

${a}

T\xe2che:
1) \xc9value la "citabilit\xe9 GEO" de cette page sur 100:
   - 0 = tr\xe8s peu utile ou tr\xe8s g\xe9n\xe9rique pour un contexte local (ville, r\xe9gion, secteur).
   - 100 = extr\xeamement sp\xe9cifique, utile et cit\xe9e potentiellement par des sites/entit\xe9s li\xe9s au territoire cibl\xe9.
2) Propose entre 3 et 5 suggestions concr\xe8tes pour am\xe9liorer:
   - la pr\xe9cision g\xe9ographique,
   - la pertinence locale (r\xe9f\xe9rences \xe0 la ville, aux quartiers, aux cas d'usage locaux),
   - la capacit\xe9 de la page \xe0 \xeatre reprise/cit\xe9e par des acteurs locaux (m\xe9dias, partenaires, institutions).

Format de r\xe9ponse STRICT (JSON, une seule ligne) :
{
  "geoScore": nombre entre 0 et 100,
  "suggestions": ["phrase 1", "phrase 2", "phrase 3", ...]
}

Ne rajoute aucun autre texte en dehors de ce JSON.
`}function a(e){let{types:t,businessContext:r,geoContext:n,goal:a,tone:o,locale:i="fr"}=e,s=t.join(", ")||"hero, richText, faq, cta";return`
Tu es un expert UX/SEO francophone sp\xe9cialis\xe9 en landing pages orient\xe9es conversion.

Langue de sortie: ${i}
Types de blocs \xe0 g\xe9n\xe9rer: ${s}

Contexte m\xe9tier: ${r??"Non sp\xe9cifi\xe9"}
Contexte g\xe9ographique: ${n??"Non sp\xe9cifi\xe9"}
Objectif de la page: ${a??"Non sp\xe9cifi\xe9"}
Tonalit\xe9 souhait\xe9e: ${o??"professionnel et accessible"}

T\xe2che:
G\xe9n\xe8re un ensemble de blocs de contenu pr\xeats \xe0 \xeatre int\xe9gr\xe9s dans mon \xe9diteur de blocs.
Respecte strictement les structures TypeScript suivantes (conceptuellement):

- HeroBlock: { id: string; type: 'hero'; title: string; subtitle?: string; backgroundImageUrl?: string; }
- RichTextBlock: { id: string; type: 'richText'; html: string; }
- FAQBlock: { id: string; type: 'faq'; items: { question: string; answer: string }[]; }
- CtaBlock: { id: string; type: 'cta'; label: string; url: string; }

R\xe8gles:
- Tous les ids peuvent \xeatre des cha\xeenes al\xe9atoires (ex: "hero-1"), le runtime remplacera par de vrais UUID.
- Le contenu doit \xeatre r\xe9aliste, adapt\xe9 au contexte m\xe9tier et g\xe9ographique, et orient\xe9 conversion.
- Si 'faq' est demand\xe9, propose au moins 3 questions/r\xe9ponses pertinentes.
- Si 'hero' est demand\xe9, produire un titre fort, un sous-titre clair et \xe9ventuellement une image de fond symbolique (URL g\xe9n\xe9rique).
- Si 'cta' est demand\xe9, produire un libell\xe9 orient\xe9 action et une URL relative (ex: "/contact" ou "/devis").

Format de r\xe9ponse STRICT (JSON, une seule ligne) :
{
  "blocks": [
    { ...ContentBlock },
    { ...ContentBlock },
    ...
  ]
}

Ne rajoute aucun autre texte en dehors de ce JSON.
`}r.d(t,{u:()=>n,w:()=>a})},90455:(e,t,r)=>{r.a(e,async(e,n)=>{try{r.d(t,{$9:()=>s,Ql:()=>c,mk:()=>i});var a=r(39097),o=e([a]);let i=(a=(o.then?(await o)():o)[0]).mk,s=a.$9,c=a.Ql;n()}catch(e){n(e)}})},25371:(e,t,r)=>{r.d(t,{Fs:()=>i,fi:()=>o});let n=["org.manage_members","content.create_page","content.edit_page","content.publish_page","content.rollback_page","content.create_article","content.edit_article","content.publish_article","content.rollback_article","content.comment","content.manage_editorial_status","content.manage_translations","content.reindex_search","content.view_calendar","content.view_all"],a={owner:[...n],admin:[...n],editor:["content.create_page","content.edit_page","content.publish_page","content.rollback_page","content.create_article","content.edit_article","content.publish_article","content.rollback_article","content.comment","content.manage_editorial_status","content.manage_translations","content.view_calendar","content.view_all"],author:["content.create_page","content.edit_page","content.create_article","content.edit_article","content.comment","content.view_calendar","content.view_all"],viewer:["content.comment","content.view_calendar","content.view_all"]};function o(e){return a[e]??[]}function i(e,t){return e.includes(t)}},39097:(e,t,r)=>{r.a(e,async(e,n)=>{try{r.d(t,{$9:()=>p,Ql:()=>d,mk:()=>u});var a=r(71615),o=r(52099),i=r(7331),s=r(25371),c=e([o,i]);async function l(){let e=(0,a.cookies)(),t=(0,a.headers)(),r=t.get("authorization")??t.get("Authorization"),n=r?.startsWith("Bearer ")?r.slice(7):void 0,i=e.get("session")?.value??e.get("__session")?.value,s=n??i;if(!s)throw Error("Utilisateur non authentifi\xe9.");let c=await o.C.verifyIdToken(s),l=c.name??c.email??null;return{uid:c.uid,orgId:c.orgId,role:c.role,email:c.email,displayName:l}}async function u(){let{uid:e,orgId:t,role:r,displayName:n}=await l();if(!t||!r)throw Error("Custom Claims Firebase manquants (orgId / role) sur le token.");return{uid:e,orgId:t,role:r,displayName:n}}async function p(e){let t;let{uid:r,orgId:n,email:a,displayName:o}=await l();if(!n)throw Error("Custom Claims Firebase : orgId manquant sur le token.");let c=await (0,i.Xu)(n);if(!c)throw Error("Organisation non trouv\xe9e.");let u=c.members??[],p=u.find(e=>e.userId===r||a&&e.userEmail.toLowerCase()===a.toLowerCase());if(p)t=p.role;else if(0===u.length)t="owner";else throw Error("Forbidden: vous n'\xeates pas membre de cette organisation.");let d=(0,s.fi)(t);return{userId:r,userEmail:a??null,userDisplayName:o??null,orgId:n,orgRole:t,permissions:d}}function d(e,t){if(!(0,s.Fs)(e.permissions,t))throw Error(`Forbidden: missing permission ${t}`)}[o,i]=c.then?(await c)():c,n()}catch(e){n(e)}})},18027:(e,t,r)=>{r.d(t,{w:()=>o});var n=r(55717);let a=process.env.ANTHROPIC_API_KEY;a||console.warn("Missing ANTHROPIC_API_KEY env var – Claude d\xe9sactiv\xe9 en environnement courant.");let o=null!=a&&""!==a?new n.ZP({apiKey:a}):{messages:{create(){throw Error("Claude est d\xe9sactiv\xe9 : ANTHROPIC_API_KEY manquant.")}}}},52099:(e,t,r)=>{r.a(e,async(e,n)=>{try{r.d(t,{C:()=>p,i:()=>d});var a=r(3263),o=r(79637),i=r(72929),s=e([a,o,i]);[a,o,i]=s.then?(await s)():s;let c=(0,a.getApps)(),l=!!process.env.FIREBASE_PROJECT_ID&&!!process.env.FIREBASE_CLIENT_EMAIL&&!!process.env.FIREBASE_PRIVATE_KEY;l||console.warn("Firebase Admin initialis\xe9 en mode limit\xe9 : variables FIREBASE_* manquantes dans l'environnement.");let u=c[0]??(l?(0,a.initializeApp)({credential:(0,a.cert)({projectId:process.env.FIREBASE_PROJECT_ID,clientEmail:process.env.FIREBASE_CLIENT_EMAIL,privateKey:process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g,"\n")}),databaseURL:process.env.FIREBASE_DATABASE_URL}):(0,a.initializeApp)()),p=l?(0,o.getAuth)(u):null,d=l?(0,i.getFirestore)(u):null;n()}catch(e){n(e)}})},97681:(e,t,r)=>{r.a(e,async(e,n)=>{try{r.d(t,{db:()=>i});var a=r(52099),o=e([a]);let i=(a=(o.then?(await o)():o)[0]).i;n()}catch(e){n(e)}})},48680:(e,t,r)=>{r.a(e,async(e,n)=>{try{r.d(t,{B:()=>s,b:()=>i});var a=r(72929),o=e([a]);function i(e){return e?"string"==typeof e?e:e.toDate().toISOString():new Date(0).toISOString()}function s(e){return a.Timestamp.fromDate(new Date(e))}a=(o.then?(await o)():o)[0],n()}catch(e){n(e)}})},7331:(e,t,r)=>{r.a(e,async(e,n)=>{try{r.d(t,{FV:()=>u,Xu:()=>l,jo:()=>c});var a=r(97681),o=r(48680),i=e([a,o]);function s(e,t){let r=e.defaultLocale??"fr-CA",n=e.supportedLocales??[r],a=e.members??[];return{...e,id:t,orgId:t,defaultLocale:r,supportedLocales:n,members:a,createdAt:(0,o.b)(e.createdAt),updatedAt:(0,o.b)(e.updatedAt)}}async function c(e){let t=await a.db.collection("organizations").where("slug","==",e).limit(1).get();if(t.empty)return null;let r=t.docs[0],n=r.data();return s(n,r.id)}async function l(e){let t=await a.db.collection("organizations").doc(e).get();if(!t.exists)return null;let r=t.data();return s(r,t.id)}async function u(e,t){let r=a.db.collection("organizations").doc(e),n={...t};void 0!==t.updatedAt&&(n.updatedAt=t.updatedAt),void 0!==t.updatedBy&&(n.updatedBy=t.updatedBy),void 0!==t.members&&(n.members=t.members),await r.update(n)}[a,o]=i.then?(await i)():i,n()}catch(e){n(e)}})}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),n=t.X(0,[9276,5972,820,1936],()=>r(1586));module.exports=n})();