import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import BlogCard from '@/components/BlogCard';
import { useAuth } from '@/hooks/useAuth';
import { TrendingUp, BookOpen, Users, ArrowRight, Sparkles, Clock, Eye, Heart, MessageCircle } from 'lucide-react';
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
          backgroundImage: `linear-gradient(135deg, rgba(76, 81, 191, 0.9), rgba(108, 99, 255, 0.9)), url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20" />
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/10 animate-float"
              style={{
                width: `${Math.random() * 100 + 50}px`,
                height: `${Math.random() * 100 + 50}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${i * 2}s`,
                animationDuration: `${15 + i * 5}s`,
              }}
            />
          ))}
        </div>
        
        <div className="relative container mx-auto px-4 text-center text-white">
          <div className="max-w-4xl mx-auto space-y-6">
            <Badge 
              variant="outline" 
              className="text-white border-white/30 bg-white/10 backdrop-blur-sm animate-fade-in"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Welcome to BloggerHub
            </Badge>
            
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight animate-fade-in-up">
              Share Knowledge,{" "}
              <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent animate-gradient">
                Build Together
              </span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-white/90 max-w-2xl mx-auto animate-fade-in-up delay-150">
              Join thousands of developers sharing insights, tutorials, and experiences. 
              Write, learn, and grow with the BloggerHub community.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 animate-fade-in-up delay-300">
              {user ? (
                <Button 
                  size="lg" 
                  className="bg-white text-primary hover:bg-white/90 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl" 
                  asChild
                >
                  <Link to="/create">
                    Start Writing <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  className="bg-white text-primary hover:bg-white/90 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl" 
                  asChild
                >
                  <Link to="/auth">
                    Join BloggerHub <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Animated scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/70 rounded-full mt-2"></div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center border-0 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 animate-fade-in-up">
              <CardContent className="pt-6">
                <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-4">
                  <BookOpen className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">1000+</h3>
                <p className="text-muted-foreground">Articles Published</p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-0 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 animate-fade-in-up delay-100">
              <CardContent className="pt-6">
                <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-4">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">500+</h3>
                <p className="text-muted-foreground">Active Writers</p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-0 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 animate-fade-in-up delay-200">
              <CardContent className="pt-6">
                <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-4">
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
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
              <section className="animate-fade-in">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold flex items-center">
                    <Sparkles className="w-6 h-6 mr-2 text-primary" />
                    Featured Article
                  </h2>
                </div>
                <div className="transform transition-all duration-500 hover:scale-[1.02]">
                  <BlogCard blog={featuredBlog} />
                </div>
              </section>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Latest Articles */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between animate-fade-in">
                  <h2 className="text-2xl font-bold flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-primary" />
                    Latest Articles
                  </h2>
                  <Button variant="ghost" asChild className="group">
                    <Link to="/latest" className="flex items-center">
                      View All
                      <ArrowRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {latestBlogs.map((blog, index) => (
                    <div 
                      key={blog.id} 
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="transform transition-all duration-300 hover:-translate-y-1">
                        <BlogCard blog={blog} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-8">
                {/* Trending Articles */}
                <Card className="border-0 bg-card/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in-right">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-lg">
                      <TrendingUp className="mr-2 w-5 h-5 text-blue-500" />
                      Trending This Week
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {trendingBlogs.map((blog, index) => (
                      <div key={blog.id} className="group">
                        <Link 
                          to={`/blog/${blog.slug}`}
                          className="block space-y-2 p-2 rounded-lg transition-all duration-300 group-hover:bg-muted/50"
                        >
                          <div className="flex items-start">
                            <span className="text-sm font-bold text-muted-foreground mr-3 mt-1">
                              {index + 1}
                            </span>
                            <h4 className="font-medium line-clamp-2 group-hover:text-primary transition-colors flex-1">
                              {blog.title}
                            </h4>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground flex-wrap gap-2">
                            <span className="flex items-center">
                              <Heart className="w-3 h-3 mr-1" />
                              {blog.likes_count}
                            </span>
                            <span className="flex items-center">
                              <MessageCircle className="w-3 h-3 mr-1" />
                              {blog.comments_count}
                            </span>
                            <span className="flex items-center">
                              <Eye className="w-3 h-3 mr-1" />
                              {blog.views_count}
                            </span>
                          </div>
                        </Link>
                        {index < trendingBlogs.length - 1 && <Separator className="mt-4" />}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Popular Tags */}
                <Card className="border-0 bg-card/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in-right delay-100">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Popular Tags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {['React', 'TypeScript', 'Node.js', 'Python', 'JavaScript', 'AWS', 'Docker', 'GraphQL'].map((tag) => (
                        <Badge 
                          key={tag} 
                          variant="secondary" 
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-105"
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* CTA Card */}
                {!user && (
                  <Card className="border-0 bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 animate-pulse-slow">
                    <CardContent className="pt-6 text-center">
                      <Sparkles className="w-8 h-8 mx-auto mb-2" />
                      <h3 className="text-lg font-bold mb-2">Ready to Share Your Story?</h3>
                      <p className="text-primary-foreground/90 text-sm mb-4">
                        Join BloggerHub and start writing today.
                      </p>
                      <Button variant="secondary" asChild className="w-full transition-all duration-300 hover:scale-105">
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

      {/* Add global styles for animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes float {
          0% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pulseSlow {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }
        .animate-fade-in-up {
          opacity: 0;
          animation: fadeInUp 0.6s ease-out forwards;
        }
        .animate-fade-in-right {
          opacity: 0;
          animation: fadeInRight 0.6s ease-out forwards;
        }
        .animate-float {
          animation: float 10s ease-in-out infinite;
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        .animate-pulse-slow {
          animation: pulseSlow 3s ease-in-out infinite;
        }
        .delay-100 {
          animation-delay: 0.1s;
        }
        .delay-150 {
          animation-delay: 0.15s;
        }
        .delay-200 {
          animation-delay: 0.2s;
        }
        .delay-300 {
          animation-delay: 0.3s;
        }
      `}</style>
    </div>
  );
}