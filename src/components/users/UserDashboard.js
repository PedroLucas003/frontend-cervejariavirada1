import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './UserDashboard.css';

const API_URL = process.env.REACT_APP_API_URL;

const UserDashboard = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState({
    nomeCompleto: '',
    email: '',
    isAdmin: false
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.isAdmin) navigate('/');
    fetchUsers();
  }, [user, navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/users`, newUser, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowForm(false);
      setNewUser({ nomeCompleto: '', email: '', isAdmin: false });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao criar usuário');
    }
  };

  if (loading) return (
    <div className="usr-loading">
      <div className="usr-spinner"></div>
    </div>
  );

  return (
    <div className="usr-container">
      <div className="usr-header">
        <h1>Gerenciamento de Usuários</h1>
        <p className="usr-subtitle">Administre os usuários do sistema</p>
      </div>

      {error && <div className="usr-error">{error}</div>}

      <div className="usr-controls">
        <div className="usr-search">
          <input
            type="text"
            placeholder="Buscar usuários..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="usr-search-icon">🔍</span>
        </div>
        
        <button 
          onClick={() => setShowForm(!showForm)}
          className="usr-add-btn"
        >
          {showForm ? 'Cancelar' : '+ Novo Usuário'}
        </button>
      </div>

      {showForm && (
        <div className="usr-form-container">
          <h3>Adicionar Novo Usuário</h3>
          <form onSubmit={handleCreateUser}>
            <div className="usr-form-group">
              <label>Nome Completo</label>
              <input
                type="text"
                value={newUser.nomeCompleto}
                onChange={(e) => setNewUser({...newUser, nomeCompleto: e.target.value})}
                required
              />
            </div>
            
            <div className="usr-form-group">
              <label>Email</label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                required
              />
            </div>
            
            <div className="usr-form-checkbox">
              <input
                type="checkbox"
                id="isAdmin"
                checked={newUser.isAdmin}
                onChange={(e) => setNewUser({...newUser, isAdmin: e.target.checked})}
              />
              <label htmlFor="isAdmin">Administrador</label>
            </div>
            
            <div className="usr-form-actions">
              <button type="submit" className="usr-submit-btn">
                Salvar Usuário
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="usr-stats">
        <div className="usr-stat-card">
          <span>Total de Usuários</span>
          <strong>{users.length}</strong>
        </div>
        <div className="usr-stat-card">
          <span>Administradores</span>
          <strong>{users.filter(u => u.isAdmin).length}</strong>
        </div>
      </div>

      <div className="usr-grid">
        {filteredUsers.length === 0 ? (
          <div className="usr-empty">
            <p>Nenhum usuário encontrado</p>
          </div>
        ) : (
          filteredUsers.map(user => (
            <div key={user._id} className={`usr-card ${user.isAdmin ? 'usr-admin' : ''}`}>
              <div className="usr-card-header">
                <h3>{user.nomeCompleto}</h3>
                {user.isAdmin && <span className="usr-admin-badge">ADMIN</span>}
              </div>
              
              <div className="usr-card-body">
                <p><span>Email:</span> {user.email}</p>
                <p><span>Criado em:</span> {new Date(user.createdAt).toLocaleDateString('pt-BR')}</p>
              </div>
              
              <div className="usr-card-actions">
                <button className="usr-edit-btn">Editar</button>
                <button className="usr-delete-btn">Excluir</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserDashboard;