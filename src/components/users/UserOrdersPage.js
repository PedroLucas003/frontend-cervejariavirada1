import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UserOrdersPage.css';

const API_URL = process.env.REACT_APP_API_URL;

const UserOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Você precisa estar logado para ver seus pedidos.');
          setLoading(false);
          return;
        }

        const response = await axios.get(`${API_URL}/api/orders/myorders`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setOrders(response.data.data); 
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Não foi possível carregar seus pedidos.';
        setError(errorMessage);
        console.error('Erro ao buscar pedidos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const toggleOrder = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  if (loading) return <div className="user-orders-loading">Carregando seus pedidos...</div>;
  if (error) return <div className="user-orders-error">{error}</div>;

  return (
    <div className="user-orders-page">
      <div className="user-orders-container">
        <div className="user-orders-header">
          <h1>Meus Pedidos</h1>
          <p className="orders-count">{orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'} encontrados</p>
        </div>

        {orders.length === 0 ? (
          <div className="no-orders">
            <div className="no-orders-content">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="10" cy="20.5" r="1"/><circle cx="18" cy="20.5" r="1"/><path d="M2.5 2.5h3l2.7 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6l1.6-8.4H7.1"/>
              </svg>
              <h3>Você ainda não fez nenhum pedido</h3>
              <p>Quando você fizer um pedido, ele aparecerá aqui.</p>
            </div>
          </div>
        ) : (
          <div className="orders-accordion">
            {orders.map((order) => (
              <div 
                key={order._id} 
                className={`order-card ${expandedOrder === order._id ? 'expanded' : ''}`}
              >
                <div 
                  className="order-summary" 
                  onClick={() => toggleOrder(order._id)}
                >
                  <div className="order-id-status">
                    <span className="order-id">Pedido #{order._id.substring(0, 8)}</span>
                    <span className={`status-badge status-${order.status}`}>
                      {order.status || 'Processando'}
                    </span>
                  </div>
                  <div className="order-date-total">
                    <span className="order-date">
                      {new Date(order.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </span>
                    <span className="order-total">R$ {order.total.toFixed(2)}</span>
                  </div>
                  <div className="order-toggle">
                    {expandedOrder === order._id ? '▲' : '▼'}
                  </div>
                </div>

                <div className="order-details">
                  <div className="order-items">
                    <h4>Itens do Pedido</h4>
                    {order.items.map((item) => (
                      item.productId ? (
                        <div key={item._id || item.productId._id} className="order-item">
                          <div className="item-image-container">
                            <img 
                              src={item.productId.imagem || 'https://placehold.co/80x80/333/333?text=Produto'} 
                              alt={item.productId.nome} 
                              className="item-image"
                              onError={(e) => {
                                e.target.src = 'https://placehold.co/80x80/333/333?text=Produto';
                              }}
                            />
                          </div>
                          <div className="item-info">
                            <h5>{item.productId.nome}</h5>
                            <div className="item-meta">
                              <span>Qtd: {item.quantity}</span>
                              <span>R$ {item.price.toFixed(2)} cada</span>
                              <span className="item-subtotal">R$ {(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div key={item._id} className="order-item-deleted">
                          <span>Produto não mais disponível</span>
                          <span>Qtd: {item.quantity}</span>
                        </div>
                      )
                    ))}
                  </div>

                  <div className="order-footer">
                    <div className="order-actions">
                      <button className="track-order">Acompanhar Pedido</button>
                      <button className="contact-support">Falar com Suporte</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserOrdersPage;