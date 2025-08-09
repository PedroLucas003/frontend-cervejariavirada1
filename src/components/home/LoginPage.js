import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

const LoginPage = ({ onLogin, onError }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nomeCompleto: '',
    email: '',
    cpf: '',
    senha: '',
    confirmarSenha: '',
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
    }]
  });
  const [maskedValues, setMaskedValues] = useState({
    cpf: '',
    telefone: '',
    cep: ''
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

const API_URL = process.env.REACT_APP_API_URL;

  // Mask functions
  const applyCpfMask = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const applyPhoneMask = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const applyCepMask = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1');
  };

  // Validation functions
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateCpf = (cpf) => {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11) return false;
    
    // CPF validation algorithm
    let sum = 0;
    let remainder;
    
    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cpf.substring(i-1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10))) return false;
    
    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cpf.substring(i-1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(cpf.substring(10, 11))) return false;
    
    return true;
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  // Event handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('enderecos.')) {
      const parts = name.split('.');
      setFormData(prev => ({
        ...prev,
        enderecos: prev.enderecos.map((endereco, i) => 
          i === parseInt(parts[1]) ? { ...endereco, [parts[2]]: value } : endereco
        )
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCpfChange = (e) => {
    const { value } = e.target;
    const maskedValue = applyCpfMask(value);
    setMaskedValues(prev => ({ ...prev, cpf: maskedValue }));
    setFormData(prev => ({ ...prev, cpf: value.replace(/\D/g, '') }));
  };

  const handlePhoneChange = (e) => {
    const { value } = e.target;
    const maskedValue = applyPhoneMask(value);
    setMaskedValues(prev => ({ ...prev, telefone: maskedValue }));
    setFormData(prev => ({ ...prev, telefone: value.replace(/\D/g, '') }));
  };

  const handleCepChange = (e, index) => {
    const { value } = e.target;
    const maskedValue = applyCepMask(value);
    
    setFormData(prev => ({
      ...prev,
      enderecos: prev.enderecos.map((endereco, i) => 
        i === index ? { ...endereco, cep: value.replace(/\D/g, '') } : endereco
      )
    }));
    
    setMaskedValues(prev => ({ ...prev, cep: maskedValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Basic validations
    const newErrors = {};

    if (!isLoginMode) {
      if (!formData.nomeCompleto.trim()) {
        newErrors.nomeCompleto = 'Nome completo é obrigatório';
      }
      
      if (!validateCpf(formData.cpf)) {
        newErrors.cpf = 'CPF inválido';
      }
      
      if (!formData.dataNascimento) {
        newErrors.dataNascimento = 'Data de nascimento é obrigatória';
      }
      
      if (formData.telefone.replace(/\D/g, '').length < 10) {
        newErrors.telefone = 'Telefone inválido';
      }
      
      if (formData.senha !== formData.confirmarSenha) {
        newErrors.confirmarSenha = 'As senhas não coincidem';
      }
    }

    if (!validateEmail(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!validatePassword(formData.senha)) {
      newErrors.senha = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (!isLoginMode) {
      if (!formData.enderecos[0].cep || formData.enderecos[0].cep.length !== 8) {
        newErrors.cep = 'CEP inválido';
      }
      
      if (!formData.enderecos[0].logradouro) {
        newErrors.logradouro = 'Logradouro é obrigatório';
      }
      
      if (!formData.enderecos[0].numero) {
        newErrors.numero = 'Número é obrigatório';
      }
      
      if (!formData.enderecos[0].bairro) {
        newErrors.bairro = 'Bairro é obrigatório';
      }
      
      if (!formData.enderecos[0].cidade) {
        newErrors.cidade = 'Cidade é obrigatória';
      }
      
      if (!formData.enderecos[0].estado) {
        newErrors.estado = 'Estado é obrigatório';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      const endpoint = isLoginMode ? '/login' : '/register';
      const { data } = await axios.post(`${API_URL}/api/auth${endpoint}`, formData);
      
      onLogin(data.token, data.user);
      navigate('/');
    } catch (error) {
      if (error.response) {
        setErrors({ submit: error.response.data.message });
        onError(error.response.data.message);
      } else {
        setErrors({ submit: 'Erro ao conectar com o servidor' });
        onError('Erro ao conectar com o servidor');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCepBlur = async (index) => {
    const cep = formData.enderecos[index].cep.replace(/\D/g, '');
    if (cep.length !== 8) return;

    try {
      const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
      const { logradouro, bairro, localidade, uf } = response.data;

      setFormData(prev => ({
        ...prev,
        enderecos: prev.enderecos.map((endereco, i) => 
          i === index ? { 
            ...endereco,
            logradouro: logradouro || '',
            bairro: bairro || '',
            cidade: localidade || '',
            estado: uf || ''
          } : endereco
        )
      }));
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      setErrors(prev => ({ ...prev, cep: 'CEP não encontrado' }));
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setErrors({});
    setFormData({
      nomeCompleto: '',
      email: '',
      cpf: '',
      senha: '',
      confirmarSenha: '',
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
      }]
    });
    setMaskedValues({
      cpf: '',
      telefone: '',
      cep: ''
    });
  };

  return (
    <div className="login-container">
      <div className="form-container">
        <h2>{isLoginMode ? 'Login' : 'Cadastre-se'}</h2>
        <p className="subtitle">
          {isLoginMode 
            ? 'Entre para acessar sua conta' 
            : 'Crie sua conta para começar'}
        </p>

        {errors.submit && (
          <div className="error-message">
            {errors.submit}
          </div>
        )}

        <form className="form" onSubmit={handleSubmit}>
          {!isLoginMode && (
            <>
              <div className="form-group">
                <label htmlFor="nomeCompleto">Nome Completo</label>
                <input
                  type="text"
                  id="nomeCompleto"
                  name="nomeCompleto"
                  value={formData.nomeCompleto}
                  onChange={handleChange}
                  placeholder=" "
                  required
                />
                {errors.nomeCompleto && (
                  <span className="field-error">{errors.nomeCompleto}</span>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cpf">CPF</label>
                  <input
                    type="text"
                    id="cpf"
                    name="cpf"
                    value={maskedValues.cpf}
                    onChange={handleCpfChange}
                    maxLength="14"
                    placeholder=" "
                    required
                  />
                  {errors.cpf && (
                    <span className="field-error">{errors.cpf}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="dataNascimento">Data de Nascimento</label>
                  <input
                    type="date"
                    id="dataNascimento"
                    name="dataNascimento"
                    value={formData.dataNascimento}
                    onChange={handleChange}
                    placeholder=" "
                    required
                  />
                  {errors.dataNascimento && (
                    <span className="field-error">{errors.dataNascimento}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="telefone">Telefone</label>
                <input
                  type="tel"
                  id="telefone"
                  name="telefone"
                  value={maskedValues.telefone}
                  onChange={handlePhoneChange}
                  maxLength="15"
                  placeholder=" "
                  required
                />
                {errors.telefone && (
                  <span className="field-error">{errors.telefone}</span>
                )}
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder=" "
              required
            />
            {errors.email && (
              <span className="field-error">{errors.email}</span>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="senha">Senha</label>
              <input
                type="password"
                id="senha"
                name="senha"
                value={formData.senha}
                onChange={handleChange}
                placeholder=" "
                required
              />
              {errors.senha && (
                <span className="field-error">{errors.senha}</span>
              )}
            </div>

            {!isLoginMode && (
              <div className="form-group">
                <label htmlFor="confirmarSenha">Confirmar Senha</label>
                <input
                  type="password"
                  id="confirmarSenha"
                  name="confirmarSenha"
                  value={formData.confirmarSenha}
                  onChange={handleChange}
                  placeholder=" "
                  required
                />
                {errors.confirmarSenha && (
                  <span className="field-error">{errors.confirmarSenha}</span>
                )}
              </div>
            )}
          </div>

          {!isLoginMode && (
            <div className="address-section">
              <h3>Endereço Principal</h3>
              
              <div className="form-group">
                <label htmlFor="enderecos.0.cep">CEP</label>
                <input
                  type="text"
                  id="enderecos.0.cep"
                  name="enderecos.0.cep"
                  value={maskedValues.cep}
                  onChange={(e) => handleCepChange(e, 0)}
                  onBlur={() => handleCepBlur(0)}
                  maxLength="9"
                  placeholder=" "
                  required
                />
                {errors.cep && (
                  <span className="field-error">{errors.cep}</span>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="enderecos.0.logradouro">Logradouro</label>
                  <input
                    type="text"
                    id="enderecos.0.logradouro"
                    name="enderecos.0.logradouro"
                    value={formData.enderecos[0].logradouro}
                    onChange={handleChange}
                    placeholder=" "
                    required
                  />
                  {errors.logradouro && (
                    <span className="field-error">{errors.logradouro}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="enderecos.0.numero">Número</label>
                  <input
                    type="text"
                    id="enderecos.0.numero"
                    name="enderecos.0.numero"
                    value={formData.enderecos[0].numero}
                    onChange={handleChange}
                    placeholder=" "
                    required
                  />
                  {errors.numero && (
                    <span className="field-error">{errors.numero}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="enderecos.0.complemento">Complemento</label>
                <input
                  type="text"
                  id="enderecos.0.complemento"
                  name="enderecos.0.complemento"
                  value={formData.enderecos[0].complemento}
                  onChange={handleChange}
                  placeholder=" "
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="enderecos.0.bairro">Bairro</label>
                  <input
                    type="text"
                    id="enderecos.0.bairro"
                    name="enderecos.0.bairro"
                    value={formData.enderecos[0].bairro}
                    onChange={handleChange}
                    placeholder=" "
                    required
                  />
                  {errors.bairro && (
                    <span className="field-error">{errors.bairro}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="enderecos.0.cidade">Cidade</label>
                  <input
                    type="text"
                    id="enderecos.0.cidade"
                    name="enderecos.0.cidade"
                    value={formData.enderecos[0].cidade}
                    onChange={handleChange}
                    placeholder=" "
                    required
                  />
                  {errors.cidade && (
                    <span className="field-error">{errors.cidade}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="enderecos.0.estado">Estado</label>
                  <input
                    type="text"
                    id="enderecos.0.estado"
                    name="enderecos.0.estado"
                    value={formData.enderecos[0].estado}
                    onChange={handleChange}
                    maxLength="2"
                    placeholder=" "
                    required
                  />
                  {errors.estado && (
                    <span className="field-error">{errors.estado}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="form-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Processando...
              </>
            ) : isLoginMode ? 'Entrar' : 'Cadastrar'}
          </button>
        </form>

        <div className="toggle-mode">
          {isLoginMode ? 'Não tem uma conta?' : 'Já tem uma conta?'}
          <button 
            type="button" 
            className="toggle-btn"
            onClick={toggleMode}
          >
            {isLoginMode ? 'Cadastre-se' : 'Faça login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;