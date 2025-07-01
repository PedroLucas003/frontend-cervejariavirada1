import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminOrdersPage.css';

const API_URL = process.env.REACT_APP_API_URL;

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/api/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setOrders(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Erro ao carregar pedidos');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <div className="loading-screen">Carregando...</div>;
  if (error) return <div className="global-error">{error}</div>;

  return (
    <div className="admin-orders-container">
      <h1>Todos os Pedidos</h1>
      
      {orders.length === 0 ? (
        <p>Nenhum pedido encontrado.</p>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <div className="order-id-status">
                  <h3>Pedido #{order._id.substring(0, 7)}</h3>
                  <span className={`status-badge status-${order.status}`}>
                    {order.status || 'Processando'}
                  </span>
                </div>
                <p className="order-date">{formatDate(order.createdAt)}</p>
              </div>

              <div className="order-customer">
                <p><strong>Cliente:</strong> {order.user?.nomeCompleto || order.userEmail}</p>
              </div>

              <div className="order-summary">
                <p><strong>Total:</strong> R$ {order.total.toFixed(2)}</p>
                <p><strong>Itens:</strong> {order.items.length}</p>
              </div>

              <div className="order-items">
                <h4>Itens do Pedido:</h4>
                {order.items.map((item) => (
                  <div key={item._id} className="order-item">
                    <img 
                      src={item.productId?.imagem || 'https://placehold.co/50x50'} 
                      alt={item.productId?.nome} 
                      className="item-image"
                    />
                    <div className="item-details">
                      <p className="item-name">{item.productId?.nome || 'Produto não disponível'}</p>
                      <p className="item-quantity">Quantidade: {item.quantity}</p>
                      <p className="item-price">Preço unitário: R$ {item.price.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;