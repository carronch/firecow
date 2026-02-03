// Auto-generated from sites-content.csv
// This is a template - replace with actual data from CSV when creating a new site
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
    siteId: "template",
    siteName: "Your Tour Name Here",
    siteEmoji: "🚀",
    heroImageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
    dailyActivities: [
        "Activity 1 - Replace with actual activity",
        "Activity 2 - Replace with actual activity",
        "Activity 3 - Replace with actual activity",
        "Activity 4 - Replace with actual activity",
        "Activity 5 - Replace with actual activity"
    ],
    tourSchedule: [
        "7:00 AM - Hotel pickup",
        "8:00 AM - Activity starts",
        "12:00 PM - Lunch break",
        "3:00 PM - Return journey",
        "5:00 PM - Hotel drop-off"
    ],
    gallery: {
        images: [
            "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
            "https://images.unsplash.com/photo-1544551763-46a013bb70d5",
            "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a",
            "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a",
            "https://images.unsplash.com/photo-1559827260-dc66d52bef19",
            "https://images.unsplash.com/photo-1566204773863-cf63e6d4ab88"
        ]
    },
    reviews: [
        {
            image: "https://i.pravatar.cc/150?img=1",
            text: "Replace with actual customer review text. Make it compelling and authentic!",
            author: "Customer Name 1"
        },
        {
            image: "https://i.pravatar.cc/150?img=2",
            text: "Replace with actual customer review text. Include specific details about the experience.",
            author: "Customer Name 2"
        },
        {
            image: "https://i.pravatar.cc/150?img=3",
            text: "Replace with actual customer review text. This should build trust and credibility.",
            author: "Customer Name 3"
        }
    ],
    contact: {
        googleBusinessUrl: "https://www.google.com/maps",
        phoneNumber: "+506-0000-0000"
    }
};
