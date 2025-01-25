export interface MapFact {
  title: string;
  description: string;
  regions: Array<{
    name: string;
    value: string;
    color: string;
  }>;
}
