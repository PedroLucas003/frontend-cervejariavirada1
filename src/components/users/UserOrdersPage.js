import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UserOrdersPage.css';

const API_URL = process.env.REACT_APP_API_URL;

const UserOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  if (loading) return <div className="loading-screen">Carregando pedidos...</div>;
  if (error) return <div className="global-error">{error}</div>;

  return (
    <div className="user-orders-page">
      <div className="user-orders-container">
        <h1>Meus Pedidos</h1>
        {orders.length === 0 ? (
          <p className="no-orders">Você ainda não fez nenhum pedido.</p>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <h3>Pedido #{order._id.substring(0, 7)}</h3>
                  <p><strong>Data:</strong> {new Date(order.createdAt).toLocaleDateString('pt-BR')}</p>
                  <p><strong>Status:</strong> <span className={`status status-${order.status}`}>{order.status || 'Processando'}</span></p>
                  <p><strong>Total:</strong> R$ {order.total.toFixed(2)}</p>
                </div>
                <div className="order-body">
                  <h4>Itens do Pedido:</h4>
                  {order.items.map((item) => (
                    item.productId ? (
                      <div key={item._id || item.productId._id} className="order-item">
                        <img 
                          src={item.productId.imagem || 'https://placehold.co/50x50/e2e8f0/e2e8f0?text=Cerva'} 
                          alt={item.productId.nome} 
                          className="item-image"
                          onError={(e) => {
                            e.target.src = 'https://placehold.co/50x50/e2e8f0/e2e8f0?text=Cerva';
                          }}
                        />
                        <div className="item-details">
                          <span>{item.productId.nome}</span>
                          <span>Qtd: {item.quantity}</span>
                          <span>Preço Unit.: R$ {item.price.toFixed(2)}</span>
                        </div>
                      </div>
                    ) : (
                      <div key={item._id} className="order-item-deleted">
                        <span>Produto não mais disponível</span>
                      </div>
                    )
                  ))}
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