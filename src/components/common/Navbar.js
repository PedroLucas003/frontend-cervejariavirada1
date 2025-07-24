import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ isAuthenticated, onLogout, user, cartItems }) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogoutClick = () => {
    setMenuOpen(false);
    setMobileMenuOpen(false);
    onLogout();
  };

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="navbar-left">
          <button className="menu-toggle" onClick={toggleMobileMenu} aria-label="Menu">
            <span className={`menu-icon ${mobileMenuOpen ? 'open' : ''}`}></span>
          </button>
        </div>

        <div className="navbar-right">
          {isAuthenticated ? (
            <>
              <div className="user-menu">
                <button className="user-toggle" onClick={toggleMenu} aria-label="Perfil">
                  <i className="fas fa-user-circle user-icon"></i>
                </button>

                {menuOpen && (
                  <div className="dropdown-menu">
                    <Link to="/" onClick={() => setMenuOpen(false)}>
                      <i className="fas fa-home"></i> Início
                    </Link>

                    <Link to="/profile" onClick={() => setMenuOpen(false)}>
                      <i className="fas fa-user"></i> Perfil
                    </Link>

                    <Link to="/my-orders" onClick={() => setMenuOpen(false)}>
                      <i className="fas fa-receipt"></i> Pedidos
                    </Link>

                    {user?.isAdmin && (
                      <>
                        <Link to="/admin/dashboard" onClick={() => setMenuOpen(false)}>
                          <i className="fas fa-tachometer-alt"></i> Dashboard
                        </Link>
                        <Link to="/admin/users" onClick={() => setMenuOpen(false)}>
                          <i className="fas fa-users"></i> Usuários
                        </Link>
                        <Link to="/admin/orders" onClick={() => setMenuOpen(false)}>
                          <i className="fas fa-list-alt"></i> Pedidos
                        </Link>
                      </>
                    )}

                    <Link to="/checkout" onClick={() => setMenuOpen(false)} className="cart-menu-item">
                      <i className="fas fa-shopping-cart"></i> Carrinho
                      {cartItems > 0 && <span className="cart-count">{cartItems}</span>}
                    </Link>
                    <button onClick={handleLogoutClick} className="logout-btn">
                      <i className="fas fa-sign-out-alt"></i> Sair
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link to="/login" className="login-link">
              <i className="fas fa-sign-in-alt"></i>
              <span className="login-text">Entrar</span>
            </Link>
          )}

          {cartItems > 0 && (
            <Link to="/checkout" className="cart-icon">
              <i className="fas fa-shopping-cart"></i>
              <span className="cart-count">{cartItems}</span>
            </Link>
          )}
        </div>
      </nav>

      {/* Menu lateral para mobile */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-content">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className="mobile-menu-item">
            <i className="fas fa-home"></i> Início
          </Link>

          {isAuthenticated ? (
            <>
              <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="mobile-menu-item">
                <i className="fas fa-user"></i> Perfil
              </Link>

              <Link to="/my-orders" onClick={() => setMobileMenuOpen(false)} className="mobile-menu-item">
                <i className="fas fa-receipt"></i> Meus Pedidos
              </Link>

              {user?.isAdmin && (
                <>
                  <Link to="/admin/dashboard" onClick={() => setMobileMenuOpen(false)} className="mobile-menu-item">
                    <i className="fas fa-tachometer-alt"></i> Dashboard
                  </Link>
                  <Link to="/admin/users" onClick={() => setMobileMenuOpen(false)} className="mobile-menu-item">
                    <i className="fas fa-users"></i> Usuários
                  </Link>
                  <Link to="/admin/orders" onClick={() => setMobileMenuOpen(false)} className="mobile-menu-item">
                    <i className="fas fa-list-alt"></i> Todos Pedidos
                  </Link>
                </>
              )}

              <Link to="/checkout" onClick={() => setMobileMenuOpen(false)} className="mobile-menu-item cart-menu-item">
                <i className="fas fa-shopping-cart"></i> Carrinho
                {cartItems > 0 && <span className="cart-count">{cartItems}</span>}
              </Link>
              <button onClick={handleLogoutClick} className="mobile-menu-item logout-btn">
                <i className="fas fa-sign-out-alt"></i> Sair
              </button>
            </>
          ) : (
            <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="mobile-menu-item">
              <i className="fas fa-sign-in-alt"></i> Entrar
            </Link>
          )}
        </div>
      </div>

      {/* Overlay para fechar o menu ao clicar fora */}
      {mobileMenuOpen && (
        <div className="menu-overlay" onClick={() => setMobileMenuOpen(false)}></div>
      )}
    </>
  );
};

export default Navbar;