import "@/styles/globals.css";
import { CartProvider }     from "@/contexts/CartContext";
import { AuthProvider }     from "@/contexts/AuthContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import Layout from "@/components/layout/Layout";

export default function App({ Component, pageProps }) {
  // Pages can opt-out of the default Layout (e.g. seller dashboard pages)
  const getLayout = Component.getLayout || ((page) => <Layout>{page}</Layout>);

  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          {getLayout(<Component {...pageProps} />)}
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
