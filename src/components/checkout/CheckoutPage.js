import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './CheckoutPage.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const CheckoutPage = ({ cartItems, user, onOrderSuccess }) => {
  const [deliveryData, setDeliveryData] = useState({
    cep: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [usingPrincipalAddress, setUsingPrincipalAddress] = useState(true);

  useEffect(() => {
    const principalAddress = user?.enderecos?.find(addr => addr.principal) || user?.enderecos?.[0];
    
    if (principalAddress) {
      setDeliveryData({
        cep: principalAddress.cep || '',
        address: principalAddress.logradouro || '',
        number: principalAddress.numero || '',
        complement: principalAddress.complemento || '',
        neighborhood: principalAddress.bairro || '',
        city: principalAddress.cidade || '',
        state: principalAddress.estado || ''
      });
      setUsingPrincipalAddress(true);
    }
  }, [user]);

  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      setError('');

      if (!cartItems || cartItems.length === 0) {
        setError('Seu carrinho está vazio');
        setIsLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const requiredFields = ['cep', 'address', 'number', 'city', 'state'];
      const missingFields = requiredFields.filter(field => !deliveryData[field]);

      if (missingFields.length > 0) {
        setError(`Por favor, preencha: ${missingFields.join(', ')}`);
        setIsLoading(false);
        return;
      }

      // Preparar os dados do pedido para criação inicial
      const orderData = {
        items: cartItems.map(item => ({
          _id: item._id,
          nome: item.nome,
          tipo: item.tipo,
          price: item.price,
          quantity: item.quantity,
          imagem: item.imagem
        })),
        shippingAddress: deliveryData,
        // O total será calculado no backend pelo pre-save hook do Mongoose
        // total: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 0.01
      };

      // 1. Enviar pedido para o backend (cria o pedido com status 'pending')
      const orderResponse = await axios.post(`${API_URL}/api/orders`, orderData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const orderId = orderResponse.data.data._id; // Obter o ID do pedido criado
      const orderTotal = orderResponse.data.data.total; // Obter o total calculado pelo backend

      onOrderSuccess(); // Limpa o carrinho ou faz outras ações de sucesso do pedido
      navigate(`/pix-payment/${orderId}`, { state: { amount: orderTotal } }); // Redireciona para a página PIX
      
    } catch (error) {
      console.error('Erro no checkout:', error);
      setError(
        error.response?.data?.message ||
        'Erro ao finalizar compra. Por favor, tente novamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsePrincipalAddress = () => {
    const principalAddress = user?.enderecos?.find(addr => addr.principal) || user?.enderecos?.[0];
    
    if (principalAddress) {
      setDeliveryData({
        cep: principalAddress.cep || '',
        address: principalAddress.logradouro || '',
        number: principalAddress.numero || '',
        complement: principalAddress.complemento || '',
        neighborhood: principalAddress.bairro || '',
        city: principalAddress.cidade || '',
        state: principalAddress.estado || ''
      });
      setUsingPrincipalAddress(true);
    }
  };

  const handleUseNewAddress = () => {
    setDeliveryData({
      cep: '',
      address: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: ''
    });
    setUsingPrincipalAddress(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (usingPrincipalAddress) {
      setUsingPrincipalAddress(false);
    }

    if (name === 'cep') {
      const numericValue = value.replace(/\D/g, '');
      const formattedValue = numericValue.length > 5
        ? `${numericValue.substring(0, 5)}-${numericValue.substring(5, 8)}`
        : numericValue;
      setDeliveryData(prev => ({ ...prev, [name]: formattedValue }));
    } else if (name === 'state') {
      setDeliveryData(prev => ({ ...prev, [name]: value.toUpperCase() }));
    } else {
      setDeliveryData(prev => ({ ...prev, [name]: value }));
    }
  };

  const principalAddress = user?.enderecos?.find(addr => addr.principal) || user?.enderecos?.[0];
  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 0.01; // Frete de 1 centavo

  return (
    <div className="checkout-container">
      <h1>Finalize sua Compra</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="checkout-grid">
        <div className="order-summary">
          <h2>Seu Carrinho</h2>
          {cartItems.length > 0 ? (
            <div className="cart-items">
              {cartItems.map(item => (
                <div key={item._id} className="cart-item">
                  <img src={item.imagem} alt={item.nome} className="cart-item-image" />
                  <div className="cart-item-details">
                    <h4>{item.nome}</h4>
                    <p className="cart-item-type">{item.tipo}</p>
                    <p>Quantidade: {item.quantity}</p>
                    <p>R$ {(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
              <div className="cart-shipping">
                <p>Frete: R$ 0.01</p> {/* Alterado para 1 centavo */}
              </div>
              <div className="cart-total">
                <p>Total: R$ {totalAmount.toFixed(2)}</p>
              </div>
            </div>
          ) : (
            <p>Seu carrinho está vazio</p>
          )}
        </div>

        <div className="delivery-payment">
          <div className="delivery-form">
            <h2>Informações de Entrega</h2>

            <div className="address-selection">
              {principalAddress && (
                <div className="address-option">
                  <input
                    type="radio"
                    id="principal-address"
                    name="addressType"
                    checked={usingPrincipalAddress}
                    onChange={handleUsePrincipalAddress}
                  />
                  <label htmlFor="principal-address">
                    Usar endereço principal
                    <div className="address-details">
                      {`${principalAddress.logradouro}, ${principalAddress.numero}`}
                      <br />
                      {`${principalAddress.bairro}, ${principalAddress.cidade} - ${principalAddress.estado}`}
                    </div>
                  </label>
                </div>
              )}
              
              <div className="address-option">
                <input
                  type="radio"
                  id="new-address"
                  name="addressType"
                  checked={!usingPrincipalAddress}
                  onChange={handleUseNewAddress}
                />
                <label htmlFor="new-address">Digitar outro endereço</label>
              </div>
            </div>

            <form>
              <div className="form-group">
                <label htmlFor="cep">CEP *</label>
                <input
                  type="text"
                  id="cep"
                  name="cep"
                  placeholder="00000-000"
                  value={deliveryData.cep}
                  onChange={handleInputChange}
                  maxLength="9"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="address">Endereço *</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  placeholder="Rua, Avenida, etc."
                  value={deliveryData.address}
                  onChange={handleInputChange}
                  required
                  disabled={usingPrincipalAddress}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="number">Número *</label>
                  <input
                    type="text"
                    id="number"
                    name="number"
                    placeholder="Nº"
                    value={deliveryData.number}
                    onChange={handleInputChange}
                    required
                    disabled={usingPrincipalAddress}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="complement">Complemento</label>
                  <input
                    type="text"
                    id="complement"
                    name="complement"
                    placeholder="Apto, Bloco, etc."
                    value={deliveryData.complement}
                    onChange={handleInputChange}
                    disabled={usingPrincipalAddress}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="neighborhood">Bairro *</label>
                <input
                  type="text"
                  id="neighborhood"
                  name="neighborhood"
                  value={deliveryData.neighborhood}
                  onChange={handleInputChange}
                  required
                  disabled={usingPrincipalAddress}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">Cidade *</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={deliveryData.city}
                    onChange={handleInputChange}
                    required
                    disabled={usingPrincipalAddress}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="state">Estado *</label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={deliveryData.state}
                    onChange={handleInputChange}
                    maxLength="2"
                    required
                    disabled={usingPrincipalAddress}
                  />
                </div>
              </div>
            </form>
          </div>

          <div className="payment-instructions">
            <h3>Instruções Importantes:</h3>
            <ul>
              <li>Após clicar em "Finalizar Compra", seu pedido será registrado</li>
              <li>Você será redirecionado para a página de pagamento PIX</li>
              <li>O pagamento será acertado via PIX usando o QR Code ou código copia e cola</li>
            </ul>
          </div>

          <div className="order-total-section">
            <button
              onClick={handleCheckout}
              disabled={isLoading || !deliveryData.cep || !deliveryData.address ||
                !deliveryData.number || cartItems.length === 0}
              className="checkout-btn"
            >
              {isLoading ? 'Processando...' : 'Finalizar Compra'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;