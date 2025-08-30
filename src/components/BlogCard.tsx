
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Check, X, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

interface BlogCardProps {
  blog: any;
  onStatusUpdate?: (blogId: string, status: string) => void;
}

export default function BlogCard({ blog, onStatusUpdate }: BlogCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-start space-x-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">{blog.title}</h3>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                  <span>By {blog.profiles?.full_name || blog.profiles?.username || 'Anonymous'}</span>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(blog.created_at), { addSuffix: true })}</span>
                  <span>•</span>
                  <span>{blog.views_count} views</span>
                  <span>•</span>
                  <span>{blog.likes_count} likes</span>
                </div>
                {blog.excerpt && (
                  <p className="text-muted-foreground line-clamp-2 mb-3">{blog.excerpt}</p>
                )}
                {blog.tags && blog.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {blog.tags.slice(0, 3).map((tag: string) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <Badge variant={
                blog.status === 'approved' ? 'default' : 
                blog.status === 'pending' ? 'secondary' : 
                'destructive'
              }>
                {blog.status.charAt(0).toUpperCase() + blog.status.slice(1)}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
        {onStatusUpdate && (
          <div className="flex space-x-2">
            {blog.status === 'pending' && (
              <>
                <Button
                  size="sm"
                  onClick={() => onStatusUpdate(blog.id, 'approved')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="mr-2 w-4 h-4" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onStatusUpdate(blog.id, 'rejected')}
                >
                  <X className="mr-2 w-4 h-4" />
                  Reject
                </Button>
              </>
            )}

            {blog.status === 'approved' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStatusUpdate(blog.id, 'rejected')}
              >
                <EyeOff className="mr-2 w-4 h-4" />
                Unpublish
              </Button>
            )}

            {blog.status === 'rejected' && (
              <Button
                size="sm"
                onClick={() => onStatusUpdate(blog.id, 'approved')}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="mr-2 w-4 h-4" />
                Approve
              </Button>
            )}
          </div>
        )}
          
          <div className="flex space-x-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{blog.title}</DialogTitle>
                </DialogHeader>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground">
                      By {blog.profiles?.full_name || blog.profiles?.username || 'Anonymous'} • 
                      {formatDistanceToNow(new Date(blog.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {blog.cover_image_url && (
                    <img 
                      src={blog.cover_image_url} 
                      alt={blog.title}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}
                  <div className="whitespace-pre-wrap">{blog.content}</div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button variant="outline" size="sm" asChild>
              <Link to={`/blog/${blog.slug}`}>
                <ExternalLink className="w-4 h-4 mr-2" />
                View Live
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
