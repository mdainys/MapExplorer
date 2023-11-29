import { useEffect, useState, useRef } from "react";
import ReactMapGL, {
  FullscreenControl,
  GeolocateControl,
  NavigationControl,
  Marker,
  Source,
  Layer,
  Popup,
} from "react-map-gl";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { calculateDistance } from "@/utils/helpers";

const Home = () => {
  const geoControlRef = useRef();

  // Initial Map settings
  const [viewport, setViewport] = useState({
    longitude: 26.432730917247454,
    latitude: 55.60407906787367,
    zoom: 15,
  });

  const [popupInfo, setPopupInfo] = useState(null);

  const [currentLocation, setCurrentLocation] = useState({
    longitude: 0,
    latitude: 0,
  });

  const [marker, setMarker] = useState({
    longitude: 26.4320152027785,
    latitude: 55.60406394176823,
  });

  const handleGeolocate = () => {
    if (geoControlRef.current) {
      geoControlRef.current._onClickGeolocate();
    }
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          setViewport((prevViewport) => ({
            ...prevViewport,
            longitude,
            latitude,
          }));
          setCurrentLocation({ longitude, latitude });
        },
        (error) => {
          console.error("Error getting geolocation:", error);
        }
      );

      return () => {
        // Clear watchPosition when the component unmounts
        navigator.geolocation.clearWatch(watchId);
      };
    }
  }, []);

  return (
    <div
      style={{
        margin: "0 auto",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <div>
        <h1 className="text-6xl mb-20 text-[#50d71e] ">Map Explorer</h1>
        Current Location: {currentLocation.latitude.toFixed(6)},{" "}
        {currentLocation.longitude.toFixed(6)}
      </div>

      <div
        style={{
          height: "40vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <ReactMapGL
          style={{
            marginTop: "40px",
            width: "400px",
            borderRadius: "15px",
            boxShadow: "10px 10px 5px 0px rgba(0,0,0,0.75)",
          }}
          {...viewport}
          mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
          mapStyle="mapbox://styles/marius-dainys/clp87nlcx01tq01o4hv8ybcc1"
          attributionControl={false}
          onMove={(e) => setViewport(e.viewport)}
        >
          <GeolocateControl
            showAccuracyCircle={false}
            positionOptions={{ enableHighAccuracy: true }}
            trackUserLocation={true}
            showUserHeading
            ref={geoControlRef}
            fitBoundsOptions={{ zoom: 20, pitch: 70 }}
            onClick={handleGeolocate}
          />
          <NavigationControl position="bottom-right" />
          <FullscreenControl />
          //Pop up window
          <Marker
            longitude={marker.longitude}
            latitude={marker.latitude}
            draggable={true}
          />
        </ReactMapGL>
      </div>
    </div>
  );
};

export default Home;
