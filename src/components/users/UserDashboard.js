import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './UserDashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

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
    
    // Formatar CPF enquanto digita
    if (name === 'cpf') {
      const numericValue = value.replace(/\D/g, '');
      if (numericValue.length > 11) return;
      const formattedValue = numericValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      setNewUser(prev => ({ ...prev, [name]: formattedValue }));
      return;
    }
    
    // Formatar telefone enquanto digita
    if (name === 'telefone') {
      const numericValue = value.replace(/\D/g, '');
      if (numericValue.length > 11) return;
      const formattedValue = numericValue.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      setNewUser(prev => ({ ...prev, [name]: formattedValue }));
      return;
    }
    
    // Formatar CEP enquanto digita
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
      
      // Buscar endereço quando CEP estiver completo
      if (numericValue.length === 8) {
        fetchAddressByCEP(numericValue);
      }
      return;
    }
    
    // Para campos aninhados no array de endereços
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
    
    // Para campos normais
    setNewUser(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Validações básicas
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

    // Validação do estado (2 caracteres, maiúsculos)
    if (!newUser.enderecos[0].estado || 
        newUser.enderecos[0].estado.length !== 2 ||
        !newUser.enderecos[0].estado.match(/^[A-Za-z]{2}$/)) {
      setError('Estado deve ser a sigla com 2 letras (ex: SP, RJ)');
      return;
    }
    
    // Preparar dados para envio (remover formatação)
    const userToSend = {
      ...newUser,
      cpf: newUser.cpf.replace(/\D/g, ''),
      telefone: newUser.telefone.replace(/\D/g, ''),
      enderecos: [{
        ...newUser.enderecos[0],
        cep: newUser.enderecos[0].cep.replace(/\D/g, ''),
        estado: newUser.enderecos[0].estado.toUpperCase() // Garante que o estado fique em maiúsculas
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
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando usuários...</p>
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      <h2>Gerenciamento de Usuários</h2>
      
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)} className="close-btn">×</button>
        </div>
      )}

      {successMessage && (
        <div className="success-message">
          {successMessage}
          <button onClick={() => setSuccessMessage('')}>×</button>
        </div>
      )}

      <div className="controls">
        <input
          type="text"
          placeholder="Buscar usuários..."
          className="search-input"
        />
        <button 
          onClick={() => setShowAddForm(!showAddForm)} 
          className="add-user-btn"
        >
          {showAddForm ? 'Cancelar' : 'Adicionar Usuário'}
        </button>
      </div>

      {showAddForm && (
        <div className="add-user-form-container">
          <h3>Adicionar Novo Usuário</h3>
          <form onSubmit={handleAddUser} className="add-user-form">
            <div className="form-row">
              <div className="form-group">
                <label>Nome Completo:</label>
                <input
                  type="text"
                  name="nomeCompleto"
                  value={newUser.nomeCompleto}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  name="email"
                  value={newUser.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>CPF:</label>
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
                <label>Senha:</label>
                <input
                  type="password"
                  name="senha"
                  value={newUser.senha}
                  onChange={handleInputChange}
                  minLength="6"
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Data de Nascimento:</label>
                <input
                  type="date"
                  name="dataNascimento"
                  value={newUser.dataNascimento}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Telefone:</label>
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
              
              <div className="form-row">
                <div className="form-group">
                  <label>CEP:</label>
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
                  <label>Logradouro:</label>
                  <input
                    type="text"
                    name="enderecos.0.logradouro"
                    value={newUser.enderecos[0].logradouro}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Número:</label>
                  <input
                    type="text"
                    name="enderecos.0.numero"
                    value={newUser.enderecos[0].numero}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Complemento:</label>
                  <input
                    type="text"
                    name="enderecos.0.complemento"
                    value={newUser.enderecos[0].complemento}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Bairro:</label>
                  <input
                    type="text"
                    name="enderecos.0.bairro"
                    value={newUser.enderecos[0].bairro}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Cidade:</label>
                  <input
                    type="text"
                    name="enderecos.0.cidade"
                    value={newUser.enderecos[0].cidade}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Estado (Sigla):</label>
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
            
            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="isAdmin"
                  checked={newUser.isAdmin}
                  onChange={handleInputChange}
                />
                Administrador
              </label>
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Salvando...' : 'Salvar Usuário'}
              </button>
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)}
                className="cancel-btn"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="user-list">
        {users.length === 0 ? (
          <div className="no-results">
            Nenhum usuário encontrado
          </div>
        ) : (
          users.map(user => (
            <div key={user._id} className="user-card">
              <div className="user-info">
                <h3>
                  {user.nomeCompleto}
                  {user.isAdmin && <span className="admin-badge">Admin</span>}
                </h3>
                <p>Email: {user.email}</p>
                <p>CPF: {user.cpf}</p>
                <p>Telefone: {user.telefone}</p>
                {user.enderecos && user.enderecos[0] && (
                  <p>Endereço: {user.enderecos[0].cidade}/{user.enderecos[0].estado}</p>
                )}
              </div>
              
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
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserDashboard;