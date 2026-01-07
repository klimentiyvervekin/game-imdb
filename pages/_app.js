import GlobalStyle from "../styles";
import NavBar from "@/components/NavBar";

export default function App({ Component, pageProps }) {
  return (
    <>
      <GlobalStyle />

      <NavBar />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: 12 }}>
        <Component {...pageProps} />
      </div>
    </>
  );
}
