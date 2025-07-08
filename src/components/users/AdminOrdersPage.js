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
  const [expandedOrder, setExpandedOrder] = useState(null);

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
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(order => 
        order._id.toLowerCase().includes(term) ||
        (order.user?.nomeCompleto && order.user.nomeCompleto.toLowerCase().includes(term)) ||
        order.userEmail.toLowerCase().includes(term)
      );
    }
    
    if (statusFilter !== 'all') {
      result = result.filter(order => order.status === statusFilter);
    }
    
    setFilteredOrders(result);
  }, [searchTerm, statusFilter, orders]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/api/orders/${orderId}`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setOrders(prev => prev.map(order => 
        order._id === orderId ? { ...order, status: newStatus } : order
      ));
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao atualizar status');
    }
  };

  const toggleOrderDetails = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const formatDate = (dateString) => {
    const options = { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
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
          <div className="orders-list">
            {filteredOrders.map((order) => (
              <div key={order._id} className={`order-card ${expandedOrder === order._id ? 'expanded' : ''}`}>
                <div className="order-header" onClick={() => toggleOrderDetails(order._id)}>
                  <div className="order-id-status">
                    <span className="order-id">Pedido #{order._id.substring(0, 8)}</span>
                    <span className={`status-badge status-${order.status}`}>
                      {order.status || 'Processando'}
                    </span>
                  </div>
                  <div className="order-date-total">
                    <span className="order-date">{formatDate(order.createdAt)}</span>
                    <span className="order-total">R$ {order.total.toFixed(2)}</span>
                  </div>
                  <div className="order-toggle">
                    {expandedOrder === order._id ? '▲' : '▼'}
                  </div>
                </div>

                {expandedOrder === order._id && (
                  <div className="order-details">
                    <div className="details-grid">
                      <div className="customer-info">
                        <h4>Cliente</h4>
                        <p><strong>Nome:</strong> {order.user?.nomeCompleto || order.userEmail}</p>
                        <p><strong>Email:</strong> {order.userEmail}</p>
                        {order.user?.telefone && <p><strong>Telefone:</strong> {order.user.telefone}</p>}
                      </div>

                      <div className="shipping-info">
                        <h4>Endereço de Entrega</h4>
                        <p>
                          {order.shippingAddress.logradouro}, {order.shippingAddress.numero}
                          {order.shippingAddress.complemento && `, ${order.shippingAddress.complemento}`}
                        </p>
                        <p>
                          {order.shippingAddress.bairro}, {order.shippingAddress.cidade} - {order.shippingAddress.estado}
                        </p>
                        <p><strong>CEP:</strong> {order.shippingAddress.cep}</p>
                      </div>

                      <div className="payment-info">
                        <h4>Pagamento</h4>
                        <p><strong>Status:</strong> {order.paymentInfo?.paymentStatus || 'N/A'}</p>
                        <p><strong>Método:</strong> {order.paymentInfo?.paymentMethod || 'N/A'}</p>
                        {order.paidAt && <p><strong>Pago em:</strong> {formatDate(order.paidAt)}</p>}
                      </div>

                      <div className="order-items">
                        <h4>Itens do Pedido</h4>
                        <div className="items-list">
                          {order.items.map((item) => (
                            <div key={item._id || item.productId} className="order-item">
                              <div className="item-image-container">
                                <img 
                                  src={item.image || item.productId?.imagem || 'https://placehold.co/80x80/333/333?text=Produto'} 
                                  alt={item.name || item.productId?.nome} 
                                  className="item-image"
                                />
                                <span className="item-quantity">{item.quantity}x</span>
                              </div>
                              <div className="item-details">
                                <h5>{item.name || item.productId?.nome || 'Produto não disponível'}</h5>
                                <p className="item-type">{item.type || item.productId?.tipo || ''}</p>
                                <p className="item-price">R$ {item.price.toFixed(2)} cada</p>
                                <p className="item-subtotal">Subtotal: R$ {(item.price * item.quantity).toFixed(2)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="order-actions">
                      <div className="status-select-container">
                        <label>Atualizar status:</label>
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
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrdersPage;