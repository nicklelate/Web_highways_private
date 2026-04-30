import React, { useCallback, useEffect, useMemo, useState } from "react";
import { GoogleMap, Polyline, useJsApiLoader } from "@react-google-maps/api";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

// ขนาดแผนที่
const containerStyle = {
  position: "relative",
  width: "50vw",
  height: "75vh",
};

// center สำรอง กรณียังไม่มี route
const fallbackCenter = {
  lat: 13.664486272607089,
  lng: 101.05589011962554,
};

// style ของเส้น
const redLineOptions = {
  strokeColor: "#FF0000",
  strokeOpacity: 0.8,
  strokeWeight: 5,
  clickable: false,
  draggable: false,
  editable: false,
  visible: true,
  zIndex: 1,
};

// ดึง route จาก Firestore แล้วแปลงเป็น [{ lat, lng }, ...]
async function getRouteById(routeId) {
  const docRef = doc(db, "route", String(routeId));
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error(`Document route/${routeId} not found`);
  }

  const data = docSnap.data();
  const x = Array.isArray(data.x) ? data.x : [];
  const y = Array.isArray(data.y) ? data.y : [];

  if (x.length !== y.length) {
    throw new Error(`Invalid route/${routeId}: x and y length do not match`);
  }

  return x.map((lng, index) => ({
    lat: Number(y[index]),
    lng: Number(lng),
  }));
}

function MapComponent({ routeId }) {
  const [map, setMap] = useState(null);
  const [routeShow, setRouteShow] = useState([]);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [error, setError] = useState("");

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: "API KEY ใส่ตรงนี้จ้าาาาาาาาา",
  });

  const onLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // center:
  // - ถ้ามี route ใช้ fallbackCenter ไปก่อน
  // - หลังจาก route โหลดแล้ว fitBounds จะจัดมุมมองให้เอง
  const center = useMemo(() => {
    return fallbackCenter;
  }, []);

  // โหลด route เมื่อ routeId เปลี่ยน
  useEffect(() => {
    let cancelled = false;

    async function loadRoute() {
      if (!routeId) {
        setRouteShow([]);
        setError("");
        setLoadingRoute(false);

        if (map) {
          map.panTo(fallbackCenter);
          map.setZoom(5);
        }
        return;
      }

      try {
        setLoadingRoute(true);
        setError("");

        const route = await getRouteById(routeId);

        if (!cancelled) {
          setRouteShow(route);
        }
      } catch (err) {
        if (!cancelled) {
          setRouteShow([]);
          setError(err.message || "Failed to load route");
        }
      } finally {
        if (!cancelled) {
          setLoadingRoute(false);
        }
      }
    }

    loadRoute();

    return () => {
      cancelled = true;
    };
  }, [routeId, map]);

  // fit bounds เฉพาะตอนมี route แล้ว
  useEffect(() => {
    if (!map || !window.google || routeShow.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();
    routeShow.forEach((point) => bounds.extend(point));
    map.fitBounds(bounds);
  }, [map, routeShow]);

  if (loadError) {
    return <div>Failed to load Google Maps</div>;
  }

  if (!isLoaded) {
    return <div>Loading map...</div>;
  }

  return (
    <div>
      {loadingRoute && <div>Loading route...</div>}
      {error && <div style={{ color: "red" }}>Error: {error}</div>}

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={5}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        {routeShow.length > 1 && (
          <Polyline path={routeShow} options={redLineOptions} />
        )}
      </GoogleMap>
    </div>
  );
}

export default MapComponent;