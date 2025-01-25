export interface Coordinates {
  lat: number;
  lng: number;
}

export interface MapFact {
  title: string;
  description: string;
  regions: {
    name: string;
    value: string;
    color: string;
    coordinates?: Coordinates;
  }[];
}
