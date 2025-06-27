import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react'; 
import { useLocation } from 'react-router-dom'; 
import './PixPayment.css';

const API_URL = process.env.REACT_APP_API_URL;

const PixPayment = ({ orderId, amount, onBack, onSuccess }) => {
  const location = useLocation(); 
  
  // Extrai os dados do PIX do state da navegação
  // Usamos useMemo para garantir que initialPixData seja um valor estável
  const initialPixData = React.useMemo(() => {
    return location.state?.pixCode ? {
      pixCode: location.state.pixCode,
      qrCodeBase64: location.state.qrCodeBase64,
      expirationDate: location.state.expirationDate,
      amount: location.state.amount,
      paymentIdMP: location.state.paymentIdMP 
    } : null;
  }, [location.state]); // Depende apenas de location.state

  // pixData não precisa de setPixData se for sempre inicializado com initialPixData
  const pixData = initialPixData; 
  const [isLoading, setIsLoading] = useState(!initialPixData); 
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(initialPixData ? Math.floor((new Date(initialPixData.expirationDate).getTime() - Date.now()) / 1000) : 30 * 60);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [manualConfirmation, setManualConfirmation] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(''); 
  
  const statusCheckInterval = useRef(null);

  const checkPaymentStatus = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/pix/status/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Status de pagamento verificado:', response.data);

      if (response.data.paymentStatus === 'approved') {
        setPaymentStatus('approved');
        if (statusCheckInterval.current) {
          clearInterval(statusCheckInterval.current);
        }
        onSuccess();
      } else if (response.data.paymentStatus === 'cancelled' || response.data.paymentStatus === 'rejected') {
        setPaymentStatus(response.data.paymentStatus);
        if (statusCheckInterval.current) {
          clearInterval(statusCheckInterval.current);
        }
      }
    } catch (err) {
      console.error('Erro ao verificar status:', err);
    }
  }, [orderId, onSuccess]);

  // Efeito para iniciar a verificação de status e o contador
  useEffect(() => {
    // Se os dados PIX já foram recebidos via state, inicie o processo
    if (pixData) { // Agora usamos pixData diretamente
      setIsLoading(false);
      // Iniciar verificação periódica do status
      statusCheckInterval.current = setInterval(checkPaymentStatus, 10000);
    } else {
      // Se por algum motivo os dados não vieram no state (ex: refresh direto na URL),
      // pode tentar buscar do backend ou mostrar um erro.
      // Neste caso, vamos apenas definir um erro, pois o CheckoutPage deve sempre passar os dados.
      setError('Dados do PIX não foram carregados. Por favor, tente novamente.');
      setIsLoading(false);
    }

    // Limpeza ao desmontar
    return () => {
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
      }
    };
  }, [pixData, checkPaymentStatus]); // Depende de pixData e checkPaymentStatus

  // Efeito para o contador regressivo
  useEffect(() => {
    let timer;
    if (timeLeft > 0 && paymentStatus === 'pending') {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft <= 0 && paymentStatus === 'pending') { 
      setPaymentStatus('expired');
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [timeLeft, paymentStatus]);

  const handleManualConfirmation = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/pix/confirm`, { orderId }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setPaymentStatus('approved');
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
      }
      onSuccess();
    } catch (err) {
      setError('Erro ao confirmar pagamento manualmente');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text) => {
    if (!text) { 
      console.warn('Tentativa de copiar texto vazio para a área de transferência.');
      setCopyFeedback('Nada para copiar!'); 
      setTimeout(() => setCopyFeedback(''), 2000); 
      return;
    }
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    console.log('Código PIX copiado para a área de transferência!'); 
    setCopyFeedback('Copiado!'); 
    setTimeout(() => setCopyFeedback(''), 2000); 
  };

  if (isLoading) {
    return (
      <div className="pix-payment-loading">
        <div className="spinner"></div>
        <p>Carregando dados do PIX...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pix-payment-error">
        <p>{error}</p>
        <button onClick={onBack} className="back-button">Voltar</button>
      </div>
    );
  }

  if (paymentStatus === 'approved') {
    return (
      <div className="pix-payment-success">
        <h2>Pagamento Aprovado!</h2>
        <p>Seu pagamento foi confirmado e seu pedido está sendo processado.</p>
        <button onClick={onSuccess} className="success-button">Continuar</button>
      </div>
    );
  }

  if (paymentStatus === 'expired') {
    return (
      <div className="pix-payment-expired">
        <h2>Pagamento Expirado</h2>
        <p>O tempo para realizar o pagamento expirou. Por favor, gere um novo código.</p>
        <button onClick={onBack} className="back-button">Voltar</button>
      </div>
    );
  }

  return (
    <div className="pix-payment-container">
      <h2>Pagamento via PIX</h2>
      <p className="pix-amount">Valor: R$ {amount ? amount.toFixed(2) : '0.00'}</p>
      
      <div className="pix-qr-code">
        {pixData?.qrCodeBase64 ? (
          <img src={`data:image/png;base64,${pixData.qrCodeBase64}`} alt="QR Code PIX" />
        ) : (
          pixData?.pixCode && <QRCodeCanvas value={pixData.pixCode} size={200} /> 
        )}
      </div>
      
      <div className="pix-timer">
        <p>Tempo restante: {formatTime(timeLeft)}</p>
      </div>
      
      <div className="pix-instructions">
        <h3>Como pagar:</h3>
        <ol>
          <li>Abra o aplicativo do seu banco</li>
          <li>Selecione a opção PIX</li>
          <li>Escolha "Pagar com QR Code" ou "Copiar e Colar"</li>
          <li>Confirme o pagamento</li>
          <li>Aguarde a confirmação automática do pagamento.</li> 
        </ol>
      </div>
      
      <div className="pix-copy-code">
        <h4>Código PIX (Copiar e Colar):</h4>
        <div className="pix-code-container">
          <p className="pix-code">{pixData?.pixCode || 'Carregando...'}</p> 
          <button 
            onClick={() => copyToClipboard(pixData?.pixCode)} 
            className="copy-button"
          >
            Copiar
          </button>
          {copyFeedback && <span className="copy-feedback">{copyFeedback}</span>} 
        </div>
      </div>
      
      <div className="pix-actions">
        <button onClick={onBack} className="back-button">Voltar</button>
        <button 
          onClick={() => setManualConfirmation(true)}
          className="confirm-button"
        >
          Já paguei (Confirmação Manual)
        </button>
      </div>

      {manualConfirmation && (
        <div className="manual-confirmation-modal">
          <div className="modal-content">
            <h3>Confirmar Pagamento</h3>
            <p>Você já realizou o pagamento deste pedido via PIX? (Esta é uma confirmação manual)</p>
            <div className="modal-buttons">
              <button 
                onClick={() => setManualConfirmation(false)}
                className="cancel-button"
              >
                Cancelar
              </button>
              <button 
                onClick={handleManualConfirmation}
                className="confirm-button"
              >
                Sim, já paguei
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PixPayment;
