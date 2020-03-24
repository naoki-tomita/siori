import { Loader } from "@googlemaps/loader";

export let map: google.maps.Map;
let _places: google.maps.places.PlacesService;
let _directions: google.maps.DirectionsService;
export let directionsRenderer: google.maps.DirectionsRenderer;
export let _autoComplete: google.maps.places.AutocompleteService;


export async function initServices() {
  const loader = new Loader({ apiKey: process.env.API_KEY!, libraries: ["places"] });
  await loader.load();
  map = new google.maps.Map(document.getElementById("map")!, {
    center: { lng: 138, lat: 38 }, zoom: 6,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
  });
  _places = new google.maps.places.PlacesService(map);
  _autoComplete = new google.maps.places.AutocompleteService();
  _directions = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({ map });
}

class Places {
  async getDetails(placeId: string) {
    return new Promise<google.maps.places.PlaceResult>(ok =>
      _places.getDetails({ placeId }, results => ok(results)));
  }
  async textSearch(query: string) {
    return new Promise<google.maps.places.PlaceResult[]>(ok =>
      _places.textSearch({ query, location: map.getCenter(), radius: 200 }, results => ok(results)));
  }
}

class Directions {
  async route(req: google.maps.DirectionsRequest) {
    return new Promise<{
      result: google.maps.DirectionsResult,
      status: google.maps.DirectionsStatus
    }>(ok =>
      _directions.route(req, (result, status) => ok({ result, status })));
  }
}

class AutoComplete {
  async getPlacePredictions(keyword: string) {
    return new Promise<google.maps.places.AutocompletePrediction[]>(ok =>
      _autoComplete.getPlacePredictions({
        input: keyword,
        location: map.getCenter(),
        bounds: map.getBounds() || undefined
      }, results => ok(results))
    );
  }
}

export const places = new Places();
export const directions = new Directions();
export const autocomplete = new AutoComplete();
