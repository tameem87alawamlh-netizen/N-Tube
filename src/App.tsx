import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, 
  Flame, 
  History, 
  Clock, 
  ThumbsUp, 
  Search, 
  Share2, 
  Plus, 
  Check, 
  Play, 
  Send, 
  Tv, 
  Heart,
  ChevronUp, 
  ChevronDown, 
  MessageSquare, 
  TrendingUp, 
  X,
  Volume2,
  VolumeX,
  UserCheck,
  UserPlus,
  Loader,
  ExternalLink,
  Film
} from 'lucide-react';
import { Video, Comment, Channel, UserState } from './types';
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged, User } from './firebase';

// Initial state for standard user actions
const INITIAL_USER_STATE: UserState = {
  history: [],
  likedVideos: [],
  subscribedChannels: []
};

export default function App() {
  // Navigation / Views
  const [currentTab, setCurrentTab] = useState<'home' | 'shorts' | 'subscriptions' | 'history' | 'watchLater' | 'liked' | 'library'>('home');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [showMobileSearch, setShowMobileSearch] = useState<boolean>(false);
  
  // Data State
  const [videos, setVideos] = useState<Video[]>([]);
  const [shorts, setShorts] = useState<Video[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMoreVideos, setLoadingMoreVideos] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  
  // Firebase Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);
  
  // User Actions State
  const [userState, setUserState] = useState<UserState>(() => {
    const saved = localStorage.getItem('tubestream_user_state');
    return saved ? JSON.parse(saved) : INITIAL_USER_STATE;
  });

  // Watch Later and Custom Videos lists
  const [watchLaterList, setWatchLaterList] = useState<string[]>(() => {
    const saved = localStorage.getItem('tubestream_watch_later');
    return saved ? JSON.parse(saved) : [];
  });

  const [customVideos, setCustomVideos] = useState<Video[]>(() => {
    const saved = localStorage.getItem('tubestream_custom_videos');
    return saved ? JSON.parse(saved) : [];
  });

  // active state in Shorts theater
  const [activeShortIndex, setActiveShortIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [showShortsComments, setShowShortsComments] = useState<boolean>(false);
  const [shortsCommentInput, setShortsCommentInput] = useState<string>('');
  const [shortsComments, setShortsComments] = useState<Record<string, Comment[]>>({});
  const [shortsNextPageToken, setShortsNextPageToken] = useState<string | null>(null);
  const [loadingMoreShorts, setLoadingMoreShorts] = useState<boolean>(false);

  // Active Video comments state
  const [activeComments, setActiveComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);

  // Upload Video Modal
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [uploadUrl, setUploadUrl] = useState<string>('');
  const [uploadDescription, setUploadDescription] = useState<string>('');
  const [uploadCategory, setUploadCategory] = useState<string>('Tech');
  const [uploadChannel, setUploadChannel] = useState<string>('My Stream Space');

  // Notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Refs
  const shortsContainerRef = useRef<HTMLDivElement>(null);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('tubestream_user_state', JSON.stringify(userState));
  }, [userState]);

  useEffect(() => {
    localStorage.setItem('tubestream_watch_later', JSON.stringify(watchLaterList));
  }, [watchLaterList]);

  useEffect(() => {
    localStorage.setItem('tubestream_custom_videos', JSON.stringify(customVideos));
  }, [customVideos]);

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync upload channel with user's name
  useEffect(() => {
    if (user && user.displayName) {
      setUploadChannel(user.displayName);
    } else {
      setUploadChannel('My Stream Space');
    }
  }, [user]);

  const handleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        showToast(`Welcome back, ${result.user.displayName || 'User'}!`);
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      showToast(err.message || 'Failed to sign in. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      showToast('Signed out successfully.');
      setShowUserDropdown(false);
    } catch (err: any) {
      console.error('Sign out error:', err);
      showToast('Failed to sign out.');
    }
  };

  // Load Initial Videos & Shorts
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [videosRes, shortsRes] = await Promise.all([
          fetch('/api/videos'),
          fetch('/api/shorts')
        ]);
        
        if (videosRes.ok && shortsRes.ok) {
          const videosData = await videosRes.json();
          const shortsData = await shortsRes.json();
          setVideos(videosData);
          if (Array.isArray(shortsData)) {
            setShorts(shortsData);
          } else if (shortsData && Array.isArray(shortsData.items)) {
            setShorts(shortsData.items);
            if (shortsData.nextPageToken) {
              setShortsNextPageToken(shortsData.nextPageToken);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching dynamic videos from Tubestream Server:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Load videos when activeCategory changes
  useEffect(() => {
    if (currentTab !== 'home') return;
    
    // Skip loading the initial "All" again on mounting if we already have videos loaded
    if (activeCategory === 'All' && videos.length > 0 && searchQuery === '') return;

    const fetchCategoryVideos = async () => {
      setLoading(true);
      try {
        let url = '/api/videos';
        if (activeCategory !== 'All' && activeCategory !== 'My Streams') {
          const categoryQueries: Record<string, string> = {
            'Music': 'new music hits official music videos trending songs 2026',
            'Space': 'outer space universe star galaxy science astrophotography black hole space exploration',
            'Gaming': 'trending gaming live gameplay walkthrough streamers lets play esports playstation nintendo',
            'Sports': 'sports moments highlights match champions compilation nba football soccer trickshot',
            'Cooking': 'delicious recipes kitchen cooking hacks chef gourmet masterclass steak food pasta',
            'Coding': 'coding programming software developer web dev computer science coding tutorial',
            'Tech': 'technology gadgets unboxing setup futuristic devices reviews smart tech',
            'Synthesizers': 'modular synthesizer synth patch live performance behringer moog eurorack live jam',
            'Nature': 'beautiful nature documentary scenic landscapes wildlife animals forests ocean 4k relax',
            'Lofi': 'lofi hip hop radio study relax beats sleep instrumental calm music'
          };
          const query = categoryQueries[activeCategory] || activeCategory;
          url = `/api/videos?q=${encodeURIComponent(query)}`;
        }
        
        const res = await fetch(url);
        if (res.ok) {
          const videosData = await res.json();
          setVideos(videosData);
        }
      } catch (err) {
        console.error('Error fetching category videos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryVideos();
  }, [activeCategory, currentTab]);

  // Load More Videos from actual YouTube Search endpoint to support infinite browse
  const loadMoreVideos = async () => {
    if (loadingMoreVideos) return;
    setLoadingMoreVideos(true);
    try {
      let query = 'trending entertainment dynamic youtube videos content creators';
      if (activeCategory !== 'All' && activeCategory !== 'My Streams') {
        const categoryQueries: Record<string, string> = {
          'Music': 'popular music hits playlist new songs live performance concert 2026',
          'Space': 'nasa space station telescopes cosmology space exploration astrophotography mars galaxy',
          'Gaming': 'funny gaming moments glitches speedruns lets play commentary video games guides',
          'Sports': 'classic sports plays legendary moments highlights athletes match clips',
          'Cooking': 'easy recipes food test quick meals tasty cooking techniques restaurant style recipes',
          'Coding': 'learn coding in 10 minutes software engineering computer science system design build projects',
          'Tech': 'cool tech gadgets high tech setup components smart devices future ideas tech reviews',
          'Synthesizers': 'modular synth patching live jam eurorack electronic music hardware synths moog',
          'Nature': 'nature documentary animals wild life deep sea exploration green landscapes 4k relax vlogs',
          'Lofi': 'chill lofi beats study beats sleep beats instrumental calm music playlist'
        };
        query = categoryQueries[activeCategory] || activeCategory;
      } else if (searchQuery) {
        query = searchQuery;
      }
      
      const variations = ['vlogs', 'highlights', 'review', 'best', 'clips', 'live', 'trending', 'popular', 'new'];
      const randomVar = variations[Math.floor(Math.random() * variations.length)];
      
      const res = await fetch(`/api/search?q=${encodeURIComponent(query + ' ' + randomVar)}`);
      if (res.ok) {
        const moreVideos = await res.json();
        if (Array.isArray(moreVideos) && moreVideos.length > 0) {
          setVideos(prev => {
            const existingIds = new Set(prev.map(v => v.id));
            const uniqueNew = moreVideos.filter(v => !existingIds.has(v.id));
            return [...prev, ...uniqueNew];
          });
          showToast(`Retrieved ${moreVideos.length} additional videos!`);
        } else {
          showToast('No extra videos found right now.');
        }
      }
    } catch (err) {
      console.error('Failed to load more videos:', err);
    } finally {
      setLoadingMoreVideos(false);
    }
  };

  // Fetch more Shorts to support unlimited/infinite scrolling
  const loadMoreShorts = async () => {
    if (loadingMoreShorts) return;
    setLoadingMoreShorts(true);
    try {
      const url = `/api/shorts?pageToken=${shortsNextPageToken || ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        let newItems: Video[] = [];
        if (Array.isArray(data)) {
          newItems = data;
        } else if (data && Array.isArray(data.items)) {
          newItems = data.items;
          setShortsNextPageToken(data.nextPageToken || null);
        }
        
        if (newItems.length > 0) {
          setShorts(prev => {
            const existingIds = new Set(prev.map(item => item.id));
            const uniqueNewItems = newItems.filter(item => !existingIds.has(item.id));
            return [...prev, ...uniqueNewItems];
          });
        }
      }
    } catch (err) {
      console.error('Failed to load more shorts:', err);
    } finally {
      setLoadingMoreShorts(false);
    }
  };

  // Show dynamic toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Run Search
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&isShort=${currentTab === 'shorts'}`);
      if (res.ok) {
        const searchResults = await res.json();
        if (currentTab === 'shorts') {
          setShorts(searchResults);
          setActiveShortIndex(0);
        } else {
          setVideos(searchResults);
          setCurrentTab('home'); // Switch back to Home tab to show search results
          setSelectedVideo(null); // Close active video player to reveal grid
        }
      }
    } catch (err) {
      console.error('Search request failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Parse YouTube video ID from normal share link or raw input
  const extractVideoId = (urlOrId: string): string => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = urlOrId.match(regExp);
    return (match && match[2].length === 11) ? match[2] : urlOrId.trim();
  };

  // Add Custom Video (Upload Mock)
  const handleUploadVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle || !uploadUrl) {
      showToast('Please provide a Title and a YouTube Link/ID');
      return;
    }

    const videoId = extractVideoId(uploadUrl);
    if (!videoId || videoId.length !== 11) {
      showToast('Could not extract a valid 11-character YouTube video ID. Check the link!');
      return;
    }

    const isShortFormat = uploadCategory === 'Shorts' || uploadTitle.toLowerCase().includes('#shorts');

    const newVideo: Video = {
      id: videoId,
      title: uploadTitle,
      description: uploadDescription || 'User-uploaded stream on Tubestream.',
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` || `https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&auto=format&fit=crop&q=60`,
      duration: isShortFormat ? '0:50' : '12:00',
      views: '1',
      likes: '1',
      channelId: 'my_custom_channel',
      channelTitle: uploadChannel || 'My Creator Studio',
      channelAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60',
      publishedAt: new Date().toISOString(),
      isShort: isShortFormat
    };

    if (isShortFormat) {
      setCustomVideos(prev => [newVideo, ...prev]);
      setShorts(prev => [newVideo, ...prev]);
      setCurrentTab('shorts');
      setActiveShortIndex(0);
    } else {
      setCustomVideos(prev => [newVideo, ...prev]);
      setVideos(prev => [newVideo, ...prev]);
      setCurrentTab('home');
    }

    setIsUploadOpen(false);
    setUploadTitle('');
    setUploadUrl('');
    setUploadDescription('');
    showToast(`Successfully added "${newVideo.title}"!`);
  };

  // Handle playing video (opens theater mode)
  const playVideo = async (video: Video) => {
    setSelectedVideo(video);
    
    // Add to history
    if (!userState.history.includes(video.id)) {
      setUserState(prev => ({
        ...prev,
        history: [video.id, ...prev.history].slice(0, 50) // limit to 50
      }));
    }

    // Load comments
    try {
      const res = await fetch(`/api/comments/${video.id}`);
      if (res.ok) {
        const commentsData = await res.json();
        setActiveComments(commentsData);
      }
    } catch (err) {
      console.error('Failed to load video comments:', err);
    }
  };

  // Active video Comments adding logic
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedVideo) return;

    setSubmittingComment(true);

    const newComment: Comment = {
      id: `u-c-${Date.now()}`,
      authorName: user ? (user.displayName || user.email || 'Authenticated User') : 'Me (Tubestreamer)',
      authorAvatar: user?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60',
      text: newCommentText,
      publishedAt: 'Just now',
      likes: 0
    };

    setTimeout(() => {
      setActiveComments(prev => [newComment, ...prev]);
      setNewCommentText('');
      setSubmittingComment(false);
      showToast('Comment posted successfully!');
    }, 300);
  };

  // Add Comment for Shorts
  const handleAddShortComment = (e: React.FormEvent, shortId: string) => {
    e.preventDefault();
    if (!shortsCommentInput.trim()) return;

    const newComment: Comment = {
      id: `s-c-${Date.now()}`,
      authorName: user ? (user.displayName || user.email || 'Authenticated User') : 'Me (Tubestreamer)',
      authorAvatar: user?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60',
      text: shortsCommentInput,
      publishedAt: 'Just now',
      likes: 0
    };

    const currentShortComments = shortsComments[shortId] || [
      { id: 'sc1', authorName: 'James Chen', authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&auto=format&fit=crop&q=60', text: 'This vertical visual format looks stunning on here!', publishedAt: '2 hours ago', likes: 12 },
      { id: 'sc2', authorName: 'Sophia Loren', authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&auto=format&fit=crop&q=60', text: 'Haha loved the transition ⚡️', publishedAt: '4 hours ago', likes: 9 }
    ];

    setShortsComments(prev => ({
      ...prev,
      [shortId]: [newComment, ...currentShortComments]
    }));
    setShortsCommentInput('');
    showToast('Posted comment on Short!');
  };

  // Toggle Like Status
  const toggleLike = (videoId: string) => {
    const isLiked = userState.likedVideos.includes(videoId);
    setUserState(prev => {
      const liked = [...prev.likedVideos];
      if (isLiked) {
        return { ...prev, likedVideos: liked.filter(id => id !== videoId) };
      } else {
        return { ...prev, likedVideos: [...liked, videoId] };
      }
    });
    showToast(isLiked ? 'Removed from Liked Videos' : 'Added to Liked Videos!');
  };

  // Toggle Watch Later
  const toggleWatchLater = (videoId: string) => {
    const isSaved = watchLaterList.includes(videoId);
    if (isSaved) {
      setWatchLaterList(prev => prev.filter(id => id !== videoId));
      showToast('Removed from Watch Later');
    } else {
      setWatchLaterList(prev => [...prev, videoId]);
      showToast('Saved to Watch Later!');
    }
  };

  // Toggle Subscribe Status
  const toggleSubscribe = (channelId: string, channelName: string) => {
    const isSubbed = userState.subscribedChannels.includes(channelId);
    setUserState(prev => {
      const subs = [...prev.subscribedChannels];
      if (isSubbed) {
        return { ...prev, subscribedChannels: subs.filter(id => id !== channelId) };
      } else {
        return { ...prev, subscribedChannels: [...subs, channelId] };
      }
    });
    showToast(isSubbed ? `Unsubscribed from ${channelName}` : `Subscribed to ${channelName}!`);
  };

  // Share action (copies custom developer sandbox link/id or standard YouTube link)
  const shareVideo = (videoId: string) => {
    const shareUrl = `https://www.youtube.com/watch?v=${videoId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast('YouTube video link copied to clipboard!');
    }).catch(() => {
      showToast('Failed to copy. Video ID is: ' + videoId);
    });
  };

  // Categories helper filter
  const filterCategories = ['All', 'Music', 'Space', 'Gaming', 'Sports', 'Cooking', 'Coding', 'Tech', 'Synthesizers', 'Nature', 'Lofi', 'My Streams'];

  const filteredVideos = videos.filter(video => {
    if (activeCategory === 'All') return true;
    if (activeCategory === 'My Streams') return video.channelId === 'my_custom_channel';
    if (activeCategory === 'Coding') return video.title.toLowerCase().match(/(code|programming|web|react|dev|api)/);
    if (activeCategory === 'Music') return video.title.toLowerCase().match(/(music|beats|lofi|radio|song|rap|synth)/);
    if (activeCategory === 'Tech') return video.title.toLowerCase().match(/(tech|setup|chrome|pc|unboxing|gadget|ai)/);
    if (activeCategory === 'Synthesizers') return video.title.toLowerCase().match(/(synth|synthesizer|modular|eurorack|behringer)/);
    if (activeCategory === 'Nature') return video.title.toLowerCase().match(/(nature|scenic|escape|norway|earth)/);
    if (activeCategory === 'Lofi') return video.title.toLowerCase().match(/(lofi|relax|chill|study)/);
    if (activeCategory === 'Space') return video.title.toLowerCase().match(/(space|universe|star|orbit|physics|black hole|astronomy)/);
    if (activeCategory === 'Gaming') return video.title.toLowerCase().match(/(gaming|game|clutch|speedrun|streamer|play)/);
    if (activeCategory === 'Sports') return video.title.toLowerCase().match(/(sport|basket|football|soccer|kick|trickshot|clutch)/);
    if (activeCategory === 'Cooking') return video.title.toLowerCase().match(/(cooking|cook|recipe|chef|steak|food|garlic|pasta)/);
    return true;
  });

  // Load appropriate lists for personal views
  const watchedVideos = videos.filter(v => userState.history.includes(v.id));
  const likedVideosList = videos.filter(v => userState.likedVideos.includes(v.id));
  const watchLaterVideos = videos.filter(v => watchLaterList.includes(v.id));
  
  // Subscriptions filter
  const subscribedVideos = videos.filter(v => userState.subscribedChannels.includes(v.channelId));

  // Current list based on active personal tab
  const getPersonalVideos = () => {
    switch (currentTab) {
      case 'history': return watchedVideos;
      case 'liked': return likedVideosList;
      case 'watchLater': return watchLaterVideos;
      case 'subscriptions': return subscribedVideos;
      default: return filteredVideos;
    }
  };

  const currentDisplayVideos = getPersonalVideos();

  // Next / Previous Short Actions
  const handleNextShort = () => {
    if (activeShortIndex < shorts.length - 1) {
      setActiveShortIndex(prev => prev + 1);
      setShowShortsComments(false);
      
      // If we are getting close to the end of currently loaded shorts, prefetch the next batch
      if (activeShortIndex >= shorts.length - 3) {
        loadMoreShorts();
      }
    } else {
      // Reached the absolute end of local array, trigger immediate loading and transition
      showToast("Tuning into fresh streams...");
      loadMoreShorts().then(() => {
        setActiveShortIndex(prev => prev + 1);
        setShowShortsComments(false);
      });
    }
  };

  const handlePrevShort = () => {
    if (activeShortIndex > 0) {
      setActiveShortIndex(prev => prev - 1);
      setShowShortsComments(false);
    }
  };

  const activeShort = shorts[activeShortIndex];

  return (
    <div className="w-full min-h-screen bg-[#050505] text-[#F5F5F5] font-sans flex flex-col overflow-x-hidden antialiased selection:bg-red-600 selection:text-white">
      
      {/* Toast Notification Bar */}
      {toastMessage && (
        <div id="toast-notify" className="fixed top-20 right-6 z-50 bg-[#121212] border-l-4 border-red-600 text-white px-5 py-3 rounded-md shadow-2xl flex items-center gap-3 transition-all duration-300 transform translate-y-0 red-glow-shadow">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-ping"></div>
          <p className="text-sm font-semibold">{toastMessage}</p>
        </div>
      )}

      {/* Top Header Navigation Bar */}
      <nav id="top-navbar" className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-white/5 bg-[#0A0A0A]/95 backdrop-blur-md sticky top-0 z-40 shrink-0">
        {showMobileSearch ? (
          <form onSubmit={(e) => { handleSearch(e); setShowMobileSearch(false); }} className="flex items-center gap-3 w-full animate-in fade-in slide-in-from-top-1 duration-150">
            <button 
              type="button" 
              onClick={() => { setShowMobileSearch(false); setSearchQuery(''); }}
              className="text-white/60 hover:text-white p-2 bg-white/5 hover:bg-white/10 rounded-full"
            >
              <X size={16} />
            </button>
            <div className="relative flex-1">
              <input 
                type="text" 
                autoFocus
                placeholder={currentTab === 'shorts' ? "Search Shorts stream..." : "Search premium videos..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 text-white placeholder-white/40"
              />
              {searchQuery && (
                <button 
                  type="button" 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-white/40 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button 
              type="submit" 
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all"
            >
              Go
            </button>
          </form>
        ) : (
          <>
            <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-start">
              <div 
                className="flex items-center gap-2 cursor-pointer group" 
                onClick={() => { setSelectedVideo(null); setCurrentTab('home'); }}
              >
                <div className="w-8 h-8 md:w-9 md:h-9 bg-red-600 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:bg-red-700 red-glow-shadow shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white" className="md:w-[22px] md:h-[22px]">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
                <span className="text-xl md:text-2xl font-black tracking-tighter text-white uppercase flex items-center">
                  N-<span className="text-red-600 transition-colors duration-300 group-hover:text-red-500">TUBE</span>
                </span>
              </div>

              {/* Search bar inside navigation (PC only) */}
              <form onSubmit={handleSearch} className="hidden md:flex relative w-96 ml-6">
                <input 
                  type="text" 
                  placeholder={currentTab === 'shorts' ? "Search the Shorts stream..." : "Search premium videos..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#141414] border border-white/10 rounded-full py-2 pl-11 pr-4 text-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all text-white placeholder-white/40"
                />
                <button type="submit" className="absolute left-3 top-2.5 text-white/40 hover:text-red-500 transition-colors">
                  <Search size={16} />
                </button>
                {searchQuery && (
                  <button 
                    type="button" 
                    onClick={() => { setSearchQuery(''); fetch('/api/videos').then(res => res.json()).then(data => setVideos(data)); }}
                    className="absolute right-3 top-2.5 text-white/40 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                )}
              </form>
            </div>

            {/* Action controls */}
            <div className="flex items-center gap-3 md:gap-4">
              {/* Mobile Search Icon Button */}
              <button 
                onClick={() => setShowMobileSearch(true)}
                className="flex md:hidden items-center justify-center w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:border-white/20 text-white"
              >
                <Search size={15} />
              </button>

              <button 
                id="btn-upload-trigger"
                onClick={() => setIsUploadOpen(true)}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider px-3.5 py-2 md:px-4 md:py-2.5 rounded-full transition-all duration-300 red-glow-shadow"
              >
                <Plus size={14} />
                <span className="hidden sm:inline">Add Stream</span>
              </button>

              {/* User Sign In / Profile dropdown */}
              <div className="relative">
                {authLoading ? (
                  <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <Loader size={12} className="animate-spin text-white/50" />
                  </div>
                ) : user ? (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setShowUserDropdown(!showUserDropdown)}
                      className="w-8 h-8 md:w-9 md:h-9 rounded-full overflow-hidden border border-red-600 hover:border-red-500 transition-all focus:outline-none cursor-pointer flex items-center justify-center"
                      title={user.displayName || user.email || 'User Account'}
                    >
                      {user.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt={user.displayName || 'Profile'} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center text-xs font-black text-white select-none">
                          {user.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'US'}
                        </div>
                      )}
                    </button>

                    {showUserDropdown && (
                      <div className="absolute right-0 mt-12 w-64 rounded-xl bg-[#0F0F0F] border border-white/10 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="px-4 py-3 border-b border-white/5">
                          <p className="text-sm font-bold text-white truncate">{user.displayName || 'Anonymous User'}</p>
                          <p className="text-xs text-white/60 truncate">{user.email}</p>
                        </div>
                        
                        <div className="py-1">
                          <button 
                            onClick={() => { setCurrentTab('library'); setSelectedVideo(null); setShowUserDropdown(false); }}
                            className="w-full text-left px-4 py-2 text-xs hover:bg-white/5 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                          >
                            <Film size={14} />
                            Library Dashboard
                          </button>
                          <button 
                            onClick={() => { setCurrentTab('liked'); setSelectedVideo(null); setShowUserDropdown(false); }}
                            className="w-full text-left px-4 py-2 text-xs hover:bg-white/5 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                          >
                            <ThumbsUp size={14} />
                            Liked Videos ({userState.likedVideos.length})
                          </button>
                          <button 
                            onClick={() => { setCurrentTab('history'); setSelectedVideo(null); setShowUserDropdown(false); }}
                            className="w-full text-left px-4 py-2 text-xs hover:bg-white/5 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                          >
                            <History size={14} />
                            Watch History ({watchedVideos.length})
                          </button>
                        </div>

                        <div className="border-t border-white/5 pt-1">
                          <button 
                            onClick={handleSignOut}
                            className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-500/10 flex items-center gap-2 font-semibold transition-colors"
                          >
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button 
                    onClick={handleSignIn}
                    className="flex items-center gap-1.5 bg-white hover:bg-white/90 text-black font-bold text-[10px] md:text-xs uppercase tracking-wider px-3 py-2 md:px-4 md:py-2.5 rounded-full transition-all duration-300 shadow-md hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <UserCheck size={12} />
                    <span>Sign In</span>
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </nav>

      {/* Main Grid: Sidebar + Workspace */}
      <div className="flex flex-1 relative">
        
        {/* Left Side Navigation Menu (PC Only) */}
        <aside id="sidebar-nav" className="hidden md:flex w-60 bg-[#080808] border-r border-white/5 p-4 flex-col gap-6 shrink-0 z-30 min-h-[calc(100vh-4rem)]">
          
          {/* Section: Feeds */}
          <div className="space-y-1">
            <div className="hidden md:block text-[10px] uppercase font-bold text-white/30 px-3 tracking-widest mb-2">Streams</div>
            
            <button 
              onClick={() => { setSelectedVideo(null); setCurrentTab('home'); }}
              className={`w-full flex items-center justify-center md:justify-start gap-4 px-3 py-3 rounded-lg transition-all duration-200 ${
                currentTab === 'home' && !selectedVideo
                  ? 'bg-red-600/10 text-red-500 border-l-2 border-red-600 font-bold' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Home size={18} className={currentTab === 'home' && !selectedVideo ? 'text-red-500' : ''} />
              <span className="text-sm font-medium hidden md:inline">Browse Home</span>
            </button>

            <button 
              onClick={() => { setSelectedVideo(null); setCurrentTab('shorts'); }}
              className={`w-full flex items-center justify-center md:justify-start gap-4 px-3 py-3 rounded-lg transition-all duration-200 ${
                currentTab === 'shorts' && !selectedVideo
                  ? 'bg-red-600/10 text-red-500 border-l-2 border-red-600 font-bold' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Flame size={18} className={currentTab === 'shorts' && !selectedVideo ? 'text-red-500' : ''} />
              <span className="text-sm font-medium hidden md:inline">Sleek Shorts</span>
            </button>

            <button 
              onClick={() => { setSelectedVideo(null); setCurrentTab('subscriptions'); }}
              className={`w-full flex items-center justify-center md:justify-start gap-4 px-3 py-3 rounded-lg transition-all duration-200 ${
                currentTab === 'subscriptions' && !selectedVideo
                  ? 'bg-red-600/10 text-red-500 border-l-2 border-red-600 font-bold' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Tv size={18} className={currentTab === 'subscriptions' && !selectedVideo ? 'text-red-500' : ''} />
              <span className="text-sm font-medium hidden md:inline">Subscriptions</span>
            </button>
          </div>

          <hr className="border-white/5" />

          {/* Section: Custom Library */}
          <div className="space-y-1">
            <div className="hidden md:block text-[10px] uppercase font-bold text-white/30 px-3 tracking-widest mb-2">My Library</div>
            
            <button 
              onClick={() => { setSelectedVideo(null); setCurrentTab('history'); }}
              className={`w-full flex items-center justify-center md:justify-start gap-4 px-3 py-3 rounded-lg transition-all duration-200 ${
                currentTab === 'history' 
                  ? 'bg-red-600/10 text-red-500 border-l-2 border-red-600 font-bold' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <History size={18} />
              <span className="text-sm font-medium hidden md:inline">Watch History</span>
              {watchedVideos.length > 0 && (
                <span className="ml-auto bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full hidden md:inline">
                  {watchedVideos.length}
                </span>
              )}
            </button>

            <button 
              onClick={() => { setSelectedVideo(null); setCurrentTab('watchLater'); }}
              className={`w-full flex items-center justify-center md:justify-start gap-4 px-3 py-3 rounded-lg transition-all duration-200 ${
                currentTab === 'watchLater' 
                  ? 'bg-red-600/10 text-red-500 border-l-2 border-red-600 font-bold' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Clock size={18} />
              <span className="text-sm font-medium hidden md:inline">Watch Later</span>
              {watchLaterList.length > 0 && (
                <span className="ml-auto bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full hidden md:inline">
                  {watchLaterList.length}
                </span>
              )}
            </button>

            <button 
              onClick={() => { setSelectedVideo(null); setCurrentTab('liked'); }}
              className={`w-full flex items-center justify-center md:justify-start gap-4 px-3 py-3 rounded-lg transition-all duration-200 ${
                currentTab === 'liked' 
                  ? 'bg-red-600/10 text-red-500 border-l-2 border-red-600 font-bold' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <ThumbsUp size={18} />
              <span className="text-sm font-medium hidden md:inline">Liked Videos</span>
            </button>
          </div>

          {/* Creator channel info on desktop */}
          <div className="mt-auto hidden md:block bg-[#111111]/80 border border-white/5 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[11px] uppercase font-bold text-white/40 tracking-wider">Live Sandbox</span>
            </div>
            <p className="text-xs text-white/70 leading-relaxed font-medium">
              Connected to Tubestream core streaming microservice.
            </p>
          </div>

        </aside>

        {/* Main Content Area Container */}
        <main className="flex-1 bg-[#050505] p-3 pb-24 md:p-8 overflow-y-auto">
          
          {/* -------------------- VIEW 1: THEATER PLAYER (Selected video is active) -------------------- */}
          {selectedVideo ? (
            <div id="video-theater-layout" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Video Embed & Details */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Back button */}
                <button 
                  onClick={() => setSelectedVideo(null)}
                  className="flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full transition-all w-fit"
                >
                  <X size={15} />
                  Back to {currentTab === 'shorts' ? 'Shorts' : 'Browse'}
                </button>

                {/* Video Player Frame */}
                <div className="aspect-video w-full bg-[#0a0a0a] rounded-2xl border border-white/5 overflow-hidden shadow-2xl relative group">
                  <iframe
                    title={selectedVideo.title}
                    src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1&modestbranding=1&rel=0`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>

                {/* Video Meta Info */}
                <div className="space-y-4 bg-[#0a0a0a] p-6 rounded-2xl border border-white/5">
                  <h1 className="text-xl md:text-2xl font-black tracking-tight text-white leading-snug">
                    {selectedVideo.title}
                  </h1>

                  {/* Info stats and like/share action tray */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-b border-white/5 pb-4">
                    <div className="text-sm text-white/50">
                      {selectedVideo.views} views • {selectedVideo.publishedAt ? new Date(selectedVideo.publishedAt).toLocaleDateString() : 'Recently streamed'}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Like button */}
                      <button 
                        onClick={() => toggleLike(selectedVideo.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                          userState.likedVideos.includes(selectedVideo.id)
                            ? 'bg-red-600 text-white shadow-lg red-glow-shadow'
                            : 'bg-white/5 hover:bg-white/10 text-white'
                        }`}
                      >
                        <ThumbsUp size={14} />
                        {userState.likedVideos.includes(selectedVideo.id) ? 'Liked' : 'Like'}
                      </button>

                      {/* Watch Later button */}
                      <button 
                        onClick={() => toggleWatchLater(selectedVideo.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                          watchLaterList.includes(selectedVideo.id)
                            ? 'bg-white text-black font-extrabold'
                            : 'bg-white/5 hover:bg-white/10 text-white'
                        }`}
                      >
                        <Clock size={14} />
                        {watchLaterList.includes(selectedVideo.id) ? 'Saved' : 'Later'}
                      </button>

                      {/* Share button */}
                      <button 
                        onClick={() => shareVideo(selectedVideo.id)}
                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all"
                      >
                        <Share2 size={14} />
                        Share
                      </button>
                    </div>
                  </div>

                  {/* Channel info block */}
                  <div className="flex items-center justify-between gap-4 pt-2">
                    <div className="flex items-center gap-4">
                      <img 
                        src={selectedVideo.channelAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60'} 
                        alt={selectedVideo.channelTitle} 
                        className="w-12 h-12 rounded-full object-cover border border-white/10 shrink-0"
                      />
                      <div>
                        <h4 className="text-base font-bold text-white flex items-center gap-1.5">
                          {selectedVideo.channelTitle}
                          <span className="w-3.5 h-3.5 bg-red-600 rounded-full flex items-center justify-center text-[8px] text-white">✓</span>
                        </h4>
                        <p className="text-xs text-white/50">124K subscribers</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => toggleSubscribe(selectedVideo.channelId, selectedVideo.channelTitle)}
                      className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                        userState.subscribedChannels.includes(selectedVideo.channelId)
                          ? 'bg-white/10 text-white/70 border border-white/10'
                          : 'bg-red-600 hover:bg-red-700 text-white red-glow-shadow'
                      }`}
                    >
                      {userState.subscribedChannels.includes(selectedVideo.channelId) ? 'Subscribed' : 'Subscribe'}
                    </button>
                  </div>

                  {/* Video Description collapsible */}
                  <div className="bg-white/5 p-4 rounded-xl text-sm leading-relaxed text-white/80 border border-white/5 mt-4">
                    <p className="font-semibold text-white text-xs uppercase tracking-wider mb-2">Description</p>
                    <p className="whitespace-pre-wrap text-xs md:text-sm">{selectedVideo.description || 'No description provided.'}</p>
                  </div>
                </div>

                {/* Comments Section */}
                <div id="video-comments-panel" className="bg-[#0a0a0a] p-6 rounded-2xl border border-white/5 space-y-6">
                  <h3 className="text-lg font-black tracking-tight uppercase text-white flex items-center gap-2">
                    <MessageSquare size={18} className="text-red-600" />
                    Viewer Discussion ({activeComments.length})
                  </h3>

                  {/* Custom comment input */}
                  <form onSubmit={handleAddComment} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      ME
                    </div>
                    <div className="flex-1 space-y-2">
                      <textarea
                        rows={2}
                        placeholder="Join the stream discussion..."
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-600 transition-colors text-white placeholder-white/30"
                      ></textarea>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={submittingComment || !newCommentText.trim()}
                          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider px-5 py-2 rounded-full transition-all"
                        >
                          {submittingComment ? <Loader size={12} className="animate-spin" /> : <Send size={12} />}
                          Post
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Comment List */}
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {activeComments.length > 0 ? (
                      activeComments.map((comment) => (
                        <div key={comment.id} className="flex gap-3 text-sm border-b border-white/5 pb-4 last:border-none">
                          <img 
                            src={comment.authorAvatar} 
                            alt={comment.authorName} 
                            className="w-9 h-9 rounded-full object-cover shrink-0"
                          />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-xs">{comment.authorName}</span>
                              <span className="text-[10px] text-white/40">{comment.publishedAt}</span>
                            </div>
                            <p className="text-white/80 text-xs md:text-sm">{comment.text}</p>
                            <div className="flex items-center gap-2 text-white/40 pt-1">
                              <button className="hover:text-red-500 transition-colors">
                                <ThumbsUp size={11} />
                              </button>
                              <span className="text-[10px]">{comment.likes}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-white/40">
                        <p className="text-xs">No comments yet. Start the conversation!</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Right Column: Up Next / Sidebar Recommended */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-5 bg-red-600 rounded-full"></div>
                  <h2 className="text-base font-black tracking-wider uppercase text-white">Recommended Next</h2>
                </div>

                <div className="space-y-4">
                  {videos
                    .filter(v => v.id !== selectedVideo.id)
                    .slice(0, 8)
                    .map((video) => (
                      <div 
                        key={video.id}
                        onClick={() => playVideo(video)}
                        className="flex gap-3 bg-[#0a0a0a] hover:bg-[#121212] p-2.5 rounded-xl border border-white/5 hover:border-red-600/30 transition-all cursor-pointer group"
                      >
                        <div className="w-32 aspect-video bg-black rounded-lg overflow-hidden shrink-0 relative">
                          <img 
                            src={video.thumbnail} 
                            alt={video.title} 
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <span className="absolute bottom-1 right-1 bg-black/80 text-[9px] font-bold px-1 rounded text-white">
                            {video.duration}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight group-hover:text-red-500 transition-colors">
                            {video.title}
                          </h4>
                          <div className="text-[10px] text-white/50 mt-1">
                            <p className="truncate font-semibold">{video.channelTitle}</p>
                            <p>{video.views} views</p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

            </div>
          ) : (
            <>
              {/* -------------------- VIEW 2: DEDICATED SHORTS THEATER (Vertical Immersion) -------------------- */}
              {currentTab === 'shorts' ? (
                <div id="shorts-theater-workspace" className="max-w-md mx-auto flex flex-col items-center">
                  
                  {/* Top Shorts Header */}
                  <div className="text-center mb-6 space-y-1">
                    <span className="inline-flex items-center gap-1 bg-red-600/20 text-red-500 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                      <Flame size={10} /> Active Shorts Loop
                    </span>
                    <h2 className="text-xl font-black tracking-tight text-white uppercase">Tubestream Shorts</h2>
                    <p className="text-xs text-white/40">Scroll or press arrows to slide through trending short streams</p>
                  </div>

                  {shorts.length > 0 ? (
                    <div className="w-full flex items-stretch gap-4 relative">
                      
                      {/* Navigation buttons sidebar (Left) */}
                      <div className="flex flex-col justify-center gap-4 shrink-0">
                        <button 
                          onClick={handlePrevShort}
                          disabled={activeShortIndex === 0}
                          className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-20 flex items-center justify-center transition-all text-white"
                        >
                          <ChevronUp size={20} />
                        </button>
                        <div className="text-center text-xs font-bold text-white/50">
                          {activeShortIndex + 1}/{shorts.length}
                        </div>
                        <button 
                          onClick={handleNextShort}
                          className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all text-white"
                        >
                          <ChevronDown size={20} />
                        </button>
                      </div>

                      {/* Main Vertical Short Card Area */}
                      <div 
                        ref={shortsContainerRef}
                        className="flex-1 aspect-[9/16] max-w-[340px] bg-gradient-to-b from-[#181818] to-black rounded-3xl border border-white/10 overflow-hidden relative group shadow-2xl flex flex-col justify-between"
                      >
                        {/* Dynamic Background Image overlay for premium feel */}
                        <div className="absolute inset-0 bg-cover bg-center opacity-10 filter blur-xl" style={{ backgroundImage: `url(${activeShort.thumbnail})` }}></div>

                        {/* YouTube Embed Player configured for vertical look */}
                        <div className="absolute inset-0 z-0">
                          <iframe
                            title={activeShort.title}
                            src={`https://www.youtube.com/embed/${activeShort.id.slice(0, 11)}?autoplay=1&mute=${isMuted ? 1 : 0}&loop=1&playlist=${activeShort.id.slice(0, 11)}&controls=0&modestbranding=1&rel=0`}
                            className="w-full h-full object-cover scale-[1.3]"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        </div>

                        {/* Top dark shade and Mute Toggle Overlay */}
                        <div className="w-full p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center z-10">
                          <span className="bg-red-600 text-[9px] font-black tracking-widest px-2 py-0.5 rounded-full text-white uppercase shadow-lg">LIVE SHORTS</span>
                          <button 
                            onClick={() => setIsMuted(!isMuted)}
                            className="p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white transition-all"
                          >
                            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                          </button>
                        </div>

                        {/* Bottom overlay: Title, Channel name & action overlays */}
                        <div className="w-full p-4 bg-gradient-to-t from-black/95 via-black/80 to-transparent space-y-3 z-10">
                          
                          {/* Channel name & Subscription toggle */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <img 
                                src={activeShort.channelAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60'} 
                                alt={activeShort.channelTitle} 
                                className="w-8 h-8 rounded-full border border-white/20 object-cover shrink-0"
                              />
                              <div>
                                <h4 className="text-xs font-black text-white truncate max-w-[120px]">{activeShort.channelTitle}</h4>
                                <p className="text-[9px] text-white/50">{activeShort.views} views</p>
                              </div>
                            </div>

                            <button 
                              onClick={() => toggleSubscribe(activeShort.channelId, activeShort.channelTitle)}
                              className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full transition-all ${
                                userState.subscribedChannels.includes(activeShort.channelId)
                                  ? 'bg-white/10 text-white/60'
                                  : 'bg-red-600 hover:bg-red-700 text-white'
                              }`}
                            >
                              {userState.subscribedChannels.includes(activeShort.channelId) ? 'Subbed' : 'Subscribe'}
                            </button>
                          </div>

                          {/* Short title */}
                          <p className="text-xs font-bold leading-snug text-white line-clamp-2">
                            {activeShort.title}
                          </p>

                          {/* Interactive action icons overlay */}
                          <div className="flex justify-around items-center pt-2 border-t border-white/5">
                            {/* Like Action */}
                            <button 
                              onClick={() => toggleLike(activeShort.id)}
                              className="flex flex-col items-center gap-1 hover:text-red-500 transition-colors text-white"
                            >
                              <ThumbsUp size={16} className={userState.likedVideos.includes(activeShort.id) ? 'text-red-500 fill-red-500' : ''} />
                              <span className="text-[9px] font-bold">{userState.likedVideos.includes(activeShort.id) ? 'Liked' : 'Like'}</span>
                            </button>

                            {/* Watch Later */}
                            <button 
                              onClick={() => toggleWatchLater(activeShort.id)}
                              className="flex flex-col items-center gap-1 hover:text-red-500 transition-colors text-white"
                            >
                              <Clock size={16} className={watchLaterList.includes(activeShort.id) ? 'text-red-500' : ''} />
                              <span className="text-[9px] font-bold">Later</span>
                            </button>

                            {/* Comment drawer toggle */}
                            <button 
                              onClick={() => setShowShortsComments(!showShortsComments)}
                              className="flex flex-col items-center gap-1 hover:text-red-500 transition-colors text-white"
                            >
                              <MessageSquare size={16} className={showShortsComments ? 'text-red-500' : ''} />
                              <span className="text-[9px] font-bold">Comments</span>
                            </button>

                            {/* External YouTube link */}
                            <button 
                              onClick={() => shareVideo(activeShort.id)}
                              className="flex flex-col items-center gap-1 hover:text-red-500 transition-colors text-white"
                            >
                              <Share2 size={16} />
                              <span className="text-[9px] font-bold">Share</span>
                            </button>
                          </div>

                        </div>

                      </div>

                      {/* Floating comment drawer (Right side of active short) */}
                      {showShortsComments && (
                        <div className="w-[220px] bg-[#0a0a0a] border border-white/10 rounded-2xl p-3 flex flex-col justify-between z-20 shadow-2xl relative">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                              <span className="text-[10px] font-black uppercase tracking-wider text-white">Shorts Comments</span>
                              <button onClick={() => setShowShortsComments(false)} className="text-white/40 hover:text-white">
                                <X size={12} />
                              </button>
                            </div>

                            {/* Scrollable short comments list */}
                            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                              {((shortsComments[activeShort.id]) || [
                                { id: 'sc1', authorName: 'James Chen', authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&auto=format&fit=crop&q=60', text: 'This vertical format looks stunning!', publishedAt: '2h ago', likes: 12 },
                                { id: 'sc2', authorName: 'Sophia Loren', authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&auto=format&fit=crop&q=60', text: 'Haha loved the transition ⚡️', publishedAt: '4h ago', likes: 9 }
                              ]).map((c) => (
                                <div key={c.id} className="text-[11px] leading-tight space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-extrabold text-white text-[10px]">{c.authorName}</span>
                                    <span className="text-[8px] text-white/30">{c.publishedAt}</span>
                                  </div>
                                  <p className="text-white/70">{c.text}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Quick Add Comment for Shorts */}
                          <form onSubmit={(e) => handleAddShortComment(e, activeShort.id)} className="mt-3 flex gap-1 border-t border-white/5 pt-2">
                            <input 
                              type="text" 
                              placeholder="Write a comment..."
                              value={shortsCommentInput}
                              onChange={(e) => setShortsCommentInput(e.target.value)}
                              className="flex-1 bg-[#141414] border border-white/10 rounded-lg p-1.5 text-[10px] focus:outline-none focus:border-red-600 text-white"
                            />
                            <button type="submit" className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-lg text-[9px] font-bold">
                              <Send size={10} />
                            </button>
                          </form>
                        </div>
                      )}

                    </div>
                  ) : (
                    <div className="text-center py-16 text-white/30">
                      <p className="text-sm">No Shorts found matching that query. Try browsing Home!</p>
                    </div>
                  )}

                </div>
              ) : currentTab === 'library' ? (
                // -------------------- VIEW 4: BEAUTIFUL COMBINED LIBRARY / "YOU" DASHBOARD --------------------
                <div className="space-y-8 pb-12">
                  {/* Header profile block */}
                  <div className="bg-gradient-to-r from-red-900/20 via-[#0A0A0A] to-[#0A0A0A] border border-white/5 p-6 rounded-3xl flex flex-col sm:flex-row items-center gap-6">
                    {user ? (
                      <>
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-red-600 shrink-0 relative group">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center text-xl font-black text-white">
                              {user.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'US'}
                            </div>
                          )}
                        </div>
                        <div className="text-center sm:text-left space-y-1.5 flex-1 min-w-0">
                          <span className="bg-red-600/15 text-red-500 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">Tubestream Verified Creator</span>
                          <h2 className="text-xl md:text-2xl font-black tracking-tight text-white truncate mt-1">{user.displayName || 'Creator Account'}</h2>
                          <p className="text-xs text-white/50 truncate">{user.email}</p>
                        </div>
                        <div className="sm:ml-auto flex gap-2 shrink-0">
                          <button onClick={handleSignOut} className="bg-red-600/10 hover:bg-red-600/20 text-red-500 text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-full border border-red-500/20 transition-all">
                            Sign Out
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                          <History size={24} className="text-white/40" />
                        </div>
                        <div className="text-center sm:text-left space-y-1.5 flex-1 min-w-0">
                          <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-tight">Your Custom Streaming Workspace</h2>
                          <p className="text-xs text-white/50">Sign in with Google to sync your channels, like videos, customize streams, and build lists.</p>
                        </div>
                        <button onClick={handleSignIn} className="sm:ml-auto bg-white hover:bg-white/90 text-black font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-full transition-all flex items-center gap-2 shrink-0">
                          <UserCheck size={14} /> Sign In
                        </button>
                      </>
                    )}
                  </div>

                  {/* Section 1: Watch History */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <h3 className="text-sm font-black tracking-wider uppercase text-white flex items-center gap-2">
                        <History size={16} className="text-red-500" />
                        Watch History ({watchedVideos.length})
                      </h3>
                      {watchedVideos.length > 0 && (
                        <button 
                          onClick={() => { setUserState(prev => ({ ...prev, history: [] })); showToast('Cleared History'); }} 
                          className="text-xs text-red-500 hover:text-red-400 font-bold transition-colors"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                    {watchedVideos.length > 0 ? (
                      <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none">
                        {watchedVideos.map((video) => (
                          <div key={`hist-${video.id}`} onClick={() => playVideo(video)} className="w-48 md:w-56 shrink-0 space-y-2 cursor-pointer group">
                            <div className="aspect-video bg-[#111] rounded-xl border border-white/10 relative overflow-hidden group-hover:border-red-600/50 transition-all">
                              <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                              <span className="absolute bottom-2 right-2 bg-black/80 text-[9px] font-black px-1.5 py-0.5 rounded text-white">{video.duration}</span>
                            </div>
                            <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-red-500 transition-colors">{video.title}</h4>
                            <p className="text-[10px] text-white/50 font-semibold">{video.channelTitle}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-white/40 py-4">No recently watched streams.</p>
                    )}
                  </div>

                  {/* Section 2: Watch Later */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <h3 className="text-sm font-black tracking-wider uppercase text-white flex items-center gap-2">
                        <Clock size={16} className="text-red-500" />
                        Watch Later ({watchLaterVideos.length})
                      </h3>
                    </div>
                    {watchLaterVideos.length > 0 ? (
                      <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none">
                        {watchLaterVideos.map((video) => (
                          <div key={`lat-${video.id}`} onClick={() => playVideo(video)} className="w-48 md:w-56 shrink-0 space-y-2 cursor-pointer group">
                            <div className="aspect-video bg-[#111] rounded-xl border border-white/10 relative overflow-hidden group-hover:border-red-600/50 transition-all">
                              <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                              <span className="absolute bottom-2 right-2 bg-black/80 text-[9px] font-black px-1.5 py-0.5 rounded text-white">{video.duration}</span>
                            </div>
                            <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-red-500 transition-colors">{video.title}</h4>
                            <p className="text-[10px] text-white/50 font-semibold">{video.channelTitle}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-white/40 py-4">Streams saved to Watch Later will show up here.</p>
                    )}
                  </div>

                  {/* Section 3: Liked Videos */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <h3 className="text-sm font-black tracking-wider uppercase text-white flex items-center gap-2">
                        <ThumbsUp size={16} className="text-red-500" />
                        Liked Streams ({likedVideosList.length})
                      </h3>
                    </div>
                    {likedVideosList.length > 0 ? (
                      <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none">
                        {likedVideosList.map((video) => (
                          <div key={`like-${video.id}`} onClick={() => playVideo(video)} className="w-48 md:w-56 shrink-0 space-y-2 cursor-pointer group">
                            <div className="aspect-video bg-[#111] rounded-xl border border-white/10 relative overflow-hidden group-hover:border-red-600/50 transition-all">
                              <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                              <span className="absolute bottom-2 right-2 bg-black/80 text-[9px] font-black px-1.5 py-0.5 rounded text-white">{video.duration}</span>
                            </div>
                            <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-red-500 transition-colors">{video.title}</h4>
                            <p className="text-[10px] text-white/50 font-semibold">{video.channelTitle}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-white/40 py-4">Streams you liked will show up here.</p>
                    )}
                  </div>
                </div>
              ) : (
                
                // -------------------- VIEW 3: STANDARD VIDEO BROWSER (Home Feed & Library Tab feeds) --------------------
                <div className="space-y-8">
                  
                  {/* Category Filter Chips (Only shown on Standard Home browsing) */}
                  {currentTab === 'home' && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-none">
                      {filterCategories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setActiveCategory(cat)}
                          className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all uppercase tracking-wider ${
                            activeCategory === cat 
                              ? 'bg-red-600 text-white shadow-lg red-glow-shadow' 
                              : 'bg-[#0F0F0F] hover:bg-[#1A1A1A] text-white/70 hover:text-white'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Feed Title Banner */}
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-red-600 rounded-full shadow-[0_0_10px_#dc2626]"></div>
                      <h2 className="text-xl font-black tracking-tight uppercase text-white">
                        {currentTab === 'home' && (activeCategory === 'All' ? 'Recommended Streams' : `Category: ${activeCategory}`)}
                        {currentTab === 'subscriptions' && 'Subscribed Channels Streams'}
                        {currentTab === 'history' && 'Your Watch History'}
                        {currentTab === 'watchLater' && 'Your Watch Later List'}
                        {currentTab === 'liked' && 'Your Liked Streams'}
                      </h2>
                    </div>
                    
                    <span className="text-xs text-white/40 font-bold bg-[#0f0f0f] px-3 py-1 rounded-full border border-white/5">
                      {currentDisplayVideos.length} streams
                    </span>
                  </div>

                  {/* Standard Video Feed Grid */}
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                      <Loader className="w-10 h-10 text-red-600 animate-spin" />
                      <p className="text-sm font-semibold text-white/50">Streaming latest contents from server...</p>
                    </div>
                  ) : currentDisplayVideos.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {currentDisplayVideos.map((video) => (
                          <div 
                            key={video.id} 
                            onClick={() => playVideo(video)}
                            className="space-y-3 cursor-pointer group"
                          >
                            {/* Video Thumbnail Box */}
                            <div className="aspect-video bg-[#111] rounded-2xl border border-white/10 relative overflow-hidden group-hover:border-red-600/50 group-hover:red-glow-border transition-all duration-300">
                              <img 
                                src={video.thumbnail} 
                                alt={video.title} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                              
                              {/* Duration label overlay */}
                              <div className="absolute bottom-3 right-3 bg-black/80 text-[10px] font-black px-2 py-0.5 rounded text-white tracking-widest">
                                {video.duration}
                              </div>

                              {/* Red scale play button hover effect */}
                              <div className="absolute inset-0 bg-red-600/10 group-hover:bg-red-600/20 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                                <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white scale-75 group-hover:scale-100 transition-all duration-300 red-glow-shadow shadow-lg">
                                  <Play size={20} fill="white" className="ml-1" />
                                </div>
                              </div>
                            </div>

                            {/* Description metadata */}
                            <div className="flex gap-3 px-1">
                              <img 
                                src={video.channelAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60'} 
                                alt={video.channelTitle} 
                                className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0"
                              />
                              <div className="min-w-0 space-y-1">
                                <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-red-500 transition-colors duration-200">
                                  {video.title}
                                </h3>
                                <div className="text-xs text-white/50 space-y-0.5 font-medium">
                                  <p className="hover:text-white truncate flex items-center gap-1">
                                    {video.channelTitle}
                                    <span className="w-3 h-3 bg-red-600 rounded-full flex items-center justify-center text-[6px] text-white font-extrabold">✓</span>
                                  </p>
                                  <p>{video.views} views • {video.publishedAt ? new Date(video.publishedAt).toLocaleDateString() : 'stream'}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Beautiful, high-contrast Load More button for unlimited scroll content */}
                      {currentTab === 'home' && (
                        <div className="flex justify-center pt-8 pb-12 border-t border-white/5 mt-10">
                          <button
                            onClick={loadMoreVideos}
                            disabled={loadingMoreVideos}
                            className="flex items-center gap-3 bg-red-600 hover:bg-red-700 disabled:bg-white/10 disabled:text-white/40 text-white font-black text-xs md:text-sm uppercase tracking-widest px-8 py-3.5 rounded-full transition-all duration-300 red-glow-shadow shadow-xl cursor-pointer hover:scale-105 active:scale-95"
                          >
                            {loadingMoreVideos ? (
                              <>
                                <Loader className="w-4 h-4 animate-spin text-white" />
                                <span>Tuning into YouTube...</span>
                              </>
                            ) : (
                              <>
                                <TrendingUp className="w-4 h-4" />
                                <span>Load More From YouTube</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-24 bg-[#0a0a0a] rounded-2xl border border-white/5 space-y-4">
                      <div className="w-16 h-16 rounded-full bg-white/5 mx-auto flex items-center justify-center text-white/30">
                        <Film size={28} />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-white">No streams found in this tab</h3>
                        <p className="text-xs text-white/40">Watch videos, subscribe to channels, or add custom streams to populate this section!</p>
                      </div>
                      {currentTab === 'home' && (
                        <button 
                          onClick={() => { setActiveCategory('All'); }}
                          className="bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-full transition-all"
                        >
                          Reset Filter
                        </button>
                      )}
                    </div>
                  )}

                </div>
              )}
            </>
          )}

        </main>
      </div>

      {/* -------------------- POPUP MODAL: UPLOAD STREAM -------------------- */}
      {isUploadOpen && (
        <div id="upload-dialog-overlay" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl relative red-glow-shadow">
            
            {/* Close button */}
            <button 
              onClick={() => setIsUploadOpen(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            {/* Header info */}
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 bg-red-600/10 text-red-500 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                <Plus size={10} /> Add Custom Stream
              </span>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Post Video on Tubestream</h3>
              <p className="text-xs text-white/40">Paste any standard YouTube video URL or ID to import it into your workspace.</p>
            </div>

            {/* Form */}
            <form onSubmit={handleUploadVideo} className="space-y-4">
              
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-white/60">YouTube Link or Video ID</label>
                <input 
                  type="text" 
                  placeholder="e.g. https://www.youtube.com/watch?v=jfKfPfyJRdk"
                  value={uploadUrl}
                  onChange={(e) => setUploadUrl(e.target.value)}
                  className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-600 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-white/60">Stream Title</label>
                <input 
                  type="text" 
                  placeholder="Enter custom title for Tubestream"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-600 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-white/60">Channel Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Studio X"
                    value={uploadChannel}
                    onChange={(e) => setUploadChannel(e.target.value)}
                    className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-white/60">Feed Format</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-600 text-white"
                  >
                    <option value="Tech">Standard Video (Tech)</option>
                    <option value="Coding">Standard Video (Coding)</option>
                    <option value="Music">Standard Video (Music)</option>
                    <option value="Lofi">Standard Video (Lofi)</option>
                    <option value="Shorts">Vertical Shorts Loop</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-white/60">Video Description (Optional)</label>
                <textarea 
                  rows={3}
                  placeholder="Write description notes..."
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-600 text-white"
                ></textarea>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsUploadOpen(false)}
                  className="bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all red-glow-shadow"
                >
                  Post Stream
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Sticky Bottom Tab Bar Navigation for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-[#0A0A0A]/95 border-t border-white/5 backdrop-blur-md flex items-center justify-around z-40 md:hidden pb-safe">
        <button 
          onClick={() => { setSelectedVideo(null); setCurrentTab('home'); }}
          className={`flex flex-col items-center justify-center gap-1 w-12 h-full transition-colors ${
            currentTab === 'home' && !selectedVideo ? 'text-red-500 font-bold' : 'text-white/50 hover:text-white'
          }`}
        >
          <Home size={20} className={currentTab === 'home' && !selectedVideo ? 'text-red-500' : ''} />
          <span className="text-[10px]">Home</span>
        </button>

        <button 
          onClick={() => { setSelectedVideo(null); setCurrentTab('shorts'); }}
          className={`flex flex-col items-center justify-center gap-1 w-12 h-full transition-colors ${
            currentTab === 'shorts' && !selectedVideo ? 'text-red-500 font-bold' : 'text-white/50 hover:text-white'
          }`}
        >
          <Flame size={20} className={currentTab === 'shorts' && !selectedVideo ? 'text-red-500' : ''} />
          <span className="text-[10px]">Shorts</span>
        </button>

        <button 
          onClick={() => setIsUploadOpen(true)}
          className="flex flex-col items-center justify-center gap-1 w-12 h-full text-white/50 hover:text-white"
        >
          <div className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-all shadow-[0_0_10px_rgba(220,38,38,0.3)]">
            <Plus size={20} className="text-white" />
          </div>
        </button>

        <button 
          onClick={() => { setSelectedVideo(null); setCurrentTab('subscriptions'); }}
          className={`flex flex-col items-center justify-center gap-1 w-12 h-full transition-colors ${
            currentTab === 'subscriptions' && !selectedVideo ? 'text-red-500 font-bold' : 'text-white/50 hover:text-white'
          }`}
        >
          <Tv size={20} className={currentTab === 'subscriptions' && !selectedVideo ? 'text-red-500' : ''} />
          <span className="text-[10px]">Subs</span>
        </button>

        <button 
          onClick={() => { setSelectedVideo(null); setCurrentTab('library'); }}
          className={`flex flex-col items-center justify-center gap-1 w-12 h-full transition-colors ${
            currentTab === 'library' && !selectedVideo ? 'text-red-500 font-bold' : 'text-white/50 hover:text-white'
          }`}
        >
          {user && user.photoURL ? (
            <img 
              src={user.photoURL} 
              alt="You" 
              className={`w-5 h-5 rounded-full object-cover border ${
                currentTab === 'library' ? 'border-red-500' : 'border-white/20'
              }`}
              referrerPolicy="no-referrer"
            />
          ) : (
            <History size={20} className={currentTab === 'library' && !selectedVideo ? 'text-red-500' : ''} />
          )}
          <span className="text-[10px]">Library</span>
        </button>
      </div>

    </div>
  );
}
