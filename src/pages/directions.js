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
import { lineStyle } from "@/utils/geoJsonData";
import Instruction from "@/components/Instruction";
import MapInfo from "@/components/MapInfo";

const Home = () => {
  const geoControlRef = useRef();

  // Initial Map settings
  const [viewport, setViewport] = useState({
    longitude: 26.432730917247454,
    latitude: 55.60407906787367,
    zoom: 15,
  });

  // Route details
  const [coords, setCoords] = useState([]);
  const [start, setStart] = useState([26.432730917247454, 55.60407906787367]);
  const [end, setEnd] = useState([26.44709, 55.59473]);
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [distanceToNextStep, setDistanceToNextStep] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [showDirection, setShowDirection] = useState(false);
  const [finalDestination, setFinalDestination] = useState("");
  //Show Popup
  const [marker, setMarker] = useState({
    longitude: 26.4320152027785,
    latitude: 55.60406394176823,
  });
  const [showPopup, setShowPopup] = useState(true);

  // Fetch route details
  const getRoute = async () => {
    try {
      setIsFetching(true);

      console.log(22, start);
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/walking/${start.join(
          ","
        )};${end.join(",")}?steps=true&geometries=geojson&access_token=${
          process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
        }`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch route data");
      }

      const data = await response.json();
      const route = data.routes[0];

      setCoords(route.geometry.coordinates);
      setSteps(route.legs[0].steps.map((step) => step.maneuver.instruction));
      setTotalDistance(route.distance);
      setDistanceToNextStep(route.legs[0].steps[0].distance);
      setFinalDestination(route.legs[0].summary);
    } catch (error) {
      console.error("Error fetching route data:", error);
    } finally {
      setIsFetching(false);
    }
  };

  // GeoJSON for Start and End points
  const startPoint = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [...coords],
        },
      },
    ],
  };

  const endPoint = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [...end],
        },
      },
    ],
  };

  const layerEndpoint = {
    id: "end",
    type: "circle",
    source: {
      type: "geojson",
      data: end,
    },
    paint: {
      "circle-radius": 10,
      "circle-color": "#f70776",
    },
  };

  // Map click handler
  const handleClick = (e) => {
    const newEnd = e.lngLat;
    const endPoint = Object.values(newEnd);
    setEnd(endPoint);
    setCurrentStepIndex(0);
  };

  // Effect to fetch route and trigger geolocation
  useEffect(() => {
    const fetchData = async () => {
      if (showDirection) {
        await getRoute();
        GeolocateControl.current?.trigger();
      }
    };

    fetchData();
  }, [showDirection, end, geoControlRef]);

  // Effect to update step index based on geolocation
  useEffect(() => {
    const onGeolocate = (e) => {
      const userLocation = [e.coords.longitude, e.coords.latitude];
      const { longitude, latitude } = e.coords;

      // Update start coordinates with user's current location
      setStart(userLocation);

      // Use the latest steps state
      const currentStep = steps[currentStepIndex];

      const distanceToNextStep = calculateDistance(
        userLocation,
        currentStep.location.coordinates
      );

      setDistanceToNextStep(distanceToNextStep);

      // Adjust the threshold for step completion to 10 meters
      if (distanceToNextStep < 10) {
        setCurrentStepIndex((prevIndex) =>
          Math.min(prevIndex + 1, steps.length - 1)
        );
      }
    };

    GeolocateControl.current?.on("geolocate", onGeolocate);

    return () => {
      GeolocateControl.current?.off("geolocate", onGeolocate);
    };
  }, [currentStepIndex, steps]);

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

        <button
          className="border border-blue-500 rounded-lg py-2 px-4 w-36"
          onClick={() => setShowDirection(!showDirection)}
        >
          {showDirection ? "Hide Direction" : "Show Direction"}
        </button>

        {showDirection && (
          <div>
            <MapInfo
              totalDistance={totalDistance.toFixed(0)}
              finalDestination={finalDestination}
            />
            {steps.length > 0 && (
              <Instruction instruction={steps[currentStepIndex]} />
            )}
            <div>{distanceToNextStep}</div>
          </div>
        )}
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
          onClick={handleClick}
        >
          <GeolocateControl
            showAccuracyCircle={false}
            positionOptions={{ enableHighAccuracy: true }}
            trackUserLocation={true}
            showUserHeading
            ref={geoControlRef}
            onGeolocate={(e) =>
              setStart([e.coords.longitude, e.coords.latitude])
            }
            fitBoundsOptions={{ zoom: 20, pitch: 70 }}
          />
          <NavigationControl position="bottom-right" />
          <FullscreenControl />
          {showDirection && !isFetching && (
            <>
              <Source id="routeSource" type="geojson" data={startPoint}>
                <Layer {...lineStyle} />
              </Source>
            </>
          )}
          <Source id="endSource" type="geojson" data={endPoint}>
            <Layer {...layerEndpoint} />
          </Source>
          //Pop up window
          <Marker
            longitude={marker.longitude}
            latitude={marker.latitude}
            draggable={true}
          />
          <Popup
            longitude={marker.longitude}
            latitude={marker.latitude}
            anchor="bottom"
            onClose={() => setShowPopup(false)}
          >
            You have reached the Marker
          </Popup>
        </ReactMapGL>
      </div>
    </div>
  );
};

export default Home;
