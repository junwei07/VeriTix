import { type Event, type Ticket } from "@shared/schema";

export const MOCK_EVENTS: Event[] = [
  {
    id: 1,
    title: "Fintech Summit 2026",
    description: "The premier gathering for fintech innovators, regulators, and investors in Southeast Asia. Join us for three days of deep dives into AI-driven finance, XRPL advancements, and the future of digital assets.",
    location: "Sands Expo & Convention Centre, Singapore",
    date: "2026-04-15T09:00:00.000Z",
    price: 49900, // 499.00 SGD
    imageUrl: "https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?auto=format&fit=crop&q=80&w=1000",
    availableTickets: 450,
    totalTickets: 1000,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    title: "Web3 Music Festival",
    description: "Experience the fusion of underground beats and blockchain technology. Featuring international headliners and local talent, with all tickets secured via soulbound NFTs on the XRP Ledger.",
    location: "Marina Bay Sands Event Plaza",
    date: "2026-05-22T19:00:00.000Z",
    price: 15900, // 159.00 SGD
    imageUrl: "https://images.unsplash.com/photo-1459749411177-042180ce673c?auto=format&fit=crop&q=80&w=1000",
    availableTickets: 120,
    totalTickets: 2500,
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    title: "NFT Art Gala",
    description: "An exclusive evening dedicated to the world of digital art and collectibles. Witness live minting sessions, interact with world-renowned digital artists, and bid on unique NFT pieces.",
    location: "ArtScience Museum, Singapore",
    date: "2026-06-10T18:30:00.000Z",
    price: 8900, // 89.00 SGD
    imageUrl: "https://images.unsplash.com/photo-1561214078-f3247647fc5e?auto=format&fit=crop&q=80&w=1000",
    availableTickets: 45,
    totalTickets: 200,
    createdAt: new Date().toISOString(),
  },
  {
    id: 4,
    title: "XRPL Builders Workshop",
    description: "A hands-on workshop for developers looking to build the next generation of financial applications on the XRP Ledger. Learn about AMMs, sidechains, and smart contract integration.",
    location: "National University of Singapore (NUS)",
    date: "2026-07-05T10:00:00.000Z",
    price: 0, // Free
    imageUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1000",
    availableTickets: 200,
    totalTickets: 300,
    createdAt: new Date().toISOString(),
  },
  {
    id: 5,
    title: "AI & DeFi Symposium",
    description: "Exploring the intersection of Artificial Intelligence and Decentralized Finance. Discuss how LLMs and automated agents are reshaping wealth management and trading strategies.",
    location: "Resorts World Convention Centre, Sentosa",
    date: "2026-08-18T09:30:00.000Z",
    price: 29900, // 299.00 SGD
    imageUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=1000",
    availableTickets: 310,
    totalTickets: 600,
    createdAt: new Date().toISOString(),
  },
  {
    id: 6,
    title: "Crypto Night Singapore",
    description: "The ultimate networking event for the crypto community. Relaxed atmosphere, drinks, and conversations with the brightest minds in the industry.",
    location: "LAVO Italian Restaurant & Rooftop Bar",
    date: "2026-09-30T20:00:00.000Z",
    price: 4500, // 45.00 SGD
    imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1000",
    availableTickets: 85,
    totalTickets: 150,
    createdAt: new Date().toISOString(),
  }
];

export const MOCK_TICKETS: (Ticket & { event: Event })[] = [
  {
    id: 101,
    userId: "mock-user-id",
    eventId: 1,
    event: MOCK_EVENTS[0],
    nftTokenId: "00080000D0000000000000000000000000000000000000000000000000000001",
    status: "active",
    seat: "VIP-A12",
    purchasePrice: 49900,
    purchaseDate: new Date().toISOString(),
  },
  {
    id: 102,
    userId: "mock-user-id",
    eventId: 2,
    event: MOCK_EVENTS[1],
    nftTokenId: "00080000D0000000000000000000000000000000000000000000000000000002",
    status: "active",
    seat: "GA-Floor",
    purchasePrice: 15900,
    purchaseDate: new Date().toISOString(),
  }
];

export interface Listing {
  id: number;
  ticket: Ticket & { event: Event };
  price: number;
  sellerName: string;
}

export const MOCK_LISTINGS: Listing[] = [
  {
    id: 1,
    ticket: {
      ...MOCK_TICKETS[0],
      id: 201,
      seat: "VIP-B22",
    },
    price: 55000, // 550.00 SGD
    sellerName: "Alex Tan",
  },
  {
    id: 2,
    ticket: {
      ...MOCK_TICKETS[1],
      id: 202,
      seat: "GA-Floor-34",
    },
    price: 18000, // 180.00 SGD
    sellerName: "Sarah Lim",
  },
  {
    id: 3,
    ticket: {
      ...MOCK_TICKETS[0],
      id: 203,
      seat: "VIP-C10",
      event: MOCK_EVENTS[2], // NFT Art Gala
    },
    price: 12000, // 120.00 SGD
    sellerName: "Jason Wong",
  },
];

