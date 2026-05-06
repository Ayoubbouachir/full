import React, { useState, useEffect, useCallback } from 'react';

/**
 * SmartAccessibility Component
 * Supports both Alt + Q and Ctrl + Q
 */
const ScreenMagnifier = () => {
    const [isActive, setIsActive] = useState(false);
    const [globalZoom, setGlobalZoom] = useState(1);
    const [hoveredText, setHoveredText] = useState("");
    const [isContrast, setIsContrast] = useState(false);

    const toggleSystem = useCallback(() => {
        setIsActive(prev => !prev);
    }, []);

    useEffect(() => {
        window.addEventListener('toggle-magnifier', toggleSystem);
        
        const handleKeyDown = (e) => {
            // Support Alt+Q OR Ctrl+Q
            const isQ = e.key && e.key.toLowerCase() === 'q';
            if ((e.altKey || e.ctrlKey) && isQ) {
                e.preventDefault();
                toggleSystem();
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('toggle-magnifier', toggleSystem);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [toggleSystem]);

    useEffect(() => {
        if (isActive) {
            document.documentElement.style.zoom = globalZoom;
        } else {
            document.documentElement.style.zoom = "1";
        }
    }, [isActive, globalZoom]);

    useEffect(() => {
        if (isActive && isContrast) {
            document.body.style.filter = "contrast(1.2) brightness(1.1)";
        } else {
            document.body.style.filter = "none";
        }
    }, [isActive, isContrast]);

    useEffect(() => {
        if (!isActive) return;

        const handleMouseOver = (e) => {
            const el = e.target;
            if (['P', 'A', 'BUTTON', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SPAN', 'LI', 'IMG', 'DIV'].includes(el.tagName)) {
                // On ne prend le texte que si c'est un petit conteneur ou s'il contient du texte direct
                const text = (el.innerText || el.alt || "").trim();
                
                if (text.length > 1 && text.length < 1000) {
                    el.style.transition = 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                    el.style.transform = 'scale(1.1)';
                    el.style.zIndex = '10000';
                    setHoveredText(text);
                }
            }
        };

        const handleMouseOut = (e) => {
            const el = e.target;
            el.style.transform = '';
        };

        document.addEventListener('mouseover', handleMouseOver);
        document.addEventListener('mouseout', handleMouseOut);

        return () => {
            document.removeEventListener('mouseover', handleMouseOver);
            document.removeEventListener('mouseout', handleMouseOut);
        };
    }, [isActive]);

    if (!isActive) return null;

    return (
        <>
            <div style={{
                position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 2147483647,
                background: '#2d3436', color: 'white', padding: '10px', display: 'flex',
                alignItems: 'center', justifyContent: 'center', gap: '20px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)', fontFamily: 'sans-serif'
            }}>
                <div style={{ fontWeight: 'bold', borderRight: '1px solid #555', paddingRight: '15px' }}>
                    MODES D'ASSISTANCE
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>Taille site :</span>
                    <button onClick={() => setGlobalZoom(1)} style={btnStyle(globalZoom === 1)}>Normal</button>
                    <button onClick={() => setGlobalZoom(1.25)} style={btnStyle(globalZoom === 1.25)}>125%</button>
                    <button onClick={() => setGlobalZoom(1.5)} style={btnStyle(globalZoom === 1.5)}>150%</button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>Lumière :</span>
                    <button onClick={() => setIsContrast(!isContrast)} style={btnStyle(isContrast)}>
                        {isContrast ? "Contraste ON" : "Normal"}
                    </button>
                </div>

                <button 
                    onClick={toggleSystem}
                    style={{ background: '#d63031', border: 'none', color: 'white', padding: '5px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    Fermer (Alt+Q / Ctrl+Q)
                </button>
            </div>

            {hoveredText && (
                <div style={{
                    position: 'fixed', 
                    bottom: '30px', 
                    left: '50%', 
                    transform: 'translateX(-50%)',
                    width: 'auto', 
                    minWidth: '50%',
                    maxWidth: '90%', 
                    zIndex: 2147483647,
                    background: 'rgba(255, 255, 0, 0.98)', 
                    color: '#000', 
                    padding: '15px 40px',
                    borderRadius: '60px', 
                    boxShadow: '0 15px 50px rgba(0,0,0,0.6)',
                    fontSize: '32px', 
                    fontWeight: '900', 
                    textAlign: 'center',
                    border: '5px solid #000', 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    pointerEvents: 'none' // Pour ne pas gêner le clic sur la page
                }}>
                    {hoveredText}
                </div>
            )}

            <style>{`
                @keyframes slideUp { from { transform: translateX(-50%) translateY(100px); } to { transform: translateX(-50%) translateY(0); } }
            `}</style>
        </>
    );
};

const btnStyle = (active) => ({
    background: active ? '#9c27b0' : '#444',
    color: 'white', border: 'none', padding: '5px 12px', borderRadius: '4px',
    cursor: 'pointer', fontSize: '13px', fontWeight: active ? 'bold' : 'normal',
    transition: 'all 0.2s'
});

export default ScreenMagnifier;
