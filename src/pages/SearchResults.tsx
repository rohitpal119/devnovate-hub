import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import BlogCard from '@/components/BlogCard';
import { Search, ArrowLeft } from 'lucide-react';

interface Blog {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  author_id: string;
  cover_image_url?: string;
  tags: string[];
  reading_time: number;
  likes_count: number;
  comments_count: number;
  views_count: number;
  created_at: string;
  published_at: string;
  profiles: {
    full_name: string;
    avatar_url?: string;
  };
}

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    fetchAvailableTags();
    if (searchQuery) {
      performSearch();
    }
  }, []);

  useEffect(() => {
    const query = searchParams.get('q');
    const tags = searchParams.get('tags');
    
    if (query) setSearchQuery(query);
    if (tags) setSelectedTags(tags.split(','));
    
    if (query || tags) {
      performSearch();
    }
  }, [searchParams]);

  const fetchAvailableTags = async () => {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('tags')
        .eq('status', 'approved')
        .not('tags', 'is', null);

      if (error) throw error;

      const allTags = data
        .flatMap(blog => blog.tags || [])
        .filter(Boolean);

      const uniqueTags = [...new Set(allTags)].sort();
      setAvailableTags(uniqueTags);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const performSearch = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('blogs')
        .select(`
          *,
          profiles:author_id (
            full_name,
            avatar_url
          )
        `)
        .eq('status', 'approved')
        .order('published_at', { ascending: false });

      // Text search
      if (searchQuery.trim()) {
        query = query.or(
          `title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      let filteredData = data || [];

      // Filter by tags
      if (selectedTags.length > 0) {
        filteredData = filteredData.filter(blog => 
          blog.tags && blog.tags.some(tag => selectedTags.includes(tag))
        );
      }

      setBlogs(filteredData);
    } catch (error) {
      console.error('Search error:', error);
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery);
    if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
    
    setSearchParams(params);
    performSearch();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setSearchParams({});
    setBlogs([]);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back
        </Button>

        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold mb-6">Search Articles</h1>
          
          {/* Search Input */}
          <div className="flex space-x-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              Search
            </Button>
          </div>

          {/* Tags Filter */}
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3 text-muted-foreground">Filter by tags:</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {availableTags.map(tag => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
            
            {(searchQuery || selectedTags.length > 0) && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Search Results */}
      <div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {(searchQuery || selectedTags.length > 0) && (
              <div className="mb-6">
                <p className="text-muted-foreground">
                  Found {blogs.length} article{blogs.length !== 1 ? 's' : ''}
                  {searchQuery && ` for "${searchQuery}"`}
                  {selectedTags.length > 0 && ` tagged with: ${selectedTags.join(', ')}`}
                </p>
              </div>
            )}

            {blogs.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {blogs.map((blog) => (
                  <BlogCard key={blog.id} blog={blog} />
                ))}
              </div>
            ) : (searchQuery || selectedTags.length > 0) ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium mb-2">No articles found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search terms or filters
                </p>
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium mb-2">Start searching</h3>
                <p className="text-muted-foreground">
                  Enter keywords or select tags to find articles
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}