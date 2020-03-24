import * as React from "react";
import { places, map, directions, directionsRenderer, autocomplete } from "./Map";
import debounce from "lodash.debounce";
import { zip } from "./Utils";
const { createContext, useState, useContext: useContextOriginal, useEffect } = React;

interface AppStore {
  map: MapStore;
}

const Context = createContext<AppStore>({} as any);
const { Provider } = Context;

export const StoreProvider: React.FC = ({ children }) => {
  const map = useMap();
  return <Provider value={{ map }}>{children}</Provider>;
};

export function useContext() {
  return useContextOriginal(Context);
}

type PlaceResult = google.maps.places.PlaceResult;
type AutoCompletePrediction = google.maps.places.AutocompletePrediction;
type DirectionResult = google.maps.DirectionsResult;

interface MapState {
  autocompleteResults: AutoCompletePrediction[];
  selectedLocations: PlaceResult[];
  limitedRoutes: Array<"start" | "end" | "waypoint" | "unknown">;
  currentLocation: PlaceResult | null;
  directions: DirectionResult | null;
  markers: google.maps.Marker[];
}

interface MapAction {
  autocomplete(keyword: string): void;
  select(id: string): void;
  remove(place: PlaceResult): void;
  switch(from: number, to: number): void;
  limitedRoute(placeId: string): void;
}

type MapStore = MapState & MapAction;

function useMap(): MapStore {
  const [state, setState] = useState<MapState & { route: string[] }>({
    autocompleteResults: [],
    selectedLocations: [],
    limitedRoutes: [],
    currentLocation: null,
    directions: null,
    markers: [],
    route: []
  });

  function createBounds(places: PlaceResult[]) {
    if (places.length === 0) {
      return new google.maps.LatLngBounds();
    }
    const bounds = new google.maps.LatLngBounds(places[0].geometry?.location);
    places.forEach(it => it.geometry && bounds.extend(it.geometry.location));
    return bounds;
  }

  function hideMarkers() {
    state.markers.forEach(it => it.setMap(null));
  }

  function createMarkers(places: PlaceResult[], map?: google.maps.Map, icon?: google.maps.Icon) {
    return places.map(it =>
      new google.maps.Marker({ position: it.geometry?.location, map, icon })
    );
  }

  function fitBounds(places: PlaceResult[]) {
    if (places.length === 0) {
      map.panTo({ lng: 138, lat: 38 });
      map.setZoom(6);
    } else {
      map.fitBounds(createBounds(places));
      (map.getZoom() > 16) && map.setZoom(16);
    }
  }

  async function route(places: PlaceResult[]) {
    return await directions.route({
      origin: places[0].geometry?.location,
      waypoints: places.slice(1, -1).map(it => ({ location: it.geometry?.location, stopover: false })),
      destination: places[places.length - 1].geometry?.location,
      travelMode: google.maps.TravelMode.DRIVING,
    });
  }

  const searchAutoComplete = debounce(async (keyword: string) => {
    const autocompleteResults = await autocomplete.getPlacePredictions(keyword);
    if (Array.isArray(autocompleteResults)) {
      setState({ ...state, autocompleteResults });
    }
  }, 400);

  async function update(selectedLocations: PlaceResult[], fromTo: string[]) {
    hideMarkers();
    const markers = createMarkers(
      selectedLocations, map,
      { url: "/marker.svg", scaledSize: new google.maps.Size(30, 30) }
    );
    let result: DirectionResult | null = null;
    // set list before calcurating direction. for draggable list.
    setState({ ...state, selectedLocations: selectedLocations, route: fromTo });
    if (selectedLocations.length > 1) {
      const routeType = calcurateLimitedRoutes(fromTo);
      const routePlaces = (routeType.includes("start") && routeType.includes("end"))
        ? zip(selectedLocations, routeType).filter(([_, type]) => type !== "unknown").map(([place]) => place)
        : selectedLocations;
      result = (await route(routePlaces)).result;
      directionsRenderer.setDirections(result);
      directionsRenderer.setMap(map);
    } else {
      directionsRenderer.setMap(null);
    }
    fitBounds(selectedLocations);
    setState({
      ...state,
      selectedLocations: selectedLocations,
      route: fromTo,
      markers,
      autocompleteResults: [],
      directions: result,
    });
  }

  async function setSelectedLocation(places: PlaceResult[]) {
    update(places, state.route);
  }

  function calcurateLimitedRoutes(route: string[]) {
    let foundStart = false;
    let foundEnd = false;
    return state.selectedLocations.map(it => {
      if (!foundStart) {
        if (route.includes(it.place_id || "dummy")) {
          foundStart = true;
          return "start";
        }
      } else if (!foundEnd) {
        if (route.includes(it.place_id || "dummy")) {
          foundEnd = true;
          return "end";
        } else if (route.length === 2) {
          return "waypoint";
        }
      }
      return "unknown";
    });
  }

  return {
    ...state,
    limitedRoutes: calcurateLimitedRoutes(state.route),
    async autocomplete(keyword) {
      searchAutoComplete(keyword);
    },
    async select(placeId: string) {
      const place = await places.getDetails(placeId);
      const selectedLocations = [...state.selectedLocations, place];
      setSelectedLocation(selectedLocations);
    },
    async remove(place: PlaceResult) {
      setSelectedLocation(state.selectedLocations.filter(it => it.place_id !== place.place_id))
    },
    async switch(from, to) {
      const tmpList = [...state.selectedLocations];
      const item = tmpList.splice(from, 1);
      tmpList.splice(to, 0, ...item);
      setSelectedLocation(tmpList);
    },
    limitedRoute(id) {
      const { route } = state;
      if (route.includes(id)) {
        update(state.selectedLocations, [...route.filter(it => it !== id)])
      } else if (route.length !== 2) {
        update(state.selectedLocations, [...route, id])
      }
    }
  };
}
