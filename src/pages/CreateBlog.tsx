import { useState, useEffect } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUpload } from '@/components/ImageUpload';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, FileText, Image, Tag, Type, Clock, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

export default function CreateBlog() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    tags: '',
    cover_image_url: ''
  });
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);

  useEffect(() => {
    const words = formData.content.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    setReadingTime(Math.ceil(words.length / 200));
  }, [formData.content]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading editor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please add a title and content to your article.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const slug = formData.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      const blogData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        excerpt: formData.excerpt.trim(),
        slug: slug + '-' + Date.now(),
        author_id: profile?.id,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        reading_time: readingTime,
        cover_image_url: formData.cover_image_url || null,
        status: 'pending'
      };

      const { error } = await supabase.from('blogs').insert(blogData);

      if (error) throw error;

      toast({
        title: "Article submitted!",
        description: "Your article has been submitted for review and will be published soon.",
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error saving article:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save article. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 py-8">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')} 
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <div className="w-px h-6 bg-border"></div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Create Article
              </h1>
              <p className="text-muted-foreground">Share your knowledge with the community</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{readingTime} min read</span>
            <div className="w-px h-4 bg-border mx-2"></div>
            <FileText className="w-4 h-4" />
            <span>{wordCount} words</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Title Input */}
                  <div className="space-y-2">
                    <Label htmlFor="title" className="flex items-center gap-2">
                      <Type className="w-4 h-4" />
                      Article Title
                    </Label>
                    <Input
                      id="title"
                      placeholder="Catchy title that grabs attention..."
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="text-xl font-semibold h-14 border-2 focus:border-primary transition-colors"
                      required
                    />
                  </div>

                  {/* Cover Image Upload */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Image className="w-4 h-4" />
                      Cover Image
                    </Label>
                    <ImageUpload
                      onImageUploaded={(url) => handleInputChange('cover_image_url', url)}
                      currentImageUrl={formData.cover_image_url}
                      onImageRemoved={() => handleInputChange('cover_image_url', '')}
                    />
                  </div>

                  {/* Excerpt Input */}
                  <div className="space-y-2">
                    <Label htmlFor="excerpt">Article Excerpt</Label>
                    <Textarea
                      id="excerpt"
                      placeholder="Brief summary of your article (appears in article previews)..."
                      value={formData.excerpt}
                      onChange={(e) => handleInputChange('excerpt', e.target.value)}
                      rows={3}
                      className="resize-none border-2 focus:border-primary transition-colors"
                    />
                    <p className="text-sm text-muted-foreground">
                      {formData.excerpt.length}/200 characters
                    </p>
                  </div>

                  {/* Content Editor */}
                  <div className="space-y-2">
                    <Label htmlFor="content">Article Content</Label>
                    <Textarea
                      id="content"
                      placeholder="Write your amazing content here... You can use Markdown for formatting!"
                      value={formData.content}
                      onChange={(e) => handleInputChange('content', e.target.value)}
                      rows={20}
                      className="min-h-[400px] resize-none border-2 focus:border-primary transition-colors font-mono text-sm"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tags Input */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Input
                    placeholder="react, javascript, webdev..."
                    value={formData.tags}
                    onChange={(e) => handleInputChange('tags', e.target.value)}
                    className="border-2 focus:border-primary transition-colors"
                  />
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.split(',')
                      .map(tag => tag.trim())
                      .filter(Boolean)
                      .map((tag, index) => (
                        <Badge key={index} variant="secondary" className="px-2 py-1">
                          #{tag}
                        </Badge>
                      ))
                    }
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Add comma-separated tags to help readers find your article
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Publishing Card */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/5 to-accent/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Publish</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                      Draft
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Visibility</span>
                    <span className="font-medium">Public</span>
                  </div>

                  <div className="pt-4 border-t">
                    <Button 
                      type="submit" 
                      onClick={handleSubmit}
                      disabled={saving || !formData.title.trim() || !formData.content.trim()}
                      className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Publishing...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 w-4 h-4" />
                          Publish Article
                        </>
                      )}
                    </Button>
                    
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Your article will be reviewed before publication
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Writing Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p>Use clear, descriptive headings</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p>Include code examples where relevant</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p>Add images to make your content engaging</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p>Proofread before publishing</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}