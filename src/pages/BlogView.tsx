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
import { ArrowLeft, Heart, MessageCircle, Eye, Clock, Share2 } from 'lucide-react';
import { CommentSection } from '@/components/CommentSection';
import { format } from 'date-fns';

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
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    fetchBlog();
    if (user) {
      checkIfLiked();
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
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update like status.",
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
    <article className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back
        </Button>

        {/* Cover Image */}
        {blog.cover_image_url && (
          <div className="mb-8">
            <img
              src={blog.cover_image_url}
              alt={blog.title}
              className="w-full h-64 md:h-96 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Article Header */}
        <header className="mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            {blog.tags?.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
            {blog.title}
          </h1>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage src={blog.profiles.avatar_url} />
                <AvatarFallback>
                  {blog.profiles.full_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{blog.profiles.full_name}</p>
                <div className="flex items-center text-sm text-muted-foreground space-x-4">
                  <span>{format(new Date(blog.published_at), 'MMM dd, yyyy')}</span>
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {blog.reading_time} min read
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={`${isLiked ? 'text-red-500' : ''}`}
              >
                <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
                {likesCount}
              </Button>
              <Button variant="ghost" size="sm">
                <MessageCircle className="w-4 h-4 mr-1" />
                {blog.comments_count}
              </Button>
              <Button variant="ghost" size="sm">
                <Eye className="w-4 h-4 mr-1" />
                {blog.views_count}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        <Separator className="mb-8" />
      </div>

      {/* Article Content */}
      <div className="prose prose-lg max-w-none mb-12">
        <div className="whitespace-pre-wrap leading-relaxed">
          {blog.content}
        </div>
      </div>

      <Separator className="mb-8" />

      {/* Comments Section */}
      <CommentSection blogId={blog.id} />
    </article>
  );
}