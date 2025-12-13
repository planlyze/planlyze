import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const payload = await req.json();
    const { userEmail, credits, notes } = payload;

    if (!userEmail || typeof credits !== 'number') {
      return Response.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // Get target user
    const allUsers = await base44.asServiceRole.entities.User.list();
    const targetUser = allUsers.find(u => u.email === userEmail);

    if (!targetUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate new balance
    const currentCredits = targetUser.premium_credits || 0;
    const newBalance = Math.max(0, currentCredits + credits);

    // Update user credits and usage tracking
    const updates = {
      premium_credits: newBalance
    };
    
    // Track purchases separately
    if (credits > 0) {
      updates.total_credits_purchased = (targetUser.total_credits_purchased || 0) + credits;
    } else {
      // Track deductions as usage
      updates.total_credits_used = (targetUser.total_credits_used || 0) + Math.abs(credits);
    }
    
    await base44.asServiceRole.entities.User.update(targetUser.id, updates);

    // Create transaction record with proper type
    const transactionType = credits > 0 ? 'bonus' : 'refund';
    await base44.asServiceRole.entities.Transaction.create({
      user_email: userEmail,
      type: transactionType,
      credits: credits,
      status: 'completed',
      notes: notes || `Admin ${credits > 0 ? 'added' : 'deducted'} ${Math.abs(credits)} credits`,
      payment_provider: 'admin_adjustment'
    });

    return Response.json({
      success: true,
      newBalance: newBalance,
      adjustment: credits
    }, { status: 200 });
  } catch (error) {
    console.error('adjustUserCredits error:', error);
    return Response.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
});