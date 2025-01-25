export interface MapFact {
  title: string;
  regions: {
    name: string;
    value: string | number;
    color?: string;
  }[];
  description: string;
}

export interface GenerateFactResponse {
  fact: MapFact;
  error?: string;
}
