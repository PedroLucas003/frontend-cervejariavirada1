import React from 'react';
import './HeroBanner.css';

const HeroBanner = () => {
  const scrollToCervejas = () => {
    const element = document.getElementById('cervejas-section');
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="hero-banner">
      <div className="hero-video-container">
        <video autoPlay loop muted playsInline className="hero-video">
          <source src="/cervejariavirada.mp4" type="video/mp4" />
        </video>
        <div className="glass-overlay"></div>
      </div>

      <div className="hero-content-container">
        <div className="hero-content">
          <div className="brand-logo-container">
            <img 
              src="/logo-cervejaria-virada.png" 
              alt="Cervejaria Virada" 
              className="brand-logo"
            />
          </div>
          <p className="subtitle">Artesanal • Autêntica • Inesquecível</p>
          <button className="cta-button" onClick={scrollToCervejas}>
            Conheça Nossas Cervejas
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;