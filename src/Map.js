import React, { useState, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import * as turf from "@turf/turf";
import "mapbox-gl/dist/mapbox-gl.css";
import { useDispatch } from "react-redux";
import { addPoint, removePoint } from "./store";

const Map = () => {
  const dispatch = useDispatch();
  const [map, setMap] = useState(null);
  mapboxgl.accessToken =
  "pk.eyJ1IjoidGFyc2hpZDA3IiwiYSI6ImNsdHNjZmlhejBzMHgycXFtc3J0eXNjMnMifQ.JeJEzJfmKDAOwPB7hKhLEQ&zoomwheel";

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
      const distanceContainer = document.getElementById("distance");

      // GeoJSON object to hold our measurement features
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
            "line-width": 4.5,
            "line-offset": -5,
          },
          filter: ["in", "$type", "LineString"],
        });
        
        // Add the new segment-distances layer
        map.addLayer({
          id: "segment-distances",
          type: "symbol",
          source: "segmentLines",
          layout: {
            "text-field": "{distance}",
            "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
            "text-size": 20,
            "text-offset": [0, 2],
            "text-anchor": "bottom",
          },
          paint: {
            "text-color": "#F00",
          },
        });

        map.on("click", (e) => {
          const features = map.queryRenderedFeatures(e.point, {
            layers: ["measure-points"],
          });

          // Remove the linestring from the group
          // so we can redraw it based on the points collection.
          if (geojson.features.length > 1) geojson.features.pop();

          // If a feature was clicked, remove it from the map.
          if (features.length) {
            const id = features[0].properties.id;
            dispatch(removePoint(id));
            geojson.features = geojson.features.filter(
              (point) => point.properties.id !== id
            );
          } else {
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
          }

          if (geojson.features.length > 1) {
            linestring.geometry.coordinates = geojson.features.map(
              (point) => point.geometry.coordinates
            );

            geojson.features.push(linestring);

            // Update segmentLines data to show segment distances
            const segmentLines = {
              type: "FeatureCollection",
              features: [],
            };
            let prevCoord = linestring.geometry.coordinates[0];
            for (let i = 1; i < linestring.geometry.coordinates.length; i++) {
              const currCoord = linestring.geometry.coordinates[i];
              const segment = turf.lineString([prevCoord, currCoord]);
              const segmentDistance = turf.length(segment).toLocaleString();

              const segmentFeature = {
                type: "Feature",
                geometry: segment.geometry,
                properties: {
                  distance: segmentDistance,
                },
              };
              segmentLines.features.push(segmentFeature);

              prevCoord = currCoord;
            }

            map.getSource("segmentLines").setData(segmentLines);
          }
          map.getSource("geojson").setData(geojson);
        });

        map.on("mousemove", (e) => {
          const features = map.queryRenderedFeatures(e.point, {
            layers: ["measure-points"],
          });
          // Change the cursor to a pointer when hovering over a point on the map.
          // Otherwise cursor is a crosshair.
          map.getCanvas().style.cursor = features.length
            ? "pointer"
            : "crosshair";
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