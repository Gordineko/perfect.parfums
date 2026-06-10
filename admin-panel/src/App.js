import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

// Провайдеры
import { ModalsProvider } from "./app/context/modals-context"; 

// Лейаут и страницы
import AdminLayout from "./app/providers/AdminLayout";
import { AnalyticsPage } from "./pages/analitics";
import { BlogPage } from "./pages/blog-list";
import { CategoryPage } from "./pages/category-list";
import { ClientsPage } from "./pages/clients-list";
import HomePage from "./pages/home";
import OrdersPage from "./pages/order-list/OrdersPage";
import { ProductsPage } from "./pages/product-list";
import { PromoPage } from "./pages/promo-list";
import { WarehousePage } from "./pages/warehouse-list";
import { ProductRewrite } from "./pages/product-rewrite";
import CategoryRewritePage from "./pages/category-rewrite/CategoryRewrite";
import AuthPage from "./pages/auth/AuthPage";

// Импортируем компонент защиты роутов (создай его, если еще не сделал)
import ProtectedRoute from "./app/providers/ProtectedRoute"; 
import OrderRewritePage from "./pages/orders-rewrite/OrdersRewrite";
import ContentPage from "./pages/content/ContentPage";
import ArticleRewritePage from "./pages/blog-rewrite/ArticleRewritePage";
import BannerPage from "./pages/banner-list/BannerPage";
import UserRewritePage from "./pages/user-rewrite/UserRewrite";
import BannerRewritePage from "./pages/banner-rewrite/BannerRewrite";
import ToastContainer from "./shared/ui/toast/ToastContainer";
import ReviewsPage from "./pages/reviews-list/ReviewsPage";
import ReviewRewritePage from "./pages/review-rewrite/ReviewRewrite";


function App() {
  return (
    <ModalsProvider>
      <ToastContainer />
      <BrowserRouter>
        <Routes>
      
          <Route path="/auth" element={<AuthPage />} />

        
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<AdminLayout />}>
              <Route index element={<HomePage />} />
              <Route path="order-rewrite/:id" element={<OrderRewritePage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="users" element={<ClientsPage />} />
              <Route path="users-rewrite/:id" element={<UserRewritePage />} />
              <Route path="content" element={<ContentPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="categories" element={<CategoryPage />} />
              <Route path="warehouse" element={<WarehousePage />} />
              <Route path="blogs" element={<BlogPage />} />
              <Route path="reviews" element={<ReviewsPage />} />
              <Route path="review-rewrite/:id" element={<ReviewRewritePage />} />
              <Route path="banners" element={<BannerPage />} />
              <Route path="blog-rewrite/:id" element={<ArticleRewritePage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="promo" element={<PromoPage />} />
              <Route path="banner-rewrite/:id" element={<BannerRewritePage />} />
              <Route path="product-rewrite/:id" element={<ProductRewrite />} />
              <Route path="category-rewrite/:id" element={<CategoryRewritePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>

          {/* Глобальный перехват неизвестных урлов - кидаем на главную */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ModalsProvider>
  );
}

export default App;