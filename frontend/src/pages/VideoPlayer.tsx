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
import { generateMockVideos, generateMockSeries, MockVideo, MockSeries } from '@/services/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const VideoPlayer = () => {
  const { id } = useParams<{ id: string }>();
  const [video, setVideo] = useState<MockVideo | null>(null);
  const [series, setSeries] = useState<MockSeries | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<MockVideo[]>([]);
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
  const [progress, setProgress] = useState(45); // Mock progress
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [question, setQuestion] = useState('');
  const [questions, setQuestions] = useState([
    { id: 1, user: 'John Doe', question: 'How does this work with React hooks?', time: '5:23', likes: 12 },
    { id: 2, user: 'Jane Smith', question: 'Can you explain the useEffect dependency array?', time: '12:45', likes: 8 },
  ]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate API call
    const fetchVideoData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockVideos = generateMockVideos();
      const mockSeries = generateMockSeries();
      
      const foundVideo = mockVideos.find(v => v.id === parseInt(id || '1'));
      const foundSeries = mockSeries.find(s => s.title.toLowerCase().includes(foundVideo?.series.toLowerCase() || ''));
      const related = mockVideos.filter(v => v.id !== foundVideo?.id).slice(0, 4);
      
      setVideo(foundVideo || mockVideos[0]);
      setSeries(foundSeries || mockSeries[0]);
      setRelatedVideos(related);
      setDuration(1800); // 30 minutes mock duration
      setLoading(false);
    };

    fetchVideoData();
  }, [id]);

  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
    }
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    setIsMuted(vol === 0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
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
                {/* Mock Video Player */}
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <Button
                    size="lg"
                    className="w-20 h-20 rounded-full"
                    onClick={handlePlayPause}
                  >
                    {isPlaying ? (
                      <Pause className="h-8 w-8" />
                    ) : (
                      <Play className="h-8 w-8 ml-1" />
                    )}
                  </Button>
                </div>

                {/* Video Controls */}
                {showControls && (
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
                  <span>{video.views.toLocaleString()} views</span>
                  <span>{video.duration}</span>
                  <span>{new Date(video.uploadedAt).toLocaleDateString()}</span>
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

          {/* Q&A Section (Premium Users) */}
          {user?.subscription_type === 'premium' && (
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
                <span>3 of 8 videos</span>
              </div>
              <Progress value={37.5} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {series?.totalDuration} remaining
              </div>
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
                    <p className="text-xs text-muted-foreground">{relatedVideo.duration}</p>
                  </div>
                  {getVisibilityBadge(relatedVideo.visibility)}
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
