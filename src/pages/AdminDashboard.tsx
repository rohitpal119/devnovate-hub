import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  if (!user || profile?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    fetchPendingBlogs();
  }, []);

  const fetchPendingBlogs = async () => {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select(`*, profiles(full_name, username)`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBlogs(data || []);
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoadingBlogs(false);
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

      toast({
        title: "Status updated",
        description: `Blog ${status} successfully.`,
      });
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">Pending Review ({filterBlogsByStatus('pending').length})</TabsTrigger>
          <TabsTrigger value="approved">Published ({filterBlogsByStatus('approved').length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({filterBlogsByStatus('rejected').length})</TabsTrigger>
        </TabsList>

        {['pending', 'approved', 'rejected'].map(status => (
          <TabsContent key={status} value={status} className="space-y-4">
            {filterBlogsByStatus(status).map(blog => (
              <Card key={blog.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">{blog.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        By {blog.profiles?.full_name || blog.profiles?.username || 'Anonymous'}
                      </p>
                      {blog.excerpt && (
                        <p className="text-muted-foreground line-clamp-2">{blog.excerpt}</p>
                      )}
                    </div>
                    <Badge variant={status === 'approved' ? 'default' : status === 'pending' ? 'secondary' : 'destructive'}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                  </div>

                  {status === 'pending' && (
                    <div className="flex space-x-2">
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
                    </div>
                  )}

                  {status === 'approved' && (
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateBlogStatus(blog.id, 'hidden')}
                      >
                        <EyeOff className="mr-2 w-4 h-4" />
                        Hide
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}