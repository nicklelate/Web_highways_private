import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

const makeTimeDocId = (displayKey) => {
  return displayKey
    .replace(' - ', '_')
    .replace(/:/g, '_')
    .replace(/\s/g, '');
};

const LineChart = React.memo(({ routeId, selectedTime }) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const renderEmptyState = (message) => {
    const chart = chartInstanceRef.current;
    if (!chart) return;

    chart.hideLoading();
    chart.clear();
    chart.setOption({
      animation: false,
      title: {
        text: message,
        left: '150',
        top: '150',
        textStyle: {
          fontSize: 18,
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          color: '#000000',
          fontWeight: 'normal',
        },
      },
    });
  };

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

  const buildUniformXAxis = (oldXValues, step = 0.1) => {
    const rawMaxKm = Math.max(...oldXValues);
    const xMaxAligned = Math.ceil(rawMaxKm / step) * step;

    const newXAxisData = [];
    for (let i = 0; i <= xMaxAligned + 1e-9; i += step) {
      newXAxisData.push(i.toFixed(1));
    }

    return { newXAxisData, xMaxAligned };
  };

  const resampleSeriesLinear = (oldXValues, oldYValues, newXAxisData) => {
    if (!oldXValues.length || !oldYValues.length) return [];

    const result = [];
    let cursor = 0;

    for (const xStr of newXAxisData) {
      const x = parseFloat(xStr);

      while (
        cursor < oldXValues.length - 2 &&
        x > oldXValues[cursor + 1]
      ) {
        cursor++;
      }

      if (x <= oldXValues[0]) {
        result.push(Number(oldYValues[0]));
        continue;
      }

      if (x >= oldXValues[oldXValues.length - 1]) {
        result.push(Number(oldYValues[oldYValues.length - 1]));
        continue;
      }

      const x0 = Number(oldXValues[cursor]);
      const x1 = Number(oldXValues[cursor + 1]);
      const y0 = Number(oldYValues[cursor]);
      const y1 = Number(oldYValues[cursor + 1]);

      if (x1 === x0) {
        result.push(y0);
        continue;
      }

      const t = (x - x0) / (x1 - x0);
      const y = y0 + (y1 - y0) * t;
      result.push(Number(y.toFixed(2)));
    }

    return result;
  };

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current, null, { renderer: 'canvas' });
    chartInstanceRef.current = chart;

    renderEmptyState('กรุณาค้นหาเส้นทางก่อน');

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

    const loadChart = async () => {
      if (!routeId) {
        renderEmptyState('กรุณาค้นหาเส้นทางก่อน');
        return;
      }

      if (!selectedTime) {
        renderEmptyState('กรุณาเลือกช่วงเวลาเพื่อดูกราฟ');
        return;
      }

      try {
        chart.showLoading();

        const routeRef = doc(db, 'route', String(routeId));
        const timeDocId = makeTimeDocId(selectedTime);
        const profileRef = doc(db, 'route', String(routeId), 'speed_profiles', timeDocId);

        const [routeSnap, profileSnap] = await Promise.all([
          getDoc(routeRef),
          getDoc(profileRef),
        ]);

        if (!routeSnap.exists()) {
          throw new Error(`ไม่พบข้อมูล route/${routeId}`);
        }

        if (!profileSnap.exists()) {
          throw new Error(`ไม่พบข้อมูลช่วงเวลา ${selectedTime}`);
        }

        const routeData = routeSnap.data();
        const profileData = profileSnap.data();

        const graphDistance = Array.isArray(routeData.graph_distance)
          ? routeData.graph_distance.map(Number).filter((v) => !Number.isNaN(v))
          : [];

        if (!graphDistance.length) {
          throw new Error(`route/${routeId} ไม่มี graph_distance`);
        }

        const avgSpeeds = Array.isArray(profileData.avg_speeds) ? profileData.avg_speeds : [];
        const q15Speeds = Array.isArray(profileData.q15_speeds) ? profileData.q15_speeds : [];
        const q85Speeds = Array.isArray(profileData.q85_speeds) ? profileData.q85_speeds : [];

        const minLength = Math.min(
          graphDistance.length,
          avgSpeeds.length,
          q15Speeds.length,
          q85Speeds.length
        );

        if (minLength === 0) {
          throw new Error(`ข้อมูลกราฟของ ${selectedTime} ว่าง`);
        }

        const oldXValues = graphDistance.slice(0, minLength);
        const avgTrimmed = avgSpeeds.slice(0, minLength);
        const q15Trimmed = q15Speeds.slice(0, minLength);
        const q85Trimmed = q85Speeds.slice(0, minLength);

        const { newXAxisData, xMaxAligned } = buildUniformXAxis(oldXValues, 0.1);

        const avgResampled = resampleSeriesLinear(oldXValues, avgTrimmed, newXAxisData);
        const q15Resampled = resampleSeriesLinear(oldXValues, q15Trimmed, newXAxisData);
        const q85Resampled = resampleSeriesLinear(oldXValues, q85Trimmed, newXAxisData);

        const showIndices = new Set();
        for (let target = 0; target <= xMaxAligned + 1e-9; target += 2) {
          const idx = newXAxisData.findIndex((x) => parseFloat(x) === target);
          if (idx !== -1) showIndices.add(idx);
        }

        if (cancelled) return;

        chart.hideLoading();
        chart.clear();
        const SHARED_GRID_LEFT = 90;
        const SHARED_GRID_RIGHT = 10;
        chart.setOption(
          {
            animation: false,
            grid: {
              top: 36,
              left: SHARED_GRID_LEFT,
              right: SHARED_GRID_RIGHT,
              bottom: 28,
              height: '48%',
            },
            legend: {
              top: 0,
              left: 0,
              textStyle: {
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 12,
                color: '#000000',
              },
            },
            tooltip: {
              trigger: 'axis',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderColor: '#ccc',
              borderWidth: 1,
              textStyle: {
                color: '#333',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 12,
              },
              formatter: function (params) {
                if (!params || !params.length) return '';

                const xLabel = params[0].axisValue;
                const formattedDistance = formatDistanceKm(xLabel);

                const lines = [
                  `<div style="margin-bottom: 4px;"><strong>ระยะทาง:</strong> ${formattedDistance} km</div>`
                ];

                params.forEach((item) => {
                  const value = Number(item.data);
                  lines.push(
                    `<div style="margin-bottom: 2px;">
                      <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${item.color};margin-right:6px;"></span>
                      ${item.seriesName}: ${value.toFixed(2)} km/h
                    </div>`
                  );
                });

                return lines.join('');
              },
            },
            graphic: [
              {
                type: 'text',
                left: SHARED_GRID_LEFT-85,   // ผูกกับจุดเริ่มของ plot area
                top: '305vh',
                style: {
                  text: 'ระยะทาง (km)',
                  fill: '#000000',
                  font: '12px "Plus Jakarta Sans, sans-serif"',
                  textAlign: 'left',
                  textVerticalAlign: 'middle',
                },
                silent: true,
              },
            ],
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
              type: 'value',
              min: 0,
              name: 'ความเร็ว (km/h)',
              nameLocation: 'middle',
              nameGap: 35,
              nameTextStyle: {
                fontSize: 12,
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                color: '#000000',
              },
              axisLabel: {
                fontSize: 12,
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                color: '#000000',
              },
              splitLine: {
                show: true,
                lineStyle: {
                  color: 'rgba(0, 0, 0, 0.2)',
                },
              },
            },
            series: [
              {
                name: 'Average Speed',
                type: 'line',
                data: avgResampled,
                showSymbol: false,
                symbol: 'circle',
                symbolSize: 8,
                lineStyle: {
                  width: 3,
                  color: 'rgb(0, 0, 255)',
                },
                itemStyle: {
                  color: 'rgb(0, 0, 255)',
                },
                smooth: false,
              },
              {
                name: 'Speed: 15 Percentile',
                type: 'line',
                data: q15Resampled,
                showSymbol: false,
                symbol: 'circle',
                symbolSize: 8,
                lineStyle: {
                  width: 3,
                  color: 'rgba(255, 130, 130)',
                },
                itemStyle: {
                  color: 'rgba(255, 130, 130)',
                },
                smooth: false,
              },
              {
                name: 'Speed: 85 Percentile',
                type: 'line',
                data: q85Resampled,
                showSymbol: false,
                symbol: 'circle',
                symbolSize: 8,
                lineStyle: {
                  width: 3,
                  color: '#1a9850',
                },
                itemStyle: {
                  color: '#1a9850',
                },
                smooth: false,
              },
            ],
          },
          true
        );
      } catch (err) {
        if (cancelled) return;
        console.error('Error loading line chart data from Firestore:', err);
        renderEmptyState(err.message || 'โหลดข้อมูลกราฟไม่สำเร็จ');
      }
    };

    loadChart();

    return () => {
      cancelled = true;
      chart.hideLoading();
    };
  }, [routeId, selectedTime]);

  return (
    <div style={{ flexShrink: 0 }}>
      <div ref={chartRef} style={{ width: '150vw', height: '75vh' }} />
    </div>
  );
});

export default LineChart;