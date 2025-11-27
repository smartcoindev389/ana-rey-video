import { useState, useEffect, useRef, useMemo } from 'react';
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
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import CourseHeroSection from '@/components/CourseHeroSection';
import { faqApi, Faq } from '@/services/faqApi';
import { settingsApi } from '@/services/settingsApi';
import { categoryApi, Category, seriesApi, videoApi } from '@/services/videoApi';
import { feedbackApi, Feedback } from '@/services/feedbackApi';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/hooks/useLocale';
import cover1 from '@/assets/cover1.webp';
import cover2 from '@/assets/cover2.webp';
import cover3 from '@/assets/cover3.webp';
import cover4 from '@/assets/cover4.webp';
import cover5 from '@/assets/cover5.webp';
import cover6 from '@/assets/cover6.webp';
import cover7 from '@/assets/cover7.webp';
import cover8 from '@/assets/cover8.webp';
import logoSA from '@/assets/logoSA-negro.png';

const Home = () => {
  const [popularSeries, setPopularSeries] = useState<MockSeries[]>([]);
  const [newSeries, setNewSeries] = useState<MockSeries[]>([]);
  const [recommendedSeries, setRecommendedSeries] = useState<MockSeries[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState(0); // Start at first category tab
  const [faqs, setFaqs] = useState<Record<string, Faq[]>>({});
  const [faqLoading, setFaqLoading] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [seriesByCategory, setSeriesByCategory] = useState<Record<number, any[]>>({});
  const [seriesLoading, setSeriesLoading] = useState(false);
  const [testimonials, setTestimonials] = useState<Feedback[]>([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(false);
  const [featuredCourse, setFeaturedCourse] = useState<any>(null);
  const [featuredCourses, setFeaturedCourses] = useState<any[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [heroSettings, setHeroSettings] = useState<Record<string, string>>({});
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [homepageVideos, setHomepageVideos] = useState<any[]>([]);
  const [homepageVideosLoading, setHomepageVideosLoading] = useState(false);
  const homepageVideosCarouselRef = useRef<HTMLDivElement>(null);
  const [showVideosLeftArrow, setShowVideosLeftArrow] = useState(false);
  const [showVideosRightArrow, setShowVideosRightArrow] = useState(true);
  const [shouldCenterVideos, setShouldCenterVideos] = useState(false);
  const tabContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated, updateUser } = useAuth();
  const { t } = useTranslation();
  const { navigateWithLocale, getPathWithLocale, locale } = useLocale();

  // Bunny.net stream base URL for direct MP4 previews (e.g. https://your-stream-zone.b-cdn.net)
  const BUNNY_STREAM_BASE = import.meta.env.VITE_BUNNY_STREAM_URL || '';

  const getBunnyPreviewUrl = (video: any): string | null => {
    if (!video) return null;
    // If backend ever stores a direct MP4 URL, prefer that
    if (video.bunny_video_url && (video.bunny_video_url as string).startsWith('http')) {
      return video.bunny_video_url;
    }
    // Otherwise, build from bunny_video_id + Bunny stream base
    if (!video.bunny_video_id) return null;
    if (!BUNNY_STREAM_BASE) {
      console.warn('[Homepage preview] VITE_BUNNY_STREAM_URL is not set, skipping video preview.');
      return null;
    }
    const base = BUNNY_STREAM_BASE.replace(/\/+$/, '');
    return `${base}/${video.bunny_video_id}/play_720p.mp4`;
  };

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
    navigateWithLocale(`/series/${courseId}`);
  };

  const handleCategoryClick = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
    navigateWithLocale(`/category/${categoryId}`);
  };

  const centerActiveTab = (tabIndex: number, instant: boolean = false) => {
    if (tabContainerRef.current) {
      const container = tabContainerRef.current;
      const activeButton = container.querySelector(`[data-tab-index="${tabIndex}"]`) as HTMLElement;
      
      if (activeButton && activeButton.offsetWidth > 0) {
        // Get container dimensions
        const containerWidth = container.clientWidth;
        const containerRect = container.getBoundingClientRect();
        
        // Get active button dimensions and position relative to container
        const buttonRect = activeButton.getBoundingClientRect();
        const buttonLeft = buttonRect.left - containerRect.left + container.scrollLeft;
        const buttonWidth = buttonRect.width;
        
        // Calculate the scroll position to center the button
        const scrollLeft = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);
        
        // Ensure scroll position is within bounds
        const maxScroll = container.scrollWidth - containerWidth;
        const finalScrollLeft = Math.max(0, Math.min(scrollLeft, maxScroll));
        
        // Scroll to center the active tab (instant on first load, smooth on interactions)
        container.scrollTo({
          left: finalScrollLeft,
          behavior: instant ? 'auto' : 'smooth'
        });
        
        return true; // Successfully centered
      }
      return false; // Tab not ready yet
    }
    return false;
  };

  const handleTabClick = (index: number) => {
    const currentTab = tabData[index];
    if (!currentTab) {
      return;
    }
    setActiveTab(index);
    // Use setTimeout to ensure the DOM has updated, with smooth scrolling
    setTimeout(() => centerActiveTab(index, false), 50);
  };

  // Center the active tab when it changes
  useEffect(() => {
    if (tabContainerRef.current && categories.length > 0) {
      // Use requestAnimationFrame to ensure all layout calculations are complete
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Additional delay to ensure tabs are fully rendered and have their widths calculated
          setTimeout(() => {
            centerActiveTab(activeTab, true);
          }, 150);
        });
      });
    }
  }, [activeTab]);

  // Center the active tab when categories first load
  useEffect(() => {
    if (tabContainerRef.current && categories.length > 0) {
      let attempts = 0;
      const maxAttempts = 20; // Try up to 20 times
      
      const tryCenter = () => {
        attempts++;
        const centered = centerActiveTab(activeTab, true);
        
        if (!centered && attempts < maxAttempts) {
          // Tab not ready yet, try again
          requestAnimationFrame(tryCenter);
        }
      };
      
      // Start trying after a small initial delay
      const initialTimer = setTimeout(() => {
        requestAnimationFrame(tryCenter);
      }, 50);

      return () => {
        clearTimeout(initialTimer);
      };
    }
  }, [categories]);

  // Center active tab on window resize
  useEffect(() => {
    const handleResize = () => {
      if (tabContainerRef.current) {
        centerActiveTab(activeTab, true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeTab]);

  const toggleFaq = (faqId: number) => {
    setExpandedFaq(expandedFaq === faqId ? null : faqId);
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

  // Helper to construct full URL if needed (defined early for use in useEffect)
  const getImageUrl = (src: string) => {
    if (!src || !src.trim()) return cover1;
    // If it's already a full URL, return as is
    if (src.startsWith('http://') || src.startsWith('https://')) {
      return src;
    }
    // If it starts with /storage or /, construct full URL
    if (src.startsWith('/storage/') || src.startsWith('/')) {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      return `${API_BASE_URL.replace('/api', '')}${src}`;
    }
    // If it's a relative path without leading slash, construct full URL
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    return `${API_BASE_URL.replace('/api', '')}/${src.replace(/^\//, '')}`;
  };

  // HBO Max style poster collage data - pulled from DB when available
  const [heroBgUrls, setHeroBgUrls] = useState<string[]>([]);

  useEffect(() => {
    // Fetch public hero backgrounds from DB
    const fetchHeroBackgrounds = async () => {
      try {
        const { heroBackgroundApi } = await import('@/services/heroBackgroundApi');
        const resp = await heroBackgroundApi.getPublic();
        if (resp?.success && Array.isArray(resp.data) && resp.data.length > 0) {
          const urls = resp.data
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            .map(bg => {
              const url = bg.image_url || bg.image_path;
              // Construct full URL if needed, add cache-busting parameter
              if (url && url.trim()) {
                const fullUrl = getImageUrl(url);
                // Add timestamp to prevent caching
                const finalUrl = fullUrl.includes('?') 
                  ? `${fullUrl}&t=${Date.now()}` 
                  : `${fullUrl}?t=${Date.now()}`;
                return finalUrl;
              }
              return null;
            })
            .filter((url): url is string => Boolean(url) && url.trim() !== '');
          setHeroBgUrls(urls);
        } else {
          // If no backgrounds found, clear the state
          setHeroBgUrls([]);
        }
      } catch (e) {
        // Silent fallback to defaults
        console.warn('Hero backgrounds fetch failed; using defaults', e);
        setHeroBgUrls([]);
      }
    };

    fetchHeroBackgrounds();
    
    // Refetch every 30 seconds to get new uploads (optional, but helpful)
    const interval = setInterval(fetchHeroBackgrounds, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // HBO Max style poster collage data - now configurable from admin
  const getPosterCollage = () => {
    const defaultCollage = [
      { src: cover1, alt: t('general.sculpting_series'), rotation: -8, x: 10, y: 15 },
      { src: cover2, alt: t('general.art_techniques'), rotation: 12, x: 25, y: 5 },
      { src: cover3, alt: t('general.master_classes'), rotation: -5, x: 45, y: 20 },
      { src: cover4, alt: t('general.restoration'), rotation: 8, x: 65, y: 10 },
      { src: cover5, alt: t('general.behind_scenes'), rotation: -12, x: 80, y: 25 },
      { src: cover6, alt: t('general.professional_tips'), rotation: 6, x: 15, y: 35 },
      { src: cover7, alt: t('general.creative_process'), rotation: -10, x: 35, y: 40 },
      { src: cover8, alt: t('general.expert_insights'), rotation: 9, x: 55, y: 35 },
      { src: cover1, alt: t('general.studio_sessions'), rotation: -7, x: 75, y: 45 },
      { src: cover2, alt: t('general.art_history'), rotation: 11, x: 5, y: 55 },
      { src: cover3, alt: t('general.modern_art'), rotation: -9, x: 30, y: 60 },
      { src: cover4, alt: t('general.classical_techniques'), rotation: 7, x: 60, y: 55 },
      { src: cover5, alt: t('general.digital_art'), rotation: -11, x: 85, y: 65 },
      { src: cover6, alt: t('general.traditional_methods'), rotation: 5, x: 20, y: 75 },
      { src: cover7, alt: t('general.contemporary_art'), rotation: -6, x: 50, y: 75 },
      { src: cover8, alt: t('general.artistic_vision'), rotation: 10, x: 70, y: 80 }
    ];

    // Prefer database hero backgrounds if available
    if (heroBgUrls.length > 0) {
      return defaultCollage.map((d, index) => {
        const dbUrl = heroBgUrls[index % heroBgUrls.length];
        // Only use database URL if it's valid and not empty
        const finalSrc = (dbUrl && dbUrl.trim()) ? dbUrl : d.src;
        return {
          src: finalSrc,
          alt: `${t('general.background')} ${index + 1}`,
          rotation: d.rotation,
          x: d.x,
          y: d.y,
        };
      });
    }

    // Otherwise, if hero settings have background images, use them
    if (heroSettings.hero_background_images) {
      try {
        const customImages = JSON.parse(heroSettings.hero_background_images);
        if (Array.isArray(customImages) && customImages.length > 0) {
          return customImages.map((img, index) => ({
            src: img.url ? getImageUrl(img.url) : defaultCollage[index % defaultCollage.length].src,
            alt: img.alt || `${t('general.background')} ${index + 1}`,
            rotation: img.rotation || defaultCollage[index % defaultCollage.length].rotation,
            x: img.x || defaultCollage[index % defaultCollage.length].x,
            y: img.y || defaultCollage[index % defaultCollage.length].y
          }));
        }
      } catch (error) {
        console.error('Error parsing hero background images:', error);
      }
    }

    return defaultCollage;
  };

  // Make posterCollage reactive to heroBgUrls and heroSettings changes
  const posterCollage = useMemo(() => getPosterCollage(), [heroBgUrls, heroSettings, t]);

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

  // Fetch FAQs from backend
  useEffect(() => {
    const fetchFaqs = async () => {
      setFaqLoading(true);
      try {
        const response = await faqApi.getFaqs(undefined, locale);
        // Keep the grouped structure for category display
        setFaqs(response.data);
      } catch (error) {
        console.error('Error fetching FAQs:', error);
        // Fallback to empty state if API fails
        setFaqs({});
      } finally {
        setFaqLoading(false);
      }
    };

    fetchFaqs();
  }, [locale]); // Refetch when locale changes

  // Fetch Hero Settings from backend
  useEffect(() => {
    const fetchHeroSettings = async () => {
      setSettingsLoading(true);
      try {
        const response = await settingsApi.getPublicSettings();
        if (response.success) {
          console.log('Hero settings loaded:', response.data);
          console.log('About image URL:', response.data.about_image);
          setHeroSettings(response.data);
        }
      } catch (error) {
        console.error('Error fetching hero settings:', error);
        // Fallback to default values if API fails
        setHeroSettings({
          hero_title: t('hero.title'),
          hero_subtitle: t('hero.subtitle'),
          hero_cta_text: t('hero.cta_text'),
          hero_price: '$9.99/month',
          hero_cta_button_text: t('hero.cta_button'),
          hero_disclaimer: t('hero.disclaimer')
        });
      } finally {
        setSettingsLoading(false);
      }
    };

    fetchHeroSettings();
  }, []);

  // Handle payment success/cancel callbacks from Stripe
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');

    if (paymentStatus === 'success' && sessionId) {
      // Payment successful - refresh user data to get updated subscription
      const refreshUser = async () => {
        try {
          const response = await api.getUser();
          if (response.user) {
            updateUser(response.user);
            toast.success(t('subscription.payment_success') || 'Payment successful! Your subscription is now active.');
          }
        } catch (error) {
          console.error('Error refreshing user after payment:', error);
          toast.success(t('subscription.payment_success') || 'Payment successful!');
        }
      };
      refreshUser();
      
      // Clean up URL
      searchParams.delete('payment');
      searchParams.delete('session_id');
      setSearchParams(searchParams, { replace: true });
    } else if (paymentStatus === 'cancel') {
      toast.error(t('subscription.payment_cancelled') || 'Payment was cancelled.');
      
      // Clean up URL
      searchParams.delete('payment');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, updateUser, t]);

  // Fetch Categories and Series from backend
  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const response = await categoryApi.getPublic(locale);
        if (response.success) {
          const cats = response.data || [];
          setCategories(cats);
          // Set activeTab to first category
          if (cats.length > 0) {
            setActiveTab(0);
          }
          
          // Fetch series for each category
          if (cats.length > 0) {
            await fetchSeriesForCategories(cats);
          }
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, [locale]); // Refetch when locale changes

  // Fetch videos for all categories
  const fetchSeriesForCategories = async (cats: Category[]) => {
    setSeriesLoading(true);
    try {
      const videosPromises = cats.map(async (category) => {
        try {
          const response = await videoApi.getPublic({
            category_id: category.id,
            status: 'published',
            per_page: 10
          });
          // Handle both paginated and non-paginated responses
          const videosData = response.data?.data || response.data;
          const videos = Array.isArray(videosData) ? videosData : [];
          
          // Transform videos to match the expected series format
          const series = videos.map((video: any) => {
            // Prioritize full URLs from model accessors, then fallback to raw paths
            const imageUrl = video.intro_image_url 
              || getImageUrl(video.intro_image || cover1);
            
            return {
              id: video.id,
              title: video.title,
              subtitle: video.short_description || video.description || '',
              image: imageUrl,
              videoCount: 1, // Each video is a single item
              duration: `${Math.floor((video.duration || 0) / 60)}m`,
              viewers: video.views || 0,
              rating: parseFloat(video.rating || '0'),
              visibility: video.visibility || 'freemium'
            };
          });
          
          return { categoryId: category.id, series };
        } catch (error) {
          console.error(`Error fetching videos for category ${category.id}:`, error);
          return { categoryId: category.id, series: [] };
        }
      });

      const results = await Promise.all(videosPromises);
      const seriesMap: Record<number, any[]> = {};
      results.forEach(({ categoryId, series }) => {
        seriesMap[categoryId] = series;
      });
      setSeriesByCategory(seriesMap);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setSeriesLoading(false);
    }
  };

  // Fetch Featured Videos (videos with most reviews/comments)
  useEffect(() => {
    const fetchFeaturedVideos = async () => {
      setFeaturedLoading(true);
      try {
        // Fetch videos sorted by comment count (reviews), fallback to views if no comments
        const response = await videoApi.getPublic({
          status: 'published',
          sort_by: 'reviews',
          sort_order: 'desc',
          per_page: 6
        });
        
        const videosData = response.data?.data || response.data;
        const videos = Array.isArray(videosData) ? videosData : [];
        
        if (videos.length > 0) {
          // Use first video as featured course
          const firstVideo = videos[0];
          setFeaturedCourse({
            id: firstVideo.id,
            title: firstVideo.title,
            description: firstVideo.short_description || firstVideo.description || '',
            video: firstVideo, // Include full video object for preview
            image: getImageUrl(firstVideo.thumbnail_url || firstVideo.intro_image_url || firstVideo.thumbnail || firstVideo.intro_image || cover1),
            category: firstVideo.category?.name || t('general.uncategorized'),
            duration: `${Math.floor((firstVideo.duration || 0) / 60)}m`,
            rating: parseFloat(firstVideo.rating || '0'),
            studentsCount: firstVideo.views || 0,
            instructor: firstVideo.instructor?.name || t('general.instructor'),
            comments_count: (firstVideo as any).comments_count || 0,
            views: firstVideo.views || 0
          });
          
          // Use remaining videos as featured courses
          const remainingVideos = videos.slice(1).map((video: any) => ({
            id: video.id,
            title: video.title,
            video: video, // Include full video object for preview
            image: getImageUrl(video.thumbnail_url || video.intro_image_url || video.thumbnail || video.intro_image || cover1),
            duration: `${Math.floor((video.duration || 0) / 60)}m`,
            rating: parseFloat(video.rating || '0'),
            studentsCount: video.views || 0,
            instructor: video.instructor?.name || t('general.instructor'),
            category: video.category?.name || t('general.uncategorized'),
            comments_count: (video as any).comments_count || 0
          }));
          
          setFeaturedCourses(remainingVideos);
        } else {
          // Fallback: Fetch videos sorted by views if no videos with comments
          const fallbackResponse = await videoApi.getPublic({
            status: 'published',
            sort_by: 'views',
            sort_order: 'desc',
            per_page: 6
          });
          
          const fallbackData = fallbackResponse.data?.data || fallbackResponse.data;
          const fallbackVideos = Array.isArray(fallbackData) ? fallbackData : [];
          
          if (fallbackVideos.length > 0) {
            const firstVideo = fallbackVideos[0];
            setFeaturedCourse({
              id: firstVideo.id,
              title: firstVideo.title,
              description: firstVideo.short_description || firstVideo.description || '',
              video: firstVideo,
              image: getImageUrl(firstVideo.thumbnail_url || firstVideo.intro_image_url || firstVideo.thumbnail || firstVideo.intro_image || cover1),
              category: firstVideo.category?.name || 'Uncategorized',
              duration: `${Math.floor((firstVideo.duration || 0) / 60)}m`,
              rating: parseFloat(firstVideo.rating || '0'),
              studentsCount: firstVideo.views || 0,
              instructor: firstVideo.instructor?.name || 'Instructor',
            comments_count: (firstVideo as any).comments_count || 0,
            views: firstVideo.views || 0
            });
            
            const remainingVideos = fallbackVideos.slice(1).map((video: any) => ({
              id: video.id,
              title: video.title,
              video: video,
              image: getImageUrl(video.thumbnail_url || video.intro_image_url || video.thumbnail || video.intro_image || cover1),
              duration: `${Math.floor((video.duration || 0) / 60)}m`,
              rating: parseFloat(video.rating || '0'),
              studentsCount: video.views || 0,
              instructor: video.instructor?.name || t('general.instructor'),
              category: video.category?.name || t('general.uncategorized'),
              comments_count: (video as any).comments_count || 0
            }));
            
            setFeaturedCourses(remainingVideos);
          }
        }
      } catch (error) {
        console.error('Error fetching featured videos:', error);
      } finally {
        setFeaturedLoading(false);
      }
    };

    fetchFeaturedVideos();
  }, [locale]);

  // Fetch Testimonials
  useEffect(() => {
    const fetchTestimonials = async () => {
      setTestimonialsLoading(true);
      try {
        // Get selected testimonials from settings
        const selectedIds = heroSettings.homepage_testimonial_ids;
        let testimonialIds: number[] = [];
        
        if (selectedIds) {
          try {
            testimonialIds = JSON.parse(selectedIds);
          } catch (e) {
            console.error('Error parsing homepage_testimonial_ids:', e);
          }
        }

        // Fetch all approved testimonials (using feedback with type 'general_feedback')
        const response = await feedbackApi.getAll({ type: 'general_feedback', status: 'resolved' });
        if (response.success) {
          let allTestimonials = response.data?.data || response.data || [];
          
          // Filter to show only selected testimonials if any are selected
          if (testimonialIds.length > 0) {
            allTestimonials = allTestimonials.filter((t: Feedback) => testimonialIds.includes(t.id));
          }
          
          setTestimonials(allTestimonials);
        }
      } catch (error) {
        console.error('Error fetching testimonials:', error);
        setTestimonials([]);
      } finally {
        setTestimonialsLoading(false);
      }
    };

    // Only fetch when heroSettings is loaded
    if (Object.keys(heroSettings).length > 0) {
      fetchTestimonials();
    }
  }, [heroSettings]);

  // Fetch Homepage Videos (selected videos for carousel)
  useEffect(() => {
    const fetchHomepageVideos = async () => {
      setHomepageVideosLoading(true);
      try {
        // Get selected video IDs from settings
        const selectedIds = heroSettings.homepage_video_ids;
        let videoIds: number[] = [];
        
        if (selectedIds) {
          try {
            videoIds = typeof selectedIds === 'string' ? JSON.parse(selectedIds) : selectedIds;
          } catch (e) {
            console.error('Error parsing homepage_video_ids:', e);
          }
        }

        // If no videos selected, don't fetch
        if (videoIds.length === 0) {
          setHomepageVideos([]);
          setHomepageVideosLoading(false);
          return;
        }

        console.log('Fetching homepage videos, selected IDs:', videoIds, 'Total IDs:', videoIds.length);

        // Fetch all published videos with high limit
        const publicResponse = await videoApi.getPublic({ 
          status: 'published', 
          per_page: 1000,
          sort_by: 'created_at',
          sort_order: 'desc'
        });
        
        const responseData = publicResponse.data;
        const videosData = responseData?.data || [];
        const allPublicVideos = Array.isArray(videosData) ? videosData : [];
        
        console.log('Total published videos fetched:', allPublicVideos.length);
        console.log('Pagination info:', {
          current_page: responseData?.current_page,
          last_page: responseData?.last_page,
          total: responseData?.total
        });

        // Filter to only selected videos and maintain order
        const validVideos = videoIds
          .map(id => {
            const video = allPublicVideos.find((v: any) => v.id === id);
            if (!video) {
              console.warn(`Video ${id} not found in published videos`);
              return null;
            }
            return {
              id: video.id,
              title: video.title,
              video: video,
              image: getImageUrl(video.thumbnail_url || video.intro_image_url || video.thumbnail || video.intro_image || cover1),
              duration: `${Math.floor((video.duration || 0) / 60)}m`,
              rating: parseFloat(video.rating || '0'),
              studentsCount: video.views || 0,
              instructor: video.instructor?.name || t('general.instructor'),
              category: video.category?.name || t('general.uncategorized'),
            };
          })
          .filter(v => v !== null);

        console.log('Fetched homepage videos:', validVideos.length, 'out of', videoIds.length, 'selected');
        if (validVideos.length < videoIds.length) {
          console.warn('Some videos were not found. Missing IDs:', 
            videoIds.filter(id => !allPublicVideos.find((v: any) => v.id === id))
          );
        }

        setHomepageVideos(validVideos);
      } catch (error) {
        console.error('Error fetching homepage videos:', error);
        setHomepageVideos([]);
      } finally {
        setHomepageVideosLoading(false);
      }
    };

    // Only fetch when heroSettings is loaded
    if (Object.keys(heroSettings).length > 0) {
      fetchHomepageVideos();
    }
  }, [heroSettings]);

  // Check if homepage videos carousel should be centered and show/hide arrows
  useEffect(() => {
    const checkCenterVideos = () => {
      if (homepageVideosCarouselRef.current) {
        const container = homepageVideosCarouselRef.current;
        const containerWidth = container.clientWidth;
        const contentWidth = container.scrollWidth;
        
        // If content fits within container, center it
        setShouldCenterVideos(contentWidth <= containerWidth);
        
        // Check arrow visibility
        setShowVideosLeftArrow(container.scrollLeft > 0);
        setShowVideosRightArrow(
          container.scrollLeft < contentWidth - containerWidth - 10
        );
      }
    };

    checkCenterVideos();
    
    // Check on window resize and when videos change
    const handleResize = () => {
      checkCenterVideos();
    };
    window.addEventListener('resize', handleResize);
    
    // Also check on scroll
    const handleScroll = () => {
      checkCenterVideos();
    };
    if (homepageVideosCarouselRef.current) {
      homepageVideosCarouselRef.current.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (homepageVideosCarouselRef.current) {
        homepageVideosCarouselRef.current.removeEventListener('scroll', handleScroll);
      }
    };
  }, [homepageVideos]);

  const scrollVideosCarousel = (direction: 'left' | 'right') => {
    if (homepageVideosCarouselRef.current) {
      const scrollAmount = homepageVideosCarouselRef.current.clientWidth * 0.8;
      const newScrollLeft = homepageVideosCarouselRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      
      homepageVideosCarouselRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });

      setTimeout(() => {
        if (homepageVideosCarouselRef.current) {
          setShowVideosLeftArrow(homepageVideosCarouselRef.current.scrollLeft > 0);
          setShowVideosRightArrow(
            homepageVideosCarouselRef.current.scrollLeft < homepageVideosCarouselRef.current.scrollWidth - homepageVideosCarouselRef.current.clientWidth - 10
          );
        }
      }, 300);
    }
  };

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


  // Transform categories from database to courseCategories format
  const courseCategories = categories.map((category) => {
    // Get image from category's URL fields (from backend accessors) or raw fields, fallback to default
    // Priority: image_url > cover_image_url > thumbnail_url > image > cover_image > thumbnail
    const categoryImage = category.image_url 
      || category.cover_image_url 
      || category.thumbnail_url 
      || category.image 
      || category.cover_image 
      || category.thumbnail;
    // If it's already a full URL (from accessors), use it directly; otherwise construct URL
    const imageUrl = categoryImage 
      ? (categoryImage.startsWith('http') || categoryImage.startsWith('/') 
          ? categoryImage 
          : getImageUrl(categoryImage)) 
      : cover1;
    
    return {
      id: category.id,
      title: category.name,
      image: imageUrl,
      courseCount: (category as any).videos_count || 0,
      description: category.description || category.short_description || '',
      category: category.name
    };
  });

  const SeriesCard = ({ series }: { series: any }) => {
    const imageSrc = series.image || cover1;
    const finalImageUrl = getImageUrl(imageSrc);

    return (
      <Card className="group cursor-pointer overflow-visible border-0 bg-transparent transform hover:scale-105 transition-all duration-300 hover:shadow-2xl" onClick={() => navigateWithLocale(`/series/${series.id}`)}>
        <div className="aspect-[3/2] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 relative overflow-hidden rounded-lg shadow-lg">
          {/* Background Image */}
          <img
            src={finalImageUrl}
            alt={series.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              // Fallback to default cover if image fails to load
              const target = e.target as HTMLImageElement;
              if (target.src !== cover1) {
                target.src = cover1;
              }
            }}
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
  };

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

  // Generate tab data from database categories
  const generateTabData = () => {
    const categoryTabs = categories.map((category, index) => {
      // Get series data from backend for this category
      const seriesData = seriesByCategory[category.id] || [];

      return {
        id: category.id,
        title: category.name.toUpperCase(),
        icon: TrendingUp,
        summary: category.description || t('general.discover_amazing_content'),
        description: category.description || t('general.explore_curated_collection'),
        features: [t('general.expert_content'), t('general.professional_techniques'), t('general.quality_learning')],
        backgroundImage: cover1,
        series: seriesData
      };
    });

    return categoryTabs;
  };

  const tabData = generateTabData();

  const TabbedCarousel = () => {
    const currentTab = tabData[activeTab];
    
    // Show loading state if categories are still loading
    if (categoriesLoading || categories.length === 0) {
      return (
        <section className="mb-16 lg:mb-20">
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-400 text-xl">{t('general.loading_categories')}</div>
          </div>
        </section>
      );
    }
    
    return (
      <section className="mb-16 lg:mb-20">
        {/* HBO Max Style Header with Tab Navigation */}
        
        
        {/* Tab Navigation - HBO Max Style - Arrows aligned with content ends */}
        <div className="flex items-center justify-between mb-8 lg:mb-12 w-full max-w-6xl mx-auto">
          {/* Left Arrow - Aligned to content left */}
          <button 
            onClick={() => {
              const newIndex = activeTab - 1;
              if (newIndex >= 0) {
                handleTabClick(newIndex);
              }
            }}
            className="text-gray-400 hover:text-white transition-colors duration-300 p-4 flex-shrink-0"
          >
            <ChevronRight className="h-8 w-8 rotate-180" />
          </button>
          
          {/* Tab Labels - Show all tabs in single row */}
          <div 
            ref={tabContainerRef}
            className="flex items-center space-x-6 lg:space-x-8 overflow-x-auto hide-scrollbar w-full flex-nowrap"
          >
            {tabData.map((tab, index) => (
              <button
                key={tab.id}
                data-tab-index={index}
                onClick={() => handleTabClick(index)}
                className={`text-2xl lg:text-3xl xl:text-4xl font-light transition-colors duration-300 flex-shrink-0 whitespace-nowrap ${
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
            onClick={() => {
              const newIndex = activeTab + 1;
              if (newIndex < tabData.length) {
                handleTabClick(newIndex);
              }
            }}
            className="text-gray-400 hover:text-white transition-colors duration-300 p-4 flex-shrink-0"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </div>
        
        {/* HBO Max Style Grid - Single Row with Arrow Navigation */}
        <div className="w-full max-w-6xl mx-auto">
          <div className="flex items-center">
            
            {/* Content Grid */}
            <div 
              className="content-grid grid grid-flow-col grid-rows-1 gap-6 lg:gap-8 overflow-x-auto hide-scrollbar py-4 flex-1"
            >
              {currentTab.series.map((item) => (
                <div key={item.id} className="w-72 md:w-80 lg:w-96 flex-shrink-0 hover:z-50 transition-all duration-300 group">
                  <SeriesCard series={item} />
                </div>
              ))}
            </div>
            
           
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
                    key={`${poster.src}-${index}`}
                    onError={(e) => {
                      // Fallback to default cover if image fails to load
                      const target = e.target as HTMLImageElement;
                      if (!target.src.includes('cover')) {
                        const covers = [cover1, cover2, cover3, cover4, cover5, cover6, cover7, cover8];
                        target.src = covers[index % covers.length];
                      }
                    }}
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
                    {settingsLoading ? t('common.loading') : `${heroSettings.hero_cta_text || t('hero.cta_text')} ${heroSettings.hero_price || '$9.99/month'}`}
                  </p>                 
                  </div>

                {/* Subscribe Button */}
                <div className="pt-4">
                  {isAuthenticated ? (
                      <Button 
                        size="lg" 
                      className="bg-white text-black hover:bg-white/90 font-bold text-lg lg:text-xl px-12 lg:px-16 py-4 lg:py-5 rounded-md shadow-xl transition-all duration-300 hover:scale-105"
                        onClick={() => navigateWithLocale('/explore')}
                      >
{settingsLoading ? t('common.loading') : (heroSettings.hero_cta_button_text || t('hero.cta_button'))}
                      </Button>
                  ) : (
                      <Button
                        onClick={handleGetStarted}
                        size="lg"
                      className="bg-white text-black hover:bg-white/90 font-bold text-lg lg:text-xl px-12 lg:px-16 py-4 lg:py-5 rounded-md shadow-xl transition-all duration-300 hover:scale-105"
                      >
{settingsLoading ? t('common.loading') : (heroSettings.hero_cta_button_text || t('hero.cta_button'))}
                      </Button>
                  )}
                </div>

                {/* Disclaimer */}
                <div className="pt-8 lg:pt-12">
                  <p className="text-xs lg:text-sm text-white/70 max-w-4xl mx-auto leading-relaxed">
                    {settingsLoading ? t('common.loading') : (heroSettings.hero_disclaimer || t('hero.disclaimer'))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

       {/* Course Hero Section - Two Part Layout */}
       {featuredLoading ? (
         <div className="py-16 lg:py-24 px-4 md:px-8 bg-[#141414]">
           <div className="container mx-auto max-w-7xl">
             <div className="flex items-center justify-center py-20">
               <div className="text-gray-400 text-xl">{t('common.loading')}</div>
             </div>
           </div>
         </div>
       ) : featuredCourse ? (
         <CourseHeroSection
           featuredCourse={featuredCourse}
           courseCategories={courseCategories}
           featuredCourses={featuredCourses}
           onCourseClick={handleCourseClick}
           onCategoryClick={handleCategoryClick}
           selectedCategoryId={selectedCategoryId}
          heroBackgroundImage={(() => {
            // First, try to use first hero background from database
            if (heroBgUrls.length > 0) {
              return heroBgUrls[0];
            }
            // Fallback: Get hero background image from settings
            if (heroSettings.hero_background_images) {
              try {
                const customImages = JSON.parse(heroSettings.hero_background_images);
                if (Array.isArray(customImages) && customImages.length > 0) {
                  // Get the first image URL
                  const firstImage = customImages[0];
                  const imageUrl = firstImage.url || '';
                  if (imageUrl) {
                    return getImageUrl(imageUrl);
                  }
                }
              } catch (e) {
                console.error('Error parsing hero_background_images:', e);
              }
            }
            return null;
          })()}
         />
       ) : null}

      {/* Content Sections - HBO Max Style */}
      <div className="w-full px-4 md:px-8 lg:px-16 xl:px-24 2xl:px-32 pt-16 lg:pt-20 pb-12 lg:pb-20">
          <TabbedCarousel />
        </div>

      {/* Homepage Video Carousel */}
      {homepageVideos.length > 0 && (
        <section className="py-16 lg:py-24 px-4 md:px-8 bg-[#141414]">
          <div className="container mx-auto max-w-7xl">
            <div className="space-y-12">
              {/* Section Title */}
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
                  {t('general.featured_courses')}
                </h2>
                <p className="text-gray-400 text-xl md:text-2xl">
                  {t('general.handpicked_courses_subtitle')}
                </p>
              </div>
              
              {/* Video Carousel */}
              {homepageVideosLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-400">{t('common.loading')}</p>
                </div>
              ) : (
                <div className="relative group">
                  {/* Left Arrow */}
                  {showVideosLeftArrow && !shouldCenterVideos && (
                    <button
                      onClick={() => scrollVideosCarousel('left')}
                      className="absolute left-0 top-0 bottom-0 z-20 w-12 md:w-16 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/90"
                    >
                      <ChevronRight className="w-8 h-8 md:w-10 md:h-10 text-white rotate-180" />
                    </button>
                  )}
                  
                  {/* Video Carousel */}
                  <div 
                    ref={homepageVideosCarouselRef}
                    className={`flex space-x-8 overflow-x-auto hide-scrollbar py-4 ${shouldCenterVideos ? 'justify-center' : ''}`}
                  >
                    {homepageVideos.map((video) => {
                      const VideoCardPreview = () => {
                        const videoRef = useRef<HTMLVideoElement>(null);
                        const timeoutRef = useRef<NodeJS.Timeout | null>(null);

                        const previewSrc = getBunnyPreviewUrl(video.video);

                        const handleMouseEnter = () => {
                          if (videoRef.current && previewSrc) {
                            const vid = videoRef.current;
                            vid.currentTime = 0;
                            vid.play().catch(() => {});
                            
                            if (timeoutRef.current) {
                              clearTimeout(timeoutRef.current);
                            }
                            
                            timeoutRef.current = setTimeout(() => {
                              if (vid && !vid.paused) {
                                vid.pause();
                              }
                            }, 15000);
                          }
                        };

                        const handleMouseLeave = () => {
                          if (videoRef.current) {
                            const vid = videoRef.current;
                            vid.pause();
                            vid.currentTime = 0;
                            
                            if (timeoutRef.current) {
                              clearTimeout(timeoutRef.current);
                              timeoutRef.current = null;
                            }
                          }
                        };

                        return (
                          <div
                            className="group transition-all duration-300 hover:scale-105 flex-shrink-0 w-56 md:w-64 lg:w-72 cursor-pointer"
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                            onClick={() => handleCourseClick(video.id)}
                          >
                            <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-2xl relative group/card">
                              {/* Video Preview (15s) */}
                              {previewSrc && (
                                <video
                                  ref={videoRef}
                                  src={previewSrc}
                                  poster={video.image}
                                  className="absolute inset-0 w-full h-full object-cover"
                                  muted
                                  playsInline
                                  preload="auto"
                                  onLoadedData={(e) => {
                                    e.currentTarget.currentTime = 0.1;
                                    e.currentTarget.pause();
                                  }}
                                  onTimeUpdate={(e) => {
                                    if (e.currentTarget.currentTime >= 15) {
                                      e.currentTarget.pause();
                                      if (timeoutRef.current) {
                                        clearTimeout(timeoutRef.current);
                                        timeoutRef.current = null;
                                      }
                                    }
                                  }}
                                />
                              )}
                              {!video.video?.video_url_full && (
                                <img
                                  src={video.image}
                                  alt={video.title}
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                              
                              {/* Video Info */}
                              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                <div className="flex items-center justify-between mb-3">
                                  <Badge variant="secondary" className="bg-blue-600/80 text-white border-0 px-3 py-1 text-sm font-semibold">
                                    {video.category}
                                  </Badge>
                                  <div className="flex items-center space-x-1 text-sm">
                                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                    <span className="font-semibold">{video.rating}</span>
                                  </div>
                                </div>
                                <h3 className="font-bold text-xl md:text-2xl mb-2 group-hover:text-white transition-colors line-clamp-2">
                                  {video.title}
                                </h3>
                                <div className="flex items-center justify-between text-sm text-gray-300">
                                  <span className="font-medium">{video.instructor}</span>
                                  <span className="font-medium">{video.duration}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      };

                      return <VideoCardPreview key={video.id} />;
                    })}
                  </div>
                  
                  {/* Right Arrow */}
                  {showVideosRightArrow && !shouldCenterVideos && (
                    <button
                      onClick={() => scrollVideosCarousel('right')}
                      className="absolute right-0 top-0 bottom-0 z-20 w-12 md:w-16 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/90"
                    >
                      <ChevronRight className="w-8 h-8 md:w-10 md:h-10 text-white" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* About Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-gray-900 via-black to-gray-800">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl lg:text-5xl font-bold text-white font-playfair">
                {heroSettings.about_title || t('about.title')}
              </h2>
              <p className="text-lg lg:text-xl text-gray-400 font-montserrat leading-relaxed">
                {heroSettings.about_description || t('about.description')}
              </p>
              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="text-center">
                  <div className="text-3xl lg:text-4xl font-bold text-primary mb-2">50+</div>
                  <div className="text-gray-400 font-montserrat">{t('about.expert_instructors')}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl lg:text-4xl font-bold text-primary mb-2">1000+</div>
                  <div className="text-gray-400 font-montserrat">{t('about.master_classes')}</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[16/9] rounded-xl overflow-hidden shadow-2xl">
                  <iframe
                    src="https://www.youtube.com/embed/aHR2IFjhOwg"
                    title={t('general.about_sacrart')}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section - Single Row Carousel with Auto Slide */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-4 font-playfair text-white">
              {heroSettings.testimonial_title || t('testimonials.title')}
            </h2>
            <p className="text-lg lg:text-xl text-gray-400 max-w-3xl mx-auto font-montserrat">
              {heroSettings.testimonial_subtitle || t('testimonials.subtitle')}
            </p>
          </div>

          {testimonialsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-400">{t('testimonials.loading')}</p>
            </div>
          ) : testimonials.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">{t('testimonials.no_testimonials')}</p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <div 
                className="flex gap-6 lg:gap-8 animate-scroll"
                style={{
                  animation: `scroll ${testimonials.length * 10}s linear infinite`,
                  width: `calc(${testimonials.length * 400}px + ${(testimonials.length - 1) * 24}px)`
                }}
              >
                {/* Render testimonials twice for seamless loop */}
                {[...testimonials, ...testimonials].map((testimonial, index) => (
                  <div 
                    key={`${testimonial.id}-${index}`} 
                    className="flex-shrink-0 w-96 lg:w-[420px] bg-gray-900/50 rounded-xl p-8 lg:p-10 border border-white/10 hover:border-primary/50 transition-all duration-300 backdrop-blur-sm"
                  >
                    <div className="flex items-center mb-6">
                      {testimonial.user?.avatar ? (
                        <img
                          src={testimonial.user.avatar}
                          alt={testimonial.user?.name || t('general.user')}
                          className="w-12 h-12 rounded-full object-cover mr-4"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mr-4">
                          <span className="text-primary font-semibold">{(testimonial.user?.name || t('general.user')).charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                      <div>
                        <h4 className="text-white font-semibold font-montserrat">{testimonial.user?.name || t('general.anonymous')}</h4>
                      </div>
                    </div>
                    <p className="text-gray-300 leading-relaxed font-montserrat mb-4">
                      "{testimonial.description}"
                    </p>
                    <div className="flex">
                      {[...Array(testimonial.rating || 5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-50% - ${24 * (testimonials.length - 1)}px));
          }
        }
      `}</style>

      {/* Subscription Plans Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-transparent to-black/50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-4 font-playfair text-white">
              {t('plans.title')}
            </h2>
            <p className="text-lg lg:text-xl text-gray-400 max-w-3xl mx-auto font-montserrat">
              {t('plans.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 max-w-6xl mx-auto mb-8">
            {/* Freemium Plan */}
            <div className="bg-gray-900/50 rounded-xl p-8 lg:p-10 border border-white/10 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl backdrop-blur-sm flex flex-col">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2 text-white font-montserrat">{t('plans.freemium')}</h3>
                <div className="text-4xl font-bold text-white mb-2 font-montserrat">{t('plans.free')}</div>
                <p className="text-gray-400 font-montserrat">{t('plans.perfect_for_getting_started')}</p>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-center text-gray-300 font-montserrat">
                  <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                  <span>{t('features.access_basic_content')}</span>
                </li>
                <li className="flex items-center text-gray-300 font-montserrat">
                  <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                  <span>{t('features.community_support')}</span>
                </li>
                <li className="flex items-center text-gray-300 font-montserrat">
                  <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                  <span>{t('features.mobile_app_access')}</span>
                </li>
              </ul>
            </div>

            {/* Basic Plan */}
            <div className="bg-gray-900/50 rounded-xl p-8 lg:p-10 border-2 border-primary relative hover:shadow-2xl transition-all duration-300 backdrop-blur-sm transform hover:scale-105 flex flex-col">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-white px-4 py-1 font-semibold">{t('plans.most_popular')}</Badge>
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2 text-white font-montserrat">{t('plans.basic')}</h3>
                <div className="text-4xl font-bold text-white mb-2 font-montserrat">$19<span className="text-lg text-gray-400">{t('plans.per_month')}</span></div>
                <p className="text-gray-400 font-montserrat">{t('plans.for_art_enthusiasts')}</p>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-center text-gray-300 font-montserrat">
                  <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                  <span>{t('features.everything_in_freemium')}</span>
                </li>
                <li className="flex items-center text-gray-300 font-montserrat">
                  <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                  <span>{t('features.advanced_techniques')}</span>
                </li>
                <li className="flex items-center text-gray-300 font-montserrat">
                  <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                  <span>{t('features.downloadable_resources')}</span>
                </li>
                <li className="flex items-center text-gray-300 font-montserrat">
                  <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                  <span>{t('features.priority_support')}</span>
                </li>
              </ul>
            </div>

            {/* Premium Plan */}
            <div className="bg-gray-900/50 rounded-xl p-8 lg:p-10 border border-white/10 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl backdrop-blur-sm flex flex-col">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2 text-white font-montserrat">{t('plans.premium')}</h3>
                <div className="text-4xl font-bold text-white mb-2 font-montserrat">$39<span className="text-lg text-gray-400">{t('plans.per_month')}</span></div>
                <p className="text-gray-400 font-montserrat">{t('plans.for_professionals')}</p>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-center text-gray-300 font-montserrat">
                  <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                  <span>{t('features.everything_in_basic')}</span>
                </li>
                <li className="flex items-center text-gray-300 font-montserrat">
                  <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                  <span>{t('features.one_on_one_mentoring')}</span>
                </li>
                <li className="flex items-center text-gray-300 font-montserrat">
                  <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                  <span>{t('features.exclusive_masterclasses')}</span>
                </li>
                <li className="flex items-center text-gray-300 font-montserrat">
                  <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                  <span>{t('features.certification_programs')}</span>
                </li>
                <li className="flex items-center text-gray-300 font-montserrat">
                  <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                  <span>{t('features.premium_support_24_7')}</span>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Buttons Row - Aligned Horizontally */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-8 lg:gap-12 max-w-6xl mx-auto">
            <Button variant="outline" className="w-full md:w-auto md:flex-1 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white font-semibold" onClick={() => navigate('/auth')}>
              {t('plans.get_started_free')}
            </Button>
            <Button className="w-full md:w-auto md:flex-1 bg-primary hover:bg-primary/90 text-white font-semibold" onClick={() => navigate('/subscription')}>
              {t('plans.start_basic_plan')}
            </Button>
            <Button variant="outline" className="w-full md:w-auto md:flex-1 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white font-semibold" onClick={() => navigate('/subscription')}>
              {t('plans.go_premium')}
            </Button>
          </div>
        </div>
      </section>

       {/* FAQ Section - New Style with Categories */}
       <section className="py-16 lg:py-24 bg-gradient-to-br from-gray-900 via-black to-gray-800">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-4 font-playfair text-white">
              {t('faq.title')}
            </h2>
            <p className="text-lg lg:text-xl text-gray-400 max-w-3xl mx-auto font-montserrat">
              {t('faq.subtitle')}
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {faqLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-400">{t('faq.loading')}</p>
              </div>
            ) : (
              Object.entries(faqs).map(([category, categoryFaqs]) => (
                <div key={category} className="mb-12">
                  <h3 className="text-2xl font-bold text-white mb-6 font-playfair capitalize">
                    {category.replace('_', ' ')} {t('faq.faqs')}
                  </h3>
                  <div className="space-y-4">
                    {categoryFaqs.map((faq: Faq) => (
                      <div key={faq.id} className="bg-gray-900/50 rounded-xl border border-white/10 transform hover:border-primary/50 transition-all duration-300 backdrop-blur-sm">
                        <button
                          onClick={() => toggleFaq(faq.id)}
                          className="w-full text-left px-6 py-4 flex justify-between items-center hover:bg-white/5 transition-colors duration-200 rounded-xl"
                        >
                          <span className="text-lg font-semibold text-white font-montserrat">
                            {faq.question}
                          </span>
                          {expandedFaq === faq.id ? (
                            <X className="h-5 w-5 text-primary" />
                          ) : (
                            <Plus className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                        {expandedFaq === faq.id && (
                          <div className="px-6 pb-4">
                            <div className="text-gray-400 py-2 font-montserrat leading-relaxed">
                              {faq.answer}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
