// types/house.ts

export interface House {
  id: string;
  name: string;
  virtual?: boolean; // Used for special options like "All Houses" that don't exist in the database
}
