import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import BlogCard from "@/components/BlogCard";
import { useAuth } from "@/hooks/useAuth";
import {
  TrendingUp,
  BookOpen,
  Users,
  ArrowRight,
  Sparkles,
  Clock,
  Eye,
  Heart,
  MessageCircle,
} from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

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
      const { data: latest } = await supabase
        .from("blogs")
        .select(`*, profiles!inner ( full_name, username, avatar_url )`)
        .eq("status", "approved")
        .order("published_at", { ascending: false })
        .limit(6);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data: trending } = await supabase
        .from("blogs")
        .select(`*, profiles!inner ( full_name, username, avatar_url )`)
        .eq("status", "approved")
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("likes_count", { ascending: false })
        .limit(5);

      if (latest) {
        setFeaturedBlog(latest[0] || null);
        setLatestBlogs(latest.slice(1));
      }
      if (trending) setTrendingBlogs(trending);
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-purple-50 to-pink-50">
      {/* Hero Section */}
      <section
        className="relative py-20 lg:py-32 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(91, 33, 182, 0.85), rgba(236, 72, 153, 0.85)), url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/30 via-fuchsia-500/30 to-pink-500/30" />
        <div className="relative container mx-auto px-4 text-center text-white">
          <Badge className="text-white border-white/30 bg-white/20 backdrop-blur-md animate-fade-in">
            <Sparkles className="w-3 h-3 mr-1" /> Welcome to BloggerHub
          </Badge>
          <h1 className="mt-6 text-5xl lg:text-7xl font-extrabold leading-tight animate-fade-in-up">
            Share Knowledge,{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
              Build Together
            </span>
          </h1>
          <p className="mt-4 text-xl lg:text-2xl text-white/90 max-w-2xl mx-auto animate-fade-in-up delay-150">
            Join thousands of developers sharing insights, tutorials, and
            experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 animate-fade-in-up delay-300">
            {user ? (
              <Button
                size="lg"
                className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold shadow-lg hover:scale-105 transition-all"
                asChild
              >
                <Link to="/create">
                  Start Writing <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            ) : (
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-semibold shadow-lg hover:scale-105 transition-all"
                asChild
              >
                <Link to="/auth">
                  Join BloggerHub <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: BookOpen, label: "Articles Published", value: "1000+" },
              { icon: Users, label: "Active Writers", value: "500+" },
              { icon: TrendingUp, label: "Monthly Readers", value: "50k+" },
            ].map((stat, i) => (
              <Card
                key={i}
                className="text-center border-0 bg-white/60 backdrop-blur-lg shadow-xl hover:shadow-2xl transition-all"
              >
                <CardContent className="pt-6">
                  <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-indigo-400 to-purple-400 text-white rounded-full mb-4">
                    <stat.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-3xl font-extrabold mb-2 text-gray-800">
                    {stat.value}
                  </h3>
                  <p className="text-gray-600 font-medium">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading articles...</p>
          </div>
        ) : (
          <div className="space-y-16">
            {featuredBlog && (
              <section>
                <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent flex items-center">
                  <Sparkles className="w-6 h-6 mr-2" /> Featured Article
                </h2>
                <div className="transform transition-all hover:scale-[1.02]">
                  <BlogCard blog={featuredBlog} />
                </div>
              </section>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold flex items-center bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                    <Clock className="w-5 h-5 mr-2" /> Latest Articles
                  </h2>
                  <Button
                    variant="ghost"
                    asChild
                    className="text-indigo-600 hover:text-purple-600"
                  >
                    <Link to="/latest" className="flex items-center">
                      View All <ArrowRight className="ml-1 w-4 h-4" />
                    </Link>
                  </Button>
                </div>
                {latestBlogs.map((blog) => (
                  <div
                    key={blog.id}
                    className="transition-transform hover:-translate-y-1"
                  >
                    <BlogCard blog={blog} />
                  </div>
                ))}
              </div>

              <div className="space-y-8">
                <Card className="border-0 bg-white/70 backdrop-blur-lg shadow-xl hover:shadow-2xl transition-all">
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg font-semibold text-indigo-600">
                      <TrendingUp className="mr-2 w-5 h-5" /> Trending This Week
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {trendingBlogs.map((blog, i) => (
                      <div key={blog.id}>
                        <Link
                          to={`/blog/${blog.slug}`}
                          className="block p-2 rounded-lg hover:bg-indigo-50"
                        >
                          <h4 className="font-medium line-clamp-2 text-gray-800 hover:text-indigo-600">
                            {blog.title}
                          </h4>
                          <div className="flex items-center text-sm text-gray-500 gap-3 mt-1">
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
                        {i < trendingBlogs.length - 1 && (
                          <Separator className="mt-3" />
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-0 bg-white/70 backdrop-blur-lg shadow-xl hover:shadow-2xl transition-all">
                  <CardHeader>
                    <CardTitle className="text-lg text-purple-600">
                      Popular Tags
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {[
                      "React",
                      "TypeScript",
                      "Node.js",
                      "Python",
                      "JavaScript",
                      "AWS",
                      "Docker",
                      "GraphQL",
                    ].map((tag) => (
                      <Badge
                        key={tag}
                        className="cursor-pointer bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow hover:scale-105 transition-all"
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </CardContent>
                </Card>

                {!user && (
                  <Card className="border-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-2xl hover:scale-[1.02] transition-all">
                    <CardContent className="pt-6 text-center">
                      <Sparkles className="w-8 h-8 mx-auto mb-3" />
                      <h3 className="text-lg font-bold mb-2">
                        Ready to Share Your Story?
                      </h3>
                      <p className="mb-4 text-white/90">
                        Join BloggerHub and start writing today.
                      </p>
                      <Button
                        variant="secondary"
                        asChild
                        className="w-full bg-white text-indigo-600 font-semibold hover:scale-105 transition-all"
                      >
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

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }
        .animate-fade-in-up {
          opacity: 0;
          animation: fadeInUp 0.6s ease-out forwards;
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 4s ease infinite;
        }
      `}</style>
    </div>
  );
}
