import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const REFERRER_REWARD = 1;
const REFERRED_REWARD = 1;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, referral_code, referral_id } = await req.json();

    if (action === 'apply_referral') {
      // Check if user already has a referral applied
      if (user.referred_by) {
        return Response.json({ error: 'Referral already applied' }, { status: 400 });
      }

      // Find the referrer by code
      const referrers = await base44.asServiceRole.entities.User.filter({ referral_code });
      if (referrers.length === 0) {
        return Response.json({ error: 'Invalid referral code' }, { status: 400 });
      }

      const referrer = referrers[0];
      
      // Can't refer yourself
      if (referrer.email === user.email) {
        return Response.json({ error: 'Cannot use your own referral code' }, { status: 400 });
      }

      // Create referral record
      await base44.asServiceRole.entities.Referral.create({
        referrer_email: referrer.email,
        referred_email: user.email,
        referral_code: referral_code,
        status: 'pending'
      });

      // Mark user as referred
      await base44.asServiceRole.entities.User.update(user.id, {
        referred_by: referral_code
      });

      return Response.json({ success: true, message: 'Referral applied successfully' });
    }

    if (action === 'complete_referral') {
      // Admin action to mark referral as complete and grant rewards
      if (user.role !== 'admin') {
        return Response.json({ error: 'Admin only' }, { status: 403 });
      }

      const referrals = await base44.asServiceRole.entities.Referral.filter({ id: referral_id });
      if (referrals.length === 0) {
        return Response.json({ error: 'Referral not found' }, { status: 404 });
      }

      const referral = referrals[0];
      
      if (referral.status === 'rewarded') {
        return Response.json({ error: 'Already rewarded' }, { status: 400 });
      }

      // Get referrer and referred users
      const referrers = await base44.asServiceRole.entities.User.filter({ email: referral.referrer_email });
      const referredUsers = await base44.asServiceRole.entities.User.filter({ email: referral.referred_email });

      if (referrers.length > 0) {
        const referrer = referrers[0];
        await base44.asServiceRole.entities.User.update(referrer.id, {
          premium_credits: (referrer.premium_credits || 0) + REFERRER_REWARD,
          total_referrals: (referrer.total_referrals || 0) + 1,
          referral_credits_earned: (referrer.referral_credits_earned || 0) + REFERRER_REWARD
        });

        // Create transaction for referrer
        await base44.asServiceRole.entities.Transaction.create({
          user_email: referrer.email,
          type: 'bonus',
          credits: REFERRER_REWARD,
          status: 'completed',
          notes: `Referral bonus for inviting ${referral.referred_email}`
        });

        // Create notification for referrer
        await base44.asServiceRole.entities.Notification.create({
          user_email: referrer.email,
          type: 'credits_purchased',
          title: 'Referral Reward!',
          message: `You earned ${REFERRER_REWARD} credit for referring a friend!`,
          is_read: false
        });
      }

      if (referredUsers.length > 0) {
        const referred = referredUsers[0];
        await base44.asServiceRole.entities.User.update(referred.id, {
          premium_credits: (referred.premium_credits || 0) + REFERRED_REWARD
        });

        // Create transaction for referred user
        await base44.asServiceRole.entities.Transaction.create({
          user_email: referred.email,
          type: 'bonus',
          credits: REFERRED_REWARD,
          status: 'completed',
          notes: 'Welcome bonus from referral program'
        });

        // Create notification for referred user
        await base44.asServiceRole.entities.Notification.create({
          user_email: referred.email,
          type: 'credits_purchased',
          title: 'Welcome Bonus!',
          message: `You received ${REFERRED_REWARD} free credit as a welcome bonus!`,
          is_read: false
        });
      }

      // Update referral status
      await base44.asServiceRole.entities.Referral.update(referral.id, {
        status: 'rewarded',
        referrer_reward_credits: REFERRER_REWARD,
        referred_reward_credits: REFERRED_REWARD,
        rewarded_at: new Date().toISOString()
      });

      return Response.json({ success: true, message: 'Rewards granted successfully' });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});