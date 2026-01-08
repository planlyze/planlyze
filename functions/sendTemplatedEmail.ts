import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userEmail, templateKey, variables, language } = await req.json();

    if (!userEmail || !templateKey) {
      return Response.json({ error: 'userEmail and templateKey are required' }, { status: 400 });
    }

    const lang = language || 'english';

    // Fetch the template
    const templates = await base44.asServiceRole.entities.EmailTemplate.filter({ 
      template_key: templateKey,
      is_active: true 
    });

    if (!templates || templates.length === 0) {
      return Response.json({ error: 'Template not found or inactive' }, { status: 404 });
    }

    const template = templates[0];
    
    // Get subject and body based on language
    const subject = lang === 'arabic' ? (template.subject_ar || template.subject_en) : template.subject_en;
    let body = lang === 'arabic' ? (template.body_ar || template.body_en) : template.body_en;

    // Replace variables in body
    if (variables && typeof variables === 'object') {
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        body = body.replace(regex, value || '');
      }
    }

    // Send email via SMTP
    const smtpHost = Deno.env.get('ZEPTOMAIL_API_URL');
    const smtpApiKey = Deno.env.get('ZEPTOMAIL_API_KEY');
    const senderName = Deno.env.get('ZEPTOMAIL_SENDER_NAME', 'Planlyze');
    const senderEmail = Deno.env.get('ZEPTOMAIL_SENDER_EMAIL', 'no.reply@planlyze.com');

    if (!smtpHost || !smtpApiKey) {
      return Response.json({ error: 'SMTP configuration missing' }, { status: 500 });
    }

    const emailPayload = {
      bounce_address: senderEmail,
      from: {
        address: senderEmail,
        name: senderName
      },
      to: [
        {
          email_address: {
            address: userEmail,
            name: userEmail.split('@')[0]
          }
        }
      ],
      subject: subject,
      htmlbody: body
    };

    const response = await fetch(`${smtpHost}`, {
      method: 'POST',
      headers: {
        'Authorization': smtpApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ZeptoMail Error:', errorText);
      return Response.json({ 
        error: 'Failed to send email',
        details: errorText 
      }, { status: 500 });
    }

    return Response.json({ 
      success: true,
      message: 'Email sent successfully' 
    });

  } catch (error) {
    console.error('Error sending templated email:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});