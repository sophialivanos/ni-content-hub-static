// pages/_app.tsx
import type { AppProps } from "next/app";
import "../styles/globals.css";
import AppFrame from "../components/AppFrame";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AppFrame>
      <Component {...pageProps} />
    </AppFrame>
  );
}