import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Maximize,
  Settings,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  BookOpen,
  Lock,
  CheckCircle,
  Crown,
  Star,
  Zap,
  Share2,
  Heart,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/hooks/useLocale';
import { videoApi, categoryApi } from '@/services/videoApi';
import { userProgressApi } from '@/services/userProgressApi';
import { commentsApi, VideoComment } from '@/services/commentsApi';
import { feedbackApi } from '@/services/feedbackApi';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MessageCircle, Lightbulb } from 'lucide-react';

const VideoPlayer = () => {
  const { id, locale } = useParams<{ id: string; locale?: string }>();
  const [video, setVideo] = useState<any | null>(null);
  const [category, setCategory] = useState<any | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [quality, setQuality] = useState('1080p');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [progress, setProgress] = useState(0);
  const [userProgress, setUserProgress] = useState<any>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [commentSortBy, setCommentSortBy] = useState<'newest' | 'most_liked'>('newest');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'feedback' | 'suggestion'>('feedback');
  const [feedbackDescription, setFeedbackDescription] = useState('');
  const [feedbackRating, setFeedbackRating] = useState<number | null>(null);
  const [feedbackPriority, setFeedbackPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [videoFeedbacks, setVideoFeedbacks] = useState<any[]>([]);
  const [userHasFeedback, setUserHasFeedback] = useState(false);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { navigateWithLocale } = useLocale();

  useEffect(() => {
    const fetchVideoData = async () => {
      try {
        setLoading(true);
        
        // Fetch video details
        const videoResponse = await videoApi.get(parseInt(id || '1'));
        
        if (!videoResponse || !videoResponse.success) {
          throw new Error('Failed to fetch video data');
        }
        
        // Backend returns { success, data: { video, user_progress, next_video, previous_video } }
        const videoData = videoResponse.data.video;
        const existingProgress = videoResponse.data.user_progress;
        
        if (!videoData) {
          throw new Error('No video data received');
        }
        
        setVideo(videoData);
        
        // Debug: Log video URLs
        console.log('Video data loaded:', {
          id: videoData.id,
          title: videoData.title,
          video_url_full: videoData.video_url_full,
          video_url: videoData.video_url,
          video_file_path: videoData.video_file_path,
        });
        
        // Check if category is already loaded in the video object
        if (videoData.category) {
          setCategory(videoData.category);
        }
        
        // Fetch related videos from the same category
        if (videoData.category_id) {
          try {
            const relatedResponse = await videoApi.getPublic({ 
              category_id: videoData.category_id, 
              per_page: 5 
            });
            const relatedData = Array.isArray(relatedResponse.data) 
              ? relatedResponse.data 
              : relatedResponse.data?.data || [];
            setRelatedVideos(relatedData.filter((v: any) => v.id !== videoData.id).slice(0, 4));
          } catch (error) {
            console.error('Failed to fetch related videos:', error);
          }
        }
        
        // Use progress data that was included in the initial response
        if (existingProgress) {
          setUserProgress(existingProgress);
          setProgress(existingProgress.progress_percentage || 0);
          setCurrentTime(existingProgress.time_watched || 0);
          setIsFavorite(existingProgress.is_favorite === true || existingProgress.is_favorite === 1);
          setIsLiked(existingProgress.is_liked === true || existingProgress.is_liked === 1);
          setIsDisliked(existingProgress.is_disliked === true || existingProgress.is_disliked === 1);
        } else {
          // If no progress exists, try to fetch it separately
          if (user && videoData.id) {
            try {
              const progressResponse = await userProgressApi.getVideoProgress(videoData.id);
              if (progressResponse.success && progressResponse.data) {
                const progress = progressResponse.data;
                setUserProgress(progress);
                setProgress(progress.progress_percentage || 0);
                setCurrentTime(progress.time_watched || 0);
                setIsFavorite(progress.is_favorite === true || progress.is_favorite === 1);
                setIsLiked(progress.is_liked === true || progress.is_liked === 1);
                setIsDisliked(progress.is_disliked === true || progress.is_disliked === 1);
              }
            } catch (error) {
              console.error('Failed to fetch progress:', error);
            }
          }
        }

        // Fetch comments
        if (videoData.id) {
          try {
            const commentsResponse = await commentsApi.getComments(videoData.id, commentSortBy);
            if (commentsResponse.success) {
              setComments(commentsResponse.data);
            }
          } catch (error) {
            console.error('Failed to fetch comments:', error);
          }
        }

        // Fetch all feedback for this video
        if (videoData.id) {
          try {
            setLoadingFeedback(true);
            const feedbackResponse = await feedbackApi.getAll({ video_id: videoData.id });
            if (feedbackResponse.success) {
              const feedbackData = Array.isArray(feedbackResponse.data)
                ? feedbackResponse.data
                : feedbackResponse.data?.data || [];
              setVideoFeedbacks(feedbackData);
              
              // Check if current user has already submitted feedback
              if (user) {
                const userFeedback = feedbackData.find((f: any) => f.user_id === user.id);
                setUserHasFeedback(!!userFeedback);
              } else {
                setUserHasFeedback(false);
              }
            }
          } catch (error) {
            console.error('Failed to fetch feedback:', error);
          } finally {
            setLoadingFeedback(false);
          }
        }
        
        setDuration(videoData.duration || 0);
        
      } catch (error: any) {
        console.error('Error loading video data:', error);
        toast.error(error.message || t('video.failed_load_video'));
        setVideo(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchVideoData();
    }
  }, [id, user]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  // Save progress function
  const saveProgress = async () => {
    if (!user || !video || duration <= 0) return;

    try {
      const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
      const isCompleted = progressPercentage >= 90;
      
      await userProgressApi.updateVideoProgress(video.id, {
        time_watched: Math.floor(currentTime),
        video_duration: Math.floor(duration),
        progress_percentage: Math.floor(progressPercentage),
        is_completed: isCompleted,
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  // Save progress periodically while playing
  useEffect(() => {
    if (!user || !video || !isPlaying || duration <= 0) return;

    const interval = setInterval(saveProgress, 10000); // Save every 10 seconds
    return () => clearInterval(interval);
  }, [user, video, isPlaying, currentTime, duration]);

  // Save progress on pause
  useEffect(() => {
    if (!user || !video || isPlaying || duration <= 0) return;
    // Small delay to avoid multiple saves on rapid pause/play
    const timeout = setTimeout(saveProgress, 1000);
    return () => clearTimeout(timeout);
  }, [isPlaying, currentTime]);

  // Update progress bar based on current time
  useEffect(() => {
    if (duration > 0) {
      setProgress((currentTime / duration) * 100);
    }
  }, [currentTime, duration]);

  const handleToggleFavorite = async () => {
    if (!user || !video) {
      toast.error(t('video.please_sign_in_favorites'));
      return;
    }

    try {
      const response = await userProgressApi.toggleFavorite(video.id);
      if (response.success && response.data) {
        setIsFavorite(response.data.is_favorite || false);
        toast.success(response.data.is_favorite ? t('video.added_to_favorites') : t('video.removed_from_favorites'));
        
        // Update user progress state
        if (userProgress) {
          setUserProgress({
            ...userProgress,
            is_favorite: response.data.is_favorite,
            favorited_at: response.data.favorited_at,
          });
        }
      }
    } catch (error: any) {
      toast.error(error.message || t('video.failed_update_favorites'));
    }
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    setIsMuted(vol === 0);
    if (videoRef.current) {
      videoRef.current.volume = vol;
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (videoRef.current) {
      videoRef.current.muted = newMuted;
    }
  };

  const toggleFullscreen = () => {
    const videoContainer = videoRef.current?.parentElement;
    if (!videoContainer) return;

    if (!isFullscreen) {
      if (videoContainer.requestFullscreen) {
        videoContainer.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmitComment = async () => {
    if (!comment.trim() || !user || !video) {
      toast.error(t('video.please_sign_in_comment'));
      return;
    }

    try {
      const response = await commentsApi.createComment(video.id, {
        comment: comment.trim(),
        comment_time: Math.floor(currentTime),
      });

      if (response.success) {
        setComments([response.data, ...comments]);
        setComment('');
        toast.success(t('video.comment_added_successfully'));
      }
    } catch (error: any) {
      toast.error(error.message || t('video.failed_add_comment'));
    }
  };

  const handleLikeComment = async (commentId: number) => {
    if (!user) {
      toast.error(t('video.please_sign_in_like_comments'));
      return;
    }

    try {
      const response = await commentsApi.toggleLike(commentId);
      if (response.success) {
        setComments(comments.map(c => 
          c.id === commentId 
            ? { ...c, is_liked: response.data.liked, likes_count: response.data.likes_count }
            : c
        ));
      }
    } catch (error: any) {
      toast.error(error.message || t('video.failed_like_comment'));
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!user) return;

    try {
      const response = await commentsApi.deleteComment(commentId);
      if (response.success) {
        setComments(comments.filter(c => c.id !== commentId));
        toast.success(t('video.comment_deleted'));
      }
    } catch (error: any) {
      toast.error(error.message || t('video.failed_delete_comment'));
    }
  };

  const refreshComments = async () => {
    if (!video) return;
    try {
      const response = await commentsApi.getComments(video.id, commentSortBy);
      if (response.success) {
        setComments(response.data);
      }
    } catch (error) {
      console.error('Failed to refresh comments:', error);
    }
  };

  useEffect(() => {
    if (video?.id) {
      refreshComments();
    }
  }, [video?.id, commentSortBy]);

  const canAccessVideo = (videoVisibility: string) => {
    // Admin can access all content
    if (user && (user.role === 'admin' || user.subscription_type === 'admin' || user.is_admin)) {
      return true;
    }
    if (!user) return videoVisibility === 'freemium';
    if (videoVisibility === 'freemium') return true;
    if (videoVisibility === 'basic') return ['basic', 'premium'].includes(user.subscription_type);
    if (videoVisibility === 'premium') return user.subscription_type === 'premium';
    return false;
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="aspect-video bg-muted rounded-lg mb-6"></div>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-8 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-full"></div>
            </div>
            <div className="space-y-4">
              <div className="h-32 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">{t('video.video_not_found')}</h1>
        <Button onClick={() => navigate('/explore')}>
          {t('video.browse_all_videos')}
        </Button>
      </div>
    );
  }

  const hasAccess = canAccessVideo(video.visibility);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Video Player */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Player */}
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            {!hasAccess ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                <div className="text-center space-y-4">
                  <Lock className="h-16 w-16 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{t('video.premium_content')}</h3>
                    <p className="text-muted-foreground mb-4">{t('video.upgrade_plan_access')}</p>
                    <Button onClick={() => navigate('/subscription')}>
                      {t('video.upgrade_now')}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Video Player */}
                {video.bunny_embed_url || video.bunny_player_url ? (
                  // Bunny.net Player (iframe)
                  <iframe
                    key={`${video.id}-bunny-player`}
                    src={video.bunny_embed_url || video.bunny_player_url}
                    className="w-full h-full border-0"
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                    allowFullScreen
                    title={video.title}
                    onLoad={() => {
                      console.log('✅ Bunny.net player loaded');
                      // For Bunny.net player, we'll track progress via API
                      // Duration will be set from video data
                      if (video.duration) {
                        setDuration(video.duration);
                      }
                    }}
                  />
                ) : video.video_url_full ? (
                  // Fallback: HTML5 video player for non-Bunny.net videos
                  <video
                    key={`${video.id}-video`}
                    ref={videoRef}
                    src={video.video_url_full}
                    className="w-full h-full"
                    controls
                    controlsList="nodownload"
                    playsInline
                    preload="auto"
                    disablePictureInPicture
                    poster={video.intro_image_url || video.intro_image || undefined}
                    onContextMenu={(e) => e.preventDefault()}
                    onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                    onLoadedMetadata={(e) => {
                      const duration = e.currentTarget.duration;
                      setDuration(duration);
                      console.log('✅ Video metadata loaded');
                      console.log('Duration:', duration, 'seconds');
                      console.log('Video URL:', e.currentTarget.src);
                      
                      // Restore video position if progress exists
                      if (userProgress && userProgress.last_position > 0 && videoRef.current) {
                        const resumePosition = userProgress.last_position;
                        if (resumePosition < duration) {
                          videoRef.current.currentTime = resumePosition;
                          setCurrentTime(resumePosition);
                        }
                      }
                    }}
                    onCanPlay={() => {
                      console.log('✅ Video ready to play');
                    }}
                    onPlay={() => {
                      setIsPlaying(true);
                      console.log('▶️ Video playing');
                    }}
                    onPause={() => {
                      setIsPlaying(false);
                      console.log('⏸️ Video paused');
                    }}
                    onEnded={() => {
                      setIsPlaying(false);
                      console.log('🏁 Video ended');
                      // Save final progress when video ends
                      if (user && video && duration > 0) {
                        setCurrentTime(duration);
                      }
                    }}
                    onError={async (e) => {
                      const error = e.currentTarget.error;
                      console.error('❌ Video error:', {
                        code: error?.code,
                        message: error?.message,
                        src: e.currentTarget.src
                      });
                      
                      // Only use video_url_full (stream endpoint) - don't try invalid fallbacks
                      if (!video.video_url_full) {
                        toast.error(t('video.no_valid_video_source'));
                        return;
                      }
                      
                      // Handle specific error codes
                      if (error?.code === 3) {
                        // Code 3 = MEDIA_ERR_DECODE (audio/video codec issue)
                        // Try playing without audio
                        console.warn('⚠️ Audio codec issue detected, attempting to play muted');
                        if (videoRef.current) {
                          videoRef.current.muted = true;
                          try {
                            await videoRef.current.play();
                          } catch (playError) {
                            console.error('Failed to play muted video:', playError);
                            toast.error(t('video.video_playback_failed'));
                          }
                        }
                        return;
                      }
                      
                      // Show user-friendly error messages
                      if (error?.code === 4) {
                        toast.error(t('video.video_format_not_supported'));
                      } else if (error?.code === 2) {
                        toast.error(t('video.network_error_loading_video'));
                      } else if (error?.code === 1) {
                        toast.error(t('video.video_file_not_found'));
                      }
                    }}
                  >
                    {t('video.browser_no_video_support')}
                  </video>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                    <div className="text-center">
                      <Play className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">{t('video.video_file_not_available')}</p>
                    </div>
                  </div>
                )}

                {/* Play/Pause Overlay - Removed to avoid interfering with native controls */}

                {/* Video Controls - Hidden, using native browser controls instead */}
                {false && showControls && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    {/* Progress Bar */}
                    <div className="mb-4">
                      <Progress 
                        value={(currentTime / duration) * 100} 
                        className="h-1 cursor-pointer"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const clickX = e.clientX - rect.left;
                          const newTime = (clickX / rect.width) * duration;
                          handleSeek(newTime);
                        }}
                      />
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handlePlayPause}
                        >
                          {isPlaying ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>

                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleMute}
                          >
                            {isMuted || volume === 0 ? (
                              <VolumeX className="h-4 w-4" />
                            ) : (
                              <Volume2 className="h-4 w-4" />
                            )}
                          </Button>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={isMuted ? 0 : volume}
                            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                            className="w-20"
                          />
                        </div>

                        <span className="text-white text-sm">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowSettings(!showSettings)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={toggleFullscreen}
                        >
                          <Maximize className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Settings Panel */}
                {showSettings && (
                  <div className="absolute top-4 right-4 bg-black/80 rounded-lg p-4 space-y-3">
                    <div>
                      <label className="text-white text-sm">Quality</label>
                      <select
                        value={quality}
                        onChange={(e) => setQuality(e.target.value)}
                        className="w-full mt-1 bg-white/10 text-white rounded px-2 py-1"
                      >
                        <option value="720p">720p</option>
                        <option value="1080p">1080p</option>
                        <option value="4K">4K</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-white text-sm">Speed</label>
                      <select
                        value={playbackSpeed}
                        onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                        className="w-full mt-1 bg-white/10 text-white rounded px-2 py-1"
                      >
                        <option value={0.5}>0.5x</option>
                        <option value={0.75}>0.75x</option>
                        <option value={1}>1x</option>
                        <option value={1.25}>1.25x</option>
                        <option value={1.5}>1.5x</option>
                        <option value={2}>2x</option>
                      </select>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Video Info */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-2">{video.title}</h1>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>{(video.total_views || 0).toLocaleString()} {t('video.views')}</span>
                  <span>{formatTime(video.duration || 0)}</span>
                  <span>{video.created_at ? new Date(video.created_at).toLocaleDateString() : t('video.na')}</span>
                  {category && (
                    <span className="flex items-center">
                      <BookOpen className="h-3 w-3 mr-1" />
                      {category.name}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant={isLiked ? "default" : "outline"}
                  size="sm"
                  onClick={async () => {
                    if (!user || !video) {
                      toast.error(t('video.please_sign_in_like'));
                      return;
                    }
                    try {
                      const response = await userProgressApi.toggleLike(video.id);
                      if (response.success && response.data) {
                        const isLikedNow = response.data.is_liked === true || response.data.is_liked === 1;
                        setIsLiked(isLikedNow);
                        if (isLikedNow) {
                          setIsDisliked(false);
                        }
                        
                        // Update user progress state
                        if (userProgress) {
                          setUserProgress({
                            ...userProgress,
                            is_liked: isLikedNow,
                            is_disliked: false,
                            liked_at: response.data.liked_at,
                          });
                        }
                        toast.success(isLikedNow ? t('video.video_liked') : t('video.like_removed'));
                      }
                    } catch (error: any) {
                      toast.error(error.message || t('video.failed_like_video'));
                    }
                  }}
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  {t('video.like')}
                </Button>
                <Button
                  variant={isDisliked ? "destructive" : "outline"}
                  size="sm"
                  onClick={async () => {
                    if (!user || !video) {
                      toast.error(t('video.please_sign_in_dislike'));
                      return;
                    }
                    try {
                      const response = await userProgressApi.toggleDislike(video.id);
                      if (response.success && response.data) {
                        const isDislikedNow = response.data.is_disliked === true || response.data.is_disliked === 1;
                        setIsDisliked(isDislikedNow);
                        if (isDislikedNow) {
                          setIsLiked(false);
                        }
                        
                        // Update user progress state
                        if (userProgress) {
                          setUserProgress({
                            ...userProgress,
                            is_disliked: isDislikedNow,
                            is_liked: false,
                            liked_at: null,
                          });
                        }
                        toast.success(isDislikedNow ? t('video.video_disliked') : t('video.dislike_removed'));
                      }
                    } catch (error: any) {
                      toast.error(error.message || t('video.failed_dislike_video'));
                    }
                  }}
                >
                  <ThumbsDown className="h-4 w-4" />
                </Button>
                <Button
                  variant={isFavorite ? "default" : "outline"}
                  size="sm"
                  onClick={handleToggleFavorite}
                >
                  <Heart className={`h-4 w-4 mr-1 ${isFavorite ? 'fill-current' : ''}`} />
                  {isFavorite ? t('video.saved') : t('video.save')}
                </Button>
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{t('video.your_progress')}</span>
                <span>{t('video.percent_complete', { percent: Math.round(progress) })}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>

          {/* Feedback & Suggestions Section */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{t('video.feedback_suggestions')}</h3>
            {user && !userHasFeedback && (
              <Button 
                variant={showFeedbackForm ? 'outline' : 'default'}
                size="sm"
                onClick={() => {
                  setShowFeedbackForm(!showFeedbackForm);
                  if (!showFeedbackForm) {
                    setFeedbackDescription('');
                    setFeedbackRating(null);
                    setFeedbackPriority('medium');
                  }
                }}
              >
                {showFeedbackForm ? t('video.cancel') : t('video.share_feedback')}
              </Button>
            )}
            {user && userHasFeedback && (
              <Badge variant="secondary" className="text-sm">
                {t('video.already_submitted_feedback')}
              </Badge>
            )}
            </div>

            {!user && (
              <div className="mb-6 p-4 bg-muted rounded-lg text-center text-sm text-muted-foreground">
                {t('video.please_sign_in_feedback')}
              </div>
            )}

            {user && showFeedbackForm && (
              <div className="space-y-4 mb-6">
                <div className="flex gap-2">
                  <Button
                    variant={feedbackType === 'feedback' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFeedbackType('feedback')}
                    className="flex-1"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {t('video.feedback')}
                  </Button>
                  <Button
                    variant={feedbackType === 'suggestion' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFeedbackType('suggestion')}
                    className="flex-1"
                  >
                    <Lightbulb className="h-4 w-4 mr-2" />
                    {t('video.suggestion')}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feedbackDescription">{t('video.description')}</Label>
                  <Textarea
                    id="feedbackDescription"
                    value={feedbackDescription}
                    onChange={(e) => setFeedbackDescription(e.target.value)}
                    placeholder={t('video.provide_feedback_details', { type: feedbackType === 'feedback' ? t('video.feedback').toLowerCase() : t('video.suggestion').toLowerCase() })}
                    className="min-h-[120px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="feedbackRating">{t('video.rating_optional')}</Label>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackRating(feedbackRating === star ? null : star)}
                          className="focus:outline-none transition-transform hover:scale-110"
                        >
                          <Star
                            className={`h-6 w-6 ${
                              feedbackRating && star <= feedbackRating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                      {feedbackRating && (
                        <span className="ml-2 text-sm text-muted-foreground">
                          {feedbackRating} {feedbackRating === 1 ? t('video.star') : t('video.stars')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="feedbackPriority">{t('video.priority')}</Label>
                    <Select 
                      value={feedbackPriority} 
                      onValueChange={(value) => setFeedbackPriority(value as 'low' | 'medium' | 'high' | 'urgent')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">{t('video.low')}</SelectItem>
                        <SelectItem value="medium">{t('video.medium')}</SelectItem>
                        <SelectItem value="high">{t('video.high')}</SelectItem>
                        <SelectItem value="urgent">{t('video.urgent')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={async () => {
                    if (!feedbackDescription.trim() || !video) {
                      toast.error(t('video.description_required'));
                      return;
                    }
                    try {
                      const response = await feedbackApi.create({
                        video_id: video.id,
                        type: feedbackType === 'feedback' ? 'general_feedback' : 'feature_request',
                        description: feedbackDescription,
                        rating: feedbackRating || undefined,
                        priority: feedbackPriority,
                        category: 'Video Content',
                      });
                      if (response.success) {
                        toast.success(t('video.feedback_submitted'));
                        setShowFeedbackForm(false);
                        setFeedbackDescription('');
                        setFeedbackRating(null);
                        setFeedbackPriority('medium');
                        setUserHasFeedback(true);
                        
                        // Refresh feedback list
                        try {
                          const feedbackResponse = await feedbackApi.getAll({ video_id: video.id });
                          if (feedbackResponse.success) {
                            const feedbackData = Array.isArray(feedbackResponse.data)
                              ? feedbackResponse.data
                              : feedbackResponse.data?.data || [];
                            setVideoFeedbacks(feedbackData);
                          }
                        } catch (error) {
                          console.error('Failed to refresh feedback:', error);
                        }
                      }
                    } catch (error: any) {
                      // Handle duplicate feedback error
                      if (error.message && error.message.includes('already submitted feedback')) {
                        toast.error(t('video.already_submitted_error'));
                        setUserHasFeedback(true);
                      } else {
                        toast.error(error.message || t('video.failed_submit_feedback'));
                      }
                    }
                  }}
                  disabled={!feedbackDescription.trim()}
                  className="w-full"
                >
                  {t('video.submit')} {feedbackType === 'feedback' ? t('video.feedback') : t('video.suggestion')}
                </Button>
              </div>
            )}

            {/* Display all feedback for this video */}
            {videoFeedbacks.length > 0 && (
              <div className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">{t('video.all_feedback', { count: videoFeedbacks.length })}</h4>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {videoFeedbacks.map((feedback: any) => (
                    <div key={feedback.id} className="border rounded-lg p-4 bg-muted/50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">{feedback.user?.name || t('video.anonymous')}</span>
                            {feedback.rating && (
                              <div className="flex items-center gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${
                                      i < feedback.rating
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {feedback.type === 'general_feedback' ? t('video.feedback') : 
                               feedback.type === 'feature_request' ? t('video.suggestion') : feedback.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{feedback.description}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{new Date(feedback.created_at).toLocaleDateString()}</span>
                            {feedback.status && (
                              <>
                                <span>•</span>
                                <Badge variant="outline" className="text-xs">
                                  {feedback.status}
                                </Badge>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!loadingFeedback && videoFeedbacks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('video.no_feedback_yet')}
              </p>
            )}

            {user && !showFeedbackForm && !userHasFeedback && videoFeedbacks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('video.help_improve_feedback')}
              </p>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Course Progress */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">{t('video.course_progress')}</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>{t('video.overall_progress')}</span>
                <span>{t('video.videos_count', { current: 1, total: relatedVideos.length + 1 })}</span>
              </div>
              <Progress value={relatedVideos.length > 0 ? (1 / (relatedVideos.length + 1)) * 100 : 100} className="h-2" />
              {relatedVideos.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  {t('video.more_videos_category', { count: relatedVideos.length, plural: relatedVideos.length !== 1 ? 's' : '' })}
                </div>
              )}
            </div>
          </Card>

          {/* Comments Section */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{t('video.comments')} ({comments.length})</h3>
              <div className="flex gap-1">
                <Button
                  variant={commentSortBy === 'newest' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCommentSortBy('newest')}
                  className="h-7 text-xs px-2"
                >
                  {t('video.newest')}
                </Button>
                <Button
                  variant={commentSortBy === 'most_liked' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCommentSortBy('most_liked')}
                  className="h-7 text-xs px-2"
                >
                  {t('video.most_liked')}
                </Button>
              </div>
            </div>

            {user && (
              <div className="space-y-3 mb-4">
                <Textarea
                  placeholder={t('video.add_comment')}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-[70px] text-sm"
                />
                <Button onClick={handleSubmitComment} disabled={!comment.trim()} size="sm" className="w-full">
                  {t('video.post_comment')}
                </Button>
              </div>
            )}

            {!user && (
              <div className="mb-4 p-3 bg-muted rounded-lg text-center text-xs text-muted-foreground">
                {t('video.please_sign_in_comments')}
              </div>
            )}

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">{t('video.no_comments_yet')}</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="border-l-2 border-primary/20 pl-3 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-xs">{comment.user?.name || t('video.anonymous')}</span>
                        {comment.comment_time !== null && (
                          <span className="text-xs text-muted-foreground">
                            @ {formatTime(comment.comment_time)}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{comment.comment}</p>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLikeComment(comment.id)}
                        className={`h-7 text-xs px-2 ${comment.is_liked ? 'text-primary' : ''}`}
                      >
                        <ThumbsUp className={`h-3 w-3 mr-1 ${comment.is_liked ? 'fill-current' : ''}`} />
                        {comment.likes_count}
                      </Button>
                      {user && (user.id === comment.user_id || user.is_admin) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-destructive h-7 text-xs px-2"
                        >
                          {t('video.delete')}
                        </Button>
                      )}
                    </div>
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-2 ml-3 space-y-2">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="border-l-2 border-muted pl-2 py-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-xs">{reply.user?.name || t('video.anonymous')}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(reply.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">{reply.comment}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLikeComment(reply.id)}
                              className={`h-6 text-xs px-1 ${reply.is_liked ? 'text-primary' : ''}`}
                            >
                              <ThumbsUp className={`h-3 w-3 mr-1 ${reply.is_liked ? 'fill-current' : ''}`} />
                              {reply.likes_count}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Course Chapters */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">{t('video.course_chapters')}</h3>
            <div className="space-y-2">
              {relatedVideos.map((relatedVideo, index) => (
                <div
                  key={relatedVideo.id}
                  className={`flex items-center p-2 rounded cursor-pointer transition-colors ${
                    relatedVideo.id === video.id ? 'bg-primary/10' : 'hover:bg-muted'
                  }`}
                  onClick={() => navigateWithLocale(`/video/${relatedVideo.id}`)}
                >
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-3">
                    {index < 3 ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Play className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{relatedVideo.title}</p>
                    <p className="text-xs text-muted-foreground">{formatTime(relatedVideo.duration || 0)}</p>
                  </div>
                  {relatedVideo.visibility && getVisibilityBadge(relatedVideo.visibility)}
                </div>
              ))}
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
