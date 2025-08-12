import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ isAuthenticated, onLogout, user, cartItems }) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
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

  // --- INÍCIO DA CORREÇÃO FINAL ---
  // Criamos um objeto de estilo dinâmico.
  const navStyle = {};

  // A condição exata do problema: tela de celular E sem rolagem.
  if (isMobile && !scrolled) {
    // Forçamos o fundo transparente nesta condição.
    navStyle.background = 'transparent';
  }
  // Em todos os outros casos (desktop, ou mobile com rolagem),
  // o objeto fica vazio e o CSS normal assume o controle.
  // --- FIM DA CORREÇÃO FINAL ---


  return (
    <>
      <nav 
        className={`navbar ${scrolled ? 'scrolled' : ''}`}
        style={navStyle} // Aplicamos o estilo inline aqui
      >
        <div className="navbar-left">
          {isMobile && (
            <button className="menu-toggle" onClick={toggleMobileMenu} aria-label="Menu">
              <span className={`menu-icon ${mobileMenuOpen ? 'open' : ''}`}></span>
            </button>
          )}
        </div>

        <div className="navbar-right">
          {isAuthenticated ? (
            <>
              {!isMobile && (
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
                        <i className="fas fa-receipt"></i> Meus Pedidos
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
                            <i className="fas fa-list-alt"></i> Todos Pedidos
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
              )}
              {isMobile && cartItems > 0 && (
                <Link to="/checkout" className="cart-icon">
                  <i className="fas fa-shopping-cart"></i>
                  <span className="cart-count">{cartItems}</span>
                </Link>
              )}
            </>
          ) : (
            <Link to="/login" className="login-link">
              <i className="fas fa-sign-in-alt"></i>
              {!isMobile && <span className="login-text">Entrar</span>}
            </Link>
          )}
          {!isMobile && cartItems > 0 && (
            <Link to="/checkout" className="cart-icon">
              <i className="fas fa-shopping-cart"></i>
              <span className="cart-count">{cartItems}</span>
            </Link>
          )}
        </div>
      </nav>

      {/* O resto do seu componente continua igual */}
      {isMobile && (
        <>
          <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
            {/* ... conteúdo do menu ... */}
          </div>
          {mobileMenuOpen && (
            <div className="menu-overlay" onClick={() => setMobileMenuOpen(false)}></div>
          )}
        </>
      )}
    </>
  );
};

export default Navbar;