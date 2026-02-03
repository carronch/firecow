// Auto-generated from sites-content.csv
// Last synced: 2026-02-03

export interface SiteConfig {
  siteId: string;
  siteName: string;
  siteEmoji: string;
  heroImageUrl: string;
  dailyActivities: string[];
  tourSchedule: string[];
  gallery: {
    images: string[];
  };
  reviews: Array<{
    image: string;
    text: string;
    author: string;
  }>;
  contact: {
    googleBusinessUrl: string;
    phoneNumber: string;
  };
}

export const siteConfig: SiteConfig = {
  siteId: "catamaran-sunset",
  siteName: "Catamaran Sunset Cruise",
  siteEmoji: "🌅",
  heroImageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
  dailyActivities: [
    "Romantic sunset sailing along Costa Rica's coast",
    "Unlimited premium cocktails, wine, and appetizers",
    "Live music or DJ on select nights",
    "Watch dolphins and sea turtles in their natural habitat",
    "Perfect for couples, celebrations, or special occasions"
],
  tourSchedule: [
    "4:00 PM - Hotel pickup from Central Pacific area",
    "5:00 PM - Board luxury sunset catamaran",
    "5:30 PM - Set sail along the coastline",
    "6:00 PM - Appetizers and cocktails served",
    "6:30 PM - Witness spectacular Pacific sunset",
    "7:15 PM - Continue evening cruise under stars",
    "8:00 PM - Return to marina",
    "8:30 PM - Hotel drop-off"
],
  gallery: {
    images: [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
      "https://images.unsplash.com/photo-1495954484750-af469f2f9be5",
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23",
      "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a",
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
]
  },
  reviews: [
    {
      image: "https://i.pravatar.cc/150?img=35",
      text: "Most romantic evening ever! Proposed to my girlfriend during the sunset and the crew helped make it perfect. Champagne, music, pure magic.",
      author: "Alex Rivera"
    },
    {
      image: "https://i.pravatar.cc/150?img=32",
      text: "Beautiful cruise with amazing views. Drinks were excellent and unlimited. Saw dolphins swimming alongside the boat. Absolutely wonderful!",
      author: "Lisa Hamilton"
    },
    {
      image: "https://i.pravatar.cc/150?img=38",
      text: "Perfect way to end our Costa Rica trip. The sunset was breathtaking, crew was attentive, and the whole vibe was incredibly relaxing.",
      author: "Kevin Brown"
    }
  ],
  contact: {
    googleBusinessUrl: "https://g.page/catamaran-sunset-cr",
    phoneNumber: "+506-2637-1234"
  }
};
