import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminOrdersPage.css';

const API_URL = process.env.REACT_APP_API_URL;

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/api/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setOrders(response.data.data);
        setFilteredOrders(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Erro ao carregar pedidos');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  useEffect(() => {
    let result = orders;
    
    // Filtrar por termo de pesquisa
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(order => 
        order._id.toLowerCase().includes(term) ||
        (order.user?.nomeCompleto && order.user.nomeCompleto.toLowerCase().includes(term)) ||
        order.userEmail.toLowerCase().includes(term)
      );
    }
    
    // Filtrar por status
    if (statusFilter !== 'all') {
      result = result.filter(order => order.status === statusFilter);
    }
    
    setFilteredOrders(result);
  }, [searchTerm, statusFilter, orders]);

  const handleStatusChange = (orderId, newStatus) => {
    // Implemente a lógica para atualizar o status do pedido
    console.log(`Atualizar pedido ${orderId} para status ${newStatus}`);
  };

  if (loading) return <div className="admin-orders-loading">Carregando...</div>;
  if (error) return <div className="admin-orders-error">{error}</div>;

  return (
    <div className="admin-orders-page">
      <div className="admin-orders-container">
        <h1>Painel de Pedidos</h1>
        
        <div className="admin-orders-filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="Pesquisar por ID, nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="search-icon">🔍</i>
          </div>
          
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
        </div>
        
        <div className="orders-summary">
          <div className="summary-card total">
            <h3>Total de Pedidos</h3>
            <p>{orders.length}</p>
          </div>
          <div className="summary-card pending">
            <h3>Pendentes</h3>
            <p>{orders.filter(o => o.status === 'pending').length}</p>
          </div>
          <div className="summary-card processing">
            <h3>Processando</h3>
            <p>{orders.filter(o => o.status === 'processing').length}</p>
          </div>
          <div className="summary-card revenue">
            <h3>Faturamento</h3>
            <p>R$ {orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}</p>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="no-orders-found">
            <p>Nenhum pedido encontrado com os filtros atuais.</p>
          </div>
        ) : (
          <div className="orders-table-container">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Itens</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order._id}>
                    <td>#{order._id.substring(0, 8)}</td>
                    <td>
                      {order.user?.nomeCompleto || order.userEmail}
                    </td>
                    <td>
                      {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td>
                      <span className={`status-badge status-${order.status}`}>
                        {order.status || 'Processando'}
                      </span>
                    </td>
                    <td>R$ {order.total.toFixed(2)}</td>
                    <td className="order-items-cell">
                      {order.items.map(item => (
                        <div key={item._id} className="item-chip">
                          {item.quantity}x {item.productId?.nome || 'Produto'}
                        </div>
                      ))}
                    </td>
                    <td>
                      <select 
                        value={order.status} 
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        className="status-select"
                      >
                        <option value="pending">Pendente</option>
                        <option value="processing">Processando</option>
                        <option value="shipped">Enviado</option>
                        <option value="delivered">Entregue</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrdersPage;