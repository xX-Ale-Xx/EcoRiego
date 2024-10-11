import './App.css';
import { useEffect, useState } from 'react';

function App() {
  const [weatherData, setWeatherData] = useState({
    temperature: null,
    humidity: null,
    icon: '',
  });
  const [location, setLocation] = useState('Guatemala');
  const [irrigationActive, setIrrigationActive] = useState(false); // Inicio en falso
  const [autoMode, setAutoMode] = useState(false);

  // Manejo del cambio de estado del riego
  const handleIrrigationButtonClick = async () => {
    setIrrigationActive(!irrigationActive);
    
    // Llamada al backend para pausar o reanudar el riego manualmente
    const route = irrigationActive ? '/pause' : '/resume';
    try {
      const response = await fetch(route, { method: 'POST' });
      if (!response.ok) {
        throw new Error('Error al cambiar el estado del riego');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Manejo del cambio de modo automático
  const handleAutoModeToggleChange = async () => {
    setAutoMode(!autoMode);
    
    // Llamada al backend para activar o desactivar el modo automático
    const route = autoMode ? '/manual' : '/automatico';
    try {
      const response = await fetch(route, { method: 'POST' });
      if (!response.ok) {
        throw new Error('Error al cambiar el modo automático');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    // Simulación de actualización basada en el modo automático
    if (autoMode) {
      setIrrigationActive(false); // Si está en modo automático, el riego manual se desactiva
    }
  }, [autoMode]);

  useEffect(() => {
    // Función para obtener los datos climáticos desde la API y la humedad del backend
    const fetchWeatherData = async () => {
      const apiKey = '091e5c01ceadb58617a7aeaa7e3584db'; // Reemplaza con tu propia API Key de OpenWeatherMap
      const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${location}&units=metric&appid=${apiKey}`;

      try {
        const response = await fetch(apiUrl);
        const responseBack = await fetch('/humedad');  // Usa ruta relativa para el backend
        const dataBack = await responseBack.json();
        console.log('Humedad del sensor:', dataBack.humedad);
        
        if (response.ok && responseBack.ok) {
          //const data = await response.json();
         // const temperature = data.main.temp;
         // const humidity = data.main.humidity;
          //const icon = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

          // Establece los datos del clima en el estado
          //setWeatherData({ temperature, humidity, icon });

          // Modifica el estado del riego basado en el sensor de humedad
          if (dataBack.humedad === 1) {
            console.log("La tierra está seca. Regando...");
            setIrrigationActive(true); // Cambia el estado de riego si es necesario
          } else {
            console.log("La tierra está húmeda. Pausando riego...");
            setIrrigationActive(false); // Pausa el riego
          }
        } else {
          console.error("Error fetching weather or humidity data");
        }
      } catch (error) {
        console.error("Unable to fetch weather or humidity data:", error);
      }
    };

    fetchWeatherData();
    const intervalId = setInterval(fetchWeatherData, 3000); // Actualiza cada 3 segundos

    return () => clearInterval(intervalId);
  }, [location]);

  return (
    <div className="App">
      <div className="card">
        <h2>Irrigation System</h2>
        <div className="icon-container">
          <svg id="water-icon" xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke={irrigationActive ? "#3b82f6" : "#777"} className="icon">
            <path d="M12 21c4.97 0 9-4.03 9-9S12 2 12 2 3 7.03 3 12s4.03 9 9 9z" />
          </svg>
        </div>
        <button 
          className={`control-button ${autoMode ? "disabled" : ""}`} 
          id="irrigation-button"
          onClick={handleIrrigationButtonClick}
          disabled={autoMode}
          style={{ backgroundColor: irrigationActive ? "#f44336" : "#3b82f6" }}
        >
          {irrigationActive ? "Pause" : "Resume"}
        </button>

        <div className="weather-info" style={{ textAlign: 'center' }}>
          {weatherData.temperature !== null ? (
            <>
              <span className="weather-icon">
                <img src={weatherData.icon} alt="Weather Icon" width="48" />
              </span>
              <span className="weather-details">
                <strong>Weather</strong>
                <span>&nbsp;{weatherData.temperature}°C &nbsp;</span>
                <span>{weatherData.humidity}% Humidity</span>
              </span>
            </>
          ) : (
            <span style={{ textAlign: 'center' }}>{irrigationActive 
            ? "Dry land."
            : "Wet land."
          }</span>
          )}
        </div>

        <p className="irrigation-status-text" id="irrigation-status">
          {irrigationActive 
            ? "Irrigation in progress. Providing water to your plants."
            : "Irrigation paused. Waiting to resume."
          }
        </p>

        <div className="auto-mode">
          <span>Auto Mode</span>
          <label className="switch">
            <input 
              type="checkbox" 
              id="auto-mode-toggle" 
              checked={autoMode} 
              onChange={handleAutoModeToggleChange} 
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>
    </div>
  );
}

export default App;
