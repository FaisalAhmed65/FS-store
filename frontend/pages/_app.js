import "@/styles/globals.css";
import Head from "next/head";
import { CartProvider }     from "@/contexts/CartContext";
import { AuthProvider }     from "@/contexts/AuthContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { ThemeProvider }    from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Layout from "@/components/layout/Layout";

export default function App({ Component, pageProps }) {
  const getLayout = Component.getLayout || ((page) => <Layout>{page}</Layout>);

  return (
    <>
      <Head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"
        />
      </Head>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                {getLayout(<Component {...pageProps} />)}
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </>
  );
}
