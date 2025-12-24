from datetime import datetime
from server.models import db, Notification, User
from server.services.email_service import send_email


def get_user_preference(user, pref_key):
    """Check if user has a specific notification preference enabled"""
    prefs = user.notification_preferences or {}
    if not prefs.get('email_notifications', True):
        return False
    return prefs.get(pref_key, True)


def create_user_notification(user_email, notification_type, title, message, meta_data=None):
    """Create in-app notification for a user"""
    try:
        notification = Notification(
            user_email=user_email,
            type=notification_type,
            title=title,
            message=message,
            is_read=False,
            meta_data=meta_data or {}
        )
        db.session.add(notification)
        db.session.commit()
        return True
    except Exception as e:
        print(f"Error creating user notification: {e}")
        db.session.rollback()
        return False


def send_user_email(user, subject, content_html, lang='en'):
    """Send email to user"""
    if not user.email_verified:
        return False
    
    if lang == 'ar':
        dir_attr = 'dir="rtl"'
    else:
        dir_attr = ''
    
    html_body = f"""
    <div {dir_attr} style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background: linear-gradient(135deg, #581c87 0%, #ea580c 100%); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Planlyze</h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #1e293b; margin-top: 0;">{subject}</h2>
            {content_html}
            <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin-top: 20px;">
                <p style="margin: 0; color: #64748b; font-size: 14px;">
                    {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}
                </p>
            </div>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
            <p>{"هذا إشعار آلي من Planlyze." if lang == 'ar' else "This is an automated notification from Planlyze."}</p>
        </div>
    </div>
    """
    
    success, error = send_email(user.email, user.full_name or user.display_name or '', subject, html_body)
    if not success:
        print(f"Failed to send user email: {error}")
    return success


def notify_referral_joined(referrer_email, referred_user_name, referred_user_email):
    """Notify user when someone joins using their referral code"""
    referrer = User.query.filter_by(email=referrer_email).first()
    if not referrer:
        return
    
    if not get_user_preference(referrer, 'referral_joined'):
        create_user_notification(
            referrer_email,
            'referral_joined',
            'New Referral Joined' if referrer.language != 'ar' else 'انضمام إحالة جديدة',
            f"{referred_user_name or referred_user_email} joined using your referral code!",
            {'referred_email': referred_user_email}
        )
        return
    
    lang = referrer.language or 'en'
    if lang == 'ar':
        subject = "إحالة جديدة انضمت!"
        content = f"""
        <p style="color: #666;">مبروك! لقد انضم <strong>{referred_user_name or referred_user_email}</strong> باستخدام رمز الإحالة الخاص بك.</p>
        <p style="color: #666;">ستحصل على مكافأتك عندما يكملون أول تحليل لهم.</p>
        """
    else:
        subject = "New Referral Joined!"
        content = f"""
        <p style="color: #666;">Congratulations! <strong>{referred_user_name or referred_user_email}</strong> has joined using your referral code.</p>
        <p style="color: #666;">You'll receive your reward when they complete their first analysis.</p>
        """
    
    create_user_notification(
        referrer_email,
        'referral_joined',
        subject,
        f"{referred_user_name or referred_user_email} joined using your referral code!",
        {'referred_email': referred_user_email}
    )
    
    send_user_email(referrer, subject, content, lang)


def notify_credits_changed(user_email, credits_amount, change_type, reason=None, admin_email=None):
    """Notify user when admin adds or deducts credits"""
    user = User.query.filter_by(email=user_email).first()
    if not user:
        return
    
    pref_key = 'credits_added' if change_type == 'add' else 'credits_deducted'
    
    lang = user.language or 'en'
    if change_type == 'add':
        if lang == 'ar':
            subject = f"تمت إضافة {credits_amount} رصيد"
            title = subject
            message = f"تمت إضافة {credits_amount} رصيد إلى حسابك"
            content = f"""
            <p style="color: #666;">تمت إضافة <strong>{credits_amount} رصيد</strong> إلى حسابك.</p>
            {f'<p style="color: #666;">السبب: {reason}</p>' if reason else ''}
            <p style="color: #666;">رصيدك الجديد: <strong>{user.credits} رصيد</strong></p>
            """
        else:
            subject = f"{credits_amount} Credits Added"
            title = subject
            message = f"{credits_amount} credits have been added to your account"
            content = f"""
            <p style="color: #666;"><strong>{credits_amount} credits</strong> have been added to your account.</p>
            {f'<p style="color: #666;">Reason: {reason}</p>' if reason else ''}
            <p style="color: #666;">Your new balance: <strong>{user.credits} credits</strong></p>
            """
    else:
        if lang == 'ar':
            subject = f"تم خصم {credits_amount} رصيد"
            title = subject
            message = f"تم خصم {credits_amount} رصيد من حسابك"
            content = f"""
            <p style="color: #666;">تم خصم <strong>{credits_amount} رصيد</strong> من حسابك.</p>
            {f'<p style="color: #666;">السبب: {reason}</p>' if reason else ''}
            <p style="color: #666;">رصيدك الجديد: <strong>{user.credits} رصيد</strong></p>
            """
        else:
            subject = f"{credits_amount} Credits Deducted"
            title = subject
            message = f"{credits_amount} credits have been deducted from your account"
            content = f"""
            <p style="color: #666;"><strong>{credits_amount} credits</strong> have been deducted from your account.</p>
            {f'<p style="color: #666;">Reason: {reason}</p>' if reason else ''}
            <p style="color: #666;">Your new balance: <strong>{user.credits} credits</strong></p>
            """
    
    create_user_notification(
        user_email,
        pref_key,
        title,
        message,
        {'credits_amount': credits_amount, 'change_type': change_type, 'reason': reason}
    )
    
    if get_user_preference(user, pref_key):
        send_user_email(user, subject, content, lang)


def notify_analysis_completed(user_email, analysis_id, business_idea):
    """Notify user when their analysis is completed"""
    user = User.query.filter_by(email=user_email).first()
    if not user:
        return
    
    lang = user.language or 'en'
    idea_short = business_idea[:50] + '...' if len(business_idea) > 50 else business_idea
    
    if lang == 'ar':
        subject = "اكتمل تحليلك!"
        title = subject
        message = f"تم الانتهاء من تحليل '{idea_short}'"
        content = f"""
        <p style="color: #666;">تم الانتهاء من تحليل فكرتك التجارية!</p>
        <p style="color: #666;"><strong>الفكرة:</strong> {business_idea}</p>
        <p style="color: #666;">يمكنك الآن عرض التقرير الكامل في لوحة التحكم الخاصة بك.</p>
        """
    else:
        subject = "Your Analysis is Complete!"
        title = subject
        message = f"Analysis for '{idea_short}' is ready"
        content = f"""
        <p style="color: #666;">Your business analysis is complete!</p>
        <p style="color: #666;"><strong>Idea:</strong> {business_idea}</p>
        <p style="color: #666;">You can now view your full report in your dashboard.</p>
        """
    
    create_user_notification(
        user_email,
        'analysis_complete',
        title,
        message,
        {'analysis_id': analysis_id}
    )
    
    if get_user_preference(user, 'analysis_complete'):
        send_user_email(user, subject, content, lang)


def notify_payment_status_changed(user_email, payment_id, status, credits=None, rejection_reason=None):
    """Notify user when their payment status changes"""
    user = User.query.filter_by(email=user_email).first()
    if not user:
        return
    
    lang = user.language or 'en'
    pref_key = f'payment_{status}'
    
    if status == 'approved':
        if lang == 'ar':
            subject = "تمت الموافقة على دفعتك!"
            title = subject
            message = f"تمت الموافقة على دفعتك وإضافة {credits} رصيد"
            content = f"""
            <p style="color: #22c55e; font-weight: bold;">تمت الموافقة على دفعتك!</p>
            <p style="color: #666;">تمت إضافة <strong>{credits} رصيد</strong> إلى حسابك.</p>
            <p style="color: #666;">يمكنك الآن استخدام رصيدك لإنشاء تحليلات متميزة.</p>
            """
        else:
            subject = "Your Payment is Approved!"
            title = subject
            message = f"Your payment is approved and {credits} credits added"
            content = f"""
            <p style="color: #22c55e; font-weight: bold;">Your payment has been approved!</p>
            <p style="color: #666;"><strong>{credits} credits</strong> have been added to your account.</p>
            <p style="color: #666;">You can now use your credits to create premium analyses.</p>
            """
    else:
        if lang == 'ar':
            subject = "تم رفض دفعتك"
            title = subject
            message = "تم رفض دفعتك. يرجى التواصل معنا للمساعدة."
            content = f"""
            <p style="color: #ef4444; font-weight: bold;">تم رفض دفعتك</p>
            {f'<p style="color: #666;">السبب: {rejection_reason}</p>' if rejection_reason else ''}
            <p style="color: #666;">إذا كنت تعتقد أن هذا خطأ، يرجى التواصل معنا.</p>
            """
        else:
            subject = "Your Payment was Rejected"
            title = subject
            message = "Your payment was rejected. Please contact us for help."
            content = f"""
            <p style="color: #ef4444; font-weight: bold;">Your payment has been rejected</p>
            {f'<p style="color: #666;">Reason: {rejection_reason}</p>' if rejection_reason else ''}
            <p style="color: #666;">If you believe this is an error, please contact us.</p>
            """
    
    create_user_notification(
        user_email,
        pref_key,
        title,
        message,
        {'payment_id': payment_id, 'status': status, 'credits': credits}
    )
    
    if get_user_preference(user, pref_key):
        send_user_email(user, subject, content, lang)


def notify_low_credits(user_email, current_credits):
    """Notify user when their credits are low"""
    user = User.query.filter_by(email=user_email).first()
    if not user:
        return
    
    lang = user.language or 'en'
    
    if lang == 'ar':
        subject = "رصيدك منخفض!"
        title = subject
        message = f"لديك {current_credits} رصيد فقط متبقي"
        content = f"""
        <p style="color: #f59e0b; font-weight: bold;">رصيدك منخفض!</p>
        <p style="color: #666;">لديك <strong>{current_credits} رصيد</strong> فقط متبقي.</p>
        <p style="color: #666;">اشترِ المزيد من الرصيد للاستمرار في إنشاء تحليلات متميزة.</p>
        """
    else:
        subject = "Your Credits are Running Low!"
        title = subject
        message = f"You have only {current_credits} credits remaining"
        content = f"""
        <p style="color: #f59e0b; font-weight: bold;">Your credits are running low!</p>
        <p style="color: #666;">You have only <strong>{current_credits} credits</strong> remaining.</p>
        <p style="color: #666;">Purchase more credits to continue creating premium analyses.</p>
        """
    
    create_user_notification(
        user_email,
        'credits_low',
        title,
        message,
        {'current_credits': current_credits}
    )
    
    if get_user_preference(user, 'credits_low'):
        send_user_email(user, subject, content, lang)


def notify_shared_report_opened(owner_email, share_id, business_idea, access_count):
    """Notify user when their shared report is opened"""
    user = User.query.filter_by(email=owner_email).first()
    if not user:
        return
    
    lang = user.language or 'en'
    idea_short = business_idea[:50] + '...' if len(business_idea) > 50 else business_idea
    
    if lang == 'ar':
        subject = "تم فتح تقريرك المشترك!"
        title = subject
        message = f"قام شخص ما بعرض تقرير '{idea_short}' المشترك الخاص بك"
        content = f"""
        <p style="color: #666;">تم فتح رابط التقرير المشترك الخاص بك!</p>
        <p style="color: #666;"><strong>التقرير:</strong> {business_idea}</p>
        <p style="color: #666;"><strong>إجمالي المشاهدات:</strong> {access_count}</p>
        """
    else:
        subject = "Your Shared Report was Opened!"
        title = subject
        message = f"Someone viewed your shared report for '{idea_short}'"
        content = f"""
        <p style="color: #666;">Your shared report link was opened!</p>
        <p style="color: #666;"><strong>Report:</strong> {business_idea}</p>
        <p style="color: #666;"><strong>Total Views:</strong> {access_count}</p>
        """
    
    create_user_notification(
        owner_email,
        'report_shared_opened',
        title,
        message,
        {'share_id': share_id, 'access_count': access_count}
    )
    
    if get_user_preference(user, 'report_shared_opened'):
        send_user_email(user, subject, content, lang)
