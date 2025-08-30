import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Heart, 
  MessageCircle, 
  Eye, 
  Clock, 
  Share2, 
  Sparkles, 
  Bookmark,
  BookmarkCheck,
  Calendar,
  User
} from 'lucide-react';
import { CommentSection } from '@/components/CommentSection';
import { format, formatDistanceToNow } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

interface Blog {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  author_id: string;
  cover_image_url?: string;
  tags: string[];
  reading_time: number;
  likes_count: number;
  comments_count: number;
  views_count: number;
  created_at: string;
  published_at: string;
  profiles: {
    full_name: string;
    avatar_url?: string;
    username?: string;
  };
}

export default function BlogView() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [summary, setSummary] = useState<string>('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    fetchBlog();
    if (user) {
      checkIfLiked();
      checkIfBookmarked();
    }
  }, [slug, user]);

  const fetchBlog = async () => {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select(`
          *,
          profiles:author_id (
            full_name,
            avatar_url,
            username
          )
        `)
        .eq('slug', slug)
        .eq('status', 'approved')
        .single();

      if (error) throw error;
      
      setBlog(data);
      setLikesCount(data.likes_count || 0);
      
      // Increment view count
      await supabase
        .from('blogs')
        .update({ views_count: (data.views_count || 0) + 1 })
        .eq('id', data.id);

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Blog post not found.",
        variant: "destructive",
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const checkIfLiked = async () => {
    if (!blog || !user) return;
    
    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('blog_id', blog.id)
      .eq('user_id', user.id)
      .single();
    
    setIsLiked(!!data);
  };

  const checkIfBookmarked = async () => {
    if (!blog || !user) return;
    
    const { data } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('blog_id', blog.id)
      .eq('user_id', user.id)
      .single();
    
    setIsBookmarked(!!data);
  };

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like posts.",
      });
      return;
    }

    if (!blog) return;

    try {
      if (isLiked) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('blog_id', blog.id)
          .eq('user_id', user.id);
        
        setIsLiked(false);
        setLikesCount(prev => prev - 1);
      } else {
        // Like
        await supabase
          .from('likes')
          .insert({ blog_id: blog.id, user_id: user.id });
        
        setIsLiked(true);
        setLikesCount(prev => prev + 1);

        toast({
          title: "Liked!",
          description: "You liked this article.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update like status.",
        variant: "destructive",
      });
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to bookmark posts.",
      });
      return;
    }

    if (!blog) return;

    try {
      if (isBookmarked) {
        // Remove bookmark
        await supabase
          .from('bookmarks')
          .delete()
          .eq('blog_id', blog.id)
          .eq('user_id', user.id);
        
        setIsBookmarked(false);
        toast({
          title: "Bookmark removed",
          description: "Article removed from your bookmarks.",
        });
      } else {
        // Add bookmark
        await supabase
          .from('bookmarks')
          .insert({ blog_id: blog.id, user_id: user.id });
        
        setIsBookmarked(true);
        toast({
          title: "Bookmarked!",
          description: "Article added to your bookmarks.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update bookmark status.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: blog?.title,
          text: blog?.excerpt,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Blog link copied to clipboard.",
      });
    }
  };

  const handleSummarize = async () => {
    if (!blog) return;
    
    setSummaryLoading(true);
    try {
      const response = await supabase.functions.invoke('summarize-article', {
        body: { content: blog.content }
      });

      if (response.error) {
        throw response.error;
      }

      setSummary(response.data.summary);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to generate summary.",
        variant: "destructive",
      });
    } finally {
      setSummaryLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 py-8">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <Skeleton className="h-10 w-32 mb-6" />
            <Skeleton className="h-64 w-full rounded-lg mb-8" />
            <Skeleton className="h-12 w-3/4 mb-4" />
            <div className="flex items-center space-x-4 mb-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Blog post not found</h1>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 py-8">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)} 
            className="mb-6 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          {/* Cover Image */}
          {blog.cover_image_url && (
            <div className="mb-8 rounded-xl overflow-hidden shadow-lg">
              <img
                src={blog.cover_image_url}
                alt={blog.title}
                className="w-full h-64 md:h-96 object-cover"
              />
            </div>
          )}

          {/* Article Header */}
          <header className="mb-8">
            <div className="flex flex-wrap gap-2 mb-4">
              {blog.tags?.map((tag) => (
                <Badge 
                  key={tag} 
                  variant="secondary"
                  className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-0"
                >
                  #{tag}
                </Badge>
              ))}
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              {blog.title}
            </h1>

            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              {blog.excerpt}
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                  <AvatarImage src={blog.profiles.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                    {blog.profiles.full_name?.charAt(0) || <User className="w-6 h-6" />}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground">{blog.profiles.full_name}</p>
                  <div className="flex items-center text-sm text-muted-foreground space-x-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(blog.published_at), 'MMM dd, yyyy')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {blog.reading_time} min read
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant={isLiked ? "default" : "outline"}
                  size="sm"
                  onClick={handleLike}
                  className={`gap-2 ${isLiked ? 'bg-red-100 text-red-600 hover:bg-red-200 border-red-200' : ''}`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                  <span>{likesCount}</span>
                </Button>
                
                <Button
                  variant={isBookmarked ? "default" : "outline"}
                  size="sm"
                  onClick={handleBookmark}
                  className={`gap-2 ${isBookmarked ? 'bg-amber-100 text-amber-600 hover:bg-amber-200 border-amber-200' : ''}`}
                >
                  {isBookmarked ? (
                    <BookmarkCheck className="w-4 h-4" />
                  ) : (
                    <Bookmark className="w-4 h-4" />
                  )}
                </Button>
                
                <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
                  <Share2 className="w-4 h-4" />
                </Button>
                
                <Button variant="outline" size="sm" className="gap-2">
                  <Eye className="w-4 h-4" />
                  <span>{blog.views_count}</span>
                </Button>
              </div>
            </div>
          </header>

          <Separator className="mb-8" />
        </div>

        {/* Article Content */}
        <article className="prose prose-lg max-w-none mb-12">
          <div className="whitespace-pre-wrap leading-relaxed text-foreground/90">
            {blog.content}
          </div>
        </article>

        {/* Article Actions */}
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                onClick={handleSummarize}
                disabled={summaryLoading}
                className="flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {summaryLoading ? 'Generating Summary...' : 'AI Summary'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Article Summary
                </DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                {summaryLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2 text-muted-foreground">Generating summary...</span>
                  </div>
                ) : summary ? (
                  <div className="prose prose-sm max-w-none">
                    <p className="text-foreground leading-relaxed">{summary}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Click the button above to generate an AI summary of this article.
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Button 
            variant="outline" 
            onClick={handleLike}
            className={`flex items-center gap-2 ${isLiked ? 'border-red-200 text-red-600' : ''}`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            {isLiked ? 'Liked' : 'Like'} ({likesCount})
          </Button>

          <Button 
            variant="outline" 
            onClick={handleBookmark}
            className={`flex items-center gap-2 ${isBookmarked ? 'border-amber-200 text-amber-600' : ''}`}
          >
            {isBookmarked ? (
              <BookmarkCheck className="w-4 h-4" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
            {isBookmarked ? 'Bookmarked' : 'Bookmark'}
          </Button>
        </div>

        <Separator className="mb-8" />

        {/* Author Card */}
        <Card className="mb-8 border-0 bg-gradient-to-br from-white to-blue-50/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16 border-2 border-white shadow-md">
                <AvatarImage src={blog.profiles.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                  {blog.profiles.full_name?.charAt(0) || <User className="w-6 h-6" />}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{blog.profiles.full_name}</h3>
                <p className="text-muted-foreground mb-2">Article published {formatDistanceToNow(new Date(blog.published_at), { addSuffix: true })}</p>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {blog.views_count} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    {likesCount} likes
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    {blog.comments_count} comments
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <CommentSection blogId={blog.id} />
      </div>
    </div>
  );
}