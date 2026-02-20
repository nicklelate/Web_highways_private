import React, { useEffect, useRef } from 'react';
// Import ECharts เพียวๆ เข้ามาใช้งาน (ไม่ต้องใช้ echarts-for-react)
import * as echarts from 'echarts';

const SriHeatmap = React.memo(() => {
  // ใช้แค่ ref เพื่ออ้างอิงไปยังกล่อง div เปล่าๆ
  const chartRef = useRef(null);

  useEffect(() => {
    // 1. สร้างพื้นที่วาดกราฟลงใน div ทันที
    const chartInstance = echarts.init(chartRef.current, null, { renderer: 'canvas' });
    
    // โชว์วงกลมหมุนๆ ระหว่างรอข้อมูล
    chartInstance.showLoading();

    // 2. Fetch ข้อมูล (สังเกตว่าเราไม่เก็บลง useState เลย!)
    fetch('/sri_heatmap.json')
      .then(res => res.json())
      .then(data => {
        chartInstance.hideLoading();

        // 3. โยนข้อมูลใส่กราฟโดยตรง
        chartInstance.setOption({
          animation: false,
          grid: { height: '70%', top: '15%', left: '10%', right: '5%' },
          xAxis: {
            type: 'category',
            data: data.xAxisData,
            axisLine: { show: false },
            axisTick: { show: false },
          },
          yAxis: {
            type: 'category',
            data: data.yAxisData,
            axisLine: { show: false },
            axisTick: { show: false },
          },
          visualMap: {
            show: false,
            min: 0,
            max: 90,
            inRange: { color: ['#000000', '#fdae61', '#fee08b', '#d9ef8b', '#a6d96a', '#1a9850'] }
          },
          series: [{
            type: 'heatmap',
            data: data.heatmapData.map(item => [item[0], item[1], Number(item[2])]),
            label: { show: false },
            silent: true,
            itemStyle: { borderWidth: 0 },
            
            // --- 4. ฟีเจอร์ลับ: การวาดแบบก้าวหน้า (Progressive Rendering) ---
            large: true,
            // largeThreshold: 2000, 
            progressive: 2000, // สั่งให้วาดทีละ 2,000 จุด (เบราว์เซอร์จะไม่ค้าง)
            // progressiveThreshold: 3000 // เปิดโหมดนี้เมื่อข้อมูลเกิน 3,000 จุด
          }]
        });
        // 💡 ความลับ: เมื่อจบฟังก์ชันนี้ ตัวแปร data จะถูกเบราว์เซอร์ "ลบทิ้ง" คืน Memory ทันที
      })
      .catch(err => console.error("Error loading heatmap data", err));

    // 5. Cleanup Function: เมื่อผู้ใช้ปิดหน้านี้ ให้ทำลายกราฟทิ้ง คืน Memory ให้หมด
    return () => {
      chartInstance.dispose();
    };
  }, []); // [] หมายถึงทำแค่ครั้งเดียวตอนเปิดหน้าเว็บ

  return (
    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      {/* React มีหน้าที่แค่สร้างกล่องเปล่าๆ ทิ้งไว้แค่นี้เลย */}
      <div ref={chartRef} style={{ width: '100%', height: '600px' }} />
    </div>
  );
});

export default SriHeatmap;