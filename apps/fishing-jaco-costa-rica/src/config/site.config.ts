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
  siteId: "fishing-jaco-costa-rica",
  siteName: "Sport Fishing Jaco Costa Rica",
  siteEmoji: "🎣",
  heroImageUrl: "https://images.unsplash.com/photo-1544943910-4c1dc44aab44",
  dailyActivities: [
    "Deep sea fishing for marlin, sailfish, and dorado",
    "Professional captain and first mate with local expertise",
    "Top-quality fishing gear and tackle provided",
    "Catch cleaning and preparation included",
    "Coolers with ice, drinks, and snacks onboard"
],
  tourSchedule: [
    "5:30 AM - Marina pickup or hotel transfer",
    "6:00 AM - Safety briefing and departure from Los Sueños Marina",
    "6:30 AM - Reach prime fishing grounds offshore",
    "6:45 AM - Begin trolling for big game fish",
    "12:00 PM - Lunch break (fishing continues inshore)",
    "2:00 PM - Return to marina with your catch",
    "2:30 PM - Fish cleaning and photo session",
    "3:00 PM - Transfer back to hotel"
],
  gallery: {
    images: [
      "https://images.unsplash.com/photo-1544943910-4c1dc44aab44",
      "https://images.unsplash.com/photo-1559675553-f369aea7e83b",
      "https://images.unsplash.com/photo-1535591273668-578e31182c4f",
      "https://images.unsplash.com/photo-1534043464124-3be32fe000c9",
      "https://images.unsplash.com/photo-1508888628b-035a6e670e6c",
      "https://images.unsplash.com/photo-1551244290-f673a6f96d0c"
]
  },
  reviews: [
    {
      image: "https://i.pravatar.cc/150?img=25",
      text: "Caught a 200lb sailfish! Captain knew exactly where to go. This fishing charter was world-class. Can't wait to come back next year.",
      author: "Tom Anderson"
    },
    {
      image: "https://i.pravatar.cc/150?img=28",
      text: "Best fishing trip of my life. Crew was knowledgeable, boat was well-maintained, and we caught multiple dorado. Highly professional operation.",
      author: "Chris Walker"
    },
    {
      image: "https://i.pravatar.cc/150?img=30",
      text: "Even though I'm a beginner, the crew made me feel confident. We caught several fish and they taught me so much. Unforgettable experience!",
      author: "Maria Garcia"
    }
  ],
  contact: {
    googleBusinessUrl: "https://g.page/fishing-jaco-cr",
    phoneNumber: "+506-8450-9498"
  }
};
