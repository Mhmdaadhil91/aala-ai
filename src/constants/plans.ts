export type PlanType = 'free';

export interface PlanLimits {
  booksPerMonth: number;
  maxChapters: number;
  maxWordsPerChapter: number;
  pdfEnabled: boolean;
  imagesEnabled: boolean;
  price: string;
  billing: string;
  description: string;
  features: string[];
}

export const PLANS: Record<PlanType, PlanLimits> = {
  free: {
    booksPerMonth: Infinity,
    maxChapters: 50,
    maxWordsPerChapter: 10000,
    pdfEnabled: true,
    imagesEnabled: true,
    price: "0",
    billing: "unlimited",
    description: "Full access to all AI book creation features.",
    features: [
      "Unlimited books per month",
      "Up to 50 chapters per book",
      "10,000 words per chapter",
      "AI Illustration Generation",
      "High-speed PDF download",
      "Priority system access"
    ]
  }
};
