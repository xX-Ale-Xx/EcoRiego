import './App.css';
import { useEffect, useState } from 'react';

function App() {
  const [weatherData, setWeatherData] = useState({
    temperature: null,
    humidity: null,
    icon: '',
  });
  const [location, setLocation] = useState('Guatemala');

  useEffect(() => {
    let irrigationActive = true;

    // Obtener referencia a los elementos del DOM.
    const irrigationButton = document.getElementById("irrigation-button");
    const irrigationStatus = document.getElementById("irrigation-status");
    const waterIcon = document.getElementById("water-icon");
    const autoModeToggle = document.getElementById("auto-mode-toggle");

    const handleIrrigationButtonClick = () => {
      irrigationActive = !irrigationActive;

      if (irrigationActive) {
        irrigationButton.textContent = "Pause";
        irrigationButton.style.backgroundColor = "#f44336";
        irrigationStatus.textContent = "Irrigation in progress. Providing water to your plants.";
        waterIcon.setAttribute("stroke", "#3b82f6");
      } else {
        irrigationButton.textContent = "Resume";
        irrigationButton.style.backgroundColor = "#3b82f6";
        irrigationStatus.textContent = "Irrigation paused. Waiting to resume.";
        waterIcon.setAttribute("stroke", "#777");
      }
    };

    const handleAutoModeToggleChange = () => {
      const isAutoMode = autoModeToggle.checked;

      if (isAutoMode) {
        irrigationButton.disabled = true;
        irrigationButton.classList.add("disabled");
        irrigationButton.textContent = "Irrigation Controlled Automatically";
      } else {
        irrigationButton.disabled = false;
        irrigationButton.classList.remove("disabled");
        irrigationButton.textContent = irrigationActive ? "Pause" : "Resume";
      }
    };

    // Agregar los event listeners
    irrigationButton.addEventListener("click", handleIrrigationButtonClick);
    autoModeToggle.addEventListener("change", handleAutoModeToggleChange);

    return () => {
      irrigationButton.removeEventListener("click", handleIrrigationButtonClick);
      autoModeToggle.removeEventListener("change", handleAutoModeToggleChange);
    };
  }, []);

  useEffect(() => {
    // Función para obtener los datos climáticos desde la API
    const fetchWeatherData = async () => {
      const apiKey = '091e5c01ceadb58617a7aeaa7e3584db'; // Reemplaza con tu propia API Key de OpenWeatherMap
      const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${location}&units=metric&appid=${apiKey}`;

      try {
        const response = await fetch(apiUrl);
         const responseBack = await fetch('/humedad');  // Usa ruta relativa
          const dataBack = await responseBack.json();
      console.log('Humedad:', dataBack.humedad)
        if (response.ok) {
          const data = await response.json();
          const temperature = data.main.temp;
          const humidity = data.main.humidity;
          const icon = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

          setWeatherData({ temperature, humidity, icon });
        } else {
          console.error("Error fetching weather data");
        }
      } catch (error) {
        console.error("Unable to fetch weather data:", error);
      }
    };

    fetchWeatherData();
    const intervalId = setInterval(fetchWeatherData, 30000); // 300000 ms = 5 minutos

    // Limpiar el intervalo cuando se desmonte el componente o cambie la ubicación.
    return () => clearInterval(intervalId);
  }, [location]);

  return (
    <div className="App">
      <div className="card">
        <h2>Irrigation System</h2>
        <div className="icon-container">
          <svg id="water-icon" xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="#3b82f6" className="icon">
            <path d="M12 21c4.97 0 9-4.03 9-9S12 2 12 2 3 7.03 3 12s4.03 9 9 9z" />
          </svg>
        </div>
        <button className="control-button" id="irrigation-button">Pause</button>

        <div className="weather-info">
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
            <span>Loading weather data...</span>
          )}
        </div>

        <p className="irrigation-status-text" id="irrigation-status">Irrigation in progress. Providing water to your plants.</p>

        <div className="auto-mode">
          <span>Auto Mode</span>
          <label className="switch">
            <input type="checkbox" id="auto-mode-toggle" />
            <span className="slider"></span>
          </label>
        </div>
      </div>
    </div>
  );
}

export default App;
