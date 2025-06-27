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
  const navigate = useNavigate();

  const getBeerImage = useCallback((beerType) => {
    const images = {
      'IPA': '/ipa-beer.png',
      'Stout': '/stout-beer.png',
      'Weiss': '/weiss-beer.png',
      'Pilsen': '/pilsen-beer.png',
      'Outro': '/default-beer.png'
    };
    return images[beerType] || images['Outro'];
  }, []);

  const fetchBeers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_URL}/api/beers/public`, {
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      withCredentials: true
    });
      
      if (!response.data || !response.data.success || !Array.isArray(response.data.data)) {
        throw new Error('Estrutura de dados inválida');
      }

      const formattedBeers = response.data.data.map(beer => ({
        _id: beer._id,
        nome: `Virada ${beer.beerType}`,
        tipo: beer.beerType,
        beerType: beer.beerType,
        descricao: beer.description,
        imagem: getBeerImage(beer.beerType),
        teor: beer.alcoholContent,
        ano: beer.yearCreated,
        price: 0.01, // Alterado para 1 centavo
        quantity: beer.quantity
      }));

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
    <section id="cervejas-section" className="cervejas-section">
      <h2 className="section-title">Nossas <span className="destaque">CERVEJAS</span> Históricas</h2>

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
          <div key={cerveja._id} className="cerveja-card">
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
              <p className="cerveja-desc">{cerveja.descricao}</p>
              <div className="cerveja-stock">
                <span className="stock-label">Estoque:</span>
                <span className={`stock-value ${stock[cerveja._id] > 0 ? 'in-stock' : 'out-of-stock'}`}>
                  {stock[cerveja._id]} unidades
                </span>
              </div>
              <span className="cerveja-teor">{cerveja.teor}</span>
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
  );
};

export default Cervejas;