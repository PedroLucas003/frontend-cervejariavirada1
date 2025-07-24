import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Cervejas.css';

const API_URL = process.env.REACT_APP_API_URL;

const Cervejas = ({ cart, addToCart, updateCart, isAuthenticated }) => {
  const [cervejas, setCervejas] = useState([]);
  const [stock, setStock] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCart, setShowCart] = useState(false);
  const [expandedCards, setExpandedCards] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [navbarScrolled, setNavbarScrolled] = useState(false);
  const navigate = useNavigate();

  // Efeito para detectar scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setNavbarScrolled(true);
      } else {
        setNavbarScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleCardExpansion = (id) => {
    setExpandedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getBeerImage = useCallback((beerType) => {
    const images = {
      'Belgian Blonde Ale': '/belgian-blonde.png',
      'Tripel': '/tripel.png',
      'Extra Stout': '/stout-beer.png',
      'Irish Red Ale': '/irish-red.png'
    };
    return images[beerType] || '/default-beer.png';
  }, []);

  const fetchBeers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_URL}/api/beers/public`, {
        headers: {
          'Accept': 'application/json'
        },
        withCredentials: true
      });

      if (!response.data || !response.data.success || !Array.isArray(response.data.data)) {
        throw new Error('Estrutura de dados inválida');
      }

      let formattedBeers = response.data.data.map(beer => {
        return {
          _id: beer._id,
          nome: `Virada ${beer.beerType}`,
          tipo: beer.beerType,
          beerType: beer.beerType,
          descricao: beer.description || 'Descrição não disponível',
          imagem: getBeerImage(beer.beerType),
          teor: beer.alcoholContent,
          ibu: beer.ibu,
          cor: beer.color,
          turbidez: beer.turbidity,
          ano: beer.yearCreated || 2016,
          price: beer.price || 15.90,
          quantity: beer.quantity,
          createdAt: beer.createdAt
        };
      });

      formattedBeers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setCervejas(formattedBeers);

      const newStock = {};
      response.data.data.forEach(beer => {
        newStock[beer._id] = beer.quantity;
      });
      setStock(newStock);

    } catch (error) {
      console.error('Erro ao carregar cervejas:', error);
      setError('Erro ao carregar as cervejas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [getBeerImage]);

  useEffect(() => {
    fetchBeers();
  }, [fetchBeers]);

  const handleAddToCart = (cerveja) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/' } });
      return;
    }

    if (stock[cerveja._id] <= 0) {
      setError('Esta cerveja está esgotada no momento.');
      return;
    }

    addToCart(cerveja);
    setShowCart(true);
  };

  const handleRemoveFromCart = (id) => {
    const updatedCart = cart.filter(item => item._id !== id);
    updateCart(updatedCart);
  };

  const handleUpdateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveFromCart(id);
      return;
    }

    const updatedCart = cart.map(item =>
      item._id === id ? { ...item, quantity: newQuantity } : item
    );
    updateCart(updatedCart);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      return total + ((item.price || 0) * item.quantity);
    }, 0).toFixed(2);
  };

  const proceedToCheckout = () => {
    navigate('/checkout');
  };

  return (
    <>
      {/* Navbar Mobile */}
      <nav className={`mobile-navbar ${navbarScrolled ? 'scrolled' : ''}`}>
        <div className="navbar-logo">
          <img src="/logo-cervejaria-virada.png" alt="Cervejaria Virada" />
        </div>
        <button 
          className={`hamburger-menu ${menuOpen ? 'active' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>
      </nav>

      {/* Menu Mobile */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <a href="/" onClick={() => setMenuOpen(false)}>Home</a>
        <a href="/cervejas" onClick={() => setMenuOpen(false)}>Cervejas</a>
        <a href="/sobre" onClick={() => setMenuOpen(false)}>Sobre</a>
        <a href="/contato" onClick={() => setMenuOpen(false)}>Contato</a>
      </div>

      <section id="cervejas-section" className="cervejas-section">
        <div className="title-container">
          <h2 className="section-title" style={{ textAlign: 'center', width: '100%' }}>Nossas <span className="destaque">CERVEJAS</span> Históricas</h2>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button
              onClick={() => {
                setError(null);
                fetchBeers();
              }}
              className="retry-button"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        <div className="cervejas-grid">
          {loading && (
            <div className="loading-overlay">
              <div className="spinner"></div>
              <p>Carregando cervejas...</p>
            </div>
          )}

          {cervejas.map((cerveja) => (
            <div key={cerveja._id} className={`cerveja-card ${expandedCards[cerveja._id] ? 'expanded' : ''}`}>
              <div className="cerveja-imagem-container">
                <img
                  src={cerveja.imagem}
                  alt={cerveja.nome}
                  className="cerveja-imagem"
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/default-beer.png";
                  }}
                />
                <div className="cerveja-detalhes">
                  <div className="cerveja-tag">Virada</div>
                  <div className="cerveja-ano">{cerveja.ano}</div>
                </div>
                <button
                  className={`add-to-cart-btn ${stock[cerveja._id] <= 0 ? 'disabled' : ''}`}
                  onClick={() => handleAddToCart(cerveja)}
                  disabled={stock[cerveja._id] <= 0}
                >
                  <i className="fas fa-shopping-cart"></i>
                  {stock[cerveja._id] > 0 ? 'Adicionar' : 'Esgotado'}
                </button>
              </div>
              <div className="cerveja-info">
                <h3>{cerveja.nome}</h3>
                <p className="cerveja-tipo">{cerveja.tipo}</p>

                <button
                  className="toggle-desc-btn"
                  onClick={() => toggleCardExpansion(cerveja._id)}
                >
                  {expandedCards[cerveja._id] ? 'Ocultar descrição' : 'Mostrar descrição'}
                </button>

                <div className={`cerveja-desc-container ${expandedCards[cerveja._id] ? 'expanded' : ''}`}>
                  <p className="cerveja-desc" dangerouslySetInnerHTML={{ __html: cerveja.descricao.replace(/\n/g, '<br />') }}></p>
                </div>

                <div className="cerveja-specs">
                  <span className="spec-item">ABV: {cerveja.teor}</span>
                  {cerveja.ibu && <span className="spec-item">IBU: {cerveja.ibu}</span>}
                  {cerveja.cor && <span className="spec-item">Cor: {cerveja.cor}</span>}
                  {cerveja.turbidez && <span className="spec-item">Turbidez: {cerveja.turbidez}</span>}
                </div>
                <div className="cerveja-stock">
                  <span className="stock-label">Estoque:</span>
                  <span className={`stock-value ${stock[cerveja._id] > 0 ? 'in-stock' : 'out-of-stock'}`}>
                    {stock[cerveja._id]} unidades
                  </span>
                </div>
                <span className="cerveja-price">R$ {(cerveja.price || 0).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className={`cart-icon ${getTotalItems() > 0 ? 'has-items' : ''}`} onClick={() => setShowCart(!showCart)}>
          <i className="fas fa-shopping-cart"></i>
          {getTotalItems() > 0 && <span className="cart-count">{getTotalItems()}</span>}
        </div>

        <div className={`cart-sidebar ${showCart ? 'open' : ''}`}>
          <div className="cart-header">
            <h3>Seu Carrinho</h3>
            <button className="close-cart" onClick={() => setShowCart(false)}>
              <i className="fas fa-times"></i>
            </button>
          </div>

          {cart.length === 0 ? (
            <div className="empty-cart">
              <i className="fas fa-shopping-cart"></i>
              <p>Seu carrinho está vazio</p>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cart.map(item => (
                  <div key={item._id} className="cart-item">
                    <img src={item.imagem} alt={item.nome} className="cart-item-image" />
                    <div className="cart-item-details">
                      <h4>{item.nome}</h4>
                      <p className="cart-item-type">{item.tipo}</p>
                      <div className="cart-item-quantity">
                        <button onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}>
                          <i className="fas fa-minus"></i>
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                          disabled={stock[item._id] <= item.quantity}
                        >
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>
                    </div>
                    <div className="cart-item-price">
                      R$ {((item.price || 0) * item.quantity).toFixed(2)}
                      <button
                        className="remove-item"
                        onClick={() => handleRemoveFromCart(item._id)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-summary">
                <div className="cart-total">
                  <span>Total:</span>
                  <span>R$ {getTotalPrice()}</span>
                </div>
                <button
                  className="checkout-btn"
                  onClick={proceedToCheckout}
                  disabled={cart.length === 0}
                >
                  Finalizar Compra
                </button>
              </div>
            </>
          )}
        </div>
        {showCart && <div className="cart-overlay" onClick={() => setShowCart(false)}></div>}
      </section>

      <footer className="transparent-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <img
              src="/logo-cervejaria-virada.png"
              alt="Cervejaria Virada"
              className="footer-logo-img"
            />
          </div>

          <div className="footer-info">
            <h3 className="footer-text">CERVEJARIA VIRADA</h3>
            <p className="footer-contact">
              Orçamentos para eventos e fornecimento de chopes artesanais<br />
              Entre em contato e leve a autêntica experiência Virada para seu evento
            </p>
          </div>

          <div className="footer-social">
            <a
              href="https://wa.me/558195723437"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon whatsapp"
              title="WhatsApp"
            >
              <i className="fab fa-whatsapp"></i>
            </a>
            <a
              href="https://www.instagram.com/tomevirada/"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon instagram"
              title="Instagram"
            >
              <i className="fab fa-instagram"></i>
            </a>
          </div>

          <div className="footer-copyright">
            © {new Date().getFullYear()} Cervejaria Virada. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </>
  );
};

export default Cervejas;