import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Image prompts for each template
const templateImageConfigs: Record<string, { category: string; images: { id: string; prompt: string; aspectRatio?: string }[] }> = {
  "marble-gold": {
    category: "corporate",
    images: [
      { id: "portfolio-1", prompt: "Luxury penthouse interior with marble floors and gold accents, floor-to-ceiling windows overlooking city skyline, minimalist modern design, ultra high resolution, architectural photography" },
      { id: "portfolio-2", prompt: "Elegant villa with swimming pool, white marble terrace, gold decorative elements, Mediterranean luxury style, aerial view, 4k photorealistic" },
      { id: "portfolio-3", prompt: "Boutique luxury hotel lobby, marble columns, crystal chandeliers, gold trim details, grand staircase, professional interior photography" },
      { id: "portfolio-4", prompt: "Private luxury yacht interior, white leather and gold fixtures, panoramic windows, sleek modern design, nautical elegance" },
      { id: "portfolio-5", prompt: "Modern corporate headquarters lobby, marble reception desk, gold logo wall, minimalist executive design, professional architecture photography" },
      { id: "portfolio-6", prompt: "Contemporary art gallery interior, white walls, marble floors, spot lighting on abstract sculptures, museum quality space" },
      { id: "team-1", prompt: "Professional headshot of confident business woman in her 40s, neutral gray background, soft studio lighting, corporate executive portrait, warm smile" },
      { id: "team-2", prompt: "Professional headshot of business man in his 30s wearing suit, neutral background, studio lighting, corporate portrait, friendly expression" },
      { id: "team-3", prompt: "Professional headshot of young professional woman, neutral background, natural lighting, modern corporate style portrait" },
      { id: "team-4", prompt: "Professional headshot of senior executive man in his 50s, distinguished look, neutral background, corporate photography" },
    ]
  },
  "luxe-boutique": {
    category: "ecommerce",
    images: [
      { id: "hero", prompt: "Fashion model in elegant evening gown, soft rose gold lighting, luxury boutique setting, high-end editorial fashion photography, full body shot", aspectRatio: "16:9" },
      { id: "product-1", prompt: "Elegant silk evening dress on mannequin, champagne gold color, studio photography on white background, high-end fashion product shot" },
      { id: "product-2", prompt: "Luxurious velvet evening gown in deep burgundy, draped on elegant display, soft lighting, boutique fashion photography" },
      { id: "product-3", prompt: "Premium cashmere winter coat in camel color, hanging on gold rack, minimalist studio setting, luxury outerwear photography" },
      { id: "product-4", prompt: "Designer leather handbag in cognac brown, gold hardware details, product photography on marble surface, luxury accessories" },
      { id: "product-5", prompt: "Elegant pearl necklace with gold clasp on velvet display, jewelry photography, soft diffused lighting, luxury accessories" },
      { id: "product-6", prompt: "Silk blouse in ivory white, draped elegantly, studio product photography, high-end fashion, soft shadows" },
    ]
  },
  "artisan-market": {
    category: "ecommerce",
    images: [
      { id: "product-1", prompt: "Handmade ceramic vase with natural earth tones glaze, artisan pottery, warm studio lighting, product photography on linen background" },
      { id: "product-2", prompt: "Hand-stitched leather messenger bag in natural tan, brass buckles, artisan craftsmanship, rustic wood background, product photography" },
      { id: "product-3", prompt: "Handcrafted wooden jewelry box with intricate carving, walnut wood, artisan woodwork, warm lighting, product shot" },
      { id: "product-4", prompt: "Hand-woven linen throw blanket in natural beige, textured weave pattern, draped on wooden ladder, cozy artisan home decor" },
      { id: "product-5", prompt: "Handmade silver earrings with turquoise stones, artisan jewelry on natural stone, bohemian style, product photography" },
      { id: "product-6", prompt: "Handcrafted terracotta plant pot with geometric pattern, artisan ceramics, natural lighting, minimalist product shot" },
      { id: "artisan-1", prompt: "Portrait of female artisan potter in her workshop, natural lighting, warm smile, surrounded by ceramic pieces, authentic craftsperson" },
      { id: "artisan-2", prompt: "Portrait of male leather craftsman at workbench, focused on work, workshop setting, warm lighting, artisan at work" },
      { id: "artisan-3", prompt: "Portrait of female jewelry maker examining handmade piece, close-up, workshop background, natural lighting, artisan portrait" },
    ]
  },
  "executive-suite": {
    category: "corporate",
    images: [
      { id: "team-1", prompt: "Professional corporate headshot of CEO woman in her 50s, power suit, confident expression, neutral gray background, executive portrait" },
      { id: "team-2", prompt: "Professional headshot of CFO man in his 40s, formal business attire, trustworthy expression, corporate photography" },
      { id: "team-3", prompt: "Professional headshot of young COO woman, modern business casual, approachable smile, corporate portrait" },
      { id: "team-4", prompt: "Professional headshot of senior advisor man, distinguished gray hair, wise expression, executive portrait" },
      { id: "service-1", prompt: "Modern glass office building exterior at dusk, city skyline, professional architecture photography, corporate headquarters" },
      { id: "service-2", prompt: "Executive boardroom with panoramic city views, long conference table, modern minimalist design, corporate interior" },
      { id: "service-3", prompt: "Professional team meeting in modern office, diverse group collaborating, natural lighting, corporate lifestyle" },
    ]
  },
  "noir-elegance": {
    category: "landing",
    images: [
      { id: "hero", prompt: "Dramatic black and white fashion photography, model in elegant black dress, high contrast lighting, luxury editorial style, full body", aspectRatio: "16:9" },
      { id: "project-1", prompt: "Minimalist black interior design, modern living room, dramatic lighting, monochrome luxury, architectural photography" },
      { id: "project-2", prompt: "Black and white product photography, luxury watch on dark surface, dramatic spot lighting, high-end advertising" },
      { id: "project-3", prompt: "Noir style portrait photography, mysterious woman, dramatic side lighting, black and white, artistic" },
    ]
  },
  "golden-prestige": {
    category: "landing",
    images: [
      { id: "hero", prompt: "Luxury gold and black abstract background, flowing golden silk fabric, dramatic lighting, premium brand aesthetic", aspectRatio: "16:9" },
      { id: "service-1", prompt: "Premium gold trophy or award on black pedestal, dramatic lighting, achievement and excellence concept" },
      { id: "service-2", prompt: "Luxury gold credit card on black marble surface, exclusive banking concept, premium lifestyle" },
      { id: "service-3", prompt: "Gold crown on black velvet pillow, royal luxury concept, dramatic lighting, prestige symbol" },
    ]
  },
  "crystal-vision": {
    category: "landing",
    images: [
      { id: "hero", prompt: "Futuristic crystal glass architecture, blue and white gradient, modern tech building, abstract geometric design, high resolution", aspectRatio: "16:9" },
      { id: "project-1", prompt: "Crystal glass sculpture catching light, prismatic rainbow reflections, modern art installation, minimalist white background" },
      { id: "project-2", prompt: "Transparent glass modern building facade, blue sky reflection, contemporary architecture photography" },
      { id: "project-3", prompt: "Abstract crystal formation, blue and purple tones, macro photography, futuristic tech aesthetic" },
    ]
  },
  "tech-horizon": {
    category: "corporate",
    images: [
      { id: "project-1", prompt: "Futuristic tech startup office, open floor plan, neon accent lighting, modern workstations, innovative workspace" },
      { id: "project-2", prompt: "Abstract technology visualization, data streams and circuits, blue gradient, digital network concept art" },
      { id: "project-3", prompt: "Modern server room with blue LED lighting, rows of servers, tech infrastructure, datacenter photography" },
      { id: "team-1", prompt: "Portrait of young tech CEO, casual hoodie, confident smile, modern office background, startup founder" },
      { id: "team-2", prompt: "Portrait of female CTO, glasses, smart casual, coding screens in background, tech professional" },
      { id: "team-3", prompt: "Portrait of diverse tech team member, friendly expression, modern workspace, innovative company culture" },
    ]
  },
  "premium-gallery": {
    category: "ecommerce",
    images: [
      { id: "gallery-1", prompt: "Luxury wristwatch product photography, stainless steel and gold, black background, high-end advertising, reflective surface" },
      { id: "gallery-2", prompt: "Premium sunglasses on marble surface, designer eyewear, soft shadows, luxury accessories photography" },
      { id: "gallery-3", prompt: "Luxury perfume bottle, crystal and gold design, dramatic lighting, high-end fragrance advertising" },
      { id: "gallery-4", prompt: "Designer shoes on pedestal, Italian leather, elegant styling, luxury footwear photography" },
      { id: "gallery-5", prompt: "Premium leather wallet, brown crocodile texture, gold accents, luxury accessories product shot" },
      { id: "gallery-6", prompt: "Luxury fountain pen on leather journal, gold nib, executive accessories, refined product photography" },
    ]
  },
  "dashboard-pro": {
    category: "webapp",
    images: [
      { id: "avatar-1", prompt: "Professional avatar photo of young woman, friendly smile, casual business attire, neutral background, app profile picture" },
      { id: "avatar-2", prompt: "Professional avatar photo of man in his 30s, approachable expression, casual style, neutral background, user profile" },
      { id: "avatar-3", prompt: "Professional avatar photo of senior woman, wise expression, business casual, neutral background, team member" },
    ]
  },
  "crm-elite": {
    category: "webapp",
    images: [
      { id: "avatar-1", prompt: "Professional CRM user avatar, young sales representative woman, confident smile, headset, customer service" },
      { id: "avatar-2", prompt: "Professional avatar of account manager man, friendly expression, suit and tie, corporate style" },
      { id: "avatar-3", prompt: "Professional avatar of customer success manager woman, approachable, modern office background" },
    ]
  },
  "platform-x": {
    category: "webapp",
    images: [
      { id: "feature-1", prompt: "Abstract tech platform visualization, connected nodes and data flow, purple and blue gradient, SaaS concept art" },
      { id: "feature-2", prompt: "Modern API integration concept, code and connections, futuristic tech illustration, developer platform" },
    ]
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { templateId, imageId, regenerate } = await req.json();

    // If specific template and image requested
    if (templateId && imageId) {
      const config = templateImageConfigs[templateId];
      if (!config) {
        return new Response(
          JSON.stringify({ error: "Template not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const imageConfig = config.images.find(img => img.id === imageId);
      if (!imageConfig) {
        return new Response(
          JSON.stringify({ error: "Image config not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if image already exists
      const filePath = `${templateId}/${imageId}.png`;
      if (!regenerate) {
        const { data: existingFile } = await supabase.storage
          .from("template-images")
          .list(templateId, { search: `${imageId}.png` });

        if (existingFile && existingFile.length > 0) {
          const { data: urlData } = supabase.storage
            .from("template-images")
            .getPublicUrl(filePath);
          
          return new Response(
            JSON.stringify({ url: urlData.publicUrl, cached: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Generate image
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: imageConfig.prompt }],
          modalities: ["image", "text"],
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error("AI API error:", aiResponse.status, errorText);
        throw new Error(`AI generation failed: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!imageUrl) {
        throw new Error("No image generated");
      }

      // Extract base64 data
      const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
      const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("template-images")
        .upload(filePath, imageBuffer, {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from("template-images")
        .getPublicUrl(filePath);

      return new Response(
        JSON.stringify({ url: urlData.publicUrl, generated: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If no specific image, return available templates
    return new Response(
      JSON.stringify({ 
        templates: Object.keys(templateImageConfigs),
        configs: templateImageConfigs 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
