import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminOrdersPage.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

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

  if (loading) return <div className="loading-screen">Carregando...</div>;
  if (error) return <div className="global-error">{error}</div>;

  return (
    <div className="admin-orders-container">
      <h1>Todos os Pedidos</h1>
      
      {orders.length === 0 ? (
        <p>Nenhum pedido encontrado.</p>
      ) : (
        <div className="orders-grid">
          {orders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <h3>Pedido #{order._id.substring(0, 7)}</h3>
                <p><strong>Cliente:</strong> {order.user?.nomeCompleto || order.userEmail}</p>
                <p><strong>Data:</strong> {new Date(order.createdAt).toLocaleDateString('pt-BR')}</p>
                <p><strong>Status:</strong> <span className={`status-${order.status}`}>
                  {order.status || 'Processando'}
                </span></p>
                <p><strong>Total:</strong> R$ {order.total.toFixed(2)}</p>
              </div>

              <div className="order-items">
                <h4>Itens:</h4>
                {order.items.map((item) => (
                  <div key={item._id} className="order-item">
                    <img 
                      src={item.productId?.imagem || 'https://placehold.co/50x50'} 
                      alt={item.productId?.nome} 
                    />
                    <div>
                      <p>{item.productId?.nome || 'Produto não disponível'}</p>
                      <p>Qtd: {item.quantity} × R$ {item.price.toFixed(2)}</p>
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