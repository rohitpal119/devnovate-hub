import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Clock, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Blog {
  id: string;
  title: string;
  excerpt?: string;
  cover_image_url?: string;
  slug: string;
  reading_time: number;
  likes_count: number;
  comments_count: number;
  views_count: number;
  created_at: string;
  tags?: string[];
  profiles: {
    full_name?: string;
    username?: string;
    avatar_url?: string;
  };
}

interface BlogCardProps {
  blog: Blog;
  variant?: 'default' | 'featured';
}

export default function BlogCard({ blog, variant = 'default' }: BlogCardProps) {
  const authorName = blog.profiles.full_name || blog.profiles.username || 'Anonymous';
  const timeAgo = formatDistanceToNow(new Date(blog.created_at), { addSuffix: true });

  if (variant === 'featured') {
    return (
      <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
        <Link to={`/blog/${blog.slug}`}>
          {blog.cover_image_url && (
            <div className="relative overflow-hidden h-48">
              <img
                src={blog.cover_image_url}
                alt={blog.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          )}
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-bold line-clamp-2 group-hover:text-primary transition-colors">
                {blog.title}
              </h2>
              {blog.excerpt && (
                <p className="text-muted-foreground line-clamp-3">
                  {blog.excerpt}
                </p>
              )}
            </div>
            
            {blog.tags && blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {blog.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            
            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={blog.profiles.avatar_url} alt={authorName} />
                  <AvatarFallback>{authorName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{authorName}</p>
                  <p className="text-xs text-muted-foreground">{timeAgo}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{blog.reading_time} min</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Heart className="w-3 h-3" />
                  <span>{blog.likes_count}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageCircle className="w-3 h-3" />
                  <span>{blog.comments_count}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="group hover:shadow-md transition-all duration-200 border-0 bg-card/50">
      <Link to={`/blog/${blog.slug}`}>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1 space-y-3">
              <div className="space-y-2">
                <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                  {blog.title}
                </h3>
                {blog.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {blog.excerpt}
                  </p>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={blog.profiles.avatar_url} alt={authorName} />
                    <AvatarFallback className="text-xs">{authorName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">{authorName}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">{timeAgo}</span>
                </div>
                
                <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Heart className="w-3 h-3" />
                    <span>{blog.likes_count}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="w-3 h-3" />
                    <span>{blog.comments_count}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye className="w-3 h-3" />
                    <span>{blog.views_count}</span>
                  </div>
                </div>
              </div>
              
              {blog.tags && blog.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {blog.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            {blog.cover_image_url && (
              <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={blog.cover_image_url}
                  alt={blog.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}