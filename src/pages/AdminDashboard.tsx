import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Check, X, Eye, EyeOff, ExternalLink, Users, FileText, TrendingUp, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

export default function AdminDashboard() {
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [stats, setStats] = useState({
    totalBlogs: 0,
    pendingReview: 0,
    totalUsers: 0,
    totalViews: 0
  });

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  if (!user || profile?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    fetchAllBlogs();
    fetchStats();
  }, []);

  const fetchAllBlogs = async () => {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select(`
          *,
          profiles!blogs_author_id_fkey(full_name, username, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBlogs(data || []);
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoadingBlogs(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [blogsCount, pendingCount, usersCount, viewsSum] = await Promise.all([
        supabase.from('blogs').select('id', { count: 'exact' }),
        supabase.from('blogs').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('blogs').select('views_count')
      ]);

      const totalViews = viewsSum.data?.reduce((sum, blog) => sum + (blog.views_count || 0), 0) || 0;

      setStats({
        totalBlogs: blogsCount.count || 0,
        pendingReview: pendingCount.count || 0,
        totalUsers: usersCount.count || 0,
        totalViews
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const updateBlogStatus = async (blogId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('blogs')
        .update({ 
          status,
          published_at: status === 'approved' ? new Date().toISOString() : null
        })
        .eq('id', blogId);

      if (error) throw error;

      setBlogs(blogs.map(blog => 
        blog.id === blogId ? { ...blog, status } : blog
      ));

      // Send notification when blog is approved
      if (status === 'approved') {
        const blog = blogs.find(b => b.id === blogId);
        if (blog?.profiles) {
          try {
            await supabase.functions.invoke('send-notifications', {
              body: {
                type: 'blog_approved',
                recipientEmail: blog.profiles.email,
                recipientName: blog.profiles.full_name || blog.profiles.username || 'User',
                blogTitle: blog.title,
                blogSlug: blog.slug
              }
            });
          } catch (notificationError) {
            console.error('Failed to send notification:', notificationError);
          }
        }
      }

      toast({
        title: "Status updated",
        description: `Blog ${status} successfully.`,
      });
      
      // Refresh stats after status change
      fetchStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update blog status.",
        variant: "destructive",
      });
    }
  };

  const filterBlogsByStatus = (status: string) => {
    return blogs.filter(blog => blog.status === status);
  };

  if (loadingBlogs) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button variant="outline" asChild>
          <Link to="/dashboard">
            <ExternalLink className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.totalBlogs}</p>
                <p className="text-xs text-muted-foreground">Total Articles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.pendingReview}</p>
                <p className="text-xs text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Views</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">
            Pending Review ({filterBlogsByStatus('pending').length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Published ({filterBlogsByStatus('approved').length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({filterBlogsByStatus('rejected').length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All Articles ({blogs.length})
          </TabsTrigger>
        </TabsList>

        {['pending', 'approved', 'rejected', 'all'].map(status => (
          <TabsContent key={status} value={status} className="space-y-4">
            {(status === 'all' ? blogs : filterBlogsByStatus(status)).map(blog => (
              <Card key={blog.id}>
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
                              {blog.tags.slice(0, 3).map((tag) => (
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
                    <div className="flex space-x-2">
                      {blog.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateBlogStatus(blog.id, 'approved')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="mr-2 w-4 h-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateBlogStatus(blog.id, 'rejected')}
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
                          onClick={() => updateBlogStatus(blog.id, 'rejected')}
                        >
                          <EyeOff className="mr-2 w-4 h-4" />
                          Unpublish
                        </Button>
                      )}

                      {blog.status === 'rejected' && (
                        <Button
                          size="sm"
                          onClick={() => updateBlogStatus(blog.id, 'approved')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="mr-2 w-4 h-4" />
                          Approve
                        </Button>
                      )}
                    </div>
                    
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
            ))}
            {(status === 'all' ? blogs : filterBlogsByStatus(status)).length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No {status === 'all' ? 'articles' : status} articles found.
                </p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}