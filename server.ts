import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'AIzaSyBx0QrKlRHM_6xFHkHRGNebAQJE9s9-kKg';

// High quality real YouTube videos to use as fallbacks or default items
const MOCK_VIDEOS = [
  {
    id: 'jfKfPfyJRdk',
    title: 'Lofi Hip Hop Radio 🌌 Beats to Relax, Study or Focus to',
    description: 'Welcome to the official lofi hip hop radio station. Grab a coffee, relax, and stream beautiful, warm instrumental beats to help you stay focused, unwind, or get inspired.',
    thumbnail: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&auto=format&fit=crop&q=60',
    duration: 'LIVE',
    views: '4.8M',
    likes: '120K',
    channelId: 'UC3H_K_G-Zz_W9_8Z1aYpXKg',
    channelTitle: 'Lofi Records',
    channelAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60',
    publishedAt: '2026-06-01T00:00:00Z',
    isShort: false
  },
  {
    id: '7C_Ycc11YhM',
    title: 'The Mind-Bending Physics of Interstellar Travel',
    description: 'Explore the theoretical physics behind space-time warping, wormholes, and black holes as we attempt to cross the cosmic void to find a second home.',
    thumbnail: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&auto=format&fit=crop&q=60',
    duration: '15:20',
    views: '920K',
    likes: '45K',
    channelId: 'UC7_Ycc11YhM_physics',
    channelTitle: 'Cosmic Horizon',
    channelAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60',
    publishedAt: '2026-07-10T12:00:00Z',
    isShort: false
  },
  {
    id: 'b6_2m9oY3g8',
    title: 'How to Sear the Perfect Ribeye Steak - Chef Secrets',
    description: 'Learn the restaurant secrets to achieving a rich, golden-brown crust on your steak, basted with rich butter, garlic cloves, and fresh rosemary.',
    thumbnail: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=60',
    duration: '08:45',
    views: '1.8M',
    likes: '110K',
    channelId: 'UC_chef_secrets',
    channelTitle: 'Michelin At Home',
    channelAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60',
    publishedAt: '2026-07-01T15:00:00Z',
    isShort: false
  },
  {
    id: 'v7TIDy8VsnM',
    title: 'Unboxing the Ultimate $10,000 Futuristic Tech Setup',
    description: 'We review the most insane custom PC build, desk, chair, and smart ambient accessories to build the ultimate cyberpunk creator workspace.',
    thumbnail: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=800&auto=format&fit=crop&q=60',
    duration: '18:12',
    views: '1.2M',
    likes: '85K',
    channelId: 'UCv7TIDy8VsnM_tech',
    channelTitle: 'HyperTech',
    channelAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=60',
    publishedAt: '2026-07-12T09:00:00Z',
    isShort: false
  },
  {
    id: 'R49n39H7bms',
    title: 'Norway Scenic Escape: 8K Ultra HD Relaxing Film',
    description: 'Experience the stunning fjords, majestic mountains, and pure nature of Norway in ultra-high definition, accompanied by a soothing ambient soundtrack.',
    thumbnail: 'https://images.unsplash.com/photo-1527004013197-933c4bb611b3?w=800&auto=format&fit=crop&q=60',
    duration: '30:00',
    views: '2.5M',
    likes: '140K',
    channelId: 'UCR49n39H7bms_nature',
    channelTitle: 'Earth Wonders',
    channelAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=60',
    publishedAt: '2026-05-20T10:00:00Z',
    isShort: false
  },
  {
    id: 'S9AtPnEGd3M',
    title: 'The Art of Traditional Japanese Wood Joinery (Sashimono)',
    description: 'An immersive documentary on Sashimono, the traditional Japanese craft of making wood furniture without using any nails, screws, or metal pieces.',
    thumbnail: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800&auto=format&fit=crop&q=60',
    duration: '12:15',
    views: '2.1M',
    likes: '130K',
    channelId: 'UC_wood_satisfy',
    channelTitle: 'Master Crafts',
    channelAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60',
    publishedAt: '2026-06-18T10:00:00Z',
    isShort: false
  },
  {
    id: '3A61_hC-L8E',
    title: 'Insane Roof Parkour Across Chalets in the Swiss Alps',
    description: 'Watch adrenaline-fueled athletes perform mind-blowing jumps, flips, and drops over traditional chalets in Switzerland with gorgeous mountain peaks in the background.',
    thumbnail: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800&auto=format&fit=crop&q=60',
    duration: '10:30',
    views: '3.4M',
    likes: '220K',
    channelId: 'UC_parkour_alpine',
    channelTitle: 'Alpine Adrenaline',
    channelAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=60',
    publishedAt: '2026-07-04T12:00:00Z',
    isShort: false
  },
  {
    id: 'tPEE9ZwTmy0',
    title: 'Cuteness Overload: Wholesome Golden Retriever Puppies Compilation',
    description: 'Get ready for some pure joy! A compilation of the most precious Golden Retriever puppies playing, sleeping, and learning to run on green grass.',
    thumbnail: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop&q=60',
    duration: '11:05',
    views: '6.7M',
    likes: '480K',
    channelId: 'UC_cute_animals',
    channelTitle: 'Wholesome Pets',
    channelAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=60',
    publishedAt: '2026-06-10T08:00:00Z',
    isShort: false
  },
  {
    id: '9v_rtU3Ue9g',
    title: 'The World\'s Most Amazing Card Magic Tricks Revealed',
    description: 'Professional magician breaks down unbelievable sleight of hand tricks, explaining the psychology and muscle memory required to pull them off.',
    thumbnail: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=800&auto=format&fit=crop&q=60',
    duration: '14:50',
    views: '1.5M',
    likes: '92K',
    channelId: 'UC_magic_sleight',
    channelTitle: 'Illusion Studio',
    channelAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60',
    publishedAt: '2026-06-25T16:00:00Z',
    isShort: false
  },
  {
    id: '8X2kIfS6fb8',
    title: 'The Synthwave Sunset Drive: Ambient Soundscapes',
    description: 'Enjoy a futuristic ride through neon-lit streets with custom curated synthesizers and 80s outrun basslines. Perfect for driving, studying, or late night relaxation.',
    thumbnail: 'https://images.unsplash.com/photo-1515462277126-270d878326e5?w=800&auto=format&fit=crop&q=60',
    duration: '45:00',
    views: '780K',
    likes: '39K',
    channelId: 'UC8X2kIfS6fb8_synth',
    channelTitle: 'RetroWave Beats',
    channelAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=60',
    publishedAt: '2026-07-02T18:00:00Z',
    isShort: false
  }
];

// Rich, highly diverse mock shorts
const MOCK_SHORTS = [
  {
    id: 'Y_S07u3GjM8',
    title: 'Insane Basketball Trickshot! 🏀😲',
    description: 'This is the most impossible half-court blindfolded shot you will ever see.',
    thumbnail: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=60',
    duration: '0:35',
    views: '3.4M',
    likes: '290K',
    channelId: 'UCR49n39H7bms_nature',
    channelTitle: 'Earth Wonders',
    channelAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=60',
    publishedAt: '2026-06-28T16:20:00Z',
    isShort: true
  },
  {
    id: '3GkU4X-4l4A',
    title: 'The Secret Behind Pixar\'s 3D Animation! 🎥🎨',
    description: 'How Pixar uses mathematics to render realistic textures and light interactions in their movies.',
    thumbnail: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800&auto=format&fit=crop&q=60',
    duration: '0:45',
    views: '2.1M',
    likes: '180K',
    channelId: 'UC7_Ycc11YhM_physics',
    channelTitle: 'Cosmic Horizon',
    channelAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60',
    publishedAt: '2026-07-11T14:30:00Z',
    isShort: true
  },
  {
    id: 'dQw4w9WgXcQ',
    title: 'Never Gonna Give You Up - Lo-Fi Chill Version 🎵✨',
    description: 'A completely re-imagined retro lofi vibe for the classic anthem.',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=60',
    duration: '0:59',
    views: '4.7M',
    likes: '350K',
    channelId: 'UC_lofi_rick',
    channelTitle: 'Rick Vibes',
    channelAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60',
    publishedAt: '2026-07-01T12:00:00Z',
    isShort: true
  },
  {
    id: 'tPEE9ZwTmy0',
    title: 'Wholesome Kitten Learns to Walk! 🐾🐱',
    description: 'This is the most precious thing you will see all day. Absolute cuteness overload.',
    thumbnail: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop&q=60',
    duration: '0:30',
    views: '12M',
    likes: '1.1M',
    channelId: 'UC_cute_animals',
    channelTitle: 'Wholesome Pets',
    channelAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=60',
    publishedAt: '2026-06-15T09:00:00Z',
    isShort: true
  },
  {
    id: 'S9AtPnEGd3M',
    title: 'Satisfying Japanese Wood Joinery Craft! 🪵🪚',
    description: 'Perfect alignment without nails. Traditional woodworking at its finest.',
    thumbnail: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800&auto=format&fit=crop&q=60',
    duration: '0:55',
    views: '8.9M',
    likes: '720K',
    channelId: 'UC_wood_satisfy',
    channelTitle: 'Master Crafts',
    channelAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60',
    publishedAt: '2026-06-20T17:45:00Z',
    isShort: true
  },
  {
    id: 'b6_2m9oY3g8',
    title: 'The Perfect Ribeye Steak Sear! 🥩🔥',
    description: 'How to get that rich golden crust with butter, garlic, and fresh rosemary.',
    thumbnail: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=60',
    duration: '0:48',
    views: '5.2M',
    likes: '410K',
    channelId: 'UC_steak_sear',
    channelTitle: 'Michelin At Home',
    channelAvatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&auto=format&fit=crop&q=60',
    publishedAt: '2026-07-02T11:00:00Z',
    isShort: true
  },
  {
    id: '9v_rtU3Ue9g',
    title: 'Mind-Bending Card Magic Trick Revealed! 🃏🔮',
    description: 'Can you spot the sleight of hand? Watch closely as the card changes in mid-air.',
    thumbnail: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=800&auto=format&fit=crop&q=60',
    duration: '0:50',
    views: '3.1M',
    likes: '190K',
    channelId: 'UC_magic_sleight',
    channelTitle: 'Illusion Studio',
    channelAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60',
    publishedAt: '2026-06-10T14:00:00Z',
    isShort: true
  },
  {
    id: '3A61_hC-L8E',
    title: 'Insane Roof Parkour Jump in Swiss Alps! 🇨🇭🧗',
    description: 'Do not try this at home! Jumping across chalets with an incredible mountain backdrop.',
    thumbnail: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800&auto=format&fit=crop&q=60',
    duration: '0:52',
    views: '6.4M',
    likes: '510K',
    channelId: 'UC_parkour_alpine',
    channelTitle: 'Alpine Adrenaline',
    channelAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=60',
    publishedAt: '2026-07-05T08:00:00Z',
    isShort: true
  },
  {
    id: 'jfKfPfyJRdk',
    title: 'Lofi Girl - Study Vibe 🌌',
    description: 'Getting focused for the ultimate late-night productivity sprint.',
    thumbnail: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&auto=format&fit=crop&q=60',
    duration: '0:59',
    views: '15M',
    likes: '1.2M',
    channelId: 'UC3H_K_G-Zz_W9_8Z1aYpXKg',
    channelTitle: 'Lofi Records',
    channelAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60',
    publishedAt: '2026-06-01T00:00:00Z',
    isShort: true
  },
  {
    id: 'R49n39H7bms',
    title: 'Norway Fjords Drone View in 60s! 🇳🇴🏔️',
    description: 'Fly over majestic mountains and emerald green waters in Norway.',
    thumbnail: 'https://images.unsplash.com/photo-1527004013197-933c4bb611b3?w=800&auto=format&fit=crop&q=60',
    duration: '0:58',
    views: '4.2M',
    likes: '340K',
    channelId: 'UCR49n39H7bms_nature',
    channelTitle: 'Earth Wonders',
    channelAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=60',
    publishedAt: '2026-05-20T10:00:00Z',
    isShort: true
  }
];

// Generates an infinite stream of diverse, high-quality simulated shorts
function generateMockShorts(count: number, offset: number = 0): any[] {
  const categories = [
    {
      topic: 'Sports',
      titles: [
        'Unbelievable Football Overhead Kick! ⚽️🤯',
        'Epic Half-Court Buzzer Beater! 🏀🔥',
        'Unreal Table Tennis Reflexes! 🏓😲',
        'Incredible Skateboarding Kickflip Over 10 Stairs! 🛹',
        'How did he catch that?! Insane Baseball Catch ⚾️'
      ],
      descriptions: [
        'The stadium went absolutely wild for this play!',
        'You have to see it in slow motion to believe it.',
        'Hard work pays off. Years of training for this single moment.',
        'Absolute perfection under pressure!'
      ],
      unsplashPhotos: [
        'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1538385869424-df85d498bf7f?w=800&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1520156473397-031da404764d?w=800&auto=format&fit=crop&q=60'
      ],
      channels: [
        { id: 'ch_sports_unreal', name: 'Sports Spotlight', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=60' },
        { id: 'ch_athletes_hub', name: 'Athletes Hub', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60' }
      ]
    },
    {
      topic: 'Cooking',
      titles: [
        'The Secret to Crispy Golden Garlic Fries! 🍟🧄',
        'Creamy Truffle Pasta in 10 Minutes! 🍝🍄',
        'Making Homemade Fluffy Soufflé Pancakes! 🥞✨',
        'Insane Street Food BBQ Ribs Glazing! 🥩🔥',
        'The Easiest Rich Chocolate Mousse Recipe! 🍫🧁'
      ],
      descriptions: [
        'Save this recipe! It will satisfy any late-night craving.',
        'Melt-in-your-mouth goodness with just 5 simple ingredients.',
        'Your family will request this every single weekend!',
        'The aroma is absolutely heavenly.'
      ],
      unsplashPhotos: [
        'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=60'
      ],
      channels: [
        { id: 'ch_chef_vibe', name: 'The Cozy Kitchen', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60' },
        { id: 'ch_gourmet_60s', name: 'Gourmet in 60s', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=60' }
      ]
    },
    {
      topic: 'Travel',
      titles: [
        'Stunning Hidden Waterfalls in Bali! 🌴💦',
        'Unbelievable View of the Venice Canals! 🇮🇹🛶',
        'Overnight Train Ride in Japan: What to Expect! 🇯🇵🚄',
        'Is this the clearest water on Earth? Bora Bora! 🏝️🌊',
        'Waking up inside a Glass Igloo in Finland! 🇫🇮❄️'
      ],
      descriptions: [
        'Adding this to the absolute top of my bucket list!',
        'A magical view that doesn’t even feel real.',
        'This train is cleaner and more futuristic than most hotels.',
        'An unforgettable journey into the heart of wilderness.'
      ],
      unsplashPhotos: [
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1527004013197-933c4bb611b3?w=800&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&auto=format&fit=crop&q=60'
      ],
      channels: [
        { id: 'ch_wanderlust_drone', name: 'Wanderlust Drone', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&auto=format&fit=crop&q=60' },
        { id: 'ch_earth_escape', name: 'Earth Escape', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&auto=format&fit=crop&q=60' }
      ]
    },
    {
      topic: 'Space & Science',
      titles: [
        'What Happens If You Fall Into a Black Hole? 🌌🕳️',
        'This is the Largest Star in the Known Universe! 🌟☄️',
        'How Quantum Computers Actually Work in 60s! 🔬⚛️',
        'Unbelievable Scale of the Universe Simulation! 🛸🪐',
        'Why Time Moves Slower in Space! ⏰🚀'
      ],
      descriptions: [
        'Theoretical physics will make you feel so incredibly tiny.',
        'The absolute mind-boggling scale of our cosmos.',
        'The future is quantum, and it is arriving faster than you think.',
        'Science is stranger and more beautiful than fiction.'
      ],
      unsplashPhotos: [
        'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=800&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&auto=format&fit=crop&q=60'
      ],
      channels: [
        { id: 'ch_cosmic_horizon', name: 'Cosmic Horizon', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60' },
        { id: 'ch_science_simplified', name: 'Science Simplified', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=50&auto=format&fit=crop&q=60' }
      ]
    },
    {
      topic: 'Gaming & Music',
      titles: [
        'Minecraft Speedrunner Clutch 1 in a Million Block! 🧱⛏️',
        'Epic Synthesizer Solo with Neon Visualizers! 🎹⚡️',
        'This CS:GO Ace Clutch Was Too Clean! 🎮🔫',
        'Satisfying Lo-Fi Beats Modular Synth Jam 🌌🎵',
        'Can you play this insane piano song? 🎹🔥'
      ],
      descriptions: [
        'My hands were literally sweating during this whole play!',
        'The analog synth bassline on this is absolutely warm.',
        'I still have no idea how I survived this lobby.',
        'Late night ambient vibes to stay focused.'
      ],
      unsplashPhotos: [
        'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1515462277126-270d878326e5?w=800&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=60'
      ],
      channels: [
        { id: 'ch_retrowave_beats', name: 'RetroWave Beats', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=60' },
        { id: 'ch_gamer_pro', name: 'Gamer Pro', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=60' }
      ]
    }
  ];

  const realVideoIds = [
    'Y_S07u3GjM8', '3GkU4X-4l4A', 'dQw4w9WgXcQ', 'tPEE9ZwTmy0', 'S9AtPnEGd3M',
    'b6_2m9oY3g8', '9v_rtU3Ue9g', '3A61_hC-L8E', 'jfKfPfyJRdk', 'R49n39H7bms',
    '8X2kIfS6fb8', 'v7TIDy8VsnM', '7C_Ycc11YhM', '3HNyX_gL8pE', 'A_ZpB-Xq2Y8',
    'p9K80RymD6g', 'W-rZ8M8WqCg'
  ];

  const results = [];
  for (let i = 0; i < count; i++) {
    const itemIndex = offset + i;
    const category = categories[itemIndex % categories.length];
    
    const title = category.titles[Math.floor((itemIndex * 7) % category.titles.length)];
    const description = category.descriptions[Math.floor((itemIndex * 3) % category.descriptions.length)];
    const photo = category.unsplashPhotos[Math.floor((itemIndex * 13) % category.unsplashPhotos.length)];
    const channel = category.channels[Math.floor((itemIndex * 17) % category.channels.length)];
    const videoId = realVideoIds[itemIndex % realVideoIds.length];

    const viewsNum = 50000 + ((itemIndex * 14322) % 9500000);
    const likesNum = Math.floor(viewsNum * (0.05 + ((itemIndex * 0.01) % 0.1)));

    results.push({
      id: `${videoId}-mock${itemIndex}`,
      title,
      description,
      thumbnail: photo,
      duration: '0:' + (30 + (itemIndex % 30)).toString().padStart(2, '0'),
      views: formatCount(viewsNum.toString()),
      likes: formatCount(likesNum.toString()),
      channelId: channel.id,
      channelTitle: channel.name,
      channelAvatar: channel.avatar,
      publishedAt: new Date(Date.now() - (itemIndex * 3600000 * 4)).toISOString(),
      isShort: true
    });
  }

  return results;
}

const MOCK_COMMENTS: Record<string, any[]> = {
  'jfKfPfyJRdk': [
    { id: 'c1', authorName: 'Alice Green', authorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&auto=format&fit=crop&q=60', text: 'This music is literally keeping me alive during my college finals week. Thank you!', publishedAt: '2 hours ago', likes: 245 },
    { id: 'c2', authorName: 'David Miller', authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&auto=format&fit=crop&q=60', text: 'Lofi Records never misses. The synth overlays on track 4 are so good.', publishedAt: '5 hours ago', likes: 112 },
    { id: 'c3', authorName: 'Elena Smith', authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&auto=format&fit=crop&q=60', text: 'Does anyone know the playlist name? This is incredible.', publishedAt: '1 day ago', likes: 89 }
  ],
  '7C_Ycc11YhM': [
    { id: 'c4', authorName: 'Dr. Evelyn Carter', authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=50&auto=format&fit=crop&q=60', text: 'An exceptionally clear explanation of Einstein-Rosen bridges. Excellent graphics!', publishedAt: '1 day ago', likes: 512 },
    { id: 'c5', authorName: 'Quantum Enthusiast', authorAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=50&auto=format&fit=crop&q=60', text: 'The part about time dilation makes me so existential. Beautifully done.', publishedAt: '2 days ago', likes: 143 }
  ],
  '3HNyX_gL8pE': [
    { id: 'c6', authorName: 'Senior Stack', authorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&auto=format&fit=crop&q=60', text: 'Finally, a tutorial that explains HLS streaming and keyframes correctly. Amazing content!', publishedAt: '3 days ago', likes: 98 },
    { id: 'c7', authorName: 'Junior React Dev', authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=50&auto=format&fit=crop&q=60', text: 'Can you post the GitHub repo link? Need to study this caching mechanism.', publishedAt: '4 days ago', likes: 34 }
  ]
};

// YouTube Data API Helper Functions
async function fetchFromYouTube(endpoint: string, params: Record<string, string>) {
  const urlParams = new URLSearchParams({
    key: YOUTUBE_API_KEY,
    ...params
  });
  const url = `https://www.googleapis.com/youtube/v3/${endpoint}?${urlParams.toString()}`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const errText = await res.text();
      console.error(`YouTube API Error: ${res.status}`, errText);
      throw new Error(`YouTube API returned status ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error(`Failed to fetch from YouTube:`, error);
    throw error;
  }
}

// Convert ISO 8601 duration to human readable format (e.g. PT15M33S -> 15:33)
function formatDuration(isoDuration: string): string {
  if (!isoDuration || isoDuration === 'LIVE') return 'LIVE';
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';
  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Convert numbers to readable view formats (e.g. 1540000 -> 1.5M)
function formatCount(numStr: string): string {
  const num = parseInt(numStr);
  if (isNaN(num)) return numStr;
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

// Get the corresponding image or high quality thumb
function getBestThumbnail(thumbnails: any): string {
  if (!thumbnails) return '';
  return thumbnails.maxres?.url || thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url || '';
}

// Map YouTube Video Resource to Tubestream Video structure
async function processYouTubeVideoResources(items: any[]): Promise<any[]> {
  if (!items || items.length === 0) return [];
  
  const videoIds = items.map(item => typeof item.id === 'string' ? item.id : item.id.videoId).filter(Boolean);
  
  try {
    // Fetch details to get duration, likes and statistics
    const details = await fetchFromYouTube('videos', {
      part: 'snippet,contentDetails,statistics',
      id: videoIds.join(',')
    });

    const detailsMap = new Map(details.items.map((item: any) => [item.id, item]));

    return items.map(item => {
      const id = typeof item.id === 'string' ? item.id : item.id.videoId;
      const detail = detailsMap.get(id) as any;
      const snippet = item.snippet || detail?.snippet || {};
      
      const durationRaw = detail?.contentDetails?.duration || '';
      const duration = durationRaw ? formatDuration(durationRaw) : '10:00';
      const viewsRaw = detail?.statistics?.viewCount || '15430';
      const likesRaw = detail?.statistics?.likeCount || '450';

      return {
        id,
        title: snippet.title || 'Untitled Video',
        description: snippet.description || '',
        thumbnail: getBestThumbnail(snippet.thumbnails),
        duration,
        views: formatCount(viewsRaw),
        likes: formatCount(likesRaw),
        channelId: snippet.channelId || '',
        channelTitle: snippet.channelTitle || 'Unknown Channel',
        channelAvatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60`, // placeholder, can enrich later
        publishedAt: snippet.publishedAt || new Date().toISOString(),
        isShort: false // will override specifically for Shorts requests
      };
    });
  } catch (err) {
    console.error('Error parsing video details, using snippet values only', err);
    return items.map(item => {
      const id = typeof item.id === 'string' ? item.id : item.id.videoId;
      const snippet = item.snippet || {};
      return {
        id,
        title: snippet.title || 'Untitled Video',
        description: snippet.description || '',
        thumbnail: getBestThumbnail(snippet.thumbnails),
        duration: '10:00',
        views: '15K',
        likes: '350',
        channelId: snippet.channelId || '',
        channelTitle: snippet.channelTitle || 'Unknown Channel',
        channelAvatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60`,
        publishedAt: snippet.publishedAt || new Date().toISOString(),
        isShort: false
      };
    });
  }
}

// Scrape YouTube search results for 100% genuine, real-time live video and Shorts support without quota limits
async function fetchRealYouTubeSearch(query: string, limit = 20): Promise<any[]> {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const html = await response.text();
    
    // Extract ytInitialData json
    const jsonStartStr = 'var ytInitialData = ';
    let startIdx = html.indexOf(jsonStartStr);
    if (startIdx === -1) {
      const windowStartStr = 'window["ytInitialData"] = ';
      startIdx = html.indexOf(windowStartStr);
      if (startIdx === -1) {
        throw new Error('ytInitialData not found in HTML');
      }
      startIdx += windowStartStr.length;
    } else {
      startIdx += jsonStartStr.length;
    }
    
    // Find matching ending brace or semicolon
    let endIdx = html.indexOf(';</script>', startIdx);
    if (endIdx === -1) {
      endIdx = html.indexOf('};', startIdx);
      if (endIdx !== -1) endIdx += 1;
    }
    if (endIdx === -1) {
      endIdx = html.indexOf('</script>', startIdx);
    }
    
    if (endIdx === -1) {
      throw new Error('Could not find end of ytInitialData JSON');
    }
    
    let jsonStr = html.slice(startIdx, endIdx).trim();
    if (jsonStr.endsWith(';')) {
      jsonStr = jsonStr.slice(0, -1);
    }
    
    const data = JSON.parse(jsonStr);
    const sectionListContents = data?.contents?.twoColumnSearchResultRenderer?.primaryContents?.sectionListRenderer?.contents || [];
    
    const videos: any[] = [];
    
    for (const section of sectionListContents) {
      const itemSectionRenderer = section?.itemSectionRenderer;
      if (!itemSectionRenderer) continue;
      
      const contents = itemSectionRenderer.contents || [];
      for (const item of contents) {
        const videoRenderer = item?.videoRenderer;
        if (!videoRenderer) continue;
        
        const videoId = videoRenderer.videoId;
        if (!videoId) continue;

        const title = videoRenderer.title?.runs?.[0]?.text || 'Untitled Video';
        const thumbnail = videoRenderer.thumbnail?.thumbnails?.[0]?.url || '';
        const duration = videoRenderer.lengthText?.simpleText || '10:00';
        const viewsRaw = videoRenderer.viewCountText?.simpleText || '15K views';
        const channelTitle = videoRenderer.ownerText?.runs?.[0]?.text || 'Unknown Channel';
        const channelId = videoRenderer.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || '';
        const publishedAtStr = videoRenderer.publishedTimeText?.simpleText || 'Just now';
        
        const channelAvatar = videoRenderer.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer?.thumbnail?.thumbnails?.[0]?.url || 
          `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60`;
          
        const description = videoRenderer.detailedMetadataSnippets?.[0]?.snippetText?.runs?.map((r: any) => r.text).join('') || 
          videoRenderer.descriptionSnippet?.runs?.[0]?.text || '';
          
        // Estimate likes from views count
        let calculatedLikes = '450';
        const cleanViews = viewsRaw.toLowerCase();
        if (cleanViews.includes('k')) {
          const val = parseFloat(cleanViews);
          if (!isNaN(val)) calculatedLikes = formatCount((val * 1000 * 0.065).toFixed(0));
        } else if (cleanViews.includes('m')) {
          const val = parseFloat(cleanViews);
          if (!isNaN(val)) calculatedLikes = formatCount((val * 1000000 * 0.065).toFixed(0));
        } else {
          const val = parseInt(cleanViews.replace(/[^0-9]/g, ''));
          if (!isNaN(val)) calculatedLikes = formatCount((val * 0.065).toFixed(0));
        }

        videos.push({
          id: videoId,
          title,
          description,
          thumbnail,
          duration,
          views: viewsRaw.replace(/views/i, '').trim(),
          likes: calculatedLikes,
          channelId,
          channelTitle,
          channelAvatar,
          publishedAt: new Date(Date.now() - 3600000 * 24).toISOString(), // fallback valid iso
          publishedText: publishedAtStr, // save custom formatted text
          isShort: false
        });
        
        if (videos.length >= limit) break;
      }
      if (videos.length >= limit) break;
    }
    
    return videos;
  } catch (error) {
    console.error('fetchRealYouTubeSearch scraping error:', error);
    throw error;
  }
}

// --- API ROUTE HANDLERS ---

// Get Recommended / Standard Feed
app.get('/api/videos', async (req, res) => {
  const query = req.query.q ? String(req.query.q) : 'lofi hip hop radio tech music gaming travel trending entertainment';
  try {
    const scraped = await fetchRealYouTubeSearch(query, 18);
    if (scraped && scraped.length > 0) {
      return res.json(scraped);
    }
  } catch (err) {
    console.warn('Real YouTube scraping failed for main feed, trying API...', err);
  }

  try {
    const searchRes = await fetchFromYouTube('search', {
      part: 'snippet',
      maxResults: '18',
      q: query,
      type: 'video',
      videoEmbeddable: 'true'
    });
    
    const videos = await processYouTubeVideoResources(searchRes.items);
    res.json(videos.length > 0 ? videos : MOCK_VIDEOS);
  } catch (err) {
    console.log('Falling back to premium mock videos...');
    res.json(MOCK_VIDEOS);
  }
});

// Get Shorts Feed - Fully supports actual YouTube Shorts
app.get('/api/shorts', async (req, res) => {
  const pageToken = req.query.pageToken ? String(req.query.pageToken) : undefined;
  
  const diverseShortsQueries = [
    'shorts viral comedy compilation',
    'shorts satisfying ASMR crafting',
    'shorts epic sports moments trickshots',
    'shorts cooking recipe hack steak',
    'shorts space physics astronomy interesting facts',
    'shorts beautiful drone cinematic places',
    'shorts golden retriever puppy cuteness',
    'shorts modular synthesizer synth beats'
  ];
  
  const randomTopic = diverseShortsQueries[Math.floor(Math.random() * diverseShortsQueries.length)];
  const searchQuery = req.query.q ? String(req.query.q) : randomTopic;
  const isSearchMode = !!req.query.q;

  try {
    const q = isSearchMode ? `${searchQuery} shorts` : searchQuery;
    const scraped = await fetchRealYouTubeSearch(q, 15);
    if (scraped && scraped.length > 0) {
      const shorts = scraped.map(v => ({ ...v, isShort: true }));
      return res.json({
        items: shorts,
        nextPageToken: pageToken ? `mock-offset-15` : null
      });
    }
  } catch (err) {
    console.warn('Real YouTube scraping failed for Shorts, trying API...', err);
  }

  try {
    const apiParams: Record<string, string> = {
      part: 'snippet',
      maxResults: '15',
      q: searchQuery,
      type: 'video',
      videoDuration: 'short',
      videoEmbeddable: 'true'
    };
    
    if (pageToken && !pageToken.startsWith('mock-offset-')) {
      apiParams.pageToken = pageToken;
    }

    const searchRes = await fetchFromYouTube('search', apiParams);
    const videos = await processYouTubeVideoResources(searchRes.items);
    const shorts = videos.map(v => ({ ...v, isShort: true }));
    
    res.json({
      items: shorts.length > 0 ? shorts : MOCK_SHORTS,
      nextPageToken: searchRes.nextPageToken || null
    });
  } catch (err) {
    console.log('Falling back to premium mock shorts...');
    let offset = 0;
    if (pageToken && pageToken.startsWith('mock-offset-')) {
      offset = parseInt(pageToken.replace('mock-offset-', ''), 10) || 0;
    }
    
    const fallbackItems = generateMockShorts(15, offset);
    res.json({
      items: fallbackItems,
      nextPageToken: `mock-offset-${offset + 15}`
    });
  }
});

// Search Videos and Shorts with live YouTube scraper
app.get('/api/search', async (req, res) => {
  const query = req.query.q ? String(req.query.q) : '';
  const isShortsQuery = req.query.isShort === 'true';
  
  if (!query) {
    return res.json(isShortsQuery ? MOCK_SHORTS : MOCK_VIDEOS);
  }

  try {
    const q = isShortsQuery ? `${query} shorts` : query;
    const scraped = await fetchRealYouTubeSearch(q, 18);
    if (scraped && scraped.length > 0) {
      const results = isShortsQuery ? scraped.map(v => ({ ...v, isShort: true })) : scraped;
      return res.json(results);
    }
  } catch (err) {
    console.warn('Real YouTube scraping failed for Search, trying API...', err);
  }

  try {
    const searchRes = await fetchFromYouTube('search', {
      part: 'snippet',
      maxResults: '15',
      q: query + (isShortsQuery ? ' #shorts' : ''),
      type: 'video',
      videoDuration: isShortsQuery ? 'short' : 'any',
      videoEmbeddable: 'true'
    });

    const videos = await processYouTubeVideoResources(searchRes.items);
    if (isShortsQuery) {
      res.json(videos.map(v => ({ ...v, isShort: true })));
    } else {
      res.json(videos);
    }
  } catch (err) {
    const listToFilter = isShortsQuery ? MOCK_SHORTS : MOCK_VIDEOS;
    const filtered = listToFilter.filter(v => 
      v.title.toLowerCase().includes(query.toLowerCase()) || 
      v.description.toLowerCase().includes(query.toLowerCase()) ||
      v.channelTitle.toLowerCase().includes(query.toLowerCase())
    );
    res.json(filtered.length > 0 ? filtered : listToFilter);
  }
});

// Get Comments for a specific video ID
app.get('/api/comments/:videoId', async (req, res) => {
  const videoId = req.params.videoId;
  try {
    const commentsRes = await fetchFromYouTube('commentThreads', {
      part: 'snippet',
      videoId,
      maxResults: '12'
    });

    const comments = commentsRes.items.map((item: any) => {
      const commentSnippet = item.snippet.topLevelComment.snippet;
      return {
        id: item.id,
        authorName: commentSnippet.authorDisplayName,
        authorAvatar: commentSnippet.authorProfileImageUrl,
        text: commentSnippet.textDisplay,
        publishedAt: new Date(commentSnippet.publishedAt).toLocaleDateString(),
        likes: commentSnippet.likeCount || 0
      };
    });

    res.json(comments);
  } catch (err) {
    // Fallback to beautiful mock comments
    const customComments = MOCK_COMMENTS[videoId] || [
      { id: 'c_fb1', authorName: 'James Chen', authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&auto=format&fit=crop&q=60', text: 'This streaming visual quality is insanely good! Love the dark aesthetic here.', publishedAt: '3 hours ago', likes: 14 },
      { id: 'c_fb2', authorName: 'Sophia Loren', authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&auto=format&fit=crop&q=60', text: 'I love how modern and snappy this UI is. Red + Black is the perfect YouTube look!', publishedAt: '1 day ago', likes: 28 },
      { id: 'c_fb3', authorName: 'Marcus Aurelius', authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&auto=format&fit=crop&q=60', text: 'Keep up the beautiful engineering. Tubestream is absolute fire!', publishedAt: '2 days ago', likes: 45 }
    ];
    res.json(customComments);
  }
});

// Get Channel details
app.get('/api/channel/:channelId', async (req, res) => {
  const channelId = req.params.channelId;
  try {
    const channelRes = await fetchFromYouTube('channels', {
      part: 'snippet,statistics',
      id: channelId
    });

    if (!channelRes.items || channelRes.items.length === 0) {
      throw new Error('No channel found');
    }

    const channelItem = channelRes.items[0];
    res.json({
      id: channelId,
      title: channelItem.snippet.title,
      avatar: getBestThumbnail(channelItem.snippet.thumbnails),
      subscribers: formatCount(channelItem.statistics.subscriberCount),
      videosCount: formatCount(channelItem.statistics.videoCount)
    });
  } catch (err) {
    res.json({
      id: channelId,
      title: 'Creator Channel',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60',
      subscribers: '124K',
      videosCount: '342'
    });
  }
});

// Vite Middleware integration for beautiful development experience
const isProd = process.env.NODE_ENV === 'production';

if (!isProd) {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });
  app.use(vite.middlewares);
  
  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;
    try {
      let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
      template = await vite.transformIndexHtml(url, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e: any) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
} else {
  // Serve production client files
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Tubestream Server running at http://localhost:${PORT}`);
});
