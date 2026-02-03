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
  siteId: "catamaran-tour-isla-tortuga",
  siteName: "Catamaran Tour Isla Tortuga",
  siteEmoji: "⛵",
  heroImageUrl: "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a",
  dailyActivities: [
    "Sail on a luxurious catamaran through the Gulf of Nicoya",
    "Swim and snorkel in tropical waters teeming with marine life",
    "Enjoy unlimited tropical drinks and fresh fruit onboard",
    "Feast on a gourmet beachside lunch",
    "Explore natural pools and hidden beaches"
],
  tourSchedule: [
    "7:30 AM - Pickup from area hotels",
    "9:00 AM - Set sail from Puntarenas on premium catamaran",
    "10:30 AM - Swimming and snorkeling stop at coral reef",
    "11:30 AM - Continue sailing to Isla Tortuga",
    "12:00 PM - Beach arrival and free time",
    "1:00 PM - Beach lunch service",
    "3:00 PM - Departure from island",
    "5:00 PM - Return to pier with sunset views",
    "6:30 PM - Hotel drop-off"
],
  gallery: {
    images: [
      "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a",
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5",
      "https://images.unsplash.com/photo-1540202404-a2f29016b523",
      "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a"
]
  },
  reviews: [
    {
      image: "https://i.pravatar.cc/150?img=12",
      text: "The catamaran was beautiful and spacious. Crew went above and beyond. This tour exceeded our expectations in every way!",
      author: "David Martinez"
    },
    {
      image: "https://i.pravatar.cc/150?img=8",
      text: "Best investment of our vacation! The snorkeling gear was top quality and we saw so many fish. Beach was pristine and uncrowded.",
      author: "Jennifer Lee"
    },
    {
      image: "https://i.pravatar.cc/150?img=15",
      text: "Amazing service from start to finish. Transportation was punctual, crew was friendly, and the whole experience was seamless.",
      author: "Robert Thompson"
    }
  ],
  contact: {
    googleBusinessUrl: "https://g.page/catamaran-tortuga",
    phoneNumber: "+506-8450-9498"
  }
};
