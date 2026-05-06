import React, { useEffect, useRef, useState } from 'react';

const MapPicker = ({ onPositionSelect, initialValue }) => {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        const checkLeaflet = setInterval(() => {
            if (window.L) {
                clearInterval(checkLeaflet);
                setIsLoaded(true);
            }
        }, 100);
        return () => clearInterval(checkLeaflet);
    }, []);

    const getAddressFromCoords = async (lat, lng) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await response.json();
            if (data && data.display_name) {
                const address = data.address;
                const city = address.city || address.town || address.village || address.suburb || address.county || "";
                const neighborhood = address.neighbourhood || address.suburb || "";
                
                let locationName = data.display_name;
                if (city) {
                    locationName = neighborhood ? `${neighborhood}, ${city}` : city;
                }
                
                onPositionSelect(locationName);
                setSearchQuery(locationName);
            }
        } catch (err) {
            console.error("Erreur de géocodage inverse:", err);
            onPositionSelect(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        }
    };

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        if (!searchQuery.trim()) return;

        setSearching(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();

            if (data && data.length > 0) {
                const { lat, lon, display_name } = data[0];
                const newPos = [parseFloat(lat), parseFloat(lon)];
                
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.setView(newPos, 13);
                    markerRef.current.setLatLng(newPos);
                    onPositionSelect(display_name);
                    setSearchQuery(display_name);
                }
            } else {
                alert("Aucun emplacement trouvé pour cette recherche.");
            }
        } catch (err) {
            console.error("Erreur de recherche:", err);
            alert("Une erreur est survenue lors de la recherche.");
        } finally {
            setSearching(false);
        }
    };

    const handleGetCurrentPosition = () => {
        if (!navigator.geolocation) {
            alert("La géolocalisation n'est pas supportée par votre navigateur.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const newPos = [latitude, longitude];
                
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.setView(newPos, 15);
                    markerRef.current.setLatLng(newPos);
                    getAddressFromCoords(latitude, longitude);
                }
            },
            () => {
                alert("Impossible d'obtenir votre position. Vérifiez vos permissions.");
            }
        );
    };

    useEffect(() => {
        if (!isLoaded || !mapContainerRef.current) return;

        const L = window.L;
        let defaultPos = [36.8065, 10.1815]; 
        
        if (initialValue && initialValue.includes(',')) {
            const coords = initialValue.split(',').map(v => parseFloat(v));
            if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                defaultPos = coords;
            }
        }

        if (!mapInstanceRef.current) {
            mapInstanceRef.current = L.map(mapContainerRef.current).setView(defaultPos, 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(mapInstanceRef.current);

            markerRef.current = L.marker(defaultPos, { draggable: true }).addTo(mapInstanceRef.current);

            markerRef.current.on('dragend', () => {
                const latlng = markerRef.current.getLatLng();
                getAddressFromCoords(latlng.lat, latlng.lng);
            });

            mapInstanceRef.current.on('click', (e) => {
                markerRef.current.setLatLng(e.latlng);
                getAddressFromCoords(e.latlng.lat, e.latlng.lng);
            });
        }
    }, [isLoaded]);

    return (
        <div style={{ position: 'relative', marginTop: '10px' }}>
            <form 
                onSubmit={handleSearch} 
                style={{ 
                    display: 'flex', 
                    gap: '5px', 
                    marginBottom: '8px',
                    position: 'absolute',
                    top: '10px',
                    left: '50px',
                    right: '60px',
                    zIndex: 1000
                }}
            >
                <input
                    type="text"
                    placeholder="Chercher une zone (ex: Ariana)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '20px',
                        border: '1px solid #ddd',
                        fontSize: '13px',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                        outline: 'none',
                        background: 'white'
                    }}
                />
                <button
                    type="submit"
                    disabled={searching}
                    style={{
                        padding: '8px 15px',
                        backgroundColor: '#36b9cc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                    }}
                >
                    {searching ? '...' : '🔍'}
                </button>
            </form>

            <div 
                ref={mapContainerRef} 
                style={{ 
                    width: '100%', 
                    height: '350px', 
                    borderRadius: '8px', 
                    border: '1px solid #ddd',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
                    zIndex: 1
                }} 
            />
            <button
                type="button"
                onClick={handleGetCurrentPosition}
                style={{
                    position: 'absolute',
                    bottom: '20px',
                    right: '10px',
                    zIndex: 1000,
                    backgroundColor: 'white',
                    border: '2px solid #36b9cc',
                    color: '#36b9cc',
                    padding: '8px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    width: '40px',
                    height: '40px'
                }}
                title="Ma position actuelle"
            >
                <i className="icofont-location-arrow" style={{ fontSize: '20px' }}></i>
            </button>
            {!isLoaded && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9f9f9', borderRadius: '8px', zIndex: 1001 }}>Chargement de la carte...</div>}
        </div>
    );
};

export default MapPicker;
