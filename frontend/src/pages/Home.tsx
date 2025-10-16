import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Play, 
  Star, 
  Clock, 
  Users, 
  TrendingUp, 
  Calendar,
  BookOpen,
  Award,
  Zap,
  Crown,
  ChevronRight,
  Check,
  Plus,
  X
} from 'lucide-react';
import { generateMockSeries, generateMockVideos, MockSeries } from '@/services/mockData';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import CourseHeroSection from '@/components/CourseHeroSection';
import cover1 from '@/assets/cover1.webp';
import cover2 from '@/assets/cover2.webp';
import cover3 from '@/assets/cover3.webp';
import cover4 from '@/assets/cover4.webp';
import logoSA from '@/assets/logoSA-negro.png';
import cover5 from '@/assets/cover5.webp';
import cover6 from '@/assets/cover6.webp';
import cover7 from '@/assets/cover7.webp';
import cover8 from '@/assets/cover8.webp';

const Home = () => {
  const [popularSeries, setPopularSeries] = useState<MockSeries[]>([]);
  const [newSeries, setNewSeries] = useState<MockSeries[]>([]);
  const [recommendedSeries, setRecommendedSeries] = useState<MockSeries[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const tabContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Featured Course Data for Hero Section
  const featuredCourse = {
    id: 1,
    title: "Master Classical Sculpture Techniques",
    description: "Learn the fundamentals of classical sculpture from ancient techniques to modern applications. Perfect for beginners and intermediate artists.",
    image: cover1,
    category: "Sculpture",
    duration: "12 hours",
    rating: 4.9,
    studentsCount: 15420,
    instructor: "Ana Rey",
    price: "$89",
    isFree: false,
    badge: "Featured"
  };

  // Course Categories Data
  const courseCategories = [
    {
      id: 1,
      title: "Classical Sculpture",
      image: cover1,
      courseCount: 24,
      description: "Traditional sculpting techniques and classical forms",
      category: "Sculpture"
    },
    {
      id: 2,
      title: "Contemporary Art",
      image: cover2,
      courseCount: 18,
      description: "Modern artistic expressions and innovative approaches",
      category: "Contemporary"
    },
    {
      id: 3,
      title: "Digital Art",
      image: cover3,
      courseCount: 32,
      description: "3D modeling, digital sculpting, and virtual art",
      category: "Digital"
    },
    {
      id: 4,
      title: "Art Restoration",
      image: cover4,
      courseCount: 15,
      description: "Conservation techniques and restoration methods",
      category: "Restoration"
    }
  ];

  // Featured Courses Data for Second Carousel
  const featuredCourses = [
    {
      id: 5,
      title: "Advanced Marble Sculpting",
      image: cover5,
      duration: "8 hours",
      rating: 4.8,
      studentsCount: 3420,
      instructor: "Ana Rey",
      category: "Sculpture"
    },
    {
      id: 6,
      title: "Modern Clay Techniques",
      image: cover6,
      duration: "6 hours",
      rating: 4.9,
      studentsCount: 2890,
      instructor: "Carlos Mendez",
      category: "Contemporary"
    },
    {
      id: 7,
      title: "3D Digital Sculpting",
      image: cover7,
      duration: "10 hours",
      rating: 4.7,
      studentsCount: 4560,
      instructor: "Sarah Chen",
      category: "Digital"
    },
    {
      id: 8,
      title: "Classical Bust Restoration",
      image: cover8,
      duration: "12 hours",
      rating: 4.9,
      studentsCount: 1890,
      instructor: "Marco Rossi",
      category: "Restoration"
    },
    {
      id: 9,
      title: "Bronze Casting Masterclass",
      image: cover1,
      duration: "15 hours",
      rating: 4.8,
      studentsCount: 1230,
      instructor: "Ana Rey",
      category: "Sculpture"
    },
    {
      id: 10,
      title: "Abstract Form Creation",
      image: cover2,
      duration: "7 hours",
      rating: 4.6,
      studentsCount: 2100,
      instructor: "Lisa Park",
      category: "Contemporary"
    }
  ];

  const handleGetStarted = () => {
    if (email.trim()) {
      // Store email for later use in signup flow
      localStorage.setItem('signup_email', email);
      navigate("/auth", { state: { email: email } });
    } else {
      navigate("/auth");
    }
  };

  const handleCourseClick = (courseId: number) => {
    navigate(`/series/${courseId}`);
  };

  const handleCategoryClick = (categoryId: number) => {
    navigate(`/explore?category=${categoryId}`);
  };

  const centerActiveTab = (tabIndex: number) => {
    if (tabContainerRef.current) {
      const container = tabContainerRef.current;
      const tabButtons = container.querySelectorAll('button');
      const activeButton = tabButtons[tabIndex];
      
      if (activeButton) {
        // Get container dimensions
        const containerWidth = container.clientWidth;
        const containerRect = container.getBoundingClientRect();
        
        // Get active button dimensions and position
        const buttonRect = activeButton.getBoundingClientRect();
        const buttonLeft = buttonRect.left - containerRect.left + container.scrollLeft;
        const buttonWidth = buttonRect.width;
        
        // Calculate the scroll position to center the button
        const scrollLeft = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);
        
        // Ensure scroll position is within bounds
        const maxScroll = container.scrollWidth - containerWidth;
        const finalScrollLeft = Math.max(0, Math.min(scrollLeft, maxScroll));
        
        // Smooth scroll to center the active tab
        container.scrollTo({
          left: finalScrollLeft,
          behavior: 'smooth'
        });
      }
    }
  };

  const handleTabClick = (index: number) => {
    setActiveTab(index);
    // Use setTimeout to ensure the DOM has updated
    setTimeout(() => centerActiveTab(index), 100);
  };

  // Center the active tab when component mounts or activeTab changes
  useEffect(() => {
    if (tabContainerRef.current) {
      setTimeout(() => centerActiveTab(activeTab), 100);
    }
  }, [activeTab]);

  // Handle window resize to maintain centering
  useEffect(() => {
    const handleResize = () => {
      setTimeout(() => centerActiveTab(activeTab), 100);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeTab]);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const toggleCategory = (index: number) => {
    setExpandedCategory(expandedCategory === index ? null : index);
  };


  // Featured hero content
  const heroContent = {
    id: 1,
    title: "Sculpting Mastery",
    description: "Witness the artistry behind incredible sculpting techniques and restoration processes",
    image: cover1,
    videoCount: 12,
    duration: "4h 30m",
    viewers: 1234,
    rating: 4.8,
    visibility: "premium"
  };

  // HBO Max style poster collage data
  const posterCollage = [
    { src: cover1, alt: "Sculpting Series", rotation: -8, x: 10, y: 15 },
    { src: cover2, alt: "Art Techniques", rotation: 12, x: 25, y: 5 },
    { src: cover3, alt: "Master Classes", rotation: -5, x: 45, y: 20 },
    { src: cover4, alt: "Restoration", rotation: 8, x: 65, y: 10 },
    { src: cover5, alt: "Behind Scenes", rotation: -12, x: 80, y: 25 },
    { src: cover6, alt: "Professional Tips", rotation: 6, x: 15, y: 35 },
    { src: cover7, alt: "Creative Process", rotation: -10, x: 35, y: 40 },
    { src: cover8, alt: "Expert Insights", rotation: 9, x: 55, y: 35 },
    { src: cover1, alt: "Studio Sessions", rotation: -7, x: 75, y: 45 },
    { src: cover2, alt: "Art History", rotation: 11, x: 5, y: 55 },
    { src: cover3, alt: "Modern Art", rotation: -9, x: 30, y: 60 },
    { src: cover4, alt: "Classical Techniques", rotation: 7, x: 60, y: 55 },
    { src: cover5, alt: "Digital Art", rotation: -11, x: 85, y: 65 },
    { src: cover6, alt: "Traditional Methods", rotation: 5, x: 20, y: 75 },
    { src: cover7, alt: "Contemporary Art", rotation: -6, x: 50, y: 75 },
    { src: cover8, alt: "Artistic Vision", rotation: 10, x: 70, y: 80 }
  ];

  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const allSeries = generateMockSeries();
      setPopularSeries(allSeries.slice(0, 6));
      setNewSeries(allSeries.slice(1, 7));
      setRecommendedSeries(allSeries.slice(2, 8));
      setLoading(false);
    };

    fetchData();
  }, []);

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'premium':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'basic':
        return <Star className="h-4 w-4 text-blue-500" />;
      case 'freemium':
        return <Zap className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getVisibilityBadge = (visibility: string) => {
    const colors = {
      premium: 'bg-yellow-100 text-yellow-800',
      basic: 'bg-blue-100 text-blue-800',
      freemium: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[visibility as keyof typeof colors]}`}>
        {getVisibilityIcon(visibility)}
        <span className="ml-1 capitalize">{visibility}</span>
      </span>
    );
  };

  const SeriesCard = ({ series }: { series: any }) => (
    <Card className="group cursor-pointer overflow-visible border-0 bg-transparent transform hover:scale-105 transition-all duration-300 hover:shadow-2xl" onClick={() => navigate(`/series/${series.id}`)}>
      <div className="aspect-[3/2] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 relative overflow-hidden rounded-lg shadow-lg">
        {/* Background Image */}
        <img
          src={series.image}
          alt={series.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {/* Bottom Gradient Overlay - HBO Max Style */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
        
        {/* Series Title */}
        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
          <h3 className="font-bold text-sm line-clamp-2 drop-shadow-lg group-hover:text-white transition-colors duration-300">
            {series.title}
          </h3>
          {series.subtitle && (
            <p className="text-xs text-white/80 mt-1 line-clamp-1">
              {series.subtitle}
            </p>
          )}
        </div>
        
        {/* HBO Max Style Hover Effect */}
        <div className="absolute inset-0 border-2 border-transparent group-hover:border-white/30 rounded-lg transition-all duration-300"></div>
      </div>
    </Card>
  );

  // Sample content for each category - HBO Max Style
  const sculptureSeries = [
    { id: 1, title: "MICHELANGELO'S SECRETS", subtitle: "Behind the David", image: cover1, videoCount: 12, duration: "4h 30m", viewers: 1234, rating: 4.8, visibility: "premium" },
    { id: 2, title: "MODERN ABSTRACT", subtitle: "Breaking Boundaries", image: cover2, videoCount: 8, duration: "3h 15m", viewers: 987, rating: 4.6, visibility: "basic" },
    { id: 3, title: "CLAY MASTERY", subtitle: "From Mud to Masterpiece", image: cover3, videoCount: 15, duration: "6h 45m", viewers: 2156, rating: 4.9, visibility: "premium" },
    { id: 4, title: "STONE CARVING", subtitle: "Ancient Techniques", image: cover4, videoCount: 10, duration: "5h 20m", viewers: 1456, rating: 4.7, visibility: "basic" },
    { id: 5, title: "BRONZE CASTING", subtitle: "The Lost Art", image: cover5, videoCount: 7, duration: "3h 50m", viewers: 876, rating: 4.5, visibility: "premium" },
    { id: 6, title: "FIGURATIVE ART", subtitle: "Human Form Study", image: cover6, videoCount: 11, duration: "4h 10m", viewers: 1689, rating: 4.8, visibility: "basic" },
    { id: 7, title: "RELIEF TECHNIQUES", subtitle: "Depth in Stone", image: cover7, videoCount: 9, duration: "3h 25m", viewers: 1123, rating: 4.6, visibility: "freemium" },
    { id: 8, title: "PUBLIC ART", subtitle: "City Transformations", image: cover8, videoCount: 6, duration: "2h 45m", viewers: 654, rating: 4.4, visibility: "basic" },
    { id: 9, title: "ANATOMY STUDIES", subtitle: "Perfect Proportions", image: cover1, videoCount: 13, duration: "5h 30m", viewers: 1890, rating: 4.9, visibility: "premium" },
    { id: 10, title: "DIGITAL SCULPTING", subtitle: "Future of Art", image: cover2, videoCount: 14, duration: "6h 15m", viewers: 2234, rating: 4.8, visibility: "premium" }
  ];

  const drawingSeries = [
    { id: 11, title: "PENCIL MASTERY", subtitle: "Portrait Techniques", image: cover3, videoCount: 12, duration: "4h 30m", viewers: 1234, rating: 4.8, visibility: "premium" },
    { id: 12, title: "CHARCOAL LANDSCAPES", subtitle: "Atmospheric Drawing", image: cover4, videoCount: 8, duration: "3h 15m", viewers: 987, rating: 4.6, visibility: "basic" },
    { id: 13, title: "INK WASH MASTERY", subtitle: "Eastern Techniques", image: cover5, videoCount: 15, duration: "6h 45m", viewers: 2156, rating: 4.9, visibility: "premium" },
    { id: 14, title: "PERSPECTIVE DRAWING", subtitle: "3D on Paper", image: cover6, videoCount: 10, duration: "5h 20m", viewers: 1456, rating: 4.7, visibility: "basic" },
    { id: 15, title: "LIFE DRAWING", subtitle: "Human Anatomy", image: cover7, videoCount: 7, duration: "3h 50m", viewers: 876, rating: 4.5, visibility: "premium" },
    { id: 16, title: "SKETCHBOOK HABITS", subtitle: "Daily Practice", image: cover8, videoCount: 11, duration: "4h 10m", viewers: 1689, rating: 4.8, visibility: "basic" },
    { id: 17, title: "DIGITAL ILLUSTRATION", subtitle: "Modern Art", image: cover1, videoCount: 9, duration: "3h 25m", viewers: 1123, rating: 4.6, visibility: "freemium" },
    { id: 18, title: "ARCHITECTURAL SKETCHING", subtitle: "Building Dreams", image: cover2, videoCount: 6, duration: "2h 45m", viewers: 654, rating: 4.4, visibility: "basic" },
    { id: 19, title: "MANGA & COMICS", subtitle: "Storytelling Art", image: cover3, videoCount: 13, duration: "5h 30m", viewers: 1890, rating: 4.9, visibility: "premium" },
    { id: 20, title: "STILL LIFE STUDIES", subtitle: "Object Mastery", image: cover4, videoCount: 14, duration: "6h 15m", viewers: 2234, rating: 4.8, visibility: "premium" }
  ];

  const polychromySeries = [
    { id: 21, title: "COLOR THEORY", subtitle: "The Science of Art", image: cover5, videoCount: 12, duration: "4h 30m", viewers: 1234, rating: 4.8, visibility: "premium" },
    { id: 22, title: "OIL PAINTING", subtitle: "Classical Mastery", image: cover6, videoCount: 8, duration: "3h 15m", viewers: 987, rating: 4.6, visibility: "basic" },
    { id: 23, title: "ACRYLIC TECHNIQUES", subtitle: "Modern Methods", image: cover7, videoCount: 15, duration: "6h 45m", viewers: 2156, rating: 4.9, visibility: "premium" },
    { id: 24, title: "WATERCOLOR MASTERY", subtitle: "Fluid Art", image: cover8, videoCount: 10, duration: "5h 20m", viewers: 1456, rating: 4.7, visibility: "basic" },
    { id: 25, title: "FRESCO PAINTING", subtitle: "Ancient Wisdom", image: cover1, videoCount: 7, duration: "3h 50m", viewers: 876, rating: 4.5, visibility: "premium" },
    { id: 26, title: "GILDING TECHNIQUES", subtitle: "Golden Touch", image: cover2, videoCount: 11, duration: "4h 10m", viewers: 1689, rating: 4.8, visibility: "basic" },
    { id: 27, title: "ENAMEL ART", subtitle: "Fire and Color", image: cover3, videoCount: 9, duration: "3h 25m", viewers: 1123, rating: 4.6, visibility: "freemium" },
    { id: 28, title: "ICON PAINTING", subtitle: "Sacred Art", image: cover4, videoCount: 6, duration: "2h 45m", viewers: 654, rating: 4.4, visibility: "basic" },
    { id: 29, title: "MURAL ART", subtitle: "Public Masterpieces", image: cover5, videoCount: 13, duration: "5h 30m", viewers: 1890, rating: 4.9, visibility: "premium" },
    { id: 30, title: "ABSTRACT PAINTING", subtitle: "Beyond Reality", image: cover6, videoCount: 14, duration: "6h 15m", viewers: 2234, rating: 4.8, visibility: "premium" }
  ];

  const restorationSeries = [
    { id: 31, title: "PAINTING RESTORATION", subtitle: "Bringing Art Back", image: cover7, videoCount: 12, duration: "4h 30m", viewers: 1234, rating: 4.8, visibility: "premium" },
    { id: 32, title: "SCULPTURE REPAIR", subtitle: "Ancient to Modern", image: cover8, videoCount: 8, duration: "3h 15m", viewers: 987, rating: 4.6, visibility: "basic" },
    { id: 33, title: "TEXTILE CONSERVATION", subtitle: "Fabric Preservation", image: cover1, videoCount: 15, duration: "6h 45m", viewers: 2156, rating: 4.9, visibility: "premium" },
    { id: 34, title: "PAPER RESTORATION", subtitle: "Document Recovery", image: cover2, videoCount: 10, duration: "5h 20m", viewers: 1456, rating: 4.7, visibility: "basic" },
    { id: 35, title: "CERAMIC MENDING", subtitle: "Broken to Beautiful", image: cover3, videoCount: 7, duration: "3h 50m", viewers: 876, rating: 4.5, visibility: "premium" },
    { id: 36, title: "WOOD RESTORATION", subtitle: "Timber Revival", image: cover4, videoCount: 11, duration: "4h 10m", viewers: 1689, rating: 4.8, visibility: "basic" },
    { id: 37, title: "METAL PATINATION", subtitle: "Age with Grace", image: cover5, videoCount: 9, duration: "3h 25m", viewers: 1123, rating: 4.6, visibility: "freemium" },
    { id: 38, title: "HISTORICAL ARTIFACTS", subtitle: "Time Travel", image: cover6, videoCount: 6, duration: "2h 45m", viewers: 654, rating: 4.4, visibility: "basic" },
    { id: 39, title: "PREVENTIVE CONSERVATION", subtitle: "Future Protection", image: cover7, videoCount: 13, duration: "5h 30m", viewers: 1890, rating: 4.9, visibility: "premium" },
    { id: 40, title: "DIGITAL RESTORATION", subtitle: "Tech Meets Art", image: cover8, videoCount: 14, duration: "6h 15m", viewers: 2234, rating: 4.8, visibility: "premium" }
  ];

  const modelingSeries = [
    { id: 41, title: "BLENDER BASICS", subtitle: "3D for Everyone", image: cover1, videoCount: 12, duration: "4h 30m", viewers: 1234, rating: 4.8, visibility: "premium" },
    { id: 42, title: "ZBRUSH SCULPTING", subtitle: "Digital Clay", image: cover2, videoCount: 8, duration: "3h 15m", viewers: 987, rating: 4.6, visibility: "basic" },
    { id: 43, title: "MAYA CHARACTER DESIGN", subtitle: "Bringing Life", image: cover3, videoCount: 15, duration: "6h 45m", viewers: 2156, rating: 4.9, visibility: "premium" },
    { id: 44, title: "SUBSTANCE PAINTER", subtitle: "Texturing Mastery", image: cover4, videoCount: 10, duration: "5h 20m", viewers: 1456, rating: 4.7, visibility: "basic" },
    { id: 45, title: "ARCHITECTURAL VISUALIZATION", subtitle: "Building Dreams", image: cover5, videoCount: 7, duration: "3h 50m", viewers: 876, rating: 4.5, visibility: "premium" },
    { id: 46, title: "GAME ASSET CREATION", subtitle: "Gaming Industry", image: cover6, videoCount: 11, duration: "4h 10m", viewers: 1689, rating: 4.8, visibility: "basic" },
    { id: 47, title: "HARD SURFACE MODELING", subtitle: "Mechanical Art", image: cover7, videoCount: 9, duration: "3h 25m", viewers: 1123, rating: 4.6, visibility: "freemium" },
    { id: 48, title: "ORGANIC MODELING", subtitle: "Living Forms", image: cover8, videoCount: 6, duration: "2h 45m", viewers: 654, rating: 4.4, visibility: "basic" },
    { id: 49, title: "RENDERING TECHNIQUES", subtitle: "Light and Shadow", image: cover1, videoCount: 13, duration: "5h 30m", viewers: 1890, rating: 4.9, visibility: "premium" },
    { id: 50, title: "ANIMATION PRINCIPLES", subtitle: "Movement Mastery", image: cover2, videoCount: 14, duration: "6h 15m", viewers: 2234, rating: 4.8, visibility: "premium" }
  ];

  // Tabbed Carousel Data
  const tabData = [
    {
      id: 0,
      title: "SCULPTURE",
      icon: TrendingUp,
      summary: "Discover what's capturing the attention of art enthusiasts worldwide.",
      description: "These popular series feature the most engaging sculpting techniques and restoration processes that are currently trending in our community.",
      features: ["Most Watched", "Community Favorites", "Expert Recommended"],
      backgroundImage: cover1,
      series: sculptureSeries
    },
    {
      id: 1,
      title: "DRAWING",
      icon: Calendar,
      summary: "Stay ahead with our latest content releases.",
      description: "Fresh masterclasses, cutting-edge techniques, and new perspectives from renowned artists are added regularly to keep your learning journey exciting and current.",
      features: ["Fresh Content", "Latest Techniques", "New Instructors"],
      backgroundImage: cover2,
      series: drawingSeries
    },
    {
      id: 2,
      title: "POLYCHROMY",
      icon: Award,
      summary: "Go beyond the finished artwork with exclusive behind-the-scenes content.",
      description: "Discover the creative process, artistic decisions, and intimate moments that bring masterpieces to life from concept to completion.",
      features: ["Creative Process", "Artist Insights", "Work in Progress"],
      backgroundImage: cover3,
      series: polychromySeries
    },
    {
      id: 3,
      title: "RESTORATION",
      icon: TrendingUp,
      summary: "Master the art of restoration with expert techniques.",
      description: "Learn professional restoration methods and preservation techniques from industry experts.",
      features: ["Expert Techniques", "Preservation Methods", "Professional Skills"],
      backgroundImage: cover4,
      series: restorationSeries
    },
    {
      id: 4,
      title: "3D MODELING",
      icon: Calendar,
      summary: "Explore the digital frontier of 3D art creation.",
      description: "Modern 3D modeling techniques and digital sculpting for contemporary artists.",
      features: ["Digital Tools", "Modern Techniques", "Contemporary Art"],
      backgroundImage: cover5,
      series: modelingSeries
    }
  ];

  const TabbedCarousel = () => {
    const currentTab = tabData[activeTab];
    
    return (
      <section className="mb-16 lg:mb-20">
        {/* HBO Max Style Header with Tab Navigation */}
        
        
        {/* Tab Navigation - HBO Max Style - Arrows aligned with content ends */}
        <div className="flex items-center justify-between mb-8 lg:mb-12 w-full max-w-6xl mx-auto">
          {/* Left Arrow - Aligned to content left */}
          <button 
            onClick={() => handleTabClick(Math.max(0, activeTab - 1))}
            className="text-gray-400 hover:text-white transition-colors duration-300 p-4 flex-shrink-0"
          >
            <ChevronRight className="h-8 w-8 rotate-180" />
          </button>
          
          {/* Tab Labels - Show all tabs like HBO Max */}
          <div 
            ref={tabContainerRef}
            className="flex items-center space-x-6 lg:space-x-8 overflow-x-auto hide-scrollbar w-full justify-center"
            style={{ scrollBehavior: 'smooth' }}
          >
            {tabData.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(index)}
                className={`text-2xl lg:text-3xl xl:text-4xl font-light transition-colors duration-300 flex-shrink-0 ${
                  index === activeTab
                    ? 'text-white'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab.title}
              </button>
            ))}
          </div>
          
          {/* Right Arrow - Aligned to content right */}
          <button 
            onClick={() => handleTabClick(Math.min(tabData.length - 1, activeTab + 1))}
            className="text-gray-400 hover:text-white transition-colors duration-300 p-4 flex-shrink-0"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </div>
        
        {/* HBO Max Style Grid - Always 2 Rows with Arrow Navigation */}
        <div className="w-full max-w-6xl mx-auto">
          <div className="flex items-center">
            {/* Left Arrow */}
            <button 
              onClick={() => {
                const container = document.querySelector('.content-grid') as HTMLElement;
                if (container) {
                  container.scrollBy({ left: -300, behavior: 'smooth' });
                }
              }}
              className="text-gray-400 hover:text-white transition-colors duration-300 p-2 flex-shrink-0 mr-4"
            >
              <ChevronRight className="h-6 w-6 rotate-180" />
            </button>
            
            {/* Content Grid */}
            <div 
              className="content-grid grid grid-flow-col grid-rows-2 gap-6 lg:gap-8 overflow-x-auto hide-scrollbar py-4 flex-1"
            >
              {currentTab.series.map((item) => (
                <div key={item.id} className="w-72 md:w-80 lg:w-96 flex-shrink-0 hover:z-50 transition-all duration-300 group">
                  <SeriesCard series={item} />
                </div>
              ))}
            </div>
            
            {/* Right Arrow */}
            <button 
              onClick={() => {
                const container = document.querySelector('.content-grid') as HTMLElement;
                if (container) {
                  container.scrollBy({ left: 300, behavior: 'smooth' });
                }
              }}
              className="text-gray-400 hover:text-white transition-colors duration-300 p-2 flex-shrink-0 ml-4"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>
    </section>
  );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="w-full px-12 lg:px-16 xl:px-20 py-8">
          <div className="animate-pulse">
            {/* Carousel Loading */}
            <div className="relative h-[500px] lg:h-[600px] w-full bg-muted mb-12"></div>
            
            {/* Content Sections Loading */}
            <div className="space-y-16">
              {[...Array(3)].map((_, i) => (
                <div key={i}>
                  <div className="h-10 bg-muted rounded w-64 mb-8"></div>
                  <div className="flex space-x-4 overflow-hidden">
                    {[...Array(5)].map((_, j) => (
                      <div key={j} className="flex-shrink-0 w-72">
                        <div className="aspect-[16/9] bg-muted rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414]">
      {/* Hero Section - HBO Max Style */}
      <section className="relative overflow-hidden -mt-16 lg:-mt-20">
        <div className="w-full">
          <div className="relative h-[75vh] lg:h-[90vh] w-full overflow-hidden">
            {/* HBO Max Style Poster Collage Background */}
            <div className="absolute inset-0 bg-black">
              {/* Smooth gradient overlay that fades completely to main background */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 via-black/70 to-[#141414] z-10"></div>
              <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#141414] via-[#141414]/60 via-[#141414]/30 to-transparent z-15"></div>
              
              {/* Poster collage */}
              {posterCollage.map((poster, index) => (
                <div
                  key={index}
                  className="absolute w-32 h-48 lg:w-40 lg:h-60 opacity-50 hover:opacity-70 transition-opacity duration-300"
                  style={{
                    left: `${poster.x}%`,
                    top: `${poster.y}%`,
                    transform: `rotate(${poster.rotation}deg)`,
                    zIndex: 5
                  }}
                >
                  <img
                    src={poster.src}
                    alt={poster.alt}
                    className="w-full h-full object-cover rounded-sm shadow-lg"
                  />
                </div>
              ))}
            </div>
            
            {/* Center-Aligned Content Overlay - HBO Max Style */}
            <div className="relative z-20 h-full flex items-center justify-center">
              <div className="text-center text-white space-y-6 lg:space-y-8 max-w-4xl px-6">
                {/* SACRART Logo */}
                <div className="space-y-2 lg:space-y-4">
                  <div className="flex justify-center">
                    <img
                      src={logoSA}
                      alt="SACRART"
                      className="h-40 sm:h-48 lg:h-56 xl:h-64 2xl:h-72 w-auto drop-shadow-2xl"
                    />
                  </div>
                  <p className="text-xl lg:text-2xl xl:text-3xl text-white/90 drop-shadow-lg font-light max-w-2xl mx-auto">
                    Start enjoying SACRART plans from only $9.99/month
                  </p>
                  <p className="text-lg lg:text-xl text-white/80 drop-shadow-md">
                    $5/month for the Premium add-on*
                  </p>
                  </div>

                {/* Subscribe Button */}
                <div className="pt-4">
                  {isAuthenticated ? (
                      <Button 
                        size="lg" 
                      className="bg-white text-black hover:bg-white/90 font-bold text-lg lg:text-xl px-12 lg:px-16 py-4 lg:py-5 rounded-md shadow-xl transition-all duration-300 hover:scale-105"
                        onClick={() => navigate('/explore')}
                      >
                        GET SACRART
                      </Button>
                  ) : (
                      <Button
                        onClick={handleGetStarted}
                        size="lg"
                      className="bg-white text-black hover:bg-white/90 font-bold text-lg lg:text-xl px-12 lg:px-16 py-4 lg:py-5 rounded-md shadow-xl transition-all duration-300 hover:scale-105"
                      >
                        GET SACRART
                      </Button>
                  )}
                </div>

                {/* Disclaimer */}
                <div className="pt-8 lg:pt-12">
                  <p className="text-xs lg:text-sm text-white/70 max-w-4xl mx-auto leading-relaxed">
                    *Requires subscription and the Premium add-on (its availability varies depending on the subscription provider). 
                    Automatic renewal unless canceled. Subject to Terms and Conditions. Content availability varies by plan. +18.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

       {/* Course Hero Section - Two Part Layout */}
       <CourseHeroSection
         featuredCourse={featuredCourse}
         courseCategories={courseCategories}
         featuredCourses={featuredCourses}
         onCourseClick={handleCourseClick}
         onCategoryClick={handleCategoryClick}
       />

       {/* Content Sections - HBO Max Style */}
       <div className="w-full px-4 md:px-8 lg:px-16 xl:px-24 2xl:px-32 pt-16 lg:pt-20 pb-12 lg:pb-20">
         <TabbedCarousel />
      </div>

      {/* Subscription Plans Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-transparent to-black/50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-4 font-playfair text-white">
              Choose Your Plan
            </h2>
            <p className="text-lg lg:text-xl text-gray-400 max-w-3xl mx-auto font-montserrat">
              Select the perfect plan to unlock unlimited access to our exclusive sculpting and restoration content.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 max-w-6xl mx-auto">
            {/* Freemium Plan */}
            <div className="bg-gray-900/50 rounded-xl p-8 lg:p-10 border border-white/10 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl backdrop-blur-sm">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2 text-white font-montserrat">Freemium</h3>
                <div className="text-4xl font-bold text-white mb-2 font-montserrat">Free</div>
                <p className="text-gray-400 font-montserrat">Perfect for getting started</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-gray-300 font-montserrat">
                  <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                  <span>Access to basic content</span>
                </li>
                <li className="flex items-center text-gray-300 font-montserrat">
                  <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                  <span>Community support</span>
                </li>
                <li className="flex items-center text-gray-300 font-montserrat">
                  <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                  <span>Mobile app access</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white font-semibold" onClick={() => navigate('/auth')}>
                Get Started Free
              </Button>
            </div>

            {/* Basic Plan */}
            <div className="bg-gray-900/50 rounded-xl p-8 lg:p-10 border-2 border-primary relative hover:shadow-2xl transition-all duration-300 backdrop-blur-sm transform hover:scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-white px-4 py-1 font-semibold">Most Popular</Badge>
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2 text-white font-montserrat">Basic</h3>
                <div className="text-4xl font-bold text-white mb-2 font-montserrat">$19<span className="text-lg text-gray-400">/month</span></div>
                <p className="text-gray-400 font-montserrat">For art enthusiasts</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-gray-300 font-montserrat">
                  <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                  <span>Everything in Freemium</span>
                </li>
                <li className="flex items-center text-gray-300 font-montserrat">
                  <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                  <span>Advanced techniques</span>
                </li>
                <li className="flex items-center text-gray-300 font-montserrat">
                  <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                  <span>Downloadable resources</span>
                </li>
                <li className="flex items-center text-gray-300 font-montserrat">
                  <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                  <span>Priority support</span>
                </li>
              </ul>
              <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold" onClick={() => navigate('/subscription')}>
                Start Basic Plan
              </Button>
            </div>

            {/* Premium Plan */}
            <div className="bg-gray-900/50 rounded-xl p-8 lg:p-10 border border-white/10 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl backdrop-blur-sm">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2 text-white font-montserrat">Premium</h3>
                <div className="text-4xl font-bold text-white mb-2 font-montserrat">$39<span className="text-lg text-gray-400">/month</span></div>
                <p className="text-gray-400 font-montserrat">For professionals</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-gray-300 font-montserrat">
                  <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                  <span>Everything in Basic</span>
                </li>
                <li className="flex items-center text-gray-300 font-montserrat">
                  <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                  <span>1-on-1 mentoring sessions</span>
                </li>
                <li className="flex items-center text-gray-300 font-montserrat">
                  <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                  <span>Exclusive masterclasses</span>
                </li>
                <li className="flex items-center text-gray-300 font-montserrat">
                  <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                  <span>Certification programs</span>
                </li>
                <li className="flex items-center text-gray-300 font-montserrat">
                  <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                  <span>24/7 premium support</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white font-semibold" onClick={() => navigate('/subscription')}>
                Go Premium
              </Button>
            </div>
          </div>
        </div>
      </section>

       {/* FAQ Section - New Style with Categories */}
       <section className="py-16 lg:py-24 bg-gradient-to-br from-gray-900 via-black to-gray-800">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-4 font-playfair text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-lg lg:text-xl text-gray-400 max-w-3xl mx-auto font-montserrat">
              Everything you need to know about SACRART and our content.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            {/* About Plans and Prices Category - Separate Card */}
            <div className="bg-gray-900/50 rounded-xl border border-white/10 transform hover:border-primary/50 transition-all duration-300 backdrop-blur-sm">
              <button
                onClick={() => toggleCategory(0)}
                className="w-full text-left px-6 py-4 flex justify-between items-center hover:bg-white/5 transition-colors duration-200 rounded-t-xl"
              >
                <h3 className="text-lg font-semibold text-white font-montserrat">About Plans and Prices</h3>
                {expandedCategory === 0 ? (
                  <X className="h-5 w-5 text-primary" />
                ) : (
                  <Plus className="h-5 w-5 text-gray-400" />
                )}
              </button>
              {expandedCategory === 0 && (
                <div className="px-6 pb-4 space-y-3">
                  <div className="border-b border-white/10 pb-3">
                    <button
                      onClick={() => toggleFaq(1)}
                      className="w-full text-left flex justify-between items-center py-2 text-gray-300 hover:text-white transition-colors duration-200"
                    >
                      <span className="font-medium">When does it open and how do I sign up?</span>
                      {expandedFaq === 1 ? (
                        <X className="h-4 w-4 text-primary" />
                      ) : (
                        <Plus className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                    {expandedFaq === 1 && (
                      <div className="text-gray-400 py-2 pl-4 font-montserrat">
                        SACRART is now open! You can sign up anytime by clicking "Get Started" on our homepage. Simply enter your email address and choose your preferred plan. Registration takes less than 2 minutes.
                      </div>
                    )}
                  </div>
                  <div className="border-b border-white/10 pb-3">
                    <button
                      onClick={() => toggleFaq(2)}
                      className="w-full text-left flex justify-between items-center py-2 text-gray-300 hover:text-white transition-colors duration-200"
                    >
                      <span className="font-medium">What's the difference between the plans?</span>
                      {expandedFaq === 2 ? (
                        <X className="h-4 w-4 text-primary" />
                      ) : (
                        <Plus className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                    {expandedFaq === 2 && (
                      <div className="text-gray-400 py-2 pl-4 font-montserrat">
                        <strong className="text-white">Freemium:</strong> Free access to basic content and community support.<br/>
                        <strong className="text-white">Basic ($19/month):</strong> Advanced techniques, downloadable resources, and priority support.<br/>
                        <strong className="text-white">Premium ($39/month):</strong> Everything in Basic plus 1-on-1 mentoring and exclusive masterclasses.
                      </div>
                    )}
                  </div>
                  <div>
                    <button
                      onClick={() => toggleFaq(3)}
                      className="w-full text-left flex justify-between items-center py-2 text-gray-300 hover:text-white transition-colors duration-200"
                    >
                      <span className="font-medium">How do I cancel my subscription?</span>
                      {expandedFaq === 3 ? (
                        <X className="h-4 w-4 text-primary" />
                      ) : (
                        <Plus className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                    {expandedFaq === 3 && (
                      <div className="text-gray-400 py-2 pl-4 font-montserrat">
                        You can cancel your subscription anytime from your account settings. There are no cancellation fees or commitments. Simply go to your profile, click "Subscription," and select "Cancel Plan." Your access will continue until the end of your current billing period.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Content and Learning Category - Separate Card */}
            <div className="bg-gray-900/50 rounded-xl border border-white/10 transform hover:border-primary/50 transition-all duration-300 backdrop-blur-sm">
              <button
                onClick={() => toggleCategory(1)}
                className="w-full text-left px-6 py-4 flex justify-between items-center hover:bg-white/5 transition-colors duration-200 rounded-t-xl"
              >
                <h3 className="text-lg font-semibold text-white font-montserrat">Content and Watching</h3>
                {expandedCategory === 1 ? (
                  <X className="h-5 w-5 text-primary" />
                ) : (
                  <Plus className="h-5 w-5 text-gray-400" />
                )}
              </button>
              {expandedCategory === 1 && (
                <div className="px-6 pb-4 space-y-3">
                  <div className="border-b border-white/10 pb-3">
                    <button
                      onClick={() => toggleFaq(5)}
                      className="w-full text-left flex justify-between items-center py-2 text-gray-300 hover:text-white transition-colors duration-200"
                    >
                      <span className="font-medium">Do I need prior sculpting experience?</span>
                      {expandedFaq === 5 ? (
                        <X className="h-4 w-4 text-primary" />
                      ) : (
                        <Plus className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                    {expandedFaq === 5 && (
                      <div className="text-gray-400 py-2 pl-4 font-montserrat">
                        Not at all! Our content is designed for all skill levels, from complete beginners to professional artists. Watch at your own pace and enjoy the journey.
                      </div>
                    )}
                  </div>
                  <div className="border-b border-white/10 pb-3">
                    <button
                      onClick={() => toggleFaq(6)}
                      className="w-full text-left flex justify-between items-center py-2 text-gray-300 hover:text-white transition-colors duration-200"
                    >
                      <span className="font-medium">What materials do I need to get started?</span>
                      {expandedFaq === 6 ? (
                        <X className="h-4 w-4 text-primary" />
                      ) : (
                        <Plus className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                    {expandedFaq === 6 && (
                      <div className="text-gray-400 py-2 pl-4 font-montserrat">
                        Each series includes detailed information about materials and techniques. You'll find recommendations for professional-grade tools and budget-friendly alternatives.
                      </div>
                    )}
                  </div>
                  <div>
                    <button
                      onClick={() => toggleFaq(7)}
                      className="w-full text-left flex justify-between items-center py-2 text-gray-300 hover:text-white transition-colors duration-200"
                    >
                      <span className="font-medium">Can I watch on mobile devices?</span>
                      {expandedFaq === 7 ? (
                        <X className="h-4 w-4 text-primary" />
                      ) : (
                        <Plus className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                    {expandedFaq === 7 && (
                      <div className="text-gray-400 py-2 pl-4 font-montserrat">
                        Yes! Our platform is fully responsive and optimized for all devices. Watch from your phone, tablet, laptop, or smart TV. All features are available across all devices.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
