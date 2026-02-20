import React from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';

// กำหนดขนาดของแผนที่ (ต้องกำหนด ไม่งั้นแผนที่อาจไม่ขึ้น)
const containerStyle = {
  position: 'relative',
  width: '50vw',
  height: '75vh',
  // top: '45vh',
  // left: '0vW',
};

const center = {
  lat: 18.78861768937617,
  lng: 98.98640969975193
};

const route121 = [
  { lat: 18.724474595906003, lng: 98.92715670549427 },
  { lat: 18.728325418716523, lng: 98.92634294061028 },
  { lat: 18.73416951500932 , lng: 98.92670381417173 },
  { lat: 18.735126423797954 , lng: 98.93016820036162 },
  { lat: 18.738912900447563 , lng: 98.93287115559653 },
  { lat: 18.74439927897996 , lng: 98.94149713949744 },
  { lat: 18.751450029569156 , lng: 98.94091778241945 },
  { lat: 18.752852016946896 , lng: 98.94166880093832 },
  { lat: 18.75652963852025 , lng: 98.9409606978205 },
  { lat: 18.756956318703693 , lng: 98.94321375320666 },
  { lat: 18.759536695022344 , lng: 98.94325666857755 },
  { lat: 18.762889093386608 , lng: 98.94467287487353 },
  { lat: 18.76853722603026 , lng: 98.95001583505906 },
  { lat: 18.777151279778813 , lng: 98.95347052017443 },
  { lat: 18.77891680520359 , lng: 98.95805432753019 },
  { lat: 18.784666360777486 , lng: 98.95851166863129 },
  { lat: 18.79495753853093 , lng: 98.96208413478158 },
  { lat: 18.80375044098128 , lng: 98.95927719705237 },
  { lat: 18.80638339108612 , lng: 98.96085928916297 },
  { lat: 18.8070114281257 , lng: 98.96239034601767 },
  { lat: 18.812760273702683 , lng: 98.96351312113505 },
  { lat: 18.818122465183745 , lng: 98.96310483931765 },
  { lat: 18.82181793002678 , lng: 98.96512073098219 },
  { lat: 18.825972211711843 , lng: 98.96573315372406 },
  { lat: 18.828242531666223 , lng: 98.96427864967625 },
  { lat: 18.832010228906384 , lng: 98.96333449787969 },
  { lat: 18.84167060487304 , lng: 98.9653248718898 },
  { lat: 18.845341402110822 , lng: 98.95996617272327 },
  { lat: 18.847080172724162 , lng: 98.95973651419504 }, 
  { lat: 18.85636753066692 , lng: 98.9627329448002 },
  { lat: 18.865605017413497 , lng: 98.95907007800523 },
  { lat: 18.867005109598924 , lng: 98.96089248949055 },
  { lat: 18.866168470583162 , lng: 98.98409666068231 },
  { lat: 18.839105015104654 , lng: 99.02648475686907 },
  { lat: 18.828828769306607 , lng: 99.04618289901556 },
  { lat: 18.792836647350693 , lng: 99.06785514783463 },
  { lat: 18.779550928343383 , lng: 99.0698721692766 },
  { lat: 18.760168964295346 , lng: 99.06412151347163 },
  { lat: 18.73964684788423 , lng: 99.04493835538494 },
  { lat: 18.721520290779758 , lng: 99.00558498590023 },
  { lat: 18.719691270029873 , lng: 98.96751907468398 },
  { lat: 18.724474595906003, lng: 98.92715670549427 },
];

// กำหนดสไตล์ของเส้น
const redLineOptions = {
  strokeColor: '#FF0000', // สีแดง
  strokeOpacity: 0.8,     // ความโปร่งแสง
  strokeWeight: 5,        // ความหนาของเส้น
  clickable: false,
  draggable: false,
  editable: false,
  visible: true,
  radius: 30000,
  zIndex: 1
};

function MapComponent({showRedLine}) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyADHpauDgTvubCOZZCW3JOt8N3d-kxO0Tg" // <-- ใส่ API Key ของคุณตรงนี้
  });

  const [map, setMap] = React.useState(null);

  const onLoad = React.useCallback(function callback(map) {
    // // ฟังก์ชันนี้จะทำงานเมื่อแผนที่โหลดเสร็จ
    // const bounds = new window.google.maps.LatLngBounds(center);
    // map.fitBounds(bounds);
    setMap(map);
  }, []);

  const onUnmount = React.useCallback(function callback(map) {
    setMap(null);
  }, []);

  return isLoaded ? (
<GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={12} // *แนะนำให้ปรับ Zoom เป็น 11 หรือ 12 เพื่อให้เห็นภาพรวม*
      onLoad={onLoad}
      onUnmount={onUnmount}
    >
      {showRedLine && (
        <>
          <Polyline path={route121} options={redLineOptions} />
        </>
      )}
      
    </GoogleMap>
  ) : <></>;
}

export default MapComponent;