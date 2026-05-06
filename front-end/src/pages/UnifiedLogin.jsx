import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import VoiceInput from '../components/VoiceInput';
import FaceAuth from '../components/FaceAuth/FaceAuth'; // Import du composant de reconnaissance faciale


const UnifiedLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [showFaceAuth, setShowFaceAuth] = useState(false); // État pour basculer vers le mode visage
  const [rememberMe, setRememberMe] = useState(false);
  const [isRobotChecked, setIsRobotChecked] = useState(false);
  const [showPuzzle, setShowPuzzle] = useState(false);
  const [puzzleType, setPuzzleType] = useState(0); // 0: Math, 1: Logic, 2: Colors

  // Load remembered email
  React.useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);


  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#f4f6f9',
    fontFamily: 'Arial, sans-serif'
  };

  const cardStyle = {
    background: 'white',
    padding: '2rem',
    borderRadius: '10px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    textAlign: 'center',
    maxWidth: '400px',
    width: '100%'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    margin: '10px 0',
    borderRadius: '5px',
    border: '1px solid #ddd',
    fontSize: '16px',
    boxSizing: 'border-box'
  };

  const buttonStyle = {
    width: '100%',
    padding: '12px',

    margin: '10px 0',

    fontSize: '16px',
    cursor: 'pointer',
    border: 'none',
    borderRadius: '5px',
    backgroundColor: '#4e73df',
    color: 'white',
    fontWeight: 'bold',
    transition: 'background 0.3s'
  };


  const handleLoginSuccess = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));

    // Remember me logic
    if (rememberMe) {
      localStorage.setItem('rememberedEmail', formData.email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }

    const publicRoles = ['User', 'Supplier', 'Delivery', 'Engineer', 'Artisan'];
    if (publicRoles.includes(userData.role)) {
      navigate('/');
    } else {
      navigate('/admin/');
    }
  };


  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };


  const handleVoiceChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isRobotChecked) {
        setError("Veuillez confirmer que vous n'êtes pas un robot.");
        return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3100/auth/login', {
        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Login failed');

      handleLoginSuccess(data);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>

        <h2 style={{ marginBottom: '1.5rem', color: '#333' }}>
          {showFaceAuth ? 'Face ID Login' : 'Sign In'}
        </h2>

        {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

        {showFaceAuth ? (
          /* Intégration du composant FaceAuth */
          <FaceAuth
            mode="login"
            onSuccess={handleLoginSuccess}
            onCancel={() => setShowFaceAuth(false)}
          />
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                style={inputStyle}
                required
              />
              <VoiceInput
                value={formData.email}
                onChange={(val) => handleVoiceChange('email', val)}
                fieldName="email"
              />
            </div>

            <div style={{ position: 'relative', marginTop: '10px' }}>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                style={inputStyle}
                required
              />
              <VoiceInput
                value={formData.password}
                onChange={(val) => handleVoiceChange('password', val)}
                fieldName="password"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#666', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                Remember me
              </label>
              <a href="#" style={{ fontSize: '14px', color: '#4e73df', textDecoration: 'none' }}>Forgot password?</a>
            </div>

            <div style={{
              marginTop: '20px',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              backgroundColor: '#f9f9f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start'
            }}>
              <input
                type="checkbox"
                id="robotCheck"
                checked={isRobotChecked}
                readOnly
                onClick={(e) => {
                  e.preventDefault();
                  if (!isRobotChecked) {
                    setPuzzleType(1); // Force Color Logic ONLY
                    setShowPuzzle(true);
                  } else {
                    setIsRobotChecked(false);
                  }
                }}
                style={{ width: '20px', height: '20px', marginRight: '10px', cursor: 'pointer' }}
              />
              <label htmlFor="robotCheck" style={{ fontSize: '14px', fontWeight: 'bold', color: '#555', cursor: 'pointer' }}>
                I'm not a robot
              </label>
              <div style={{ marginLeft: 'auto' }}>
                <img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" alt="captcha" style={{ width: '24px' }} />
              </div>
            </div>

            {showPuzzle && (
              <SecurityPuzzle
                type={puzzleType}
                onSuccess={() => {
                  setIsRobotChecked(true);
                  setShowPuzzle(false);
                }}
                onCancel={() => setShowPuzzle(false)}
              />
            )}

            <button
              type="submit"
              style={{
                ...buttonStyle,
                opacity: (loading || !isRobotChecked) ? 0.7 : 1,
                backgroundColor: isRobotChecked ? '#4e73df' : '#a0b3e8',
                marginTop: '15px'
              }}
              disabled={loading || !isRobotChecked}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            {/* Bouton pour basculer vers la reconnaissance faciale */}
            <button
              type="button"
              onClick={() => setShowFaceAuth(true)}
              style={{ ...buttonStyle, backgroundColor: '#1cc88a' }}
            >
              Login with Face ID
            </button>
          </form>
        )}


        <p style={{ marginTop: '1rem', color: '#666', fontSize: '14px' }}>
          Don't have an account? <a href="/register" style={{ color: '#4e73df' }}>Register</a>
        </p>
      </div>
    </div>
  );
};


const SecurityPuzzle = ({ type, onSuccess, onCancel }) => {
  const [answer, setAnswer] = useState('');

  // Generate puzzle data
  const [puzzleData] = useState(() => {
    const colors = ['Rouge', 'Bleu', 'Vert', 'Jaune'];
    const target = colors[Math.floor(Math.random() * colors.length)];
    const colorHexMap = { 'Rouge': '#FF5252', 'Bleu': '#448AFF', 'Vert': '#4CAF50', 'Jaune': '#FFEB3B' };
    const options = Object.values(colorHexMap).sort(() => Math.random() - 0.5);
    return { q: `Cliquez sur le carré ${target}`, a: target, options };
  });

  const modalStyle = {
    position: 'fixed',
    top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999
  };

  const puzzleBoxStyle = {
    background: 'white', padding: '30px', borderRadius: '15px',
    boxShadow: '0 15px 35px rgba(0,0,0,0.3)',
    width: '350px', textAlign: 'center'
  };

  const handleMathSubmit = (e) => {
    e.preventDefault();
    if (answer.trim() === puzzleData.a) {
      onSuccess();
    } else {
      alert('Verification failed. Please try again.');
      onCancel();
    }
  };

  return (
    <div style={modalStyle}>
      <div style={puzzleBoxStyle}>
        <div style={{ fontSize: '24px', marginBottom: '10px' }}>🛡️ Vérification</div>
        <p style={{ color: '#666', marginBottom: '20px' }}>Sélectionnez la bonne couleur pour continuer.</p>

        <p style={{ fontWeight: 'bold', fontSize: '20px', marginBottom: '20px', color: '#333' }}>
            Cliquez sur le carré : <span style={{ color: '#4e73df' }}>{puzzleData.a}</span>
        </p>

        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            {(puzzleData.options || ['#FF5252', '#448AFF', '#4CAF50', '#FFEB3B']).map((colorHex, idx) => {
              const colorNames = { 
                '#FF5252': 'Rouge', 
                '#448AFF': 'Bleu', 
                '#4CAF50': 'Vert', 
                '#FFEB3B': 'Jaune' 
              };
              const cName = colorNames[colorHex];
              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (cName === puzzleData.a) onSuccess();
                    else { alert('Erreur! Veuillez réessayer.'); onCancel(); }
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  style={{
                    height: '80px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    backgroundColor: colorHex,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '3px solid transparent'
                  }}
                >
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 'bold', pointerEvents: 'none', fontSize: '24px' }}>?</span>
                </div>
              );
            })}
          </div>
          <p style={{ marginTop: '15px', fontSize: '12px', color: '#999' }}>Vérification de sécurité anti-robot</p>
        </div>

        <button onClick={onCancel} style={{ marginTop: '20px', background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline' }}>
          Annuler
        </button>
      </div>
    </div>
  );
};


export default UnifiedLogin;
