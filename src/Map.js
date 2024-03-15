import React, { useState, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useDispatch } from "react-redux";
import { addPoint, removePoint } from "./store";

const Map = () => {
  const dispatch = useDispatch();
  const [map, setMap] = useState(null);
  mapboxgl.accessToken =
    "pk.eyJ1IjoibWsxMDM5OSIsImEiOiJjbGdyc3RzaGcwNjBjM2xxMjgwZmJraGp4In0.nMEi2-CIuCNjHWQhnWeFPw";

  useEffect(() => {
    const newMap = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mk10399/clgs6hni5001u01pr2p8sa28y",
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
            "line-width": 5,
            "line-offset": 1,
          },
          filter: ["in", "$type", "LineString"],
        });
       map.on("click", (e) => {
         const features = map.queryRenderedFeatures(e.point, {
           layers: ["measure-points"],
         });

          // Remove the linestring from the group
          // so we can redraw it based on the points collection.
          if (geojson.features.length > 1) geojson.features.pop();

          // Clear the distance container to populate it with a new value.
          distanceContainer.innerHTML = "";

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

        //  if (geojson.features.length > 1) {
           linestring.geometry.coordinates = geojson.features.map(
              (point) => point.geometry.coordinates
          );

            geojson.features.push(linestring);

            
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
      <div id="distance" className="distance-container" />
    </div>
  );
};

export default Map;

