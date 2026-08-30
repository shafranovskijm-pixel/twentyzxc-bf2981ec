import { supabase } from "@/integrations/supabase/client";

interface ContactFormData {
  type: 'contact' | 'brief';
  service?: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
  // Brief-specific fields
  projectType?: string;
  description?: string;
  features?: string;
  integrations?: string;
  users?: string;
  budget?: string;
  deadline?: string;
  pages?: string;
  products?: string;
  payment?: string;
  delivery?: string;
  attribution?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_landing?: string;
  };
}

export async function sendToTelegram(data: ContactFormData): Promise<{ success: boolean; saved?: boolean; delivered?: boolean; error?: string }> {
  try {
    // The previous production function requires a non-empty `email` field.
    // Mirror a phone into it only on the wire so phone-only leads continue to
    // work while the backward-compatible server update is rolling out.
    const payload = !data.email && data.phone
      ? { ...data, email: data.phone }
      : data;
    const { data: result, error } = await supabase.functions.invoke('send-telegram', {
      body: payload,
    });

    if (error) {
      console.error('Error sending to Telegram:', error);
      return { success: false, error: error.message };
    }

    return {
      success: result?.success === true,
      saved: typeof result?.saved === 'boolean' ? result.saved : undefined,
      delivered: result?.delivered === true,
    };
  } catch (error) {
    console.error('Error sending to Telegram:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
