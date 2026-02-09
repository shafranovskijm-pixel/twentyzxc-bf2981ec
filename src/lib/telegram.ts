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
}

export async function sendToTelegram(data: ContactFormData): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: result, error } = await supabase.functions.invoke('send-telegram', {
      body: data,
    });

    if (error) {
      console.error('Error sending to Telegram:', error);
      return { success: false, error: error.message };
    }

    return { success: result?.success ?? true };
  } catch (error) {
    console.error('Error sending to Telegram:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
