import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './UserDashboard.css';

const API_URL = process.env.REACT_APP_API_URL;

const UserDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({
    nomeCompleto: '',
    email: '',
    cpf: '',
    senha: '',
    dataNascimento: '',
    telefone: '',
    enderecos: [{
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      principal: true
    }],
    isAdmin: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/api/users`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        setUsers(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Erro ao carregar usuários');
        if (err.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [navigate]);

  const filteredUsers = users.filter(user => {
    const term = searchTerm.toLowerCase();
    return (
      user.nomeCompleto.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.cpf.includes(term)
    );
  });

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateCPF = (cpf) => {
    cpf = cpf.replace(/\D/g, '');
    return cpf.length === 11;
  };

  const fetchAddressByCEP = async (cep) => {
    cep = cep.replace(/\D/g, '');
    if (cep.length !== 8) return;
    
    try {
      const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
      const data = response.data;
      
      if (!data.erro) {
        setNewUser(prev => ({
          ...prev,
          enderecos: [{
            ...prev.enderecos[0],
            logradouro: data.logradouro || '',
            bairro: data.bairro || '',
            cidade: data.localidade || '',
            estado: data.uf || '',
            complemento: data.complemento || ''
          }]
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'cpf') {
      const numericValue = value.replace(/\D/g, '');
      if (numericValue.length > 11) return;
      const formattedValue = numericValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      setNewUser(prev => ({ ...prev, [name]: formattedValue }));
      return;
    }
    
    if (name === 'telefone') {
      const numericValue = value.replace(/\D/g, '');
      if (numericValue.length > 11) return;
      const formattedValue = numericValue.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      setNewUser(prev => ({ ...prev, [name]: formattedValue }));
      return;
    }
    
    if (name === 'enderecos.0.cep') {
      const numericValue = value.replace(/\D/g, '');
      if (numericValue.length > 8) return;
      const formattedValue = numericValue.replace(/(\d{5})(\d{3})/, '$1-$2');
      setNewUser(prev => ({
        ...prev,
        enderecos: [{
          ...prev.enderecos[0],
          cep: formattedValue
        }]
      }));
      
      if (numericValue.length === 8) {
        fetchAddressByCEP(numericValue);
      }
      return;
    }
    
    if (name.startsWith('enderecos.0.')) {
      const field = name.split('.')[2];
      setNewUser(prev => ({
        ...prev,
        enderecos: [{
          ...prev.enderecos[0],
          [field]: type === 'checkbox' ? checked : value
        }]
      }));
      return;
    }
    
    setNewUser(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!newUser.nomeCompleto.trim()) {
      setError('Nome completo é obrigatório');
      return;
    }
    
    if (!validateEmail(newUser.email)) {
      setError('Email inválido');
      return;
    }
    
    if (!validateCPF(newUser.cpf)) {
      setError('CPF inválido (deve ter 11 dígitos)');
      return;
    }
    
    if (!newUser.senha || newUser.senha.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    if (!newUser.dataNascimento) {
      setError('Data de nascimento é obrigatória');
      return;
    }
    
    if (!newUser.telefone.replace(/\D/g, '').length >= 10) {
      setError('Telefone inválido');
      return;
    }

    if (!newUser.enderecos[0].estado || 
        newUser.enderecos[0].estado.length !== 2 ||
        !newUser.enderecos[0].estado.match(/^[A-Za-z]{2}$/)) {
      setError('Estado deve ser a sigla com 2 letras (ex: SP, RJ)');
      return;
    }
    
    const userToSend = {
      ...newUser,
      cpf: newUser.cpf.replace(/\D/g, ''),
      telefone: newUser.telefone.replace(/\D/g, ''),
      enderecos: [{
        ...newUser.enderecos[0],
        cep: newUser.enderecos[0].cep.replace(/\D/g, ''),
        estado: newUser.enderecos[0].estado.toUpperCase()
      }]
    };
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/users`, userToSend, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setUsers(prev => [...prev, response.data.data]);
      setNewUser({
        nomeCompleto: '',
        email: '',
        cpf: '',
        senha: '',
        dataNascimento: '',
        telefone: '',
        enderecos: [{
          cep: '',
          logradouro: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          estado: '',
          principal: true
        }],
        isAdmin: false
      });
      setSuccessMessage('Usuário criado com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowAddForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao criar usuário');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja deletar este usuário?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/users/${id}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setUsers(prev => prev.filter(user => user._id !== id));
      setSuccessMessage('Usuário removido com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao deletar usuário');
    }
  };

  if (loading) {
    return (
      <div className="user-dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Carregando usuários...</p>
      </div>
    );
  }

  return (
    <div className="user-dashboard-page">
      <div className="user-dashboard-container">
        <div className="dashboard-header">
          <h1>Painel de Usuários</h1>
          <p className="users-count">{users.length} {users.length === 1 ? 'usuário' : 'usuários'} cadastrados</p>
        </div>
        
        {error && (
          <div className="dashboard-error">
            {error}
            <button onClick={() => setError(null)} className="close-btn">×</button>
          </div>
        )}

        {successMessage && (
          <div className="dashboard-success">
            {successMessage}
            <button onClick={() => setSuccessMessage('')} className="close-btn">×</button>
          </div>
        )}

        <div className="dashboard-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Buscar por nome, email ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          
          <button 
            onClick={() => setShowAddForm(!showAddForm)} 
            className={`add-user-btn ${showAddForm ? 'cancel' : ''}`}
          >
            {showAddForm ? 'Cancelar' : 'Adicionar Usuário'}
          </button>
        </div>

        {showAddForm && (
          <div className="add-user-form-container">
            <h3>Adicionar Novo Usuário</h3>
            <form onSubmit={handleAddUser} className="add-user-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Nome Completo</label>
                  <input
                    type="text"
                    name="nomeCompleto"
                    value={newUser.nomeCompleto}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={newUser.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>CPF</label>
                  <input
                    type="text"
                    name="cpf"
                    value={newUser.cpf}
                    onChange={handleInputChange}
                    placeholder="000.000.000-00"
                    maxLength="14"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Senha</label>
                  <input
                    type="password"
                    name="senha"
                    value={newUser.senha}
                    onChange={handleInputChange}
                    minLength="6"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Data de Nascimento</label>
                  <input
                    type="date"
                    name="dataNascimento"
                    value={newUser.dataNascimento}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Telefone</label>
                  <input
                    type="text"
                    name="telefone"
                    value={newUser.telefone}
                    onChange={handleInputChange}
                    placeholder="(00) 00000-0000"
                    maxLength="15"
                    required
                  />
                </div>
              </div>

              <div className="address-section">
                <h4>Endereço Principal</h4>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label>CEP</label>
                    <input
                      type="text"
                      name="enderecos.0.cep"
                      value={newUser.enderecos[0].cep}
                      onChange={handleInputChange}
                      placeholder="00000-000"
                      maxLength="9"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Logradouro</label>
                    <input
                      type="text"
                      name="enderecos.0.logradouro"
                      value={newUser.enderecos[0].logradouro}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Número</label>
                    <input
                      type="text"
                      name="enderecos.0.numero"
                      value={newUser.enderecos[0].numero}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Complemento</label>
                    <input
                      type="text"
                      name="enderecos.0.complemento"
                      value={newUser.enderecos[0].complemento}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Bairro</label>
                    <input
                      type="text"
                      name="enderecos.0.bairro"
                      value={newUser.enderecos[0].bairro}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Cidade</label>
                    <input
                      type="text"
                      name="enderecos.0.cidade"
                      value={newUser.enderecos[0].cidade}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Estado (Sigla)</label>
                    <input
                      type="text"
                      name="enderecos.0.estado"
                      value={newUser.enderecos[0].estado}
                      onChange={handleInputChange}
                      placeholder="Ex: SP"
                      maxLength="2"
                      style={{ textTransform: 'uppercase' }}
                      required
                    />
                    <small className="hint">Digite a sigla do estado (2 letras)</small>
                  </div>
                </div>
              </div>
              
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="isAdmin"
                    checked={newUser.isAdmin}
                    onChange={handleInputChange}
                  />
                  <span className="checkmark"></span>
                  Administrador
                </label>
              </div>
              
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner"></span>
                      Salvando...
                    </>
                  ) : 'Salvar Usuário'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>CPF</th>
                <th>Tipo</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr className="no-results">
                  <td colSpan="5">
                    <div className="no-results-content">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="8.5" cy="7" r="4"></circle>
                        <line x1="18" y1="8" x2="23" y2="13"></line>
                        <line x1="23" y1="8" x2="18" y2="13"></line>
                      </svg>
                      <p>Nenhum usuário encontrado</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user._id} className="user-row">
                    <td>
                      <div className="user-info">
                        <span className="user-name">{user.nomeCompleto}</span>
                        <span className="user-phone">{user.telefone}</span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>{user.cpf}</td>
                    <td>
                      <span className={`user-type ${user.isAdmin ? 'admin' : 'regular'}`}>
                        {user.isAdmin ? 'Admin' : 'Regular'}
                      </span>
                    </td>
                    <td>
                      <div className="user-actions">
                        <button 
                          onClick={() => navigate(`/admin/users/edit/${user._id}`)}
                          className="edit-btn"
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => handleDelete(user._id)}
                          className="delete-btn"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;