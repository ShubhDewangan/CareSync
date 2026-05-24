
import type { Metadata } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

import { cn } from '@/lib/utils';
import { Toaster } from "sonner";

const fontSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
})

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CareSync — Smart Health Management",
  description:
    "Track vitals, manage appointments, and stay connected with your care team — all in one place. A project by Shubh.",
  icons: {
    icon: "/android-chrome-512x512.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "CareSync — Smart Health Management",
    description:
      "Track vitals, manage appointments, and stay connected with your care team — all in one place. A project by Shubh.",
    url: "https://caresync.vercel.app",
    siteName: "CareSync",
    // images: [
    //   {
    //     url: "https://caresync.vercel.app/og-image.png",
    //     width: 1200,
    //     height: 630,
    //     alt: "CareSync — Smart Health Management",
    //   },
    // ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CareSync — Smart Health Management",
    description:
      "Track vitals, manage appointments, and stay connected with your care team — all in one place. A project by Shubh.",
    // images: ["https://caresync.vercel.app/og-image.png"], // ✅ fixed
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning lang="en" className={cn("font-sans", fontSans.variable)}>
      <body
        className={ cn('min-h-screen bg-light-300 font-sans antialiased overflow-x-hidden overflow-y-auto remove-scrollbar', fontSans.variable) }
      >
        <ThemeProvider
          attribute='class'
          defaultTheme='light'
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster/>
        </ThemeProvider>
      </body>
    </html>
  );
}

