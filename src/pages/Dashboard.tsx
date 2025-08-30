import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  PenTool, 
  FileText, 
  Eye, 
  Heart, 
  MessageCircle, 
  Clock, 
  MoreHorizontal,
  Edit,
  Trash2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface DashboardBlog {
  id: string;
  title: string;
  excerpt?: string;
  slug: string;
  status: 'pending' | 'approved' | 'rejected' | 'hidden';
  reading_time: number;
  likes_count: number;
  comments_count: number;
  views_count: number;
  created_at: string;
  updated_at: string;
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [blogs, setBlogs] = useState<DashboardBlog[]>([]);
  const [stats, setStats] = useState({
    totalBlogs: 0,
    publishedBlogs: 0,
    totalViews: 0,
    totalLikes: 0,
  });
  const [loadingBlogs, setLoadingBlogs] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserBlogs();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const fetchUserBlogs = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      const { data: userBlogs, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('author_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (userBlogs) {
        setBlogs(userBlogs as DashboardBlog[]);
        
        // Calculate stats
        const totalViews = userBlogs.reduce((sum, blog) => sum + (blog.views_count || 0), 0);
        const totalLikes = userBlogs.reduce((sum, blog) => sum + (blog.likes_count || 0), 0);
        const publishedBlogs = userBlogs.filter(blog => blog.status === 'approved').length;
        
        setStats({
          totalBlogs: userBlogs.length,
          publishedBlogs,
          totalViews,
          totalLikes,
        });
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
      toast({
        title: "Error",
        description: "Failed to load your blogs.",
        variant: "destructive",
      });
    } finally {
      setLoadingBlogs(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'hidden':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Published';
      case 'pending':
        return 'Under Review';
      case 'rejected':
        return 'Rejected';
      case 'hidden':
        return 'Hidden';
      default:
        return status;
    }
  };

  const filterBlogsByStatus = (status?: string) => {
    if (!status) return blogs;
    return blogs.filter(blog => blog.status === status);
  };

  const BlogCard = ({ blog }: { blog: DashboardBlog }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2 line-clamp-2">{blog.title}</h3>
            {blog.excerpt && (
              <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                {blog.excerpt}
              </p>
            )}
            <Badge className={getStatusColor(blog.status)}>
              {getStatusText(blog.status)}
            </Badge>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/edit/${blog.id}`}>
                  <Edit className="mr-2 w-4 h-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              {blog.status === 'approved' && (
                <DropdownMenuItem asChild>
                  <Link to={`/blog/${blog.slug}`}>
                    <Eye className="mr-2 w-4 h-4" />
                    View
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 w-4 h-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Eye className="w-3 h-3" />
              <span>{blog.views_count}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Heart className="w-3 h-3" />
              <span>{blog.likes_count}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageCircle className="w-3 h-3" />
              <span>{blog.comments_count}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{blog.reading_time} min read</span>
            </div>
          </div>
          <span>
            Updated {formatDistanceToNow(new Date(blog.updated_at), { addSuffix: true })}
          </span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Manage your articles and track your performance.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Articles</p>
                <p className="text-2xl font-bold">{stats.totalBlogs}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Published</p>
                <p className="text-2xl font-bold text-green-600">{stats.publishedBlogs}</p>
              </div>
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{stats.totalViews}</p>
              </div>
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Likes</p>
                <p className="text-2xl font-bold">{stats.totalLikes}</p>
              </div>
              <Heart className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Your Articles</h2>
        <Button asChild>
          <Link to="/create">
            <PenTool className="mr-2 w-4 h-4" />
            Write New Article
          </Link>
        </Button>
      </div>

      {/* Articles Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Articles ({blogs.length})</TabsTrigger>
          <TabsTrigger value="approved">
            Published ({filterBlogsByStatus('approved').length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Under Review ({filterBlogsByStatus('pending').length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({filterBlogsByStatus('rejected').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {loadingBlogs ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading your articles...</p>
            </div>
          ) : blogs.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <PenTool className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No articles yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start writing your first article to share with the community.
                </p>
                <Button asChild>
                  <Link to="/create">Write Your First Article</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            blogs.map(blog => <BlogCard key={blog.id} blog={blog} />)
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {filterBlogsByStatus('approved').map(blog => <BlogCard key={blog.id} blog={blog} />)}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {filterBlogsByStatus('pending').map(blog => <BlogCard key={blog.id} blog={blog} />)}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {filterBlogsByStatus('rejected').map(blog => <BlogCard key={blog.id} blog={blog} />)}
        </TabsContent>
      </Tabs>
    </div>
  );
}