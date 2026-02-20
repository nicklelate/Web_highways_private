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
      <SriHeatmap />

      {showRedLine && (
              <div className="App-right_top">
                <LineChart />
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
        </div>
      </div>
      <MapComponent showRedLine={showRedLine} />
    </div>
    
  );
}

export default App;
