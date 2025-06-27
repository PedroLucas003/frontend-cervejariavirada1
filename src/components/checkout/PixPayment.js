import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react'; 
import './PixPayment.css';

const API_URL = process.env.REACT_APP_API_URL;

const PixPayment = ({ orderId, amount, onBack, onSuccess }) => {
  const [pixData, setPixData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutos em segundos
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [manualConfirmation, setManualConfirmation] = useState(false);
  
  // Usando useRef para armazenar o intervalo
  const statusCheckInterval = useRef(null);

  // Função para verificar o status do pagamento
  const checkPaymentStatus = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/pix/status/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.paymentStatus === 'approved') {
        setPaymentStatus('approved');
        if (statusCheckInterval.current) {
          clearInterval(statusCheckInterval.current);
        }
        onSuccess();
      }
    } catch (err) {
      console.error('Erro ao verificar status:', err);
    }
  }, [orderId, onSuccess]);

  // Efeito principal para gerar o PIX e iniciar a verificação
  useEffect(() => {
    const generatePixPayment = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/api/pix/generate`, { orderId }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setPixData(response.data);
        setIsLoading(false);
        
        // --- NOVO LOG DE DEPURACAO AQUI ---
        console.log('Dados PIX recebidos no frontend:', response.data);
        console.log('pixCode recebido no frontend:', response.data.pixCode);
        // --- FIM DO LOG DE DEPURACAO ---

        // Iniciar verificação periódica do status
        statusCheckInterval.current = setInterval(checkPaymentStatus, 10000);
      } catch (err) {
        setError(err.response?.data?.message || 'Erro ao gerar pagamento PIX');
        setIsLoading(false);
      }
    };

    generatePixPayment();

    // Limpeza ao desmontar
    return () => {
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
      }
    };
  }, [orderId, checkPaymentStatus]);

  // Efeito para o contador regressivo
  useEffect(() => {
    let timer;
    if (timeLeft > 0 && paymentStatus === 'pending') {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && paymentStatus === 'pending') {
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
      setError('Erro ao confirmar pagamento');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text) => {
    if (!text) { // Adicionado verificação para texto vazio
      console.warn('Tentativa de copiar texto vazio para a área de transferência.');
      // Você pode adicionar um feedback visual para o usuário aqui, como um toast
      return;
    }
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    console.log('Código PIX copiado para a área de transferência!'); 
  };

  if (isLoading) {
    return (
      <div className="pix-payment-loading">
        <div className="spinner"></div>
        <p>Gerando pagamento PIX...</p>
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
      <p className="pix-amount">Valor: R$ {amount.toFixed(2)}</p>
      
      <div className="pix-qr-code">
        {pixData?.qrCodeBase64 ? (
          <img src={pixData.qrCodeBase64} alt="QR Code PIX" />
        ) : (
          <QRCodeCanvas value={pixData?.pixCode || ''} size={200} /> 
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
          <li>Após pagar, clique em "Já paguei" abaixo</li>
        </ol>
      </div>
      
      <div className="pix-copy-code">
        <h4>Código PIX (Copiar e Colar):</h4>
        <div className="pix-code-container">
          <p className="pix-code">{pixData?.pixCode}</p> {/* Aqui o valor é exibido */}
          <button 
            onClick={() => copyToClipboard(pixData?.pixCode)} 
            className="copy-button"
          >
            Copiar
          </button>
        </div>
      </div>
      
      <div className="pix-actions">
        <button onClick={onBack} className="back-button">Voltar</button>
        <button 
          onClick={() => setManualConfirmation(true)}
          className="confirm-button"
        >
          Já paguei
        </button>
      </div>

      {manualConfirmation && (
        <div className="manual-confirmation-modal">
          <div className="modal-content">
            <h3>Confirmar Pagamento</h3>
            <p>Você já realizou o pagamento deste pedido via PIX?</p>
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
