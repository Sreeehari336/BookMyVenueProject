
const venueImages: Record<number, string> = {
  // Venue ID 1 — Birthday Hall, Thrissur
  1: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80",

  // Venue ID 3 — Small hall, Kozhikode
  3: "https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=900&q=80",

  // Venue ID 5 — Birthday Hall, Kochi
  5: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=900&q=80",

  // Venue ID 6 — Birthday Hall, Thrissur
  6: "https://images.unsplash.com/photo-1478146896981-b80fe463b330?auto=format&fit=crop&w=900&q=80",

  // Venue ID 7 — Wedding Hall, Kozhikode
  7: "https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=900&q=80",

  // Venue ID 8 — Party Hall, Kannur
  8: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80",

  // Venue ID 9 — Pool Bar, Kochi
  9: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80",
};

const fallbackImage =
  "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80";

export function getVenueImage(venueId: number): string {
  return venueImages[venueId] ?? fallbackImage;
}
