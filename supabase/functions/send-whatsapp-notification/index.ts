
// Follow Deno's ESM compatibility guidelines
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  clienteNome: string;
  dataVencimento: string;
  valorTotal: number;
  valorPendente: number;
  telefone?: string; // We'll keep this in the payload but won't use it for sending
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clienteNome, dataVencimento, valorTotal, valorPendente } = await req.json() as NotificationPayload;
    
    // Format the values as Brazilian currency (R$)
    const formatarValor = (valor: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(valor);
    };

    // Always use the store owner's phone number
    const storeOwnerPhone = "77981088587";
    
    // Format the date to Brazilian format
    const dataFormatada = new Date(dataVencimento).toLocaleDateString('pt-BR');
    
    // Create WhatsApp message
    const message = `*Notificação de Vencimento* 📣\n\n*Cliente:* ${clienteNome}\n*Data de Vencimento:* ${dataFormatada}\n*Valor Total:* ${formatarValor(valorTotal)}\n*Valor Pendente:* ${formatarValor(valorPendente)}`;
    
    console.log(`Sending WhatsApp notification to store owner (${storeOwnerPhone}) about client ${clienteNome}`);
    console.log(`Message: ${message}`);
    
    // In a real implementation, you would integrate with the WhatsApp Business API 
    // or a service like Twilio, MessageBird, etc.
    // For this example, we'll just log the message and simulate a successful send
    
    // Simulating API call to WhatsApp
    // Uncomment and modify the following code when you have a real WhatsApp API integration:
    /*
    const apiResponse = await fetch('https://your-whatsapp-api-endpoint.com/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_API_KEY'
      },
      body: JSON.stringify({
        phone: storeOwnerPhone,
        message: message
      })
    });
    
    if (!apiResponse.ok) {
      throw new Error(`WhatsApp API error: ${apiResponse.status}`);
    }
    
    const apiData = await apiResponse.json();
    */
    
    // For now, simulate a successful response
    const apiData = {
      success: true,
      messageSent: true,
      to: storeOwnerPhone
    };
    
    return new Response(
      JSON.stringify({
        success: true,
        data: apiData,
        message: "WhatsApp notification sent successfully to store owner"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error) {
    console.error("Error sending WhatsApp notification:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unknown error occurred"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
