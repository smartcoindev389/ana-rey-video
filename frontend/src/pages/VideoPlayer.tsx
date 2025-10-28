import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Maximize,
  Settings,
  Download,
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
import { videoApi, categoryApi } from '@/services/videoApi';
import { userProgressApi } from '@/services/userProgressApi';
import { toast } from 'sonner';

const VideoPlayer = () => {
  const { id } = useParams<{ id: string }>();
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
  const [question, setQuestion] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

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
            const relatedResponse = await videoApi.getAll({ 
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
          setIsFavorite(existingProgress.is_favorite || false);
        }
        
        setDuration(videoData.duration || 0);
        
      } catch (error: any) {
        console.error('Error loading video data:', error);
        toast.error(error.message || 'Failed to load video');
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

  // Save progress periodically
  useEffect(() => {
    if (!user || !video || !isPlaying) return;

    const interval = setInterval(async () => {
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
    }, 10000); // Save every 10 seconds

    return () => clearInterval(interval);
  }, [user, video, isPlaying, currentTime, duration]);

  // Update progress bar based on current time
  useEffect(() => {
    if (duration > 0) {
      setProgress((currentTime / duration) * 100);
    }
  }, [currentTime, duration]);

  const handleToggleFavorite = async () => {
    if (!user || !video) {
      toast.error('Please sign in to add favorites');
      return;
    }

    try {
      await userProgressApi.toggleFavorite(video.id);
      setIsFavorite(!isFavorite);
      toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
    } catch (error) {
      toast.error('Failed to update favorites');
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

  const handleSubmitQuestion = () => {
    if (question.trim()) {
      const newQuestion = {
        id: questions.length + 1,
        user: user?.name || 'Anonymous',
        question: question,
        time: formatTime(currentTime),
        likes: 0
      };
      setQuestions([...questions, newQuestion]);
      setQuestion('');
    }
  };

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
        <h1 className="text-2xl font-bold mb-4">Video not found</h1>
        <Button onClick={() => navigate('/explore')}>
          Browse All Videos
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
                    <h3 className="text-lg font-semibold mb-2">Premium Content</h3>
                    <p className="text-muted-foreground mb-4">Upgrade your plan to access this video</p>
                    <Button onClick={() => navigate('/subscription')}>
                      Upgrade Now
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Video Player */}
                {(video.video_url_full || video.video_file_path || video.video_url) ? (
                  <video
                    key={video.id}
                    ref={videoRef}
                    src={video.video_url_full || video.video_url || video.video_file_path}
                    className="w-full h-full"
                    controls
                    playsInline
                    preload="auto"
                    crossOrigin="use-credentials"
                    poster={video.intro_image_url || video.intro_image || undefined}
                    onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                    onLoadedMetadata={(e) => {
                      const duration = e.currentTarget.duration;
                      setDuration(duration);
                      console.log('✅ Video metadata loaded');
                      console.log('Duration:', duration, 'seconds');
                      console.log('Video URL:', e.currentTarget.src);
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
                    onError={(e) => {
                      const error = e.currentTarget.error;
                      console.error('❌ Video error:', {
                        code: error?.code,
                        message: error?.message,
                        src: e.currentTarget.src
                      });
                      
                      if (error?.code === 3) {
                        // Code 3 = MEDIA_ERR_DECODE (audio/video codec issue)
                        // Often an audio codec problem - try to continue playing without audio
                        console.warn('⚠️ Audio codec not supported, attempting to play video without audio');
                        
                        // Don't show error toast for audio codec issues
                        // The video might still play with video track only
                        return;
                      }
                      
                      if (error?.code === 4) {
                        toast.error('Video format not supported');
                      } else if (error?.code === 2) {
                        toast.error('Network error loading video');
                      }
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                    <div className="text-center">
                      <Play className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Video file not available</p>
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
                  <span>{(video.total_views || 0).toLocaleString()} views</span>
                  <span>{formatTime(video.duration || 0)}</span>
                  <span>{video.created_at ? new Date(video.created_at).toLocaleDateString() : 'N/A'}</span>
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
                  onClick={() => {
                    setIsLiked(!isLiked);
                    if (isDisliked) setIsDisliked(false);
                  }}
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  Like
                </Button>
                <Button
                  variant={isDisliked ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => {
                    setIsDisliked(!isDisliked);
                    if (isLiked) setIsLiked(false);
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
                  {isFavorite ? 'Saved' : 'Save'}
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </Button>
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Your Progress</span>
                <span>{progress}% complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>

          {/* Q&A Section (Premium Users and Admins) */}
          {(user?.subscription_type === 'premium' || user?.role === 'admin' || user?.subscription_type === 'admin' || user?.is_admin) && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Ask a Question</h3>
              <div className="space-y-4">
                <Textarea
                  placeholder="Ask a question about this video..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="min-h-[80px]"
                />
                <Button onClick={handleSubmitQuestion} disabled={!question.trim()}>
                  Submit Question
                </Button>
              </div>

              <div className="mt-6 space-y-4">
                <h4 className="font-medium">Previous Questions</h4>
                {questions.map((q) => (
                  <div key={q.id} className="border-l-2 border-primary/20 pl-4 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{q.user}</span>
                      <span className="text-xs text-muted-foreground">{q.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{q.question}</p>
                    <Button variant="ghost" size="sm">
                      <ThumbsUp className="h-3 w-3 mr-1" />
                      {q.likes}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Course Progress */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Course Progress</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Overall Progress</span>
                <span>{relatedVideos.length > 0 ? `1 of ${relatedVideos.length + 1}` : '1 of 1'} videos</span>
              </div>
              <Progress value={relatedVideos.length > 0 ? (1 / (relatedVideos.length + 1)) * 100 : 100} className="h-2" />
              {relatedVideos.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  {relatedVideos.length} more video{relatedVideos.length !== 1 ? 's' : ''} in this category
                </div>
              )}
            </div>
          </Card>

          {/* Course Chapters */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Course Chapters</h3>
            <div className="space-y-2">
              {relatedVideos.map((relatedVideo, index) => (
                <div
                  key={relatedVideo.id}
                  className={`flex items-center p-2 rounded cursor-pointer transition-colors ${
                    relatedVideo.id === video.id ? 'bg-primary/10' : 'hover:bg-muted'
                  }`}
                  onClick={() => navigate(`/video/${relatedVideo.id}`)}
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

          {/* Downloadable Materials */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Downloadable Materials</h3>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Course Slides (PDF)
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Code Examples (ZIP)
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Reference Links
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
