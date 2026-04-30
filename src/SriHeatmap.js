import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

const SriHeatmap = React.memo(({ routeId, searchedSta }) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const renderEmptyState = (message = 'กรุณาค้นหาเส้นทาง') => {
    const chart = chartInstanceRef.current;
    if (!chart) return;

    chart.hideLoading();
    chart.clear();
    chart.setOption({
      animation: false,
      title: {
        text: message,
        left: 'center',
        top: 'middle',
        textStyle: {
          fontSize: 18,
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          color: '#666',
          fontWeight: 'normal',
        },
      },
    });
  };

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current, null, { renderer: 'canvas' });
    chartInstanceRef.current = chart;

    renderEmptyState();

    const handleResize = () => {
      chart.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
      chartInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartInstanceRef.current;
    if (!chart) return;

    let cancelled = false;

    const loadHeatmapFromFirestore = async () => {
      if (!routeId) {
        renderEmptyState('กรุณาค้นหาเส้นทาง');
        return;
      }

      try {
        chart.showLoading();

        const docRef = doc(db, 'route', String(routeId));
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          throw new Error(`ไม่พบข้อมูล route/${routeId}`);
        }

        const firestoreData = docSnap.data();

        const distanceData = Array.isArray(firestoreData.Distance)
          ? firestoreData.Distance
          : [];
        const timeData = Array.isArray(firestoreData.Time)
          ? firestoreData.Time
          : [];
        const sriRaw = Array.isArray(firestoreData.sri)
          ? firestoreData.sri
          : [];

        if (
          distanceData.length === 0 ||
          timeData.length === 0 ||
          sriRaw.length === 0
        ) {
          throw new Error(`route/${routeId} ไม่มีข้อมูล heatmap`);
        }

        // Firestore: [{ x, y, value }, ...] -> [[x, y, value], ...]
        const heatmapData = sriRaw.map((item) => [
          Number(item.x),
          Number(item.y),
          Number(item.value ?? 0),
        ]);

        // =========================================================
        // ทำแกน X ให้เรียงสม่ำเสมอ และใช้ปลายขวาเดียวกับ LineChart
        // =========================================================
        const step = 0.1;
        const oldXValues = distanceData.map(Number).filter((v) => !Number.isNaN(v));

        if (oldXValues.length === 0) {
          throw new Error(`route/${routeId} มี Distance ไม่ถูกต้อง`);
        }

        const rawMaxKm = Math.max(...oldXValues);
        const xMaxAligned = Math.ceil(rawMaxKm / step) * step;

        const newXAxisData = [];
        for (let i = 0; i <= xMaxAligned + 1e-9; i += step) {
          newXAxisData.push(i.toFixed(1));
        }

        // จัดกลุ่มข้อมูลตามช่วงเวลา
        const dataByTime = {};
        heatmapData.forEach((item) => {
          const oldXIdx = Number(item[0]);
          const yIdx = Number(item[1]);
          const val = Number(item[2]);

          if (!dataByTime[yIdx]) dataByTime[yIdx] = [];
          dataByTime[yIdx].push({ oldXIdx, val });
        });

        const newHeatmapData = [];

        timeData.forEach((_, yIdx) => {
          const timeSlice = dataByTime[yIdx];
          if (!timeSlice || timeSlice.length === 0) return;

          timeSlice.sort((a, b) => a.oldXIdx - b.oldXIdx);
          let currentDataCursor = 0;

          newXAxisData.forEach((newXStr, newXIdx) => {
            const currentKm = parseFloat(newXStr);

            while (
              currentDataCursor < timeSlice.length - 1 &&
              currentKm >= oldXValues[timeSlice[currentDataCursor + 1].oldXIdx]
            ) {
              currentDataCursor++;
            }

            newHeatmapData.push([
              newXIdx,
              yIdx,
              timeSlice[currentDataCursor].val,
            ]);
          });
        });

        const formatDistanceKm = (distanceStr) => {
          const km = parseFloat(distanceStr);
          const roundedKm = Math.round(km * 10) / 10;

          if (Number.isInteger(roundedKm)) {
            return `${roundedKm}`;
          }

          const kmPart = Math.floor(roundedKm);
          const meterPart = Math.round((roundedKm - kmPart) * 1000);

          return `${kmPart}+${String(meterPart).padStart(3, '0')}`;
        };

        const showIndices = new Set();
        for (let target = 0; target <= xMaxAligned + 1e-9; target += 2) {
          const idx = newXAxisData.findIndex((x) => parseFloat(x) === target);
          if (idx !== -1) showIndices.add(idx);
        }

        if (cancelled) return;

        chart.hideLoading();
        chart.clear();

        const parseStaToKm = (staStr) => {
          if (!staStr) return null;
          let kmValue = null;

          if (staStr.includes('+')) {
            const [kmPart, mPart] = staStr.split('+');
            const km = parseInt(kmPart, 10);
            const m = parseInt(mPart, 10);
            if (!isNaN(km) && !isNaN(m)) {
              kmValue = km + (m / 1000);
            }
          } else {
            const val = parseFloat(staStr);
            if (!isNaN(val)) kmValue = val;
          }

          if (kmValue === null) return null;

          const scaled = kmValue * 10;
          if (Math.abs(Math.round(scaled) - scaled) > 1e-5) {
            return null; 
          }
          return Number(kmValue.toFixed(1));
        };

        const targetKm = parseStaToKm(searchedSta);
        let validTargetCategory = null;

        if (targetKm !== null && targetKm >= 0 && targetKm <= xMaxAligned) {
          validTargetCategory = targetKm.toFixed(1); 
        }

        const staMarkLine = validTargetCategory ? {
          symbol: ['none', 'none'],
          silent: true,            
          label: { show: false },  
          lineStyle: {
            color: '#000000',      
            type: 'dashed',
            width: 2
          },
          data: [
            { xAxis: validTargetCategory } 
          ]
        } : undefined;

        const SHARED_GRID_LEFT = 70;
        const SHARED_GRID_RIGHT = 10;
        chart.setOption(
          {
            animation: false,
            tooltip: {
              position: 'top',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderColor: '#ccc',
              borderWidth: 1,
              textStyle: {
                color: '#333',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 12,
              },
              formatter: function (params) {
                const distance = newXAxisData[params.value[0]];
                const timeRange = timeData[params.value[1]];
                const sriValue = Number(params.value[2]);

                return `
                  <div style="margin-bottom: 4px;"><strong>ช่วงเวลา:</strong> ${timeRange}</div>
                  <div style="margin-bottom: 4px;"><strong>ระยะทาง:</strong> ${formatDistanceKm(distance)} km</div>
                  <div><strong>SRI Value:</strong> <span style="color:#000000; font-weight:normal;">${sriValue.toFixed(2)}</span></div>
                `;
              },
            },
            grid: {
              height: '50%',
              top: '0%',
              left: SHARED_GRID_LEFT,
              right: SHARED_GRID_RIGHT,
            },
            title: {
              text: 'ระยะทาง (km)',
              left: '0%',
              bottom: '46%',
              textStyle: {
                fontSize: 12,
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                color: '#000000',
                fontWeight: 'normal',
              },
            },
            xAxis: {
              type: 'category',
              data: newXAxisData,
              boundaryGap: true,
              axisLine: { show: false },
              axisTick: { show: false },
              axisLabel: {
                fontSize: 12,
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                color: '#000000',
                interval: (index) => showIndices.has(index),
                formatter: (value) => Math.round(parseFloat(value)),
              },
            },
            yAxis: {
              type: 'category',
              data: timeData,
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
              type: 'piecewise',
              show: true,
              orient: 'horizontal',
              left: '0%',
              bottom: '40%',
              dimension: 2,
              itemWidth: 30,
              itemHeight: 15,
              itemSymbol: 'rect',
              text: ['', 'SRI value'],
              textGap: 5,
              showLabel: true,
              textStyle: {
                fontSize: 12,
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                color: '#000000',
              },
              pieces: [
                { min: 8.01, max: 10.0, label: '> 8.00', color: '#d73027' },
                { min: 6.01, max: 8.0, label: '6.01 - 8.00', color: '#f46d43' },
                { min: 4.01, max: 6.0, label: '4.01 - 6.00', color: '#fdae61' },
                { min: 2.01, max: 4.0, label: '2.01 - 4.00', color: '#68c230' },
                { min: 0, max: 2.0, label: '0 - 2.00', color: '#1a9850' },
              ],
            },
            series: [
              {
                type: 'heatmap',
                data: newHeatmapData,
                label: { show: false },
                silent: false,
                itemStyle: { borderWidth: 0 },
                large: true,
                progressive: 2000,
                markLine: staMarkLine,
              },
            ],
          },
          true
        );
      } catch (err) {
        if (cancelled) return;
        console.error('Error loading heatmap data from Firestore:', err);
        renderEmptyState(err.message || 'โหลดข้อมูล heatmap ไม่สำเร็จ');
      }
    };

    loadHeatmapFromFirestore();

    return () => {
      cancelled = true;
      chart.hideLoading();
    };
  }, [routeId, searchedSta]);

  return (
    <div style={{ flexShrink: 0 }}>
      <div ref={chartRef} style={{ width: '150vw', height: '75vh' }} />
    </div>
  );
});

export default SriHeatmap;