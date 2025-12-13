import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const { token } = await req.json();
    
    if (!token) {
      return Response.json({ error: 'Token is required' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    
    // Use service role to bypass RLS for public share links
    const shares = await base44.asServiceRole.entities.ReportShare.filter({ 
      share_token: token 
    });
    
    const share = shares[0];
    
    if (!share) {
      return Response.json({ error: 'Share not found' }, { status: 404 });
    }
    
    if (!share.is_active) {
      return Response.json({ error: 'Share link is inactive' }, { status: 403 });
    }
    
    // Check expiration
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return Response.json({ error: 'Share link has expired' }, { status: 403 });
    }
    
    // Load the analysis
    const analyses = await base44.asServiceRole.entities.Analysis.filter({ 
      id: share.analysis_id 
    });
    
    if (analyses.length === 0) {
      return Response.json({ error: 'Analysis not found' }, { status: 404 });
    }
    
    // Update access count
    await base44.asServiceRole.entities.ReportShare.update(share.id, {
      access_count: (share.access_count || 0) + 1
    });
    
    return Response.json({
      share,
      analysis: analyses[0]
    });
    
  } catch (error) {
    console.error('Error in getSharedReport:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});