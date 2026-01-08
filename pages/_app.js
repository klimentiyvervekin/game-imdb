import { SessionProvider } from "next-auth/react";
import GlobalStyle from "../styles";
import NavBar from "@/components/NavBar";

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {
  return (
    <SessionProvider session={session}>
      <NavBar />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: 12 }}>
        <GlobalStyle />
        <Component {...pageProps} />
      </div>
    </SessionProvider>
  );
}
