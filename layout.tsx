import type { Metadata } from "next";
import localFont from "next/font/local";
import "@coinbase/onchainkit/styles.css";
import "./globals.css";
import { ResponseLogger } from "@/components/response-logger";
import { cookies } from "next/headers";
import { Providers } from "./providers";
import FarcasterWrapper from "@/components/FarcasterWrapper";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestId = cookies().get("x-request-id")?.value;

  return (
        <html lang="en">
          <head>
            {requestId && <meta name="x-request-id" content={requestId} />}
          </head>
          <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          >
            <Providers>
              
      <FarcasterWrapper>
        {children}
      </FarcasterWrapper>
      
              <ResponseLogger />
            </Providers>
          </body>
        </html>
      );
}

export const metadata: Metadata = {
        title: "Crypto Snake Challenge",
        description: "Enjoy the classic Snake game on mobile! Connect your wallet to save scores and climb the leaderboard. Compete for the top 10 spots among players worldwide!",
        other: { "fc:frame": JSON.stringify({"version":"next","imageUrl":"https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/thumbnail_7342a783-90bd-447a-91df-6cb08dff9010-EkEPsZAz2OJsFz0G6uOWavGkoCIkIF","button":{"title":"Open with Ohara","action":{"type":"launch_frame","name":"Crypto Snake Challenge","url":"https://actual-spread-548.app.ohara.ai","splashImageUrl":"https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/farcaster/splash_images/splash_image1.svg","splashBackgroundColor":"#ffffff"}}}
        ) }
    };
