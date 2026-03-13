import React from 'react';
import { Line } from 'react-chartjs-2';
import chartDataJson from './chart_data.json';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// 1. ลงทะเบียน Component ที่จำเป็นสำหรับกราฟเส้น
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// รับค่า selectedTime ที่ส่งมาจาก App.js 
const LineChart = ({ selectedTime }) => {

  console.log("เวลาที่เลือกจาก Dropdown :", `"${selectedTime}"`);
  console.log("ข้อมูลที่หาได้จาก JSON :", chartDataJson[selectedTime]);

  // ดึงข้อมูลตามช่วงเวลาที่เลือก 
  // (ถ้ายังไม่เลือกเวลา หรือหาไม่เจอ ให้คืนค่า Array ว่างๆ ไว้ก่อน กราฟจะได้ไม่พัง)
  const currentData = chartDataJson[selectedTime] || { 
    labels: [], 
    avg_speeds: [], 
    Q15_speeds: [], 
    Q85_speeds: [] 
  };

const data = {
    labels: currentData.labels, // เรียกใช้ข้อมูลระยะทางจาก JSON
    datasets: [
      {
        label: 'Average Speed',
        data: currentData.avg_speeds, // เรียกใช้ข้อมูลความเร็วจาก JSON
        borderColor: 'rgb(0, 0, 255)',
        borderWidth: 2, // ปรับเส้นให้บางลงเพราะข้อมูลเยอะมาก
        tension: 0.1,
        pointRadius: 0, // **สำคัญมาก** ข้อมูล 15,000 จุด ต้องซ่อนจุดไว้ ไม่งั้นกราฟจะกระตุกและทับกันจนดำ
      },
      {
        label: 'Speed: 15 Percentile', 
        data: currentData.Q15_speeds, 
        borderColor: 'rgba(255, 130, 130)', // สีแดง
        borderWidth: 2, 
        tension: 0.1,
      },
{
        label: 'Speed: 85 Percentile', 
        data: currentData.Q85_speeds, 
        borderColor: 'rgb(130, 255, 130)', // สีเขียว
        borderWidth: 2, 
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false, // **สำคัญมาก** ปิด Animation เพื่อให้โหลดข้อมูล 15,000 จุดได้ทันทีโดยไม่กระตุก
    elements: {
        point: {
        radius: 0 // 2. ไม่วาดจุด (Dot) บนเส้น ถ้าข้อมูลเยอะจุดจะทับกันจนดำ การปิดจะช่วยลดโหลดการวาดได้มาก
        }
    },
    plugins: {
      legend: { 
        display: true, // เปิดการแสดงผลกลับมา
        position: 'top',       
        // ปิดการคลิก
        onClick: () => {},         
        //  บังคับวาดกล่องสีฟ้าล้วน
        labels: {
          generateLabels: (chart) => {
            return chart.data.datasets.map((dataset, i) => ({
              text: dataset.label, // ใช้ข้อความเดิม ('ความเร็ว (กม./ชม.)')
              fillStyle: dataset.borderColor, // ระบายสีพื้นกล่องเป็นสีฟ้าล้วน
              strokeStyle: dataset.borderColor, // สีเส้นขอบกล่อง (สีเดียวกับพื้น)
              lineWidth: 0, // ไม่ต้องมีเส้นขอบ
              hidden: false, // บังคับให้แสดงเสมอ
              index: i
            }));
          }
        }
      },
      title: {
        display: false,
        text: 'กราฟแสดงความสัมพันธ์ระหว่างระยะทางและความเร็ว',
      },
      // แนะนำให้ปิด Tooltip ถ้ารู้สึกว่าเวลาเอาเมาส์ไปชี้แล้วมันหน่วง
      tooltip: { enabled: false }
    },
    scales: {
      x: {
        type: 'linear', // เพิ่มบรรทัดนี้: บอกว่าแกน X เป็นตัวเลขต่อเนื่อง
        title: {
          display: true,
          text: 'ระยะทาง (km)',
          color: 'rgb(0, 0, 0)'
        },
        ticks: {
          color: 'rgb(0, 0, 0)',
          stepSize: 5, // เพิ่มบรรทัดนี้: บังคับให้โชว์ Label ห่างกันทีละ 5
          // โชว์ Label เฉพาะระยะทางที่หาร 10 ลงตัว
          callback: function (value) {
            const currentDistance = this.getLabelForValue(value); 
            // แปลงเป็นตัวเลขก่อนเผื่อข้อมูลใน Excel มาเป็น String
            const numericDistance = Number(currentDistance); 
            
            if (numericDistance % 5 === 0) {
              return numericDistance;
            }
            return value;
          },
          maxRotation: 0,
        },
        grid: { display: true,
                color: 'rgba(0, 0, 0, 0.2)', // ทำให้สีเส้นตารางจางลง (เทาอ่อน)
         }
      },
      y: {
        title: {
          display: true,
          text: 'ความเร็ว (km/h)',
          color: 'rgb(0, 0, 0)'
        },
        min: 0, // ให้ความเร็วเริ่มจาก 0
        ticks: {
          color: 'black', // 📌 2. เปลี่ยนสีตัวเลขสเกลแกน Y ตรงนี้ครับ
        },
        grid: { display: true,
                color: 'rgba(0, 0, 0, 0.2)', // ทำให้สีเส้นตารางจางลง (เทาอ่อน)
        }
      },
    },
  };

  return (
<div style={{position: 'relative', width: '50vw', height: '45vh'}}>
      {/* ถ้ายังไม่ได้เลือกเวลา ให้แสดงข้อความเตือนให้ผู้ใช้เลือกก่อน */}
      {!selectedTime ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%'}}>
          กรุณาเลือกช่วงเวลาเพื่อดูกราฟ
        </div>
      ) : (
        <Line data={data} options={options} />
      )}
    </div>
  );
};

export default LineChart;