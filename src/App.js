import './App.css';
import React, { useState } from 'react';
import MapComponent from './MapComponent';
import LineChart from './LineChart';
import SriHeatmap from './SriHeatmap';

function App() {
  const [inputText, setInputText] = useState('');
  const [searchedRouteId, setSearchedRouteId] = useState('');
  const [showRedLine, setShowRedLine] = useState(false);
  const [selectedTime, setSelectedTime] = useState('');

  const handleSearch = () => {
    const route = inputText.trim();

    if (route === '121') {
      setSearchedRouteId(route);   // ส่ง route id ไปให้ MapComponent
      setShowRedLine(true);
    } else {
      setSearchedRouteId('');      // ล้าง route
      setShowRedLine(false);
      alert('ไม่พบเส้นทาง (ลองพิมพ์ 121)');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="App">
      <div className="App-header_app">
        DEPARTMENT OF HIGHWAYS
      </div>

      {showRedLine && (
        <div className="App-right_panel">
          <div className="sync-scroll-content">
            <div className="chart-top">
              <LineChart routeId={searchedRouteId} selectedTime={selectedTime} />
            </div>

            <div className="chart-bottom">
              <SriHeatmap routeId={searchedRouteId} />
            </div>
          </div>
        </div>
      )}

      <div className="App-container">
        Search Routes
        <div className="search-box-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="พิมพ์รหัสเส้นทาง (121)"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <button
            className="search-button"
            onClick={handleSearch}
          >
            Search
          </button>

          {showRedLine && (
            <select
              className="time-dropdown"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
            >
              <option value="" disabled>เลือกช่วงเวลา</option>
              <option value="0:00 - 1:00">0:00 - 1:00</option>
              <option value="1:00 - 2:00">1:00 - 2:00</option>
              <option value="2:00 - 3:00">2:00 - 3:00</option>
              <option value="3:00 - 4:00">3:00 - 4:00</option>
              <option value="4:00 - 5:00">4:00 - 5:00</option>
              <option value="5:00 - 6:00">5:00 - 6:00</option>
              <option value="6:00 - 7:00">6:00 - 7:00</option>
              <option value="7:00 - 8:00">7:00 - 8:00</option>
              <option value="8:00 - 9:00">8:00 - 9:00</option>
              <option value="9:00 - 10:00">9:00 - 10:00</option>
              <option value="10:00 - 11:00">10:00 - 11:00</option>
              <option value="11:00 - 12:00">11:00 - 12:00</option>
              <option value="12:00 - 13:00">12:00 - 13:00</option>
              <option value="13:00 - 14:00">13:00 - 14:00</option>
              <option value="14:00 - 15:00">14:00 - 15:00</option>
              <option value="15:00 - 16:00">15:00 - 16:00</option>
              <option value="16:00 - 17:00">16:00 - 17:00</option>
              <option value="17:00 - 18:00">17:00 - 18:00</option>
              <option value="18:00 - 19:00">18:00 - 19:00</option>
              <option value="19:00 - 20:00">19:00 - 20:00</option>
              <option value="20:00 - 21:00">20:00 - 21:00</option>
              <option value="21:00 - 22:00">21:00 - 22:00</option>
              <option value="22:00 - 23:00">22:00 - 23:00</option>
              <option value="23:00 - 24:00">23:00 - 24:00</option>
            </select>
          )}
        </div>
      </div>

      <MapComponent routeId={searchedRouteId} />
    </div>
  );
}

export default App;