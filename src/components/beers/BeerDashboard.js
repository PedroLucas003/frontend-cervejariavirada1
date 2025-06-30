import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './BeerDashboard.css';

const API_URL = process.env.REACT_APP_API_URL;

const BeerDashboard = ({ user }) => {
  const [beers, setBeers] = useState([]);
  const [formData, setFormData] = useState({
    beerType: '',
    description: '',
    alcoholContent: '',
    yearCreated: new Date().getFullYear().toString(),
    quantity: 0,
    price: 15.90
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !user.isAdmin) {
      navigate('/');
    }
  }, [user, navigate]);

  const fetchBeers = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`${API_URL}/api/beers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const beersWithValidPrices = response.data.data.map(beer => ({
        ...beer,
        price: Number(beer.price) || 0,
        quantity: Number(beer.quantity) || 0
      }));
      
      setBeers(beersWithValidPrices);
      setError('');
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
      } else if (err.response?.status === 403) {
        setError('Acesso negado. Você não tem permissão de administrador.');
        navigate('/');
      } else {
        setError('Erro ao carregar cervejas');
        console.error('Erro ao carregar cervejas:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchBeers();
  }, [fetchBeers]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'beerType') {
      const defaultData = {
        'Belgian Blonde Ale': {
          description: 'Estilo: Belgian Blonde Ale\nABV: 6%\nIBU: 30\n\nUma cerveja de corpo leve, de espuma fina, com um aroma frutado e um sabor suave, de um perfil fácil de beber.',
          alcoholContent: '6% ABV'
        },
        'Tripel': {
          description: 'Estilo: Tripel\nABV: 9.2%\nIBU: 23\nCor: Dourada\nTurbidez: média (encorpada)\n\nUma cerveja de corpo leve, de espuma fina, com um aroma frutado e um sabor suave, de um perfil fácil de beber, o que contrasta com sua colossal carga alcóolica, indicada apenas pelo final seco. Inspirada nas cervejas monásticas da escola Belga e fermentada usando as mesmas leveduras históricas, a Tripel é uma cerveja apenas para os fortes. Aprecie com moderação. Sério.',
          alcoholContent: '9.2% ABV'
        },
        'Extra Stout': {
          description: 'Estilo: Extra Stout\nABV: 6.7%\nIBU: 55\nCor: Preta\nTurbidez: alta (completamente opaca)\n\nUma cerveja de origem britânica e amada pelos americanos, a Imperial Stout é conhecida historicamente como a versão da English Porter que encantou a corte imperial russa. O estilo é definido pela combinação de maltes em diferentes intensidades de torra, conferindo tons de café e chocolate numa cerveja densa, quase licorosa, que contrasta perfeitamente o amargor presente com um leve adocicado. Os czares ficaram maravilhados. E você, ficaria também?',
          alcoholContent: '6.7% ABV'
        },
        'Irish Red Ale': {
          description: 'Estilo: Irish Red Ale\nABV: 5.8%\nIBU: 30\nCor: Vermelho-acobreada\nTurbidez: média (encorpada)\n\nUma abordagem pernambucana a uma cerveja irlandesa. Combina tipos diferentes de maltes de meia torra para formar uma cerveja de cor intensa e corpo complexo, contrastando um leve sabor caramelizado com o amargor destacado e o toque floral do lúpulo. Excelente para clarear as ideias e pensar melhor, seja antes ou depois do almoço.',
          alcoholContent: '5.8% ABV'
        }
      };
      
      setFormData(prev => ({
        ...prev,
        beerType: value,
        description: defaultData[value]?.description || '',
        alcoholContent: defaultData[value]?.alcoholContent || ''
      }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'price' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      if (editingId) {
        await axios.put(`${API_URL}/api/beers/${editingId}`, formData, config);
      } else {
        await axios.post(`${API_URL}/api/beers`, formData, config);
      }
      
      setFormData({
        beerType: '',
        description: '',
        alcoholContent: '',
        yearCreated: new Date().getFullYear().toString(),
        quantity: 0,
        price: 15.90
      });
      setEditingId(null);
      await fetchBeers();
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
      } else if (err.response?.status === 403) {
        setError('Acesso negado. Você não tem permissão de administrador.');
      } else {
        setError(err.response?.data?.message || err.message || 'Erro ao salvar cerveja');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (beer) => {
    setFormData({
      beerType: beer.beerType,
      description: beer.description,
      alcoholContent: beer.alcoholContent,
      yearCreated: beer.yearCreated,
      quantity: beer.quantity,
      price: beer.price
    });
    setEditingId(beer._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta cerveja?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/api/beers/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        await fetchBeers();
      } catch (err) {
        setError('Erro ao excluir cerveja');
        console.error('Erro ao excluir cerveja:', err);
      }
    }
  };

  return (
    <div className="beer-dashboard">
      <h2>Painel Admin - Gerenciamento de Cervejas</h2>
      <p className="admin-welcome">Bem-vindo, {user?.email}</p>
      
      {loading ? (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Carregando...</p>
        </div>
      ) : (
        <>
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="beer-form">
            <div className="form-group">
              <label>Tipo:</label>
              <select
                name="beerType"
                value={formData.beerType}
                onChange={handleChange}
                required
              >
                <option value="">Selecione um tipo</option>
                <option value="Belgian Blonde Ale">Belgian Blonde Ale</option>
                <option value="Tripel">Tripel</option>
                <option value="Extra Stout">Extra Stout</option>
                <option value="Irish Red Ale">Irish Red Ale</option>
              </select>
            </div>

            <div className="form-group">
              <label>Descrição:</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="5"
                placeholder="Descrição da cerveja..."
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Teor Alcoólico:</label>
                <input
                  type="text"
                  name="alcoholContent"
                  value={formData.alcoholContent}
                  onChange={handleChange}
                  required
                  placeholder="Ex: 5.0% ABV"
                />
              </div>
              <div className="form-group">
                <label>Ano de Criação:</label>
                <input
                  type="text"
                  name="yearCreated"
                  value={formData.yearCreated}
                  onChange={handleChange}
                  required
                  placeholder="Ex: 2020"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Quantidade em Estoque:</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>Preço (R$):</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="submit-btn"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="submitting-text">
                    {editingId ? 'Atualizando...' : 'Adicionando...'}
                  </span>
                ) : (
                  editingId ? 'Atualizar Cerveja' : 'Adicionar Cerveja'
                )}
              </button>
              
              {editingId && (
                <button 
                  type="button" 
                  onClick={() => {
                    setFormData({
                      beerType: '',
                      description: '',
                      alcoholContent: '',
                      yearCreated: new Date().getFullYear().toString(),
                      quantity: 0,
                      price: 15.90
                    });
                    setEditingId(null);
                  }}
                  className="cancel-btn"
                >
                  Cancelar Edição
                </button>
              )}
            </div>
          </form>

          <div className="beer-list">
            <h3>Cervejas Cadastradas</h3>
            {beers.length === 0 ? (
              <p>Nenhuma cerveja cadastrada</p>
            ) : (
              <div className="responsive-table">
                <table>
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Descrição</th>
                      <th>Teor</th>
                      <th>Ano</th>
                      <th>Estoque</th>
                      <th>Preço</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {beers.map(beer => (
                      <tr key={beer._id}>
                        <td>{beer.beerType}</td>
                        <td className="description-cell">{beer.description}</td>
                        <td>{beer.alcoholContent}</td>
                        <td>{beer.yearCreated}</td>
                        <td>{beer.quantity}</td>
                        <td>R$ {beer.price.toFixed(2)}</td>
                        <td className="actions-cell">
                          <button 
                            onClick={() => handleEdit(beer)}
                            className="edit-btn"
                          >
                            Editar
                          </button>
                          <button 
                            onClick={() => handleDelete(beer._id)}
                            className="delete-btn"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default BeerDashboard;