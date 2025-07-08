import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './CheckoutPage.css';

const API_URL = process.env.REACT_APP_API_URL;

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
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);

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

      const checkoutData = {
        items: cartItems.map(item => ({
          _id: item._id,
          nome: item.nome,
          tipo: item.tipo,
          price: item.price,
          quantity: item.quantity,
          imagem: item.imagem
        })),
        shippingAddress: deliveryData,
        couponCode: couponCode || undefined
      };

      const preferenceResponse = await axios.post(`${API_URL}/api/payments/create-preference`, checkoutData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const { init_point } = preferenceResponse.data;

      onOrderSuccess();
      window.location.href = init_point;
      
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

  const handleApplyCoupon = () => {
    // Simulação de aplicação de cupom
    if (couponCode.toUpperCase() === 'DESCONTO10') {
      setDiscount(0.1); // 10% de desconto
    } else {
      setError('Cupom inválido ou expirado');
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
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = 0.01;
  const totalAmount = (subtotal * (1 - discount)) + shipping;

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-header">
          <h1>Finalize sua Compra</h1>
          <div className="checkout-steps">
            <div className="step active">1. Carrinho</div>
            <div className="step active">2. Entrega</div>
            <div className="step">3. Pagamento</div>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="checkout-grid">
          <div className="order-summary">
            <h2 className="summary-title">
              <span className="cart-icon">🛒</span> Seu Pedido
            </h2>
            
            {cartItems.length > 0 ? (
              <>
                <div className="cart-items">
                  {cartItems.map(item => (
                    <div key={item._id} className="cart-item">
                      <div className="item-image-container">
                        <img src={item.imagem} alt={item.nome} className="cart-item-image" />
                        <span className="item-quantity">{item.quantity}x</span>
                      </div>
                      <div className="cart-item-details">
                        <h4>{item.nome}</h4>
                        <p className="cart-item-type">{item.tipo}</p>
                        <p className="item-price">R$ {(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="coupon-section">
                  <input
                    type="text"
                    placeholder="Código do cupom"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="coupon-input"
                  />
                  <button onClick={handleApplyCoupon} className="coupon-btn">
                    Aplicar
                  </button>
                </div>

                <div className="order-totals">
                  <div className="total-row">
                    <span>Subtotal:</span>
                    <span>R$ {subtotal.toFixed(2)}</span>
                  </div>
                  
                  {discount > 0 && (
                    <div className="total-row discount">
                      <span>Desconto ({discount * 100}%):</span>
                      <span>- R$ {(subtotal * discount).toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="total-row">
                    <span>Frete:</span>
                    <span>R$ {shipping.toFixed(2)}</span>
                  </div>
                  
                  <div className="total-row grand-total">
                    <span>Total:</span>
                    <span>R$ {totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-cart">
                <span className="empty-icon">😕</span>
                <p>Seu carrinho está vazio</p>
              </div>
            )}
          </div>

          <div className="delivery-payment">
            <div className="delivery-form">
              <h2 className="section-title">
                <span className="delivery-icon">🚚</span> Informações de Entrega
              </h2>

              <div className="address-selection">
                {principalAddress && (
                  <div className={`address-option ${usingPrincipalAddress ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      id="principal-address"
                      name="addressType"
                      checked={usingPrincipalAddress}
                      onChange={handleUsePrincipalAddress}
                    />
                    <label htmlFor="principal-address">
                      <span className="option-title">Usar endereço principal</span>
                      <div className="address-details">
                        {`${principalAddress.logradouro}, ${principalAddress.numero}`}
                        {principalAddress.complemento && `, ${principalAddress.complemento}`}
                        <br />
                        {`${principalAddress.bairro}, ${principalAddress.cidade} - ${principalAddress.estado}`}
                        <br />
                        {`CEP: ${principalAddress.cep}`}
                      </div>
                    </label>
                  </div>
                )}
                
                <div className={`address-option ${!usingPrincipalAddress ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    id="new-address"
                    name="addressType"
                    checked={!usingPrincipalAddress}
                    onChange={handleUseNewAddress}
                  />
                  <label htmlFor="new-address">
                    <span className="option-title">Usar outro endereço</span>
                  </label>
                </div>
              </div>

              <form className="address-form">
                <div className="form-row">
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
              <h3 className="section-title">
                <span className="info-icon">ℹ️</span> Informações Importantes
              </h3>
              <ul>
                <li>Após clicar em "Finalizar Compra", seu pedido será registrado</li>
                <li>Você será redirecionado para a página de pagamento do Mercado Pago</li>
                <li>Lá você poderá escolher o método de pagamento (PIX, Cartão, Boleto, etc.)</li>
                <li>O prazo de entrega começa a contar após a confirmação do pagamento</li>
              </ul>
            </div>

            <div className="checkout-actions">
              <button
                onClick={handleCheckout}
                disabled={isLoading || !deliveryData.cep || !deliveryData.address ||
                  !deliveryData.number || cartItems.length === 0}
                className="checkout-btn"
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Processando...
                  </>
                ) : (
                  'Finalizar Compra'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;