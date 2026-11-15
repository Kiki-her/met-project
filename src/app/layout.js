import "./globals.css";
import Providers from "@/components/Providers";

export const metadata = {
  title: {
    default: "夜の美術館 — The Night Museum",
    template: "%s — 夜の美術館",
  },
  description:
    "メトロポリタン美術館のオープンアクセス作品を、灯りを落とした展示室で。Walk the dim galleries of The Metropolitan Museum of Art's open-access collection.",
  applicationName: "The Night Museum",
  viewport: {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
  },
  themeColor: "#0a0908",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    title: "夜の美術館 — The Night Museum",
    description: "自宅で、美術館にいるような時間を。",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <head>
        {/*
          初回描画のちらつきを避けるため、保存済み設定を先に反映する。
          あわせて「このタブで既に館に入ったか」も見て、入っていれば扉に印を付ける。
          サイト内を移動して受付に戻ったときに、扉が一瞬も描かれないようにするため。
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var r=document.documentElement;var s=JSON.parse(localStorage.getItem('night-museum.settings')||'{}');if(s.motion==='reduced')r.dataset.motion='reduced';var m={s:0.94,m:1,l:1.1};r.style.setProperty('--fs-scale',String(m[s.textSize]||1));var l=localStorage.getItem('night-museum.lang');if(l==='en'||l==='ja'){r.lang=l;}if(sessionStorage.getItem('night-museum.session')==='1')r.dataset.entered='1';}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
