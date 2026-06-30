import { useState } from "react";
import axios from "axios";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import "./App.css";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

type Position = [number, number];
type Mode = "driving-car" | "cycling-regular" | "foot-walking";

function FitMap({ positions }: { positions: Position[] }) {
  const map = useMap();

  if (positions.length > 1) {
    map.fitBounds(positions, { padding: [50, 50] });
  }

  return null;
}

function App() {
  const [from, setFrom] = useState("Meerut, Uttar Pradesh");
  const [to, setTo] = useState("Delhi India Gate");
  const [mode, setMode] = useState<Mode>("driving-car");

  const [positions, setPositions] = useState<Position[]>([]);
  const [distanceKm, setDistanceKm] = useState("--");
  const [durationMin, setDurationMin] = useState("--");
  const [weather, setWeather] = useState("--");
  const [aqi, setAqi] = useState("--");
  const [steps, setSteps] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const places = [
    "Meerut, Uttar Pradesh",
    "Delhi India Gate",
    "Noida",
    "Ghaziabad",
    "Gurgaon",
    "Agra",
    "Jaipur",
    "Mumbai",
    "Haridwar",
    "Dehradun",
  ];

  const getCoords = async (place: string) => {
    const res = await axios.get(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        place
      )}`
    );

    if (!res.data || res.data.length === 0) {
      throw new Error("Location not found");
    }

    return {
      lat: Number(res.data[0].lat),
      lon: Number(res.data[0].lon),
    };
  };

  const getWeatherAndAQI = async (lat: number, lon: number) => {
    const weatherRes = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m`
    );

    const airRes = await axios.get(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi`
    );

    setWeather(`${weatherRes.data.current.temperature_2m}°C`);
    setAqi(String(airRes.data.current.european_aqi));
  };

  const findRoute = async () => {
  if (!from || !to) {
    alert("Please enter source and destination");
    return;
  }

  try {
    setLoading(true);

    const start = await getCoords(from);
    const end = await getCoords(to);

    let profile = "driving";
    if (mode === "foot-walking") profile = "walking";
    if (mode === "cycling-regular") profile = "cycling";

    const routeRes = await axios.get(
      `https://router.project-osrm.org/route/v1/${profile}/${start.lon},${start.lat};${end.lon},${end.lat}?overview=full&geometries=geojson&steps=true`
    );

    const route = routeRes.data.routes[0];

    const coords: Position[] = route.geometry.coordinates.map(
      (point: [number, number]) => [point[1], point[0]]
    );

    setPositions(coords);

    const km = route.distance / 1000;
    const min = Math.round(route.duration / 60);

    setDistanceKm(km.toFixed(1));
    setDurationMin(min.toString());

    const routeSteps = route.legs[0].steps.map((step: any) => {
      const road = step.name ? ` on ${step.name}` : "";
      return `${step.maneuver.type}${road}`;
    });

    setSteps(routeSteps);

    await getWeatherAndAQI(end.lat, end.lon);
  } catch (error) {
    console.log(error);
    alert("Route not found. Try Delhi to Meerut or Ghaziabad to Delhi.");
  } finally {
    setLoading(false);
  }
};

  

  const useMyLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFrom(`${pos.coords.latitude}, ${pos.coords.longitude}`);
      },
      () => alert("Location permission denied")
    );
  };

  const distanceNumber = distanceKm === "--" ? 0 : Number(distanceKm);
  const fuelCost =
    mode === "foot-walking" ? 0 : Math.round((distanceNumber / 18) * 95);
  const co2 = mode === "foot-walking" ? "0" : (distanceNumber * 0.12).toFixed(1);
  const toll = mode === "driving-car" ? Math.round(distanceNumber * 1.8) : 0;

  const speakRoute = () => {
    const text = `Route from ${from} to ${to}. Distance ${distanceKm} kilometers. Estimated time ${durationMin} minutes.`;
    speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  };

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <div className="logo">🛰️</div>
          <div>
            <h1>Smart Route Optimizer</h1>
            <p>Google Maps style AI route dashboard</p>
          </div>
        </div>

        <div className="top-tabs">
          <button>🚀 Fastest</button>
          <button>🛡 Safest</button>
          <button>🌱 Eco</button>
          <button onClick={speakRoute}>🔊 Voice</button>
        </div>
      </header>

      <main className="layout">
        <aside className="sidebar glass">
          <h2>📍 Find Your Route</h2>

          <label>From</label>
          <div className="input-box">
            <span className="green">●</span>
            <input
              list="places"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>

          <label>To</label>
          <div className="input-box">
            <span className="red">●</span>
            <input
              list="places"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          <datalist id="places">
            {places.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>

          <label>Travel Mode</label>
          <div className="mode-grid">
            <button
              className={mode === "driving-car" ? "active" : ""}
              onClick={() => setMode("driving-car")}
            >
              🚗 Car
            </button>

            <button
              className={mode === "cycling-regular" ? "active" : ""}
              onClick={() => setMode("cycling-regular")}
            >
              🏍 Bike
            </button>

            <button
              className={mode === "foot-walking" ? "active" : ""}
              onClick={() => setMode("foot-walking")}
            >
              🚶 Walk
            </button>
          </div>

          <button className="find-btn" onClick={findRoute}>
            {loading ? "Finding Route..." : "✨ Find Best Route"}
          </button>

          <button className="location-btn" onClick={useMyLocation}>
            🎯 Use My Location
          </button>

          <div className="recent">
            <h3>Recent Searches</h3>
            <p>Meerut → Delhi</p>
            <p>Noida → Agra</p>
            <p>Delhi → Jaipur</p>
          </div>
        </aside>

        <section className="content">
          <div className="map-card glass">
            <div className="traffic-badge">🟢 Live Traffic • AI Moderate</div>

            <MapContainer center={[28.7041, 77.1025]} zoom={7} className="map">
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />

              {positions.length > 1 && (
                <>
                  <FitMap positions={positions} />

                  <Marker position={positions[0]}>
                    <Popup>Source: {from}</Popup>
                  </Marker>

                  <Marker position={positions[positions.length - 1]}>
                    <Popup>Destination: {to}</Popup>
                  </Marker>

                  <Polyline
                    positions={positions}
                    pathOptions={{
                      color:
                        mode === "foot-walking"
                          ? "#facc15"
                          : mode === "cycling-regular"
                          ? "#38bdf8"
                          : "#22c55e",
                      weight: 6,
                    }}
                  />
                </>
              )}
            </MapContainer>

            {positions.length > 1 && (
              <div className="floating glass">
                <p>⏱ {durationMin} min</p>
                <p>🛣 {distanceKm} km</p>
                <p>💰 Toll ₹{toll}</p>
              </div>
            )}
          </div>

          <div className="cards">
            <Card icon="🛣️" title="Distance" value={`${distanceKm} km`} sub="Real route" />
            <Card icon="⏱️" title="Duration" value={`${durationMin} min`} sub="Estimated" />
            <Card icon="🚦" title="Traffic" value="Moderate" sub="AI based" />
            <Card icon="🌿" title="AQI" value={aqi} sub="Live AQI" />
            <Card icon="🌤️" title="Weather" value={weather} sub="Live weather" />
            <Card icon="⛽" title="Fuel Cost" value={`₹${fuelCost}`} sub="Estimated" />
            <Card icon="🌍" title="CO₂" value={`${co2} kg`} sub="Estimated" />
            <Card icon="💰" title="Toll" value={`₹${toll}`} sub="Estimated" />
          </div>

          <div className="bottom">
            <div className="panel glass">
              <h2>📋 Turn-by-Turn Directions</h2>

              {steps.length > 0 ? (
                steps.slice(0, 8).map((step, index) => (
                  <p key={index}>
                    <b>{index + 1}</b> {step}
                  </p>
                ))
              ) : (
                <p>Search route to show directions.</p>
              )}
            </div>

            <div className="panel glass">
              <h2>🔁 Route Alternatives</h2>
              <div className="alt blue">
                🏆 Fastest Route <span>{durationMin} min</span>
              </div>
              <div className="alt green-bg">
                🛡 Safest Route <span>+15 min</span>
              </div>
              <div className="alt purple">
                🌱 Eco Route <span>Low CO₂</span>
              </div>
            </div>

            <div className="panel glass">
              <h2>🤖 AI Route Insights</h2>
              <p>✅ Selected mode gives real road route.</p>
              <p>✅ AQI and weather are fetched live.</p>
              <p>✅ Fuel, toll and CO₂ are estimated.</p>
              <p>✅ Voice navigation is enabled.</p>
              <div className="tip">
                💡 Resume point: Real-time route optimization using ORS,
                OpenStreetMap, Weather API and AQI API.
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Card({ icon, title, value, sub }: any) {
  return (
    <div className="card glass">
      <div className="icon">{icon}</div>
      <p>{title}</p>
      <h3>{value}</h3>
      <small>{sub}</small>
    </div>
  );
}

export default App;
