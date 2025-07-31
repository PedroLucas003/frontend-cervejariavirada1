import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Componente principal da página de login/cadastro
const LoginPage = ({ onLogin, onError }) => {
  // State para alternar entre modo de login e cadastro
  const [isLoginMode, setIsLoginMode] = useState(true);
  // State para controlar o estado de carregamento durante a submissão
  const [isLoading, setIsLoading] = useState(false);
  // State para armazenar os dados do formulário
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
  // State para armazenar os valores mascarados para exibição
  const [maskedValues, setMaskedValues] = useState({
    cpf: '',
    telefone: '',
    cep: ''
  });
  // State para armazenar erros de validação
  const [errors, setErrors] = useState({});
  // Hook de navegação do React Router
  const navigate = useNavigate();

  // URL da API, obtida de uma variável de ambiente
  const API_URL = process.env.REACT_APP_API_URL;

  // Funções de máscara
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

  // Funções de validação
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateCpf = (cpf) => {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11) return false;
    
    // Algoritmo de validação de CPF
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

  // Funções de tratamento de eventos
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

  // Função de submissão do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

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

  // Busca o endereço pelo CEP
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

  // Alterna o modo de formulário
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
    <div className="login-container min-h-screen flex items-center justify-center p-4 bg-gray-950 text-white font-inter">
      {/* Estilo para a borda com gradiente, já que o Tailwind não tem nativamente */}
      <style>{`
        .form-container {
          background: #121212;
          background: linear-gradient(145deg, transparent 35%, #e81cff, #40c9ff) border-box;
          border-width: 2px;
          border-style: solid;
          border-color: transparent;
        }
      `}</style>
      <div className="form-container w-full max-w-lg p-8 rounded-2xl flex flex-col gap-5 box-border">
        <h2 className="text-center text-3xl font-bold">
          {isLoginMode ? 'Login' : 'Cadastre-se'}
        </h2>
        <p className="text-center text-gray-400 text-base -mt-4">
          {isLoginMode 
            ? 'Entre para acessar sua conta' 
            : 'Crie sua conta para começar'}
        </p>

        {errors.submit && (
          <div className="bg-red-950 text-red-300 p-3 rounded-lg text-sm">
            {errors.submit}
          </div>
        )}

        <form className="form flex flex-col gap-5" onSubmit={handleSubmit}>
          {!isLoginMode && (
            <>
              <div className="flex flex-col gap-1">
                <label htmlFor="nomeCompleto" className="text-gray-400 font-semibold text-xs">Nome Completo</label>
                <input
                  type="text"
                  id="nomeCompleto"
                  name="nomeCompleto"
                  value={formData.nomeCompleto}
                  onChange={handleChange}
                  className="w-full p-3 rounded-md bg-transparent border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Seu nome completo"
                  required
                />
                {errors.nomeCompleto && (
                  <span className="text-red-300 text-xs mt-1">{errors.nomeCompleto}</span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-5">
                <div className="flex-1 flex flex-col gap-1">
                  <label htmlFor="cpf" className="text-gray-400 font-semibold text-xs">CPF</label>
                  <input
                    type="text"
                    id="cpf"
                    name="cpf"
                    value={maskedValues.cpf}
                    onChange={handleCpfChange}
                    maxLength="14"
                    className="w-full p-3 rounded-md bg-transparent border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="000.000.000-00"
                    required
                  />
                  {errors.cpf && (
                    <span className="text-red-300 text-xs mt-1">{errors.cpf}</span>
                  )}
                </div>

                <div className="flex-1 flex flex-col gap-1">
                  <label htmlFor="dataNascimento" className="text-gray-400 font-semibold text-xs">Data de Nascimento</label>
                  <input
                    type="date"
                    id="dataNascimento"
                    name="dataNascimento"
                    value={formData.dataNascimento}
                    onChange={handleChange}
                    className="w-full p-3 rounded-md bg-transparent border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                    required
                  />
                  {errors.dataNascimento && (
                    <span className="text-red-300 text-xs mt-1">{errors.dataNascimento}</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="telefone" className="text-gray-400 font-semibold text-xs">Telefone</label>
                <input
                  type="tel"
                  id="telefone"
                  name="telefone"
                  value={maskedValues.telefone}
                  onChange={handlePhoneChange}
                  maxLength="15"
                  className="w-full p-3 rounded-md bg-transparent border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="(00) 90000-0000"
                  required
                />
                {errors.telefone && (
                  <span className="text-red-300 text-xs mt-1">{errors.telefone}</span>
                )}
              </div>
            </>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-gray-400 font-semibold text-xs">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 rounded-md bg-transparent border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="seu-email@exemplo.com"
              required
            />
            {errors.email && (
              <span className="text-red-300 text-xs mt-1">{errors.email}</span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-5">
            <div className="flex-1 flex flex-col gap-1">
              <label htmlFor="senha" className="text-gray-400 font-semibold text-xs">Senha</label>
              <input
                type="password"
                id="senha"
                name="senha"
                value={formData.senha}
                onChange={handleChange}
                className="w-full p-3 rounded-md bg-transparent border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="••••••••"
                required
              />
              {errors.senha && (
                <span className="text-red-300 text-xs mt-1">{errors.senha}</span>
              )}
            </div>

            {!isLoginMode && (
              <div className="flex-1 flex flex-col gap-1">
                <label htmlFor="confirmarSenha" className="text-gray-400 font-semibold text-xs">Confirmar Senha</label>
                <input
                  type="password"
                  id="confirmarSenha"
                  name="confirmarSenha"
                  value={formData.confirmarSenha}
                  onChange={handleChange}
                  className="w-full p-3 rounded-md bg-transparent border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="••••••••"
                  required
                />
                {errors.confirmarSenha && (
                  <span className="text-red-300 text-xs mt-1">{errors.confirmarSenha}</span>
                )}
              </div>
            )}
          </div>

          {!isLoginMode && (
            <div className="address-section pt-5 border-t border-gray-700">
              <h3 className="text-lg font-bold mb-4">Endereço Principal</h3>
              
              <div className="flex flex-col gap-1 mb-5">
                <label htmlFor="enderecos.0.cep" className="text-gray-400 font-semibold text-xs">CEP</label>
                <input
                  type="text"
                  id="enderecos.0.cep"
                  name="enderecos.0.cep"
                  value={maskedValues.cep}
                  onChange={(e) => handleCepChange(e, 0)}
                  onBlur={() => handleCepBlur(0)}
                  maxLength="9"
                  className="w-full p-3 rounded-md bg-transparent border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="00000-000"
                  required
                />
                {errors.cep && (
                  <span className="text-red-300 text-xs mt-1">{errors.cep}</span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-5 mb-5">
                <div className="flex-1 flex flex-col gap-1">
                  <label htmlFor="enderecos.0.logradouro" className="text-gray-400 font-semibold text-xs">Logradouro</label>
                  <input
                    type="text"
                    id="enderecos.0.logradouro"
                    name="enderecos.0.logradouro"
                    value={formData.enderecos[0].logradouro}
                    onChange={handleChange}
                    className="w-full p-3 rounded-md bg-transparent border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="Rua, Avenida, etc."
                    required
                  />
                  {errors.logradouro && (
                    <span className="text-red-300 text-xs mt-1">{errors.logradouro}</span>
                  )}
                </div>

                <div className="flex-1 flex flex-col gap-1">
                  <label htmlFor="enderecos.0.numero" className="text-gray-400 font-semibold text-xs">Número</label>
                  <input
                    type="text"
                    id="enderecos.0.numero"
                    name="enderecos.0.numero"
                    value={formData.enderecos[0].numero}
                    onChange={handleChange}
                    className="w-full p-3 rounded-md bg-transparent border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="123"
                    required
                  />
                  {errors.numero && (
                    <span className="text-red-300 text-xs mt-1">{errors.numero}</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1 mb-5">
                <label htmlFor="enderecos.0.complemento" className="text-gray-400 font-semibold text-xs">Complemento</label>
                <input
                  type="text"
                  id="enderecos.0.complemento"
                  name="enderecos.0.complemento"
                  value={formData.enderecos[0].complemento}
                  onChange={handleChange}
                  className="w-full p-3 rounded-md bg-transparent border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Apartamento, sala, etc."
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-5">
                <div className="flex-1 flex flex-col gap-1">
                  <label htmlFor="enderecos.0.bairro" className="text-gray-400 font-semibold text-xs">Bairro</label>
                  <input
                    type="text"
                    id="enderecos.0.bairro"
                    name="enderecos.0.bairro"
                    value={formData.enderecos[0].bairro}
                    onChange={handleChange}
                    className="w-full p-3 rounded-md bg-transparent border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="Bairro"
                    required
                  />
                  {errors.bairro && (
                    <span className="text-red-300 text-xs mt-1">{errors.bairro}</span>
                  )}
                </div>

                <div className="flex-1 flex flex-col gap-1">
                  <label htmlFor="enderecos.0.cidade" className="text-gray-400 font-semibold text-xs">Cidade</label>
                  <input
                    type="text"
                    id="enderecos.0.cidade"
                    name="enderecos.0.cidade"
                    value={formData.enderecos[0].cidade}
                    onChange={handleChange}
                    className="w-full p-3 rounded-md bg-transparent border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="Cidade"
                    required
                  />
                  {errors.cidade && (
                    <span className="text-red-300 text-xs mt-1">{errors.cidade}</span>
                  )}
                </div>

                <div className="flex-1 flex flex-col gap-1">
                  <label htmlFor="enderecos.0.estado" className="text-gray-400 font-semibold text-xs">Estado</label>
                  <input
                    type="text"
                    id="enderecos.0.estado"
                    name="enderecos.0.estado"
                    value={formData.enderecos[0].estado}
                    onChange={handleChange}
                    maxLength="2"
                    className="w-full p-3 rounded-md bg-transparent border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="UF"
                    required
                  />
                  {errors.estado && (
                    <span className="text-red-300 text-xs mt-1">{errors.estado}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="flex items-center justify-center font-semibold text-white w-full bg-gray-700 border border-gray-600 p-3 text-lg rounded-md mt-2 cursor-pointer hover:bg-purple-600 hover:border-purple-600 active:scale-95 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner inline-block w-4 h-4 border-2 border-white border-solid border-t-transparent rounded-full animate-spin mr-2"></span>
                Processando...
              </>
            ) : isLoginMode ? 'Entrar' : 'Cadastrar'}
          </button>
        </form>

        <div className="text-center text-gray-400 text-sm mt-3">
          {isLoginMode ? 'Não tem uma conta?' : 'Já tem uma conta?'}
          <button 
            type="button" 
            className="bg-transparent border-none text-blue-400 font-semibold p-0 ml-1 cursor-pointer hover:text-purple-400 transition-colors duration-300 underline"
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
