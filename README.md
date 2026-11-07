# SidTech 366 — Website on Vercel

Data aur admin panel Google Apps Script me hain. Ye repo sirf website dikhata hai (har page ka asli HTML, Google SEO ke saath).


## Files
| File | Kaam |
|---|---|
| `api/index.js` | Har page request yahin aati hai, Apps Script se data laati hai |
| `lib/render.js` | Saare pages (home, work, why-school, services, franchise, verify, contact, legal) |
| `lib/assets.js` | Design (CSS) + buttons ka JavaScript |
| `vercel.json` | Routing (sab URL → api/index.js) |
| `package.json`, `dev.js`, `.gitignore` | Setup |

## Setting (Vercel → Environment Variables)
| Naam | Value |
|---|---|
| `ST366_API` | Apps Script web-app link (`https://script.google.com/macros/s/…/exec`) — **zaroori** |
| `SITE_URL` | `https://sidtech366.vercel.app` (optional) |
| `ST366_GSV` | Google Search Console code (optional — admin panel me bhi daal sakte ho) |

## Online payment (Razorpay)
Razorpay ab poora **Apps Script** me chalta hai (`Payments.gs`). Keys **Admin panel → Company & Trust → Online payment** me daalo:
Key ID sheet me, Key Secret sirf Google Script Properties me (website / browser me kabhi nahi). Vercel me Razorpay ke env variables ki zaroorat nahi.
Website (`lib/rzpclient.js`) sirf Razorpay checkout kholta hai; order banana, amount, signature + payment verify sab Apps Script karta hai.
Har 10 min `rzpReconcile` pending online orders ko Razorpay se check karta hai (client ne page band kar diya ho tab bhi paisa record hota hai).
