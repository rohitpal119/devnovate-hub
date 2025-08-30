import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExternalLink, Shield, AlertCircle, CheckCircle, XCircle, Filter, Search, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AdminStatsCards from '@/components/AdminStatsCards';
import BlogCard from '@/components/BlogCard';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function AdminDashboard() {
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<any[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [stats, setStats] = useState({
    totalBlogs: 0,
    pendingReview: 0,
    totalUsers: 0,
    totalViews: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || profile?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    fetchAllBlogs();
    fetchStats();
  }, []);

  useEffect(() => {
    filterAndSortBlogs();
  }, [blogs, searchQuery, statusFilter, sortBy]);

  const fetchAllBlogs = async () => {
    try {
      setLoadingBlogs(true);
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
      toast({
        title: "Error",
        description: "Failed to fetch blogs. Please try again.",
        variant: "destructive",
      });
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

  const filterAndSortBlogs = () => {
    let result = [...blogs];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(blog => blog.status === statusFilter);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(blog => 
        blog.title.toLowerCase().includes(query) ||
        (blog.profiles?.full_name || '').toLowerCase().includes(query) ||
        (blog.profiles?.username || '').toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'most_views':
        result.sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
        break;
      case 'most_likes':
        result.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
        break;
    }
    
    setFilteredBlogs(result);
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
      console.error('Error updating blog status:', error);
      toast({
        title: "Error",
        description: "Failed to update blog status.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-destructive" />;
      default: return null;
    }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 pb-12">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 bg-white rounded-xl shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage content and monitor platform activity</p>
            </div>
          </div>
          <Button variant="outline" asChild className="gap-2">
            <Link to="/dashboard">
              <ExternalLink className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <AdminStatsCards stats={stats} />

        {/* Filters and Search */}
        <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Content Management
            </h2>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full md:w-[250px]"
                />
              </div>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="most_views">Most Views</SelectItem>
                  <SelectItem value="most_likes">Most Likes</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  fetchAllBlogs();
                  fetchStats();
                }}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>

          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid grid-cols-4 w-full md:w-auto">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                {getStatusIcon('pending')}
                Pending
                <Badge variant="secondary" className="ml-1">
                  {blogs.filter(b => b.status === 'pending').length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex items-center gap-2">
                {getStatusIcon('approved')}
                Published
                <Badge variant="secondary" className="ml-1">
                  {blogs.filter(b => b.status === 'approved').length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="rejected" className="flex items-center gap-2">
                {getStatusIcon('rejected')}
                Rejected
                <Badge variant="secondary" className="ml-1">
                  {blogs.filter(b => b.status === 'rejected').length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="all" className="flex items-center gap-2">
                All Articles
                <Badge variant="secondary" className="ml-1">
                  {blogs.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            {['pending', 'approved', 'rejected', 'all'].map(status => (
              <TabsContent key={status} value={status} className="mt-6 space-y-4">
                {filteredBlogs
                  .filter(blog => status === 'all' || blog.status === status)
                  .map(blog => (
                    <BlogCard 
                      key={blog.id} 
                      blog={blog} 
                      onStatusUpdate={updateBlogStatus} 
                    />
                  ))
                }
                
                {filteredBlogs.filter(blog => status === 'all' || blog.status === status).length === 0 && (
                  <div className="text-center py-12 bg-muted/20 rounded-lg">
                    <div className="mx-auto w-16 h-16 flex items-center justify-center bg-muted rounded-full mb-4">
                      <Search className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No articles found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery 
                        ? `No ${status !== 'all' ? status : ''} articles match "${searchQuery}"`
                        : `No ${status !== 'all' ? status : ''} articles found.`
                      }
                    </p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}