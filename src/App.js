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
  const [inputSta, setInputSta] = useState('');
  const [searchedSta, setSearchedSta] = useState('');

  const handleSearch = () => {
    const route = inputText.trim();

    if (route !== '') {
      // ถ้ามีการพิมพ์อะไรมา ก็รับค่านั้นไปเลย
      setSearchedRouteId(route);   // ส่ง route id ที่พิมพ์ไปให้ MapComponent
      setShowRedLine(true);        // แสดงกราฟและเครื่องมืออื่นๆ
    } else {
      // ถ้ากด Search โดยที่ช่องว่างเปล่า
      setSearchedRouteId('');      
      setShowRedLine(false);
      alert('กรุณาพิมพ์รหัสเส้นทางที่ต้องการค้นหา');
    }
  };

  const formatStaInput = (rawInput) => {
    if (!rawInput) return '';
    // 1. ลบช่องว่างทั้งหมดออก
    let text = rawInput.replace(/\s/g, '');
    // 2. ถ้าไม่มีเครื่องหมาย + (เช่น 1, 2, 7.5) ให้ตัดทศนิยมทิ้งแล้วส่งคืนเลย
    if (!text.includes('+')) {
      const val = parseInt(text, 10); 
      return isNaN(val) ? '' : String(val);
    }
    // 3. ถ้ามีเครื่องหมาย + ให้แยกส่วนกิโลเมตร (km) และเมตร (m)
    let [kmPart, mPart] = text.split('+');
    let km = parseInt(kmPart, 10);
    if (isNaN(km)) km = 0;
    // ตัดทศนิยมส่วนของเมตรออกก่อน (เช่น .56 ใน 8+4.56)
    mPart = (mPart || '').split('.')[0]; 
    // 4. เติม 0 ต่อท้ายให้ครบ 3 หลัก (เช่น '1' -> '100', '57' -> '570', '0' -> '000')
    while (mPart.length < 3) {
      mPart += '0';
    }
    // กันเหนียว: ถ้าพิมพ์มาเกิน 3 หลัก ให้ตัดเอาแค่ 3 หลักแรก
    if (mPart.length > 3) {
      mPart = mPart.substring(0, 3);
    }
    let m = parseInt(mPart, 10);
    if (isNaN(m)) m = 0;
    // 5. ปัดเศษทุกๆ 100 เมตร (<= 50 ปัดลง, > 50 ปัดขึ้น)
    const remainder = m % 100;
    if (remainder <= 50) {
      m = m - remainder; // ปัดลง
    } else {
      m = m + (100 - remainder); // ปัดขึ้น
    }
    // 6. ถ้าปัดขึ้นจนเมตรกลายเป็น 1000 ให้บวกเพิ่มที่กิโลเมตรแทน (เช่น 1+960 -> 2+000)
    if (m >= 1000) {
      km += Math.floor(m / 1000);
      m = m % 1000;
    }

    return `${km}+${String(m).padStart(3, '0')}`;
  };

  const handleSearchSta = () => {
    // นำค่าที่ผู้ใช้พิมพ์ไปจัดรูปแบบก่อน
    const formattedSta = formatStaInput(inputSta);
    // ส่งค่าที่จัดรูปแบบแล้วไปให้กราฟ
    setSearchedSta(formattedSta);
    // 🌟 แถม: อัปเดตค่าในช่องกรอก ให้ผู้ใช้เห็นว่าระบบปัดเศษให้เป็นเลขอะไร
    setInputSta(formattedSta); 
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

const handleKeyDownSta = (e) => {
    if (e.key === 'Enter') {
      handleSearchSta();
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
              <LineChart routeId={searchedRouteId} selectedTime={selectedTime} searchedSta={searchedSta} />
            </div>

            <div className="chart-bottom">
              <SriHeatmap routeId={searchedRouteId} searchedSta={searchedSta} />
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
            <>
              <div className="search-box-wrapper_sta">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Sta. ทุก 100 ม. (เช่น 1,1+100)"
                  value={inputSta}
                  onChange={(e) => setInputSta(e.target.value)}
                  onKeyDown={handleKeyDownSta}
                />
                
                <button
                  className="search-button"
                  onClick={handleSearchSta}
                >
                  Search
                </button>
              </div>

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
            </>
          )}
        </div>
      </div>

      <MapComponent routeId={searchedRouteId} />
    </div>
  );
}

export default App;