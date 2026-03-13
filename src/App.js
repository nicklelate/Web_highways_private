import './App.css';
import React, { useState } from 'react';
import MapComponent from './MapComponent';
import LineChart from './LineChart';
import SriHeatmap from './SriHeatmap';

function App() {
// State สำหรับเก็บข้อความใน Input
  const [inputText, setInputText] = useState('');

// State สำหรับส่งไปบอก Map ว่าให้โชว์เส้นหรือไม่
  const [showRedLine, setShowRedLine] = useState(false);

// เพิ่ม State สำหรับเก็บค่าช่วงเวลาที่เลือกจาก Dropdown
  const [selectedTime, setSelectedTime] = useState('');

// ฟังก์ชันตรวจสอบเงื่อนไข
  const handleSearch = () => {
    if (inputText === '121') {
      setShowRedLine(true);
    } else {
      setShowRedLine(false);
      alert('ไม่พบเส้นทาง (ลองพิมพ์ 121)'); // เพิ่มลูกเล่นแจ้งเตือนนิดหน่อย
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
      {/* <SriHeatmap /> */}

      {showRedLine && (
        <>
          <div className="App-right_top"><LineChart selectedTime={selectedTime} /></div>
          <div className="App-right_bottom"><SriHeatmap /></div>
        </>
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
              {/* สามารถเพิ่ม <option> ช่วงเวลาอื่นๆ ต่อได้เลยครับ */}
            </select>
          )}

        </div>
      </div>
      <MapComponent showRedLine={showRedLine} />
    </div>
    
  );
}

export default App;
