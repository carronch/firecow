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
  siteId: "isla-tortuga-costa-rica",
  siteName: "Isla Tortuga Costa Rica",
  siteEmoji: "🏝️",
  heroImageUrl: "https://costacat.b-cdn.net/wp-content/uploads/2025/04/DSC5373-1024x683.jpg",
  dailyActivities: [
    "Snorkel in crystal-clear waters",
    "Relax on pristine white sand beach",
    "Enjoy a delicious lunch buffet",
    "Kayaking and stand-up paddleboarding",
    "Sunset views on the return journey"
],
  tourSchedule: [
    "7:00 AM - Hotel pickup",
    "8:30 AM - Depart from Marina Los Sueños",
    "11:00 AM - Arrive at Isla Tortuga",
    "12:30 PM - Lunch served",
    "2:00 PM - Beach time and snorkeling",
    "3:30 PM - Depart island",
    "5:30 PM - Return to marina",
    "7:00 PM - Hotel drop-off"
],
  gallery: {
    images: [
      "https://costacat.b-cdn.net/wp-content/uploads/2025/04/DSC5373-1024x683.jpg",
      "https://costacat.b-cdn.net/wp-content/uploads/2025/06/Wahoo-1024x682.jpg",
      "https://costacat.b-cdn.net/wp-content/uploads/2025/10/DSC3532-1024x683.jpg",
      "https://costacat.b-cdn.net/wp-content/uploads/2025/10/DSC6659-1024x683.jpg",
      "https://costacat.b-cdn.net/wp-content/uploads/2025/10/tropical-island-palm-and-underwater-snorkeling-in-2025-03-13-01-11-45-utc-1024x683.jpg",
      "https://costacat.b-cdn.net/wp-content/uploads/2025/10/amazing-sea-sunset-on-the-pebble-beach-the-sun-w-2025-10-11-20-41-50-utc-1024x680.jpg"
]
  },
  reviews: [
    {
      image: "https://lh3.googleusercontent.com/a-/ALV-UjXJQ-Q2HhkYjh7Pl7UpA6fG8QDdCWJhvFrfc3UCWUDDp4GA7RE=w40-h40-c-rp-mo-br100",
      text: "Nothing short of perfection. The boat was well maintained and clean the crew was outstanding. Lunch was carefully prepared and delicious. 10/10 would recommend this company and the crew.",
      author: "Kristina Ferry"
    },
    {
      image: "https://lh3.googleusercontent.com/a/ACg8ocLJPFCDfXI9PIuHK7GirCp0G4HxuVb98Av2P1FdqGcMPCDoJQ=w40-h40-c-rp-mo-br100",
      text: "Everything was well organized. The amazing crew takes excellent care of everyone non stop! Best of all were the 3 whales we saw on the way back!",
      author: "Widjai Lila"
    },
    {
      image: "https://lh3.googleusercontent.com/a-/ALV-UjXG6zdXzpTaT_vIvylLAPlErDBTn_mjq4XxHijhzLyDHdnoDnBN5w=w40-h40-c-rp-mo-br100",
      text: "It was truly one of the best days of my life. The staff went above and beyond. Do yourself a favor and book this trip!",
      author: "Christina Zahid"
    }
  ],
  contact: {
    googleBusinessUrl: "https://www.google.com/maps/search/?api=1&query=Costa+Cat+Cruises",
    phoneNumber: "+506-8390-7070"
  }
};
