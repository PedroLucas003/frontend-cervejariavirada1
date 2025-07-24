import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './EditUserPage.css';

const API_URL = process.env.REACT_APP_API_URL;

const EditUserPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nomeCompleto: '',
    email: '',
    cpf: '',
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

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/api/users/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const userData = response.data.data || response.data;

        setFormData({
          nomeCompleto: userData.nomeCompleto || '',
          email: userData.email || '',
          cpf: userData.cpf ? userData.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : '',
          dataNascimento: userData.dataNascimento ? userData.dataNascimento.split('T')[0] : '',
          telefone: userData.telefone ? userData.telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3') : '',
          enderecos: userData.enderecos && userData.enderecos.length > 0 ? [{
            ...userData.enderecos[0],
            cep: userData.enderecos[0].cep ? userData.enderecos[0].cep.replace(/(\d{5})(\d{3})/, '$1-$2') : ''
          }] : [{
            cep: '',
            logradouro: '',
            numero: '',
            complemento: '',
            bairro: '',
            cidade: '',
            estado: '',
            principal: true
          }],
          isAdmin: userData.isAdmin || false
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Erro ao carregar usuário');
        if (err.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id, navigate]);

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
        setFormData(prev => ({
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
      setFormData(prev => ({ ...prev, [name]: formattedValue }));
      return;
    }

    if (name === 'telefone') {
      const numericValue = value.replace(/\D/g, '');
      if (numericValue.length > 11) return;
      const formattedValue = numericValue.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      setFormData(prev => ({ ...prev, [name]: formattedValue }));
      return;
    }

    if (name === 'enderecos.0.cep') {
      const numericValue = value.replace(/\D/g, '');
      if (numericValue.length > 8) return;
      const formattedValue = numericValue.replace(/(\d{5})(\d{3})/, '$1-$2');
      setFormData(prev => ({
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
      setFormData(prev => ({
        ...prev,
        enderecos: [{
          ...prev.enderecos[0],
          [field]: type === 'checkbox' ? checked : value
        }]
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.nomeCompleto.trim()) {
      setError('Nome completo é obrigatório');
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('Email inválido');
      return;
    }

    if (!validateCPF(formData.cpf)) {
      setError('CPF inválido (deve ter 11 dígitos)');
      return;
    }

    if (!formData.dataNascimento) {
      setError('Data de nascimento é obrigatória');
      return;
    }

    if (!formData.telefone.replace(/\D/g, '').length >= 10) {
      setError('Telefone inválido');
      return;
    }

    if (!formData.enderecos[0].estado ||
      formData.enderecos[0].estado.length !== 2 ||
      !formData.enderecos[0].estado.match(/^[A-Za-z]{2}$/)) {
      setError('Estado deve ser a sigla com 2 letras (ex: SP, RJ)');
      return;
    }

    const userToSend = {
      nomeCompleto: formData.nomeCompleto,
      email: formData.email,
      cpf: formData.cpf.replace(/\D/g, ''),
      dataNascimento: formData.dataNascimento,
      telefone: formData.telefone.replace(/\D/g, ''),
      enderecos: [{
        ...formData.enderecos[0],
        cep: formData.enderecos[0].cep.replace(/\D/g, ''),
        estado: formData.enderecos[0].estado.toUpperCase()
      }],
      isAdmin: formData.isAdmin
    };

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `${API_URL}/api/users/${id}`,
        userToSend,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setSuccess(response.data.message || 'Usuário atualizado com sucesso!');
      setTimeout(() => navigate('/admin/users'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao atualizar usuário');
      console.error('Erro na atualização:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-user-loading">
        <div className="loading-spinner"></div>
        <p>Carregando usuário...</p>
      </div>
    );
  }

  return (
    <div className="edit-user-page">
      <div className="edit-user-container">
        <div className="edit-user-header">
          <h1>Editar Usuário</h1>
          <button
            onClick={() => navigate(-1)} // Isso volta para a página anterior
            className="back-btn"
          >
            &larr; Voltar
          </button>
        </div>

        {error && (
          <div className="edit-user-error">
            {error}
            <button onClick={() => setError(null)} className="close-btn">×</button>
          </div>
        )}

        {success && (
          <div className="edit-user-success">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="edit-user-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Nome Completo</label>
              <input
                type="text"
                name="nomeCompleto"
                value={formData.nomeCompleto}
                onChange={handleInputChange}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label>CPF</label>
              <input
                type="text"
                name="cpf"
                value={formData.cpf}
                onChange={handleInputChange}
                placeholder="000.000.000-00"
                maxLength="14"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label>Data de Nascimento</label>
              <input
                type="date"
                name="dataNascimento"
                value={formData.dataNascimento}
                onChange={handleInputChange}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label>Telefone</label>
              <input
                type="text"
                name="telefone"
                value={formData.telefone}
                onChange={handleInputChange}
                placeholder="(00) 00000-0000"
                maxLength="15"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="address-section">
            <h3>Endereço Principal</h3>

            <div className="form-grid">
              <div className="form-group">
                <label>CEP</label>
                <input
                  type="text"
                  name="enderecos.0.cep"
                  value={formData.enderecos[0].cep}
                  onChange={handleInputChange}
                  placeholder="00000-000"
                  maxLength="9"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label>Logradouro</label>
                <input
                  type="text"
                  name="enderecos.0.logradouro"
                  value={formData.enderecos[0].logradouro}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label>Número</label>
                <input
                  type="text"
                  name="enderecos.0.numero"
                  value={formData.enderecos[0].numero}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label>Complemento</label>
                <input
                  type="text"
                  name="enderecos.0.complemento"
                  value={formData.enderecos[0].complemento}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label>Bairro</label>
                <input
                  type="text"
                  name="enderecos.0.bairro"
                  value={formData.enderecos[0].bairro}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label>Cidade</label>
                <input
                  type="text"
                  name="enderecos.0.cidade"
                  value={formData.enderecos[0].cidade}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label>Estado (Sigla)</label>
                <input
                  type="text"
                  name="enderecos.0.estado"
                  value={formData.enderecos[0].estado}
                  onChange={handleInputChange}
                  placeholder="Ex: SP"
                  maxLength="2"
                  style={{ textTransform: 'uppercase' }}
                  required
                  disabled={isSubmitting}
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
                checked={formData.isAdmin}
                onChange={handleInputChange}
                disabled={isSubmitting}
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
              ) : 'Salvar Alterações'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/users')}
              className="cancel-btn"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserPage;