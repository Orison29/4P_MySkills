export type IngestionError = {
  row: number;
  field: string;
  error: string;
};

export type IngestionSummary = {
  processed: number;
  created: number;
  ignored: number;
  failed: number;
  errors: IngestionError[];
};
