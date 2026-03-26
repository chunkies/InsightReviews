'use client';

import Script from 'next/script';

// Validate analytics IDs to prevent script injection via env vars
const rawGaId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || '';
const rawPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';
const GA_ID = /^G-[A-Z0-9]+$/.test(rawGaId) ? rawGaId : null;
const META_PIXEL_ID = /^\d+$/.test(rawPixelId) ? rawPixelId : null;

const ga4InitScript = GA_ID
  ? 'window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag("js",new Date());gtag("config","' + GA_ID + '",{page_path:window.location.pathname});'
  : '';

const metaPixelScript = META_PIXEL_ID
  ? '!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");fbq("init","' + META_PIXEL_ID + '");fbq("track","PageView");'
  : '';

export function AnalyticsScripts() {
  return (
    <>
      {GA_ID && (
        <>
          <Script
            src={'https://www.googletagmanager.com/gtag/js?id=' + GA_ID}
            strategy="afterInteractive"
          />
          <Script
            id="ga4-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{ __html: ga4InitScript }}
          />
        </>
      )}

      {META_PIXEL_ID && (
        <Script
          id="meta-pixel-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: metaPixelScript }}
        />
      )}
    </>
  );
}
