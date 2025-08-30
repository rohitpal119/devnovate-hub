import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: 'new_blog' | 'new_comment' | 'blog_approved';
  recipientEmail: string;
  recipientName: string;
  blogTitle: string;
  blogSlug?: string;
  authorName?: string;
  commentContent?: string;
}

const templates = {
  new_blog: (data: NotificationRequest) => ({
    subject: `New blog post: ${data.blogTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Blog Post Published!</h2>
        <p>Hi ${data.recipientName},</p>
        <p>A new blog post has been published:</p>
        <h3 style="color: #0066cc;">${data.blogTitle}</h3>
        <p>by ${data.authorName}</p>
        ${data.blogSlug ? `<a href="${Deno.env.get('SITE_URL')}/blog/${data.blogSlug}" style="background-color: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Read Article</a>` : ''}
        <p style="margin-top: 20px; color: #666; font-size: 14px;">
          Best regards,<br>
          The Blog Team
        </p>
      </div>
    `,
  }),

  new_comment: (data: NotificationRequest) => ({
    subject: `New comment on: ${data.blogTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Comment on Your Blog Post!</h2>
        <p>Hi ${data.recipientName},</p>
        <p>Someone commented on your blog post:</p>
        <h3 style="color: #0066cc;">${data.blogTitle}</h3>
        <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #0066cc; margin: 15px 0;">
          "${data.commentContent}"
        </div>
        ${data.blogSlug ? `<a href="${Deno.env.get('SITE_URL')}/blog/${data.blogSlug}" style="background-color: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Comment</a>` : ''}
        <p style="margin-top: 20px; color: #666; font-size: 14px;">
          Best regards,<br>
          The Blog Team
        </p>
      </div>
    `,
  }),

  blog_approved: (data: NotificationRequest) => ({
    subject: `Your blog post has been approved: ${data.blogTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Congratulations! Your Blog Post is Live!</h2>
        <p>Hi ${data.recipientName},</p>
        <p>Great news! Your blog post has been approved and is now live:</p>
        <h3 style="color: #0066cc;">${data.blogTitle}</h3>
        ${data.blogSlug ? `<a href="${Deno.env.get('SITE_URL')}/blog/${data.blogSlug}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Your Post</a>` : ''}
        <p style="margin-top: 20px;">
          Your post is now visible to all readers. Share it with your network to get more engagement!
        </p>
        <p style="margin-top: 20px; color: #666; font-size: 14px;">
          Best regards,<br>
          The Blog Team
        </p>
      </div>
    `,
  }),
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: NotificationRequest = await req.json();
    
    if (!data.type || !data.recipientEmail || !data.recipientName) {
      throw new Error("Missing required fields");
    }

    const template = templates[data.type];
    if (!template) {
      throw new Error("Invalid notification type");
    }

    const emailContent = template(data);

    const emailResponse = await resend.emails.send({
      from: "Blog Platform <notifications@yourdomain.com>",
      to: [data.recipientEmail],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-notifications function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);