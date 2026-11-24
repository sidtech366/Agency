/* Per-site app settings that the Admin panel does not have (own icon, splash colour, daily push).
   Key = page slug (/AstroVikas -> "astrovikas"). Sites not listed here work exactly as before. */
const ICONS = require('./appicons');

const APPS = {
  astrovikas: {
    name: 'Astro Vikass',
    short: 'Astro Vikass',
    description: 'Astro Vikass — लाल किताब, वैदिक ज्योतिष, वास्तु, कुंडली, राशिफल',
    theme: '#14103A',          // status bar / title bar (deep navy)
    bg: '#14103A',             // splash screen background
    icons: ICONS.astrovikas,   // 512 / 192 / 180 PNG (maskable-safe)
    // OneSignal App ID is public (it is in every page that uses it). The REST key stays only in Vercel env.
    onesignal: process.env.ONESIGNAL_APP_ID_ASTROVIKAS || '',
    android: {                 // Android app built from github.com/sidtech366/jyotishi (android/ folder)
      package: 'com.astrovikass.app',
      sha256: ['1E:F3:4C:58:75:03:5C:57:90:FE:8D:58:33:B7:1B:79:55:87:45:53:A6:0C:F8:E3:1C:DE:F9:9E:2B:C2:7A:3E']
    },
    push: {                    // daily morning notification (api/push-daily.js)
      title: '🌅 शुभ प्रभात — आज का राशिफल',
      url: '/astrovikas/'
    }
  }
};

const get = (slug) => APPS[String(slug || '').toLowerCase()] || null;
/* /.well-known/assetlinks.json for every Android app above */
const assetlinks = () => JSON.stringify(Object.values(APPS).filter((a) => a.android).map((a) => ({
  relation: ['delegate_permission/common.handle_all_urls'],
  target: { namespace: 'android_app', package_name: a.android.package, sha256_cert_fingerprints: a.android.sha256 }
})));
module.exports = { get, assetlinks, APPS };
