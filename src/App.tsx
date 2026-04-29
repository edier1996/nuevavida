import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { TransactionProvider } from "@/contexts/TransactionContext";
import { CartProvider } from "@/contexts/CartContext";
import Index from "./pages/Index.tsx";
import Explore from "./pages/Explore.tsx";
import Login from "./pages/Login.tsx";
import Publish from "./pages/Publish.tsx";
import Favorites from "./pages/Favorites.tsx";
import Messages from "./pages/Messages.tsx";
import Profile from "./pages/Profile.tsx";
import ProductDetail from "./pages/ProductDetail.tsx";
import Checkout from "./pages/Checkout.tsx";
import CheckoutCart from "./pages/CheckoutCart.tsx";
import OrderConfirmation from "./pages/OrderConfirmation.tsx";
import SellerDashboard from "./pages/SellerDashboard.tsx";
import Categories from "./pages/Categories.tsx";
import About from "./pages/About.tsx";
import Contact from "./pages/Contact.tsx";
import Transparency from "./pages/Transparency.tsx";
import Privacy from "./pages/Privacy.tsx";
import Terms from "./pages/Terms.tsx";
import Cookies from "./pages/Cookies.tsx";
import MyPurchases from "./pages/MyPurchases.tsx";
import Cart from "./pages/Cart.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import WorkerDashboard from "./pages/WorkerDashboard.tsx";
import MyRequests from "./pages/MyRequests.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TransactionProvider>
        <CartProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/explorar" element={<Explore />} />
            <Route path="/login" element={<Login />} />
            <Route path="/publicar" element={<Publish />} />
            <Route path="/favoritos" element={<Favorites />} />
            <Route path="/mensajes" element={<Messages />} />
            <Route path="/perfil" element={<Profile />} />
            <Route path="/producto/:id" element={<ProductDetail />} />
            <Route path="/checkout/:id" element={<Checkout />} />
            <Route path="/carrito" element={<Cart />} />
            <Route path="/checkout-carrito" element={<CheckoutCart />} />
            <Route path="/mis-compras" element={<MyPurchases />} />
            <Route path="/mis-solicitudes" element={<MyRequests />} />
            <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />
            <Route path="/dashboard" element={<SellerDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/worker" element={<WorkerDashboard />} />
            <Route path="/categorias" element={<Categories />} />
            <Route path="/sobre" element={<About />} />
            <Route path="/contacto" element={<Contact />} />
            <Route path="/transparencia" element={<Transparency />} />
            <Route path="/privacidad" element={<Privacy />} />
            <Route path="/terminos" element={<Terms />} />
            <Route path="/cookies" element={<Cookies />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
        </CartProvider>
      </TransactionProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
