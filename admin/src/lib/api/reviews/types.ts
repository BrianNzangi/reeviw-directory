export type Review = {
  id: string;
  title: string;
  rating: string;
  status: "pending" | "approved" | "rejected";
  createdAt?: string;
};
