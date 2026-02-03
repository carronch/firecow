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
  siteId: "private-charter-isla-tortuga",
  siteName: "Private Charter Isla Tortuga",
  siteEmoji: "🛥️",
  heroImageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5",
  dailyActivities: [
    "Exclusive private catamaran experience for your group only",
    "Customizable itinerary based on your preferences",
    "Premium open bar with cocktails and champagne",
    "Personalized gourmet meal prepared by private chef",
    "Water sports equipment: kayaks, paddleboards, snorkeling gear"
],
  tourSchedule: [
    "8:00 AM - Private hotel pickup in luxury vehicle",
    "9:30 AM - Board your exclusive chartered catamaran",
    "10:00 AM - Depart at your preferred time",
    "11:00 AM - Snorkeling at secluded spots (customizable)",
    "12:00 PM - Arrive at private beach area",
    "1:00 PM - Gourmet lunch service on beach or boat",
    "3:00 PM - Additional activities or early departure (flexible)",
    "5:00 PM - Return sailing with premium cocktails",
    "7:00 PM - Private transfer back to hotel"
],
  gallery: {
    images: [
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5",
      "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a",
      "https://images.unsplash.com/photo-1520443240718-fce21cc0cb0b",
      "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a"
]
  },
  reviews: [
    {
      image: "https://i.pravatar.cc/150?img=20",
      text: "We chartered for our anniversary and it was magical. Complete privacy, incredible service, and the crew made us feel like royalty.",
      author: "Amanda Williams"
    },
    {
      image: "https://i.pravatar.cc/150?img=18",
      text: "Corporate event on the catamaran was a huge success. Professional crew, beautiful boat, and our clients were thoroughly impressed.",
      author: "James Peterson"
    },
    {
      image: "https://i.pravatar.cc/150?img=22",
      text: "Worth every dollar for a private experience. Being able to customize our schedule and activities made this the highlight of our honeymoon.",
      author: "Sophie Anderson"
    }
  ],
  contact: {
    googleBusinessUrl: "https://g.page/costa-cat-cruises",
    phoneNumber: "+506-8450-9498"
  }
};
