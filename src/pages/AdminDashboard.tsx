
import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AdminStatsCards from '@/components/AdminStatsCards';
import BlogCard from '@/components/BlogCard';

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

  console.log('AdminDashboard - Current user:', user?.id);
  console.log('AdminDashboard - Current profile:', profile);
  console.log('AdminDashboard - Loading state:', loading);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  if (!user || profile?.role !== 'admin') {
    console.log('AdminDashboard - Access denied. User:', !!user, 'Role:', profile?.role);
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    console.log('AdminDashboard - Starting data fetch...');
    fetchAllBlogs();
    fetchStats();
  }, []);

  const fetchAllBlogs = async () => {
    try {
      console.log('AdminDashboard - Fetching all blogs...');
      const { data, error } = await supabase
        .from('blogs')
        .select(`
          *,
          profiles!blogs_author_id_fkey(full_name, username, avatar_url)
        `)
        .order('created_at', { ascending: false });

      console.log('AdminDashboard - Blogs query result:', { data, error });
      
      if (error) {
        console.error('AdminDashboard - Error fetching blogs:', error);
        throw error;
      }
      
      setBlogs(data || []);
      console.log('AdminDashboard - Blogs set:', data?.length || 0);
    } catch (error) {
      console.error('AdminDashboard - Error in fetchAllBlogs:', error);
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
      console.log('AdminDashboard - Fetching stats...');
      const [blogsCount, pendingCount, usersCount, viewsSum] = await Promise.all([
        supabase.from('blogs').select('id', { count: 'exact' }),
        supabase.from('blogs').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('blogs').select('views_count')
      ]);

      console.log('AdminDashboard - Stats results:', { blogsCount, pendingCount, usersCount, viewsSum });

      const totalViews = viewsSum.data?.reduce((sum, blog) => sum + (blog.views_count || 0), 0) || 0;

      const newStats = {
        totalBlogs: blogsCount.count || 0,
        pendingReview: pendingCount.count || 0,
        totalUsers: usersCount.count || 0,
        totalViews
      };

      console.log('AdminDashboard - Setting stats:', newStats);
      setStats(newStats);
    } catch (error) {
      console.error('AdminDashboard - Error fetching stats:', error);
    }
  };

  const updateBlogStatus = async (blogId: string, status: string) => {
    try {
      console.log('AdminDashboard - Updating blog status:', { blogId, status });
      
      const { error } = await supabase
        .from('blogs')
        .update({ 
          status,
          published_at: status === 'approved' ? new Date().toISOString() : null
        })
        .eq('id', blogId);

      if (error) {
        console.error('AdminDashboard - Error updating blog status:', error);
        throw error;
      }

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
      console.error('AdminDashboard - Error in updateBlogStatus:', error);
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

      <AdminStatsCards stats={stats} />

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
              <BlogCard 
                key={blog.id} 
                blog={blog} 
                onStatusUpdate={updateBlogStatus} 
              />
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
