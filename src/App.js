import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import './App.css';
import BeerDashboard from './components/beers/BeerDashboard';
import Navbar from './components/common/Navbar';
import HeroBanner from './components/home/HeroBanner';
import Cervejas from './components/beers/Cervejas';
import LoginPage from './components/home/LoginPage';
import UserDashboard from './components/users/UserDashboard';
import CheckoutPage from './components/checkout/CheckoutPage';
import EditUserPage from './components/users/EditUserPage';
import UserProfilePage from './components/users/UserProfilePage';
import UserOrdersPage from './components/users/UserOrdersPage';
import AdminOrdersPage from './components/users/AdminOrdersPage';
import PixPayment from './components/checkout/PixPayment';
// Removendo o import de PaymentSuccessPage, pois a rota /payment-success não será mais usada para exibir conteúdo estático
// import PaymentSuccessPage from './components/checkout/PaymentSuccessPage'; 

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

// Componente Wrapper para PixPayment para extrair os parâmetros da URL e o state
const PixPaymentWrapper = ({ onOrderSuccess }) => {
  const { orderId } = useParams(); 
  const location = useLocation();    
  const navigate = useNavigate();    

  const amount = location.state?.amount; 

  if (!orderId || amount === undefined) {
    console.error("Dados de pagamento PIX insuficientes para renderizar PixPayment.");
    return (
      <div className="error-container">
        <h2>Erro: Dados de Pagamento Ausentes</h2>
        <p>Não foi possível carregar os detalhes do pagamento PIX. Por favor, tente novamente.</p>
        <button onClick={() => navigate('/')}>Voltar para a Página Inicial</button>
      </div>
    );
  }

  return (
    <PixPayment 
      orderId={orderId} 
      amount={amount} 
      onBack={() => navigate('/checkout')} 
      onSuccess={() => { 
        onOrderSuccess(); // Limpa o carrinho
        navigate('/my-orders'); // Redireciona diretamente para Meus Pedidos após PIX pago/confirmado
      }} 
    />
  );
};


function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

function App() {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null,
    loading: true
  });

  const [error, setError] = useState(null);
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await axios.get(`${API_URL}/api/auth/validate`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.data.valid) {
            setAuthState({
              isAuthenticated: true,
              user: response.data.user,
              loading: false
            });
            return;
          }
        }
        throw new Error('Sessão inválida');
      } catch (err) {
        localStorage.removeItem('token');
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false
        });
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token);
    setAuthState({
      isAuthenticated: true,
      user: userData,
      loading: false
    });
    navigate(userData.isAdmin ? '/admin/dashboard' : '/');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('cart');
    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false
    });
    setCart([]);
    navigate('/');
  };

  const addToCart = (item) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem._id === item._id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem._id === item._id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  const handleOrderSuccess = () => {
    setCart([]); 
    localStorage.removeItem('cart'); 
    console.log('Carrinho limpo após sucesso do pedido.');
  };


  if (authState.loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="App">
      <Navbar
        isAuthenticated={authState.isAuthenticated}
        user={authState.user}
        onLogout={handleLogout}
        cartItems={cart.reduce((total, item) => total + item.quantity, 0)}
      />

      {error && (
        <div className="global-error">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <main className="main-content">
        <Routes>
          <Route path="/" element={
            <>
              <HeroBanner />
              <Cervejas
                cart={cart}
                addToCart={addToCart}
                updateCart={setCart}
                isAuthenticated={authState.isAuthenticated}
              />
            </>
          } />

          <Route path="/login" element={
            authState.isAuthenticated ?
              <Navigate to={authState.user?.isAdmin ? '/admin/dashboard' : '/'} /> :
              <LoginPage
                onLogin={handleLogin}
                onError={setError}
              />
          } />

          <Route path="/profile" element={
            authState.isAuthenticated ? (
              <UserProfilePage
                user={authState.user}
                onUpdateUser={(updatedUser) => setAuthState(prev => ({
                  ...prev,
                  user: updatedUser
                }))}
              />
            ) : (
              <Navigate to="/login" state={{ from: '/profile' }} />
            )
          } />

          <Route path="/my-orders" element={
            authState.isAuthenticated ? <UserOrdersPage /> : <Navigate to="/login" state={{ from: '/my-orders' }} />
          } />
          <Route path="/admin/orders" element={
            authState.isAuthenticated && authState.user?.isAdmin ? (
              <AdminOrdersPage />
            ) : (
              <Navigate to="/login" />
            )
          } />

          <Route path="/admin/dashboard" element={
            authState.isAuthenticated && authState.user?.isAdmin ? (
              <BeerDashboard user={authState.user} />
            ) : (
              <Navigate to="/login" state={{ from: '/admin/dashboard' }} />
            )
          } />

          <Route path="/admin/users" element={
            authState.isAuthenticated && authState.user?.isAdmin ? (
              <UserDashboard user={authState.user} />
            ) : (
              <Navigate to="/login" />
            )
          } />

          <Route path="/admin/users/edit/:id" element={
            authState.isAuthenticated && authState.user?.isAdmin ? (
              <EditUserPage user={authState.user} />
            ) : (
              <Navigate to="/login" />
            )
          } />

          <Route path="/checkout" element={
            authState.isAuthenticated ? (
              <CheckoutPage
                cartItems={cart}
                user={authState.user}
                onOrderSuccess={handleOrderSuccess}
              />
            ) : (
              <Navigate to="/login" state={{ from: '/checkout' }} />
            )
          } />

          <Route 
            path="/pix-payment/:orderId" 
            element={
              authState.isAuthenticated ? (
                <PixPaymentWrapper onOrderSuccess={handleOrderSuccess} />
              ) : (
                <Navigate to="/login" state={{ from: '/pix-payment' }} />
              )
            } 
          />

          {/* ROTA PARA A PÁGINA DE SUCESSO DO PAGAMENTO */}
          <Route path="/payment-success" element={
            <div className="payment-success-page">
              <h2>🎉 Pedido Confirmado! 🎉</h2>
              <p>Seu pagamento foi recebido e seu pedido está sendo processado. Em breve você receberá um e-mail com os detalhes.</p>
              <button onClick={() => navigate('/my-orders')} className="btn btn-primary">Ver Meus Pedidos</button>
              <button onClick={() => navigate('/')} className="btn btn-secondary">Voltar para a Loja</button>
            </div>
          } />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default AppWrapper;