import React from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';

import { CurrencyProvider } from './context/CurrencyContext';
import './i18n'; // Initialize i18n


// === Admin Components ===
import AdminHeader from './features/admin/components/Header';
import AdminFooter from './features/admin/components/Footer';
import AdminHome from './features/admin/pages/Home';
import AdminEmail from './features/admin/pages/Email';
import AdminCalendar from './features/admin/pages/Calendar';
import AdminQuotation from './features/admin/pages/AllQuotation';
import AdminTerms from './features/admin/pages/TermsConditions';
import AdminProfile from './features/admin/pages/Profile';
import AdminEmployee from './features/admin/pages/Employee';
import AdminDetailProfil from './features/admin/pages/DetailProfil';


// === Public Components ===

import PublicHome from './features/public/pages/Home';
import PublicAbout from './features/public/pages/About';
import PublicContact from './features/public/pages/Contact';
import PublicBlog from './features/public/pages/Blog';
import PublicProduits from './features/public/pages/Produits';
import PublicProductDetail from './features/public/pages/ProductDetail';
import PublicCart from './features/public/pages/Cart';
import PublicTeam from './features/public/pages/Team';
import PublicTeamDetail from './features/public/pages/TeamDetail';
import PublicProject from './features/public/pages/Project';
import PublicProjectDetail from './features/public/pages/ProjectDetail';

import PublicHeader from './features/public/components/Header';
import PublicFooter from './features/public/components/Footer';
import PublicCheckout from './features/public/pages/Checkout';
import PublicSuccess from './features/public/pages/Success';
import MyOrders from './features/public/pages/MyOrders';


// === Shared/Unified ===
import UnifiedLogin from './pages/UnifiedLogin';
import Register from './pages/Register';
import UserProfile from './pages/UserProfile';
import Messages from './pages/Messages';

import Subscriptions from './pages/Subscriptions';

import Notifications from './pages/Notifications';
import Quotations from './pages/Quotations';
import Factures from './pages/Factures';


// === AI Features ===
import AssistantChat from './pages/AssistantChat';
import AutoReports from './pages/AutoReports';
import ProjectClustering from './pages/ProjectClustering';
import RecommendMaterialsBmp from './pages/RecommendMaterialsBmp';
import ConstructionDashboard from './pages/ConstructionDashboard';
import PlanAnalysis from './pages/PlanAnalysis';
import ProgressMonitoring from './pages/ProgressMonitoring';
import AIFeatures from './pages/AIFeatures';

import ChatBotArtisan from './components/ChatBotArtisan/ChatBotArtisan';
import MarketplaceLayout from './components/marketplace/MarketplaceLayout';
import MarketplaceDashboard from './pages/marketplace/MarketplaceDashboard';
import PlanVsReel from './pages/marketplace/PlanVsReel';


import AvailableRequestsPage from './pages/marketplace/AvailableRequestsPage';
import RequestDetailPage from './pages/marketplace/RequestDetailPage';
import SubmitOfferPage from './pages/marketplace/SubmitOfferPage';
import NegotiationChat from './pages/marketplace/NegotiationChat';
import MyOffersPage from './pages/marketplace/MyOffersPage';


import ProjectTasks from './pages/ProjectTasks';
import ArtisanTaskResponse from './pages/ArtisanTaskResponse';
import ArtisanMissions from './pages/ArtisanMissions';
import ArtisanTaskManage from './pages/ArtisanTaskManage';

import EngineerCalendar from './features/engineer/pages/EngineerCalendar';
import SupplierAddProduct from './features/supplier/pages/AddProduct';
import SupplierManageProducts from './features/supplier/pages/ManageProducts';
import DeliveryOrders from './features/delivery/pages/Orders';
import AIRoutePredictor from './features/delivery/pages/AIRoutePredictor';
import Estimate from './pages/Estimate';
import VoiceNavigator from './components/VoiceNavigator';
import VoiceProductSearch from './components/VoiceProductSearch';
import ScreenMagnifier from './components/Accessibility/ScreenMagnifier';
import './DarkMode.css';

function App() {
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  return (
    <CurrencyProvider>
      <CartProvider>
        <BrowserRouter>
          <ScreenMagnifier />
          <VoiceNavigator />
          <VoiceProductSearch />
          <ChatBotArtisan /> {/* 🛠️ Chatbot Artisans flottant (Salim) */}

          <Routes>
            {/* === Auth === */}
            <Route path="/login" element={<UnifiedLogin />} />
            <Route path="/register" element={<Register />} />
            <Route path="/subscriptions" element={<Subscriptions />} />

            {/* === Admin Section === */}
            <Route path="/admin/*" element={
              <div className="admin-wrapper">
                <AdminHeader />
                <Routes>
                  <Route path="/" element={<AdminHome />} />
                  <Route path="calendar" element={<AdminCalendar />} />
                  <Route path="quotations" element={<AdminQuotation />} />
                  <Route path="terms" element={<AdminTerms />} />
                  <Route path="email" element={<AdminEmail />} />
                  <Route path="profil" element={<AdminProfile />} />
                  <Route path="employee" element={<AdminEmployee />} />
                  <Route path="detailprofil" element={<AdminDetailProfil />} />
                  <Route path="*" element={<Navigate to="/admin/" replace />} />
                </Routes>
                <AdminFooter />
              </div>
            } />

            {/* === Public Layout Section === */}
            <Route path="/*" element={
              <div className="public-wrapper">
                <PublicHeader />
                <Routes>
                  <Route path="/" element={<PublicHome />} />
                  <Route path="about" element={<PublicAbout />} />
                  <Route path="contact" element={<PublicContact />} />
                  <Route path="blog" element={<PublicBlog />} />
                  <Route path="produit" element={<PublicProduits />} />
                  <Route path="productDetail" element={<PublicProductDetail />} />
                  <Route path="cart" element={<PublicCart />} />
                  <Route path="team" element={<PublicTeam />} />
                  <Route path="teamDetail" element={<PublicTeamDetail />} />
                  <Route path="project" element={<PublicProject />} />
                  <Route path="projectDetail" element={<PublicProjectDetail />} />
                  <Route path="checkout" element={<PublicCheckout />} />
                  <Route path="success" element={<PublicSuccess />} />
                  <Route path="my-orders" element={<MyOrders />} />
                  <Route path="estimate" element={<Estimate />} />

                  {/* AI Features Routes — BMP Construction AI Platform */}
                  <Route path="ai-features" element={<ConstructionDashboard />} />
                  <Route path="ai-features/plan-analysis" element={<PlanAnalysis />} />
                  <Route path="ai-features/recommend-materials-bmp" element={<RecommendMaterialsBmp />} />
                  <Route path="ai-features/progress-monitoring" element={<ProgressMonitoring />} />
                   <Route path="ai-features/assistant" element={<AssistantChat />} />
                   <Route path="ai-features/clustering" element={<ProjectClustering />} />
                   <Route path="ai-features/reports" element={<AutoReports />} />
                   <Route path="plan-vs-reel" element={<PlanVsReel />} />

                  {/* Marketplace (Engineer / Artisan) — layout with dashboard, cards, negotiation */}
                  <Route path="marketplace" element={<MarketplaceLayout />}>
                    <Route index element={<Navigate to="/marketplace/dashboard" replace />} />
                    <Route path="dashboard" element={<MarketplaceDashboard />} />


                    <Route path="requests/:requestId" element={<RequestDetailPage />} />
                    <Route path="requests/:requestId/chat" element={<NegotiationChat />} />
                    <Route path="requests/:requestId/offer" element={<SubmitOfferPage />} />
                    <Route path="available" element={<AvailableRequestsPage />} />
                    <Route path="offers" element={<MyOffersPage />} />
                  </Route>

                  <Route path="/engineer/calendar" element={<EngineerCalendar />} />
                  <Route path="/project/:projectId/tasks" element={<ProjectTasks />} />
                  <Route path="/artisan/missions" element={<ArtisanMissions />} />
                  <Route path="/artisan/task-response/:projectId/:taskId" element={<ArtisanTaskResponse />} />
                  <Route path="/artisan/projects/:projectId/tasks/:taskId/manage" element={<ArtisanTaskManage />} />

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                <PublicFooter />
              </div>
            } />

            {/* === Role Specific Routes === */}

            <Route path="/supplier/add-product" element={<SupplierAddProduct />} />
            <Route path="/supplier/manage-products" element={<SupplierManageProducts />} />
            <Route path="/delivery/orders" element={<DeliveryOrders />} />
            <Route path="/delivery/ai-predict" element={<AIRoutePredictor />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/devis" element={<Quotations />} />
            <Route path="/factures" element={<Factures />} />


          </Routes>
        </BrowserRouter>
      </CartProvider>
    </CurrencyProvider>

  );
}

export default App;
