import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminOrdersPage.css';

const API_URL = process.env.REACT_APP_API_URL;

const AdminOrdersPage = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao carregar pedidos');
      if (err.response?.status === 401) navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!user?.isAdmin) navigate('/');
    fetchOrders();
  }, [user, navigate, fetchOrders]);

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
      setError('Erro ao atualizar status');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch = order.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         order._id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) return (
    <div className="adm-loading">
      <div className="adm-spinner"></div>
      <p>Carregando pedidos...</p>
    </div>
  );

  return (
    <div className="adm-container">
      <div className="adm-header">
        <h1>Painel de Pedidos</h1>
        <p className="adm-subtitle">Gerencie todos os pedidos dos clientes</p>
      </div>

      {error && <div className="adm-error">{error}</div>}

      <div className="adm-controls">
        <div className="adm-search">
          <input
            type="text"
            placeholder="Buscar pedidos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="adm-search-icon">🔍</span>
        </div>
        
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="adm-filter"
        >
          <option value="all">Todos Status</option>
          <option value="pending">Pendente</option>
          <option value="processing">Processando</option>
          <option value="shipped">Enviado</option>
          <option value="delivered">Entregue</option>
        </select>
      </div>

      <div className="adm-stats">
        <div className="adm-stat-card">
          <span>Total</span>
          <strong>{orders.length}</strong>
        </div>
        <div className="adm-stat-card">
          <span>Filtrados</span>
          <strong>{filteredOrders.length}</strong>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="adm-empty">
          <p>Nenhum pedido encontrado</p>
        </div>
      ) : (
        <div className="adm-orders-grid">
          {filteredOrders.map(order => (
            <div key={order._id} className="adm-order-card">
              <div className="adm-order-header">
                <div>
                  <h3>Pedido #{order._id.substring(0, 8).toUpperCase()}</h3>
                  <p>{new Date(order.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
                <select
                  value={order.status}
                  onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                  className={`adm-status adm-status-${order.status}`}
                >
                  <option value="pending">Pendente</option>
                  <option value="processing">Processando</option>
                  <option value="shipped">Enviado</option>
                  <option value="delivered">Entregue</option>
                </select>
              </div>

              <div className="adm-order-body">
                <div className="adm-order-customer">
                  <p><strong>Cliente:</strong> {order.userEmail}</p>
                  <p><strong>Total:</strong> R$ {order.total.toFixed(2)}</p>
                </div>

                <div className="adm-order-items">
                  <h4>Itens ({order.items.length})</h4>
                  {order.items.map(item => (
                    <div key={item._id} className="adm-order-item">
                      <img 
                        src={item.productId?.imagem || 'https://via.placeholder.com/50'} 
                        alt={item.productId?.nome} 
                      />
                      <div>
                        <p>{item.productId?.nome || 'Produto não disponível'}</p>
                        <p>{item.quantity} × R$ {item.price.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;