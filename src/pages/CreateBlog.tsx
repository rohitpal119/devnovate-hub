import { useState, useEffect } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save } from 'lucide-react';

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
    tags: ''
  });

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const slug = formData.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      const blogData = {
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt,
        slug: slug + '-' + Date.now(),
        author_id: profile?.id,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        reading_time: Math.ceil(formData.content.split(' ').length / 200),
      };

      const { error } = await supabase.from('blogs').insert(blogData);

      if (error) throw error;

      toast({
        title: "Blog submitted!",
        description: "Your blog has been submitted for review.",
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save blog.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Create New Article</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Write Your Article</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                placeholder="Article title..."
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="text-xl font-semibold border-0 px-0 focus-visible:ring-0"
                required
              />
            </div>

            <div>
              <Textarea
                placeholder="Write a brief excerpt..."
                value={formData.excerpt}
                onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                rows={2}
              />
            </div>

            <div>
              <Textarea
                placeholder="Write your article content here..."
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                rows={20}
                className="min-h-[400px]"
                required
              />
            </div>

            <div>
              <Input
                placeholder="Tags (comma separated)"
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                <Save className="mr-2 w-4 h-4" />
                {saving ? 'Publishing...' : 'Publish Article'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}