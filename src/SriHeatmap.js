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

        // const showIndices = new Set();
        // let nextTarget = 0; // ตั้งเป้าหมายแรกที่ 0 กม.
        // data.xAxisData.forEach((valStr, index) => {
        //   const val = parseFloat(valStr); // แปลงข้อความเป็นตัวเลข
          
        //   // ถ้าระยะทางปัจจุบัน มากกว่าหรือเท่ากับ เป้าหมาย
        //   if (val >= nextTarget) {
        //     showIndices.add(index); // จดจำตำแหน่งนี้ไว้
        //     nextTarget += 5;        // ขยับเป้าหมายต่อไปเป็น 5, 10, 15...
        //   }
        // });

        // 3. โยนข้อมูลใส่กราฟโดยตรง
        chartInstance.setOption({
          animation: false,
          grid: { height: '50%', top: '0%', left: '0%', right: '0%' },
          title: {
            text: 'ระยะทาง (km)',
            left: '0%',      // 👈 ปรับตำแหน่ง ซ้าย-ขวา ตรงนี้ (ลองแก้เป็นเลขอื่นหรือใส่เป็น Pixel เช่น '50px' ก็ได้)
            bottom: '46%',   // 👈 ปรับตำแหน่ง บน-ล่าง ตรงนี้ ให้ตรงกับหน้าเลข 0.02 
            textStyle: {
              fontSize: 12,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              color: '#000000',
              fontWeight: 'normal' // ไม่ให้ตัวหนังสือหนาเกินไป
            }
          },
          xAxis: {
            type: 'category',
            data: data.xAxisData,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: {
              fontSize: 10,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              color: '#000000',
            },
            // axisLabel: {
            //   // เช็คว่าตำแหน่งนี้ (index) ตรงกับที่เราจดไว้ไหม ถ้าตรงให้โชว์ (return true)
            //   interval: function (index, value) {
            //     return showIndices.has(index);
            //   },
            //   // ปัดเศษตัวเลขให้ไม่มีทศนิยม (เช่น 5.72 กลายเป็น 6) แล้วเติมคำว่า "กม."
            //   formatter: function (value) {
            //     return Math.round(parseFloat(value)) + ' กม.';
            //   }
            // }
          },
          yAxis: {
            type: 'category',
            data: data.yAxisData,
            axisLine: { show: false },
            axisTick: { show: false },
            name: 'ช่วงเวลา', 
            nameLocation: 'middle',
            nameGap: 2,
            nameTextStyle: {
              fontSize: 12,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              color: '#000000',
            },
            axisLabel: {
              interval: 0,
              fontSize: 10,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              color: '#000000',
            },
          },
          visualMap: {
            type: 'piecewise', // บอกให้ ECharts แสดงแถบสีแบบเป็นขั้นๆ (ไม่กลืนเป็นเนื้อเดียว)
            show: true,        // เปิดการแสดงผล Legend
            orient: 'horizontal',
            left: '0%',        // เอาไปวางชิดซ้ายสุดของหน้าจอ
            bottom: '40%',     // วางไว้ด้านล่างๆ
            dimension: 2,      // อ้างอิงจากตัวเลขตำแหน่งที่ 3 (ค่า SRI)
            itemWidth: 30,     // ขนาดความกว้างของกล่องสี
            itemHeight: 15,    // ขนาดความสูงของกล่องสี
            itemSymbol: 'rect',

            text: ['', 'SRI value'],
            textGap: 5,
            showLabel: true,

            textStyle: {
              fontSize: 12,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              color: '#000000',
            },
            // กำหนดช่วงตัวเลข ข้อความ และสีที่ต้องการ (ปรับแก้ตัวเลขได้ตามข้อมูลจริง)
            pieces: [
              { min: 8.01, max: 10.00, label: '> 8.00', color: '#d73027' },
              { min: 6.01, max: 8.00, label: '6.01 - 8.00', color: '#f46d43' },
              { min: 4.01, max: 6.00, label: '4.01 - 6.00', color: '#fdae61' },
              { min: 2.01, max: 4.00, label: '2.01 - 4.00', color: '#d9ef8b' },
              { min: 0,  max: 2.00, label: '0 - 2.00',  color: '#1a9850' }
            ]
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

// --- ส่วนที่เพิ่มเข้ามาเพื่อให้ Responsive ---
    const handleResize = () => {
      // สั่งให้กราฟคำนวณและปรับขนาดตัวเองใหม่
      chartInstance.resize(); 
    };

    // นำฟังก์ชันไปผูกติดกับหน้าต่างเบราว์เซอร์ (เมื่อมีการย่อ/ขยายหน้าจอ ให้เรียก handleResize)
    window.addEventListener('resize', handleResize);

    // 5. Cleanup Function: เมื่อผู้ใช้ปิดหน้านี้ ให้ทำลายกราฟทิ้ง คืน Memory ให้หมด
    return () => {
// สำคัญมาก: ต้องถอด Event Listener ออกทุกครั้งที่ปิดหน้านี้ เพื่อกัน Memory Leak
      window.removeEventListener('resize', handleResize);
      chartInstance.dispose();
    };
  }, []); // [] หมายถึงทำแค่ครั้งเดียวตอนเปิดหน้าเว็บ

  return (
    <div style={{ flexShrink: 0 }}>
      {/* React มีหน้าที่แค่สร้างกล่องเปล่าๆ ทิ้งไว้แค่นี้เลย */}
      <div ref={chartRef} style={{ width: '150vw', height: '75vh' }} />
    </div>
  );
});

export default SriHeatmap;