import type { AppProps } from "next/app";
import "@/styles/globals.css";
import { Inter } from "next/font/google";
import AppLayout from "@/components/AppLayout"; // your app shell

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={inter.variable + " font-sans"}>
      <AppLayout>
        <Component {...pageProps} />
      </AppLayout>
    </div>
  );
}