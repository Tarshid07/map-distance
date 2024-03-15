import React, { useState, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useDispatch } from "react-redux";
import { addPoint } from "./store";

const Map = () => {
  const dispatch = useDispatch();
  const [map, setMap] = useState(null);
  mapboxgl.accessToken =
    "pk.eyJ1IjoidGFyc2hpZDA3IiwiYSI6ImNsdHNjZmlhejBzMHgycXFtc3J0eXNjMnMifQ.JeJEzJfmKDAOwPB7hKhLEQ&zoomwheel";
   // https://api.mapbox.com/styles/v1/tarshid07/cltselid8006g01quaoaxa9c3.html?title=copy&access_token=pk.eyJ1IjoidGFyc2hpZDA3IiwiYSI6ImNsdHNjZmlhejBzMHgycXFtc3J0eXNjMnMifQ.JeJEzJfmKDAOwPB7hKhLEQ&zoomwheel=true&fresh=true#12/25.12/55.13
  useEffect(() => {
    const newMap = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/tarshid07/cltselid8006g01quaoaxa9c3",
      center: [77.21, 28.64],
      zoom: 12,
    });
    setMap(newMap);
  }, []);

  useEffect(() => {
    if (map) {
      const geojson = {
        type: "FeatureCollection",
        features: [],
      };

      // Used to draw a line between points
      const linestring = {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [],
        },
      };
      map.on("load", () => {
        map.addSource("geojson", {
          type: "geojson",
          data: geojson,
        });
        map.addSource("segmentLines", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [],
          },
        });

        // Add styles to the map
        map.addLayer({
          id: "measure-points",
          type: "circle",
          source: "geojson",
          paint: {
            "circle-radius": 7,
            "circle-color": "#000000",
          },
          filter: ["in", "$type", "Point"],
        });
        map.addLayer({
          id: "measure-lines",
          type: "line",
          source: "geojson",
          layout: {
            "line-cap": "round",
            "line-join": "round",
          },
          paint: {
            "line-color": "#000000",
            "line-width": 5,
            "line-offset": 1,
          },
          filter: ["in", "$type", "LineString"],
        });
       map.on("click", (e) => {
        
          if (geojson.features.length > 1) geojson.features.pop();

            const point = {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [e.lngLat.lng, e.lngLat.lat],
              },
              properties: {
                id: String(new Date().getTime()),
              },
            };

            geojson.features.push(point);
            dispatch(addPoint(point));

           linestring.geometry.coordinates = geojson.features.map(
              (point) => point.geometry.coordinates
          );

            geojson.features.push(linestring);

            
          map.getSource("geojson").setData(geojson);
        });

      });
    }
  }, [map]);
  return (
    <div>
      <div id="map" style={{ height: "100vh" }} />
    </div>
  );
};

export default Map;

