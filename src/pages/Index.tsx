import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import BlogCard from '@/components/BlogCard';
import { useAuth } from '@/hooks/useAuth';
import { TrendingUp, BookOpen, Users, ArrowRight } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';

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

export default function Index() {
  const { user } = useAuth();
  const [latestBlogs, setLatestBlogs] = useState<Blog[]>([]);
  const [trendingBlogs, setTrendingBlogs] = useState<Blog[]>([]);
  const [featuredBlog, setFeaturedBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      // Fetch latest blogs
      const { data: latest } = await supabase
        .from('blogs')
        .select(`
          *,
          profiles!inner (
            full_name,
            username,
            avatar_url
          )
        `)
        .eq('status', 'approved')
        .order('published_at', { ascending: false })
        .limit(6);

      // Fetch trending blogs (by engagement in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: trending } = await supabase
        .from('blogs')
        .select(`
          *,
          profiles!inner (
            full_name,
            username,
            avatar_url
          )
        `)
        .eq('status', 'approved')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('likes_count', { ascending: false })
        .limit(5);

      if (latest) {
        setFeaturedBlog(latest[0] || null);
        setLatestBlogs(latest.slice(1));
      }
      
      if (trending) {
        setTrendingBlogs(trending);
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section 
        className="relative py-20 lg:py-32 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(147, 51, 234, 0.9)), url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20" />
        <div className="relative container mx-auto px-4 text-center text-white">
          <div className="max-w-4xl mx-auto space-y-6">
            <Badge variant="outline" className="text-white border-white/30 bg-white/10 backdrop-blur-sm">
              Welcome to the Developer Community
            </Badge>
            
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
              Share Knowledge,{" "}
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Build Together
              </span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-white/90 max-w-2xl mx-auto">
              Join thousands of developers sharing insights, tutorials, and experiences. 
              Write, learn, and grow with the community.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              {user ? (
                <Button size="lg" className="bg-white text-primary hover:bg-white/90" asChild>
                  <Link to="/create">
                    Start Writing <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              ) : (
                <Button size="lg" className="bg-white text-primary hover:bg-white/90" asChild>
                  <Link to="/auth">
                    Join the Community <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              )}
              <Button size="lg" variant="outline" className="text-white border-white/30 hover:bg-white/10">
                Explore Articles
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center border-0 bg-card/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <BookOpen className="w-12 h-12 mx-auto text-primary mb-4" />
                <h3 className="text-2xl font-bold mb-2">1000+</h3>
                <p className="text-muted-foreground">Articles Published</p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-0 bg-card/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <Users className="w-12 h-12 mx-auto text-primary mb-4" />
                <h3 className="text-2xl font-bold mb-2">500+</h3>
                <p className="text-muted-foreground">Active Writers</p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-0 bg-card/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <TrendingUp className="w-12 h-12 mx-auto text-primary mb-4" />
                <h3 className="text-2xl font-bold mb-2">50k+</h3>
                <p className="text-muted-foreground">Monthly Readers</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading articles...</p>
          </div>
        ) : (
          <div className="space-y-16">
            {/* Featured Article */}
            {featuredBlog && (
              <section>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold">Featured Article</h2>
                </div>
                <BlogCard blog={featuredBlog} />
              </section>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Latest Articles */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Latest Articles</h2>
                  <Button variant="ghost" asChild>
                    <Link to="/latest">View All</Link>
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {latestBlogs.map((blog) => (
                    <BlogCard key={blog.id} blog={blog} />
                  ))}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-8">
                {/* Trending Articles */}
                <Card className="border-0 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="mr-2 w-5 h-5" />
                      Trending This Week
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {trendingBlogs.map((blog, index) => (
                      <div key={blog.id}>
                        <Link 
                          to={`/blog/${blog.slug}`}
                          className="block space-y-2 group"
                        >
                          <h4 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                            {blog.title}
                          </h4>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <span>{blog.profiles.full_name || blog.profiles.username}</span>
                            <span className="mx-2">•</span>
                            <span>{blog.likes_count} likes</span>
                          </div>
                        </Link>
                        {index < trendingBlogs.length - 1 && <Separator className="mt-4" />}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Popular Tags */}
                <Card className="border-0 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Popular Tags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {['React', 'TypeScript', 'Node.js', 'Python', 'JavaScript', 'AWS', 'Docker', 'GraphQL'].map((tag) => (
                        <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* CTA Card */}
                {!user && (
                  <Card className="border-0 bg-gradient-to-br from-primary to-accent text-primary-foreground">
                    <CardContent className="pt-6 text-center">
                      <h3 className="text-lg font-bold mb-2">Ready to Share Your Story?</h3>
                      <p className="text-primary-foreground/90 text-sm mb-4">
                        Join our community and start writing today.
                      </p>
                      <Button variant="secondary" asChild className="w-full">
                        <Link to="/auth">Get Started</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}