import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet + React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const AIRoutePredictor = () => {
    const [pointA, setPointA] = useState(null);
    const [pointB, setPointB] = useState(null);
    const [route, setRoute] = useState([]);
    const [distance, setDistance] = useState(0);
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [roadType, setRoadType] = useState('primary');
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [geocoding, setGeocoding] = useState(false);

    // Initial setup (Location & User List)
    useEffect(() => {
        const fetchLocation = async () => {
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const currentPos = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        };
                        setPointA(currentPos);
                        console.log("Current location captured via Browser:", currentPos);
                    },
                    (error) => {
                        console.warn("Browser geolocation denied. Trying Web-IP geolocation...");
                        getWebIPGeolocation();
                    }
                );
            } else {
                getWebIPGeolocation();
            }
        };

        const fetchUsersData = async () => {
            try {
                const response = await fetch('https://fulll-aadvh5h7hrhmdye2.francecentral-01.azurewebsites.net/users/FindAll');
                const data = await response.json();
                setUsers(data.filter(u => u.address && u.address.length > 3));
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };

        fetchLocation();
        fetchUsersData();
    }, []);

    const getWebIPGeolocation = async () => {
        try {
            // Use ipapi.co as a free web fallback for approximate location
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            
            if (data && data.latitude && data.longitude) {
                const webPos = { lat: data.latitude, lng: data.longitude };
                setPointA(webPos);
                console.log("Location captured via Web-IP fallback:", webPos);
            } else {
                // Last resort: profile address
                fallbackToProfileAddress();
            }
        } catch (error) {
            console.error("Web IP Geolocation failed:", error);
            fallbackToProfileAddress();
        }
    };

    const fallbackToProfileAddress = async () => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) return;
        
        const userObj = JSON.parse(storedUser);
        if (userObj.address && userObj.address !== "System") {
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(userObj.address)}`);
                const data = await response.json();
                if (data && data.length > 0) {
                    setPointA({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
                }
            } catch (e) { console.error("Profile geocoding failed", e); }
        }
    };

    // Generic geocoding function for Point B
    const geocodeAddress = async (address) => {
        setGeocoding(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
            const data = await response.json();

            if (data && data.length > 0) {
                const pos = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
                setPointB(pos);
                return pos;
            } else {
                alert(`Could not find location for: ${address}`);
            }
        } catch (error) {
            console.error("Geocoding error:", error);
        } finally {
            setGeocoding(false);
        }
        return null;
    };

    // Handle User selection for Point B
    const handleUserSelect = async (userId) => {
        setSelectedUserId(userId);
        const targetUser = users.find(u => u._id === userId);
        if (!targetUser || !targetUser.address) return;

        const pos = await geocodeAddress(targetUser.address);
        if (pos && pointA) {
            fetchRoute(pointA, pos);
        }
    };

    // Handler for map clicks
    const MapEvents = () => {
        useMapEvents({
            click(e) {
                if (!pointA) {
                    setPointA(e.latlng);
                } else if (!pointB) {
                    setPointB(e.latlng);
                    fetchRoute(pointA, e.latlng);
                } else {
                    // Reset and start over
                    setPointA(e.latlng);
                    setPointB(null);
                    setRoute([]);
                    setPrediction(null);
                    setSelectedUserId(''); // Reset dropdown too
                }
            },
        });
        return null;
    };

    const fetchRoute = async (start, end) => {
        setLoading(true);
        try {
            // 1. Use OSRM to get the actual road route
            const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`);
            const data = await response.json();

            if (data.routes && data.routes.length > 0) {
                const routeData = data.routes[0];
                setRoute(routeData.geometry.coordinates.map(coord => [coord[1], coord[0]]));
                setDistance(routeData.distance);

                // 2. Automatically detect road type using Overpass API
                // We check near the midpoint of the route to get a representative road type
                const midpoint = routeData.geometry.coordinates[Math.floor(routeData.geometry.coordinates.length / 2)];
                await detectRoadType(midpoint[1], midpoint[0]);
            }
        } catch (error) {
            console.error("Error fetching route:", error);
            alert("Could not calculate route. Please try different points.");
        } finally {
            setLoading(false);
        }
    };

    const detectRoadType = async (lat, lon) => {
        try {
            // Query Overpass to find the nearest road with a highway tag
            const query = `[out:json];way(around:50,${lat},${lon})[highway];out;`;
            const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
            const data = await response.json();

            if (data.elements && data.elements.length > 0) {
                // Find the first element that has a highway tag we recognize
                const validTypes = ['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'residential', 'service', 'unclassified'];
                for (const element of data.elements) {
                    const type = element.tags.highway;
                    if (validTypes.includes(type)) {
                        setRoadType(type);
                        console.log("Automatically detected road type:", type);
                        break;
                    }
                }
            }
        } catch (error) {
            console.error("Error detecting road type:", error);
        }
    };

    const handlePredict = async () => {
        if (!pointA || !pointB || !distance) {
            alert("Please select two points on the map first.");
            return;
        }
        
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8002/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    length_m: distance,
                    from_lat: pointA.lat,
                    from_lon: pointA.lng,
                    to_lat: pointB.lat,
                    to_lon: pointB.lng,
                    road_type: roadType,
                    oneway: 'yes'
                })
            });
            const data = await response.json();
            setPrediction(data);
        } catch (error) {
            console.error("Error calling prediction API:", error);
            alert("AI Server is not responding. Make sure FastAPI is running.");
        } finally {
            setLoading(false);
        }
    };

    // Re-trigger prediction if road type changes and we already have a prediction
    useEffect(() => {
        if (prediction && pointA && pointB) {
            handlePredict();
        }
    }, [roadType]);

    // Dynamic styling based on road type
    const getRouteColor = () => {
        const colors = {
            'motorway': '#E53E3E',
            'trunk': '#DD6B20',
            'primary': '#D69E2E',
            'secondary': '#38A169',
            'tertiary': '#3182CE',
            'residential': '#805AD5'
        };
        return colors[roadType] || '#4A90E2';
    };

    const containerStyle = {
        padding: '24px',
        maxWidth: '1200px',
        margin: '0 auto',
        fontFamily: "'Inter', sans-serif"
    };

    const cardStyle = {
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
        padding: '30px',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 350px',
        gap: '30px',
        minHeight: '70vh'
    };

    return (
        <div style={containerStyle}>
            <div style={{ marginBottom: '30px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#1a202c', marginBottom: '10px' }}>
                    AI Delivery Estimator
                </h1>
                <p style={{ color: '#718096', fontSize: '1.1rem' }}>
                    Click on the map to set <strong>Point A</strong> and <strong>Point B</strong> for a high-accuracy travel time prediction.
                </p>
            </div>

            <div style={cardStyle}>
                <div style={{ position: 'relative', borderRadius: '15px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <MapContainer 
                        center={pointA ? [pointA.lat, pointA.lng] : [36.8065, 10.1815]} 
                        zoom={pointA ? 15 : 11} 
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <MapEvents />
                        {pointA && <Marker position={pointA} />}
                        {pointB && <Marker position={pointB} />}
                        {route.length > 0 && (
                            <Polyline 
                                positions={route} 
                                color={getRouteColor()} 
                                weight={6} 
                                opacity={0.8} 
                                dashArray={roadType === 'residential' ? '5, 10' : ''}
                            />
                        )}
                    </MapContainer>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '15px', border: '1px solid #edf2f7' }}>
                        <h3 style={{ margin: '0 0 15px 0', fontSize: '1.2rem', color: '#2d3748' }}>Delivery Context</h3>
                        
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ fontSize: '0.9rem', color: '#4a5568', display: 'block', marginBottom: '8px' }}>
                                <i className="icofont-location-pin me-2"></i>Origin (Point A)
                            </label>
                            <div style={{ 
                                padding: '10px', 
                                background: pointA ? '#e6fffa' : '#fff5f5', 
                                borderRadius: '10px', 
                                border: '1px solid',
                                borderColor: pointA ? '#38b2ac' : '#feb2b2',
                                fontSize: '0.85rem',
                                color: pointA ? '#2c7a7b' : '#c53030',
                                textAlign: 'center'
                            }}>
                                {pointA ? "Auto-detected successfully" : "Waiting for location..."}
                            </div>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ fontSize: '0.9rem', color: '#4a5568', display: 'block', marginBottom: '8px' }}>
                                <i className="icofont-user me-2"></i>Target User (Point B)
                            </label>
                            <select 
                                value={selectedUserId} 
                                onChange={(e) => handleUserSelect(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e0', outline: 'none' }}
                                disabled={geocoding}
                            >
                                <option value="">-- Choose User --</option>
                                {users.map(u => (
                                    <option key={u._id} value={u._id}>
                                        {u.prenom} {u.nom} ({u.address})
                                    </option>
                                ))}
                            </select>
                            {geocoding && <small style={{ color: '#4A90E2', marginTop: '5px', display: 'block' }}>Locating user...</small>}
                        </div>

                        <label style={{ fontSize: '0.9rem', color: '#4a5568', display: 'block', marginBottom: '8px' }}>
                            <i className="icofont-road me-2"></i>Road Type
                        </label>
                        <select 
                            value={roadType} 
                            onChange={(e) => setRoadType(e.target.value)}
                            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e0', outline: 'none' }}
                        >
                            <option value="motorway">Motorway</option>
                            <option value="trunk">Trunk</option>
                            <option value="primary">Primary Road</option>
                            <option value="secondary">Secondary Road</option>
                            <option value="tertiary">Tertiary Road</option>
                            <option value="residential">Residential</option>
                        </select>
                    </div>

                    <button 
                        onClick={handlePredict}
                        disabled={!pointB || loading}
                        style={{
                            width: '100%',
                            padding: '15px',
                            background: !pointB || loading ? '#cbd5e0' : '#1a202c',
                            color: 'white',
                            borderRadius: '12px',
                            fontWeight: 'bold',
                            border: 'none',
                            cursor: !pointB || loading ? 'not-allowed' : 'pointer',
                            transition: 'background 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px'
                        }}
                    >
                        {loading ? (
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        ) : (
                            <i className="icofont-magic"></i>
                        )}
                        Predict Delivery Time
                    </button>

                    {prediction && (
                        <div style={{ 
                            padding: '25px', 
                            background: 'linear-gradient(135deg, #1cc88a 0%, #13855c 100%)', 
                            borderRadius: '18px', 
                            color: 'white',
                            boxShadow: '0 10px 20px rgba(28, 200, 138, 0.3)',
                            marginTop: '10px'
                        }}>
                            <div style={{ fontSize: '0.85rem', opacity: '0.9', marginBottom: '5px', letterSpacing: '1px' }}>AI PREDICTION RESULTS</div>
                            <div style={{ fontSize: '2.8rem', fontWeight: '800', marginBottom: '10px', display: 'flex', alignItems: 'baseline' }}>
                                {prediction.estimated_time_min} 
                                <span style={{ fontSize: '1.2rem', fontWeight: '400', marginLeft: '5px' }}>min</span>
                            </div>
                            
                            <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.2)', margin: '15px 0' }} />
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', opacity: '0.8' }}>SPEED</div>
                                    <div style={{ fontWeight: '700', fontSize: '1.2rem' }}>{prediction.predicted_speed_kmh} <span style={{ fontSize: '0.8rem' }}>km/h</span></div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', opacity: '0.8' }}>DISTANCE</div>
                                    <div style={{ fontWeight: '700', fontSize: '1.2rem' }}>{(prediction.distance_m / 1000).toFixed(2)} <span style={{ fontSize: '0.8rem' }}>km</span></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {!pointA && (
                        <div style={{ padding: '30px', textAlign: 'center', color: '#718096', border: '2px dashed #e2e8f0', borderRadius: '15px', marginTop: '20px' }}>
                            <i className="icofont-location-pin" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '12px' }}></i>
                            <div style={{ fontWeight: '600' }}>Step 1: Select Origin</div>
                            <div style={{ fontSize: '0.85rem' }}>Click anywhere on the map</div>
                        </div>
                    )}
                    {pointA && !pointB && (
                        <div style={{ padding: '30px', textAlign: 'center', color: '#4A90E2', border: '2px dashed #4A90E2', borderRadius: '15px', marginTop: '20px' }}>
                            <i className="icofont-location-arrow" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '12px' }}></i>
                            <div style={{ fontWeight: '600' }}>Step 2: Select Destination</div>
                            <div style={{ fontSize: '0.85rem' }}>Click for the arrival point</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIRoutePredictor;
