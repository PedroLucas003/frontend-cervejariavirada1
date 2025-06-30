import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminOrdersPage.css';

const API_URL = process.env.REACT_APP_API_URL;

const AdminOrdersPage = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !user.isAdmin) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
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

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === statusFilter);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_URL}/api/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setOrders(orders.map(order => 
        order._id === orderId ? { ...order, status: newStatus } : order
      ));
    } catch (err) {
      setError('Erro ao atualizar status do pedido');
      console.error(err);
    }
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <p>Carregando pedidos...</p>
    </div>
  );

  if (error) return <div className="global-error">{error}</div>;

  return (
    <div className="admin-orders-container">
      <div className="dashboard-container">
        <h1>Todos os Pedidos</h1>
        
        <div className="filters-container">
          <div className="status-filter">
            <label>Filtrar por status:</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos</option>
              <option value="pending">Pendente</option>
              <option value="processing">Processando</option>
              <option value="shipped">Enviado</option>
              <option value="delivered">Entregue</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
          
          <div className="stats-summary">
            <span>Total: {orders.length} pedidos</span>
            <span>Filtrados: {filteredOrders.length}</span>
          </div>
        </div>
        
        {filteredOrders.length === 0 ? (
          <p className="no-orders">Nenhum pedido encontrado.</p>
        ) : (
          <div className="orders-grid">
            {filteredOrders.map((order) => (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <h3>Pedido #{order._id.substring(0, 7)}</h3>
                  <p><strong>Cliente:</strong> {order.user?.nomeCompleto || order.userEmail}</p>
                  <p><strong>Data:</strong> {new Date(order.createdAt).toLocaleDateString('pt-BR')}</p>
                  <p>
                    <strong>Status:</strong> 
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                      className={`status-select status-${order.status}`}
                    >
                      <option value="pending">Pendente</option>
                      <option value="processing">Processando</option>
                      <option value="shipped">Enviado</option>
                      <option value="delivered">Entregue</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </p>
                  <p><strong>Total:</strong> R$ {order.total.toFixed(2)}</p>
                </div>

                <div className="order-items">
                  <h4>Itens ({order.items.length}):</h4>
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
                
                <div className="order-footer">
                  <p><strong>Endereço:</strong> {order.shippingAddress?.rua}, {order.shippingAddress?.numero}</p>
                  <p>{order.shippingAddress?.cidade} - {order.shippingAddress?.estado}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrdersPage;