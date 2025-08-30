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
  Trash2,
  TrendingUp,
  BarChart3,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

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
  const [filteredBlogs, setFilteredBlogs] = useState<DashboardBlog[]>([]);
  const [stats, setStats] = useState({
    totalBlogs: 0,
    publishedBlogs: 0,
    totalViews: 0,
    totalLikes: 0,
  });
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetchUserBlogs();
    }
  }, [user]);

  useEffect(() => {
    filterBlogs();
  }, [blogs, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
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

  const filterBlogs = () => {
    if (!searchQuery) {
      setFilteredBlogs(blogs);
      return;
    }

    const filtered = blogs.filter(blog => 
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (blog.excerpt && blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredBlogs(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'hidden':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <Eye className="w-3 h-3 mr-1" />;
      case 'pending':
        return <Clock className="w-3 h-3 mr-1" />;
      case 'rejected':
        return <Trash2 className="w-3 h-3 mr-1" />;
      case 'hidden':
        return <Eye className="w-3 h-3 mr-1" />;
      default:
        return null;
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
    if (!status) return filteredBlogs;
    return filteredBlogs.filter(blog => blog.status === status);
  };

  const DashboardBlogCard = ({ blog }: { blog: DashboardBlog }) => (
    <Card className="hover:shadow-md transition-all duration-300 hover:-translate-y-1 border">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <Badge className={getStatusColor(blog.status)} variant="outline">
                {getStatusIcon(blog.status)}
                {getStatusText(blog.status)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(blog.updated_at), { addSuffix: true })}
              </span>
            </div>
            
            <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-primary transition-colors">
              {blog.title}
            </h3>
            {blog.excerpt && (
              <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                {blog.excerpt}
              </p>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="ml-2">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/edit/${blog.id}`} className="flex items-center cursor-pointer">
                  <Edit className="mr-2 w-4 h-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              {blog.status === 'approved' && (
                <DropdownMenuItem asChild>
                  <Link to={`/blog/${blog.slug}`} className="flex items-center cursor-pointer">
                    <Eye className="mr-2 w-4 h-4" />
                    View
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-destructive cursor-pointer">
                <Trash2 className="mr-2 w-4 h-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1" title="Views">
              <Eye className="w-4 h-4" />
              <span className="font-medium">{blog.views_count}</span>
            </div>
            <div className="flex items-center space-x-1" title="Likes">
              <Heart className="w-4 h-4" />
              <span className="font-medium">{blog.likes_count}</span>
            </div>
            <div className="flex items-center space-x-1" title="Comments">
              <MessageCircle className="w-4 h-4" />
              <span className="font-medium">{blog.comments_count}</span>
            </div>
            <div className="flex items-center space-x-1" title="Reading time">
              <Clock className="w-4 h-4" />
              <span className="font-medium">{blog.reading_time} min</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const StatCard = ({ title, value, icon: Icon, trend, className }: { 
    title: string; 
    value: number; 
    icon: React.ElementType;
    trend?: string;
    className?: string;
  }) => (
    <Card className="bg-gradient-to-br from-white to-slate-50/50 border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <p className={`text-2xl font-bold ${className}`}>{value.toLocaleString()}</p>
            {trend && (
              <div className="flex items-center mt-1">
                <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                <span className="text-xs text-green-600">{trend}</span>
              </div>
            )}
          </div>
          <div className="p-3 bg-primary/10 rounded-lg">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 pb-12">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Your Dashboard
            </h1>
            <p className="text-muted-foreground">Manage your articles and track your performance</p>
          </div>
          <Button asChild className="gap-2">
            <Link to="/create">
              <Plus className="w-4 h-4" />
              Write New Article
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Articles" 
            value={stats.totalBlogs} 
            icon={FileText} 
            trend="+2 this month" 
          />
          <StatCard 
            title="Published" 
            value={stats.publishedBlogs} 
            icon={Eye} 
            className="text-green-600" 
          />
          <StatCard 
            title="Total Views" 
            value={stats.totalViews} 
            icon={BarChart3} 
            trend="+12% this week" 
          />
          <StatCard 
            title="Total Likes" 
            value={stats.totalLikes} 
            icon={Heart} 
            className="text-rose-600" 
          />
        </div>

        {/* Content Section */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Your Articles
              </CardTitle>
              
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search your articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-[280px]"
                />
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Articles Tabs */}
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid grid-cols-4 mb-6">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <Filter className="w-3 h-3" />
                  All ({blogs.length})
                </TabsTrigger>
                <TabsTrigger value="approved" className="flex items-center gap-2">
                  <Eye className="w-3 h-3" />
                  Published ({filterBlogsByStatus('approved').length})
                </TabsTrigger>
                <TabsTrigger value="pending" className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  Review ({filterBlogsByStatus('pending').length})
                </TabsTrigger>
                <TabsTrigger value="rejected" className="flex items-center gap-2">
                  <Trash2 className="w-3 h-3" />
                  Rejected ({filterBlogsByStatus('rejected').length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {loadingBlogs ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading your articles...</p>
                  </div>
                ) : filteredBlogs.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No articles found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery 
                        ? `No articles match "${searchQuery}"`
                        : "You haven't written any articles yet."
                      }
                    </p>
                    {!searchQuery && (
                      <Button asChild>
                        <Link to="/create">Write Your First Article</Link>
                      </Button>
                    )}
                  </div>
                ) : (
                  filteredBlogs.map(blog => <DashboardBlogCard key={blog.id} blog={blog} />)
                )}
              </TabsContent>

              {['approved', 'pending', 'rejected'].map(status => (
                <TabsContent key={status} value={status} className="space-y-4">
                  {filterBlogsByStatus(status).length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">
                        No {status === 'approved' ? 'published' : status === 'pending' ? 'under review' : 'rejected'} articles
                      </h3>
                      <p className="text-muted-foreground">
                        {status === 'approved' 
                          ? "You don't have any published articles yet."
                          : status === 'pending'
                          ? "You don't have any articles under review."
                          : "You don't have any rejected articles."
                        }
                      </p>
                    </div>
                  ) : (
                    filterBlogsByStatus(status).map(blog => <DashboardBlogCard key={blog.id} blog={blog} />)
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}