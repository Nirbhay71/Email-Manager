/**
 * Seeds 45 realistic synthetic Email documents for the test user.
 * Designed with genuine variety across all content-type categories
 * that the inboxSampler recognizes, plus varied sender domains and dates.
 *
 * Run: node seed_test_emails.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './src/.env' });
import { Email } from './src/models/email.model.js';
import { OnboardingSample } from './src/models/onboardingSample.model.js';
import { EmailLabel } from './src/models/emailLabel.model.js';

const USER_EMAIL = 'buddhdevdarshan1478@gmail.com';

// Helper: date N days ago
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

const SEED_EMAILS = [
    // ── OTP / Verification (5) ──────────────────────────────────────
    {
        messageId: 'seed-otp-001',
        from: 'noreply@accounts.google.com',
        subject: 'Your verification code is 847293',
        body: 'Your Google verification code is 847293. This code expires in 10 minutes. If you did not request this code, ignore this email.',
        createdAt: daysAgo(1)
    },
    {
        messageId: 'seed-otp-002',
        from: 'security@linkedin.com',
        subject: 'LinkedIn: Your OTP for login',
        body: 'Hi Darshan, your one-time password for LinkedIn login is 551902. Do not share this with anyone. This OTP is valid for 5 minutes.',
        createdAt: daysAgo(3)
    },
    {
        messageId: 'seed-otp-003',
        from: 'no-reply@github.com',
        subject: '[GitHub] Please verify your device',
        body: 'Hey Darshan! We noticed a new sign-in to your GitHub account. Your verification code is 382716. If this wasn\'t you, please reset your password immediately.',
        createdAt: daysAgo(12)
    },
    {
        messageId: 'seed-otp-004',
        from: 'support@razorpay.com',
        subject: 'Security code for your Razorpay account',
        body: 'Your 2FA security code is 994120. Enter this code to complete your transaction. This code will expire in 3 minutes.',
        createdAt: daysAgo(20)
    },
    {
        messageId: 'seed-otp-005',
        from: 'noreply@amazon.in',
        subject: 'Amazon sign-in OTP',
        body: 'Your Amazon OTP is 663401. Use this to complete your sign-in. Do not share this code with anyone.',
        createdAt: daysAgo(45)
    },

    // ── Invoice / Payment (5) ───────────────────────────────────────
    {
        messageId: 'seed-invoice-001',
        from: 'billing@digitalocean.com',
        subject: 'Invoice #DO-2026-07 for your DigitalOcean services',
        body: 'Hi Darshan, your invoice for July 2026 is ready. Amount due: $12.00. Payment will be automatically charged to your card ending in 4242. View invoice details at dashboard.digitalocean.com.',
        createdAt: daysAgo(2)
    },
    {
        messageId: 'seed-invoice-002',
        from: 'receipts@uber.com',
        subject: 'Your Uber receipt for July 22',
        body: 'Thanks for riding with Uber! Trip from Satellite to Nirma University. Total fare: ₹187.00. Payment method: UPI. Receipt ID: UBER-7722-XC.',
        createdAt: daysAgo(4)
    },
    {
        messageId: 'seed-invoice-003',
        from: 'noreply@paytm.com',
        subject: 'Payment successful - ₹499 to Jio Prepaid',
        body: 'Your payment of ₹499.00 to Jio Prepaid Recharge has been processed successfully. Transaction ID: PTM926482. Amount debited from Paytm Wallet.',
        createdAt: daysAgo(15)
    },
    {
        messageId: 'seed-invoice-004',
        from: 'billing@aws.amazon.com',
        subject: 'AWS billing statement for June 2026',
        body: 'Your AWS billing statement is available. Total charges: $4.32. Service breakdown: EC2 $2.10, S3 $0.87, Lambda $1.35. Pay now to avoid service interruption.',
        createdAt: daysAgo(35)
    },
    {
        messageId: 'seed-invoice-005',
        from: 'orders@flipkart.com',
        subject: 'Order confirmed - Invoice attached',
        body: 'Your order #FK-88291 has been confirmed. Invoice for Logitech G402 Mouse - ₹2,499. Expected delivery: July 28. Payment via Credit Card ending 8891.',
        createdAt: daysAgo(60)
    },

    // ── Deadline / Due Date (6) ─────────────────────────────────────
    {
        messageId: 'seed-deadline-001',
        from: 'placements@nirmauni.ac.in',
        subject: 'URGENT: Deadline for TCS placement registration',
        body: 'Dear students, the last date to register for TCS campus placement drive is July 28, 2026. Submit your resume and academic transcripts on the placement portal before the deadline. Late registrations will NOT be accepted.',
        createdAt: daysAgo(1)
    },
    {
        messageId: 'seed-deadline-002',
        from: 'noreply@unstop.com',
        subject: 'Reminder: Application deadline approaching for HackWithInfy',
        body: 'Hi Darshan, the deadline for HackWithInfy 2026 is in 3 days! Complete your application before July 29. You\'ve saved a draft — finish it now. Over 50,000 students have already applied.',
        createdAt: daysAgo(2)
    },
    {
        messageId: 'seed-deadline-003',
        from: 'academics@nirmauni.ac.in',
        subject: 'Due date for project submission - Cloud Computing Lab',
        body: 'This is to inform all B.Tech CSE students that the due date for the Cloud Computing lab project (Phase 2) is August 5, 2026. Submit via the university LMS portal. Penalty of 10% per day for late submissions.',
        createdAt: daysAgo(5)
    },
    {
        messageId: 'seed-deadline-004',
        from: 'contests@codechef.com',
        subject: 'Registration closes tonight: CodeChef Starters 150',
        body: 'Don\'t miss out! Registration for CodeChef Starters 150 expires tonight at 11:59 PM IST. The contest features problems across all difficulty levels with exciting prizes.',
        createdAt: daysAgo(10)
    },
    {
        messageId: 'seed-deadline-005',
        from: 'noreply@internshala.com',
        subject: 'Last date to apply: React Developer Internship at Zomato',
        body: 'Hi Darshan, the application deadline for React Developer Internship at Zomato (Gurgaon) is approaching. Last date: July 20, 2026. Stipend: ₹25,000/month. Apply now before it\'s too late!',
        createdAt: daysAgo(25)
    },
    {
        messageId: 'seed-deadline-006',
        from: 'registrar@nirmauni.ac.in',
        subject: 'Fee payment deadline - Semester 7',
        body: 'Dear Darshan Buddhdev, the last date for paying Semester 7 tuition fees is August 10, 2026. Amount due: ₹1,25,000. Late fee of ₹500/day will be applicable after the deadline.',
        createdAt: daysAgo(40)
    },

    // ── Interview / Selection (6) ───────────────────────────────────
    {
        messageId: 'seed-interview-001',
        from: 'hr@infosys.com',
        subject: 'Interview invitation - Infosys SDE Intern',
        body: 'Dear Darshan, congratulations! You have been shortlisted for Round 2 (Technical Interview) for the SDE Intern position at Infosys. Date: July 30, 2026, 10:00 AM IST. Platform: Microsoft Teams. Please confirm your availability.',
        createdAt: daysAgo(1)
    },
    {
        messageId: 'seed-interview-002',
        from: 'careers@google.com',
        subject: 'Google STEP Intern 2026 - Coding challenge invitation',
        body: 'Hi Darshan, thank you for applying to Google STEP Internship 2026. We\'d like to invite you to complete an online coding test on HackerRank. The test window is July 25-28. You\'ll have 90 minutes once started.',
        createdAt: daysAgo(3)
    },
    {
        messageId: 'seed-interview-003',
        from: 'talent@razorpay.com',
        subject: 'Razorpay: You\'re shortlisted! Next steps for SDE Internship',
        body: 'Hi Darshan, great news — you\'ve been shortlisted for the Razorpay SDE Internship! Your Round 1 coding challenge score was excellent. Next step: 45-minute technical interview. Our team will reach out to schedule.',
        createdAt: daysAgo(8)
    },
    {
        messageId: 'seed-interview-004',
        from: 'noreply@unstop.com',
        subject: 'Selection result: Flipkart GRiD 6.0',
        body: 'Congratulations Darshan! You have cleared Round 1 of Flipkart GRiD 6.0 - Software Development Track. Round 2 details will be shared soon. Keep an eye on your registered email for further updates.',
        createdAt: daysAgo(18)
    },
    {
        messageId: 'seed-interview-005',
        from: 'recruitment@microsoft.com',
        subject: 'Microsoft Engage 2026 - Interview schedule',
        body: 'Dear Darshan Buddhdev, your interview for Microsoft Engage 2026 mentorship program has been scheduled. Date: August 2, 2026. Round: Technical + HR. Duration: 60 minutes. Join link will be shared 30 minutes before.',
        createdAt: daysAgo(30)
    },
    {
        messageId: 'seed-interview-006',
        from: 'placements@nirmauni.ac.in',
        subject: 'Wipro interview shortlist - Final round candidates',
        body: 'The following students have been shortlisted for Wipro final round interview: Darshan Buddhdev (21BCE001), Priya Shah (21BCE042)... Report to Seminar Hall B at 9 AM on August 5.',
        createdAt: daysAgo(50)
    },

    // ── Meeting / Calendar (4) ──────────────────────────────────────
    {
        messageId: 'seed-meeting-001',
        from: 'calendar-notification@google.com',
        subject: 'Reminder: Team sync - Capstone Project',
        body: 'Reminder: Team sync - Capstone Project. When: July 26, 2026 3:00 PM - 3:30 PM IST. Where: Google Meet (link attached). Attendees: darshan, nirbhay, priya, rahul.',
        createdAt: daysAgo(0)
    },
    {
        messageId: 'seed-meeting-002',
        from: 'noreply@zoom.us',
        subject: 'You\'ve been invited to a Zoom meeting: Prof. Mehta Office Hours',
        body: 'Prof. Amit Mehta is inviting you to a scheduled Zoom meeting. Topic: Office Hours - Cloud Computing doubts. Time: July 27, 2026 11:00 AM IST. Join Zoom Meeting: https://zoom.us/j/example',
        createdAt: daysAgo(6)
    },
    {
        messageId: 'seed-meeting-003',
        from: 'events@nirmauni.ac.in',
        subject: 'Agenda for CSE Department Meeting - July 2026',
        body: 'Dear faculty and student representatives, the agenda for the monthly CSE department meeting is: 1) Placement update 2) Lab infrastructure 3) Hackathon planning 4) Student feedback. Venue: Conference Room, 2nd Floor.',
        createdAt: daysAgo(14)
    },
    {
        messageId: 'seed-meeting-004',
        from: 'standup@slack.com',
        subject: 'Daily standup notes - July 20',
        body: 'Standup summary for #capstone-project channel. Darshan: Worked on search feature integration, blocked on embedding service config. Nirbhay: Completed webhook handler testing. Today: sync on gRPC proto definitions.',
        createdAt: daysAgo(22)
    },

    // ── Newsletter (5) ──────────────────────────────────────────────
    {
        messageId: 'seed-newsletter-001',
        from: 'newsletter@medium.com',
        subject: 'Medium Daily Digest: Top stories in Programming',
        body: 'Your daily digest is here! Top stories: "Why Rust is the future of systems programming", "Building RAG applications with LangChain", "React Server Components explained". To unsubscribe from this newsletter, click here.',
        createdAt: daysAgo(0)
    },
    {
        messageId: 'seed-newsletter-002',
        from: 'digest@quora.com',
        subject: 'Quora Digest: What are the best tips for cracking FAANG interviews?',
        body: 'Questions for you: "What are the best tips for cracking FAANG interviews?" (142 answers), "Is a CS degree still worth it in 2026?" (89 answers). Unsubscribe from Quora Digest emails.',
        createdAt: daysAgo(2)
    },
    {
        messageId: 'seed-newsletter-003',
        from: 'noreply@leetcode.com',
        subject: 'LeetCode Weekly: Your coding stats + new problems',
        body: 'Hi Darshan! This week you solved 12 problems (7 medium, 5 easy). Your streak: 23 days. New problems added: "Binary Tree Camera", "Merge K Sorted Lists". Keep going! Manage your email preferences or unsubscribe.',
        createdAt: daysAgo(7)
    },
    {
        messageId: 'seed-newsletter-004',
        from: 'weekly@hackernewsletter.com',
        subject: 'Hacker Newsletter #612',
        body: 'This week: SQLite as a production database, Why I left Google after 12 years, Show HN: An open-source Notion alternative. Curated by Kale Davis. Unsubscribe or update your email preferences.',
        createdAt: daysAgo(14)
    },
    {
        messageId: 'seed-newsletter-005',
        from: 'updates@geeksforgeeks.org',
        subject: 'GfG Weekly: DSA practice plan for placement season',
        body: 'Placement season is here! Follow our 90-day DSA practice plan: Week 1-2: Arrays & Strings, Week 3-4: Linked Lists & Trees. Plus: top 50 most asked interview questions. Click to opt out of mailing list.',
        createdAt: daysAgo(28)
    },

    // ── General / Personal (9) ──────────────────────────────────────
    {
        messageId: 'seed-general-001',
        from: 'nirbhayshingala71@gmail.com',
        subject: 'Re: Capstone project repo access',
        body: 'Hey Darshan, I\'ve added you as a collaborator on the GitHub repo. Can you pull the latest and check if the gRPC service starts? Also, should we use MongoDB Atlas or keep it local for now?',
        createdAt: daysAgo(1)
    },
    {
        messageId: 'seed-general-002',
        from: 'priya.shah@gmail.com',
        subject: 'Notes from today\'s class - Machine Learning',
        body: 'Hi Darshan, here are my notes from today\'s ML lecture. Topics covered: gradient descent variants, learning rate scheduling, batch normalization. Prof said the mid-sem will focus on chapters 3-5.',
        createdAt: daysAgo(3)
    },
    {
        messageId: 'seed-general-003',
        from: 'dad@buddhdev.com',
        subject: 'Come home this weekend?',
        body: 'Beta, your mom is making your favorite dhokla this Sunday. Can you come home for the weekend? Also, your uncle was asking about your placement preparation — call him once.',
        createdAt: daysAgo(5)
    },
    {
        messageId: 'seed-general-004',
        from: 'hostel.warden@nirmauni.ac.in',
        subject: 'Hostel maintenance notice - Water supply',
        body: 'Dear residents, water supply will be disrupted on July 27 from 10 AM to 2 PM due to tank cleaning. Please store water in advance. Apologies for the inconvenience.',
        createdAt: daysAgo(8)
    },
    {
        messageId: 'seed-general-005',
        from: 'library@nirmauni.ac.in',
        subject: 'Book return reminder',
        body: 'Dear Darshan Buddhdev, the following books are due for return: 1) "Design Patterns" by Gang of Four (due: July 25) 2) "Clean Code" by Robert Martin (due: July 28). Please return to avoid fines.',
        createdAt: daysAgo(10)
    },
    {
        messageId: 'seed-general-006',
        from: 'rahul.dev@outlook.com',
        subject: 'Weekend hackathon?',
        body: 'Yo Darshan, there\'s a 24-hour hackathon at DAIICT this weekend. Theme is AI for social good. Want to team up? I was thinking we could build something with our email manager project. Let me know!',
        createdAt: daysAgo(16)
    },
    {
        messageId: 'seed-general-007',
        from: 'sports@nirmauni.ac.in',
        subject: 'Cricket tournament registration open',
        body: 'Inter-hostel cricket tournament 2026 registrations are now open. Format: T10, teams of 8. Register your team by August 1 on the sports portal. Contact the sports secretary for queries.',
        createdAt: daysAgo(32)
    },
    {
        messageId: 'seed-general-008',
        from: 'alumni@nirmauni.ac.in',
        subject: 'Alumni talk: Career in AI/ML - Register now',
        body: 'Join us for an alumni talk by Dr. Sneha Patel (Batch 2018, now at DeepMind). Topic: "From campus to cutting-edge AI research". Date: August 3, 2026. Venue: Auditorium. Free for all students.',
        createdAt: daysAgo(55)
    },
    {
        messageId: 'seed-general-009',
        from: 'noreply@swiggy.in',
        subject: 'Your Swiggy order is on the way!',
        body: 'Your order from Domino\'s Pizza is being prepared! Estimated delivery: 35 minutes. Order: 1x Margherita Pizza, 1x Garlic Bread, 1x Coke. Track your order in the Swiggy app.',
        createdAt: daysAgo(70)
    },

    // ── Additional variety: promotions / spam-like (4) ──────────────
    {
        messageId: 'seed-promo-001',
        from: 'deals@udemy.com',
        subject: 'Flash sale: All courses at ₹449!',
        body: 'Don\'t miss our biggest sale of the year! Get any course for just ₹449. Top picks: Docker & Kubernetes, System Design, React + Next.js. Sale ends in 48 hours. Unsubscribe from promotional emails.',
        createdAt: daysAgo(4)
    },
    {
        messageId: 'seed-promo-002',
        from: 'offers@myntra.com',
        subject: 'End of Reason Sale LIVE - Up to 80% off!',
        body: 'The Myntra EORS is LIVE! Up to 80% off on top brands. Extra 10% off with ICICI cards. Shop now for Nike, Adidas, H&M and more. Limited time only! Unsubscribe from this mailing list.',
        createdAt: daysAgo(11)
    },
    {
        messageId: 'seed-promo-003',
        from: 'campus@naukri.com',
        subject: 'New job matches for your profile',
        body: 'Hi Darshan, we found 15 new jobs matching your profile: SDE Intern at Paytm, Backend Developer at CRED, Full Stack at Swiggy. Apply now on Naukri Campus. Update your email preferences.',
        createdAt: daysAgo(19)
    },
    {
        messageId: 'seed-promo-004',
        from: 'team@notion.so',
        subject: 'What\'s new in Notion - July 2026',
        body: 'Hi Darshan, check out what\'s new in Notion this month: AI-powered databases, new calendar view, improved API. Free for students with .edu email. Opt out of product updates.',
        createdAt: daysAgo(42)
    }
];

async function seed() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear any existing seed data and onboarding state
    const deleteResult = await Email.deleteMany({
        userEmail: USER_EMAIL,
        messageId: { $regex: /^seed-/ }
    });
    console.log(`Cleared ${deleteResult.deletedCount} previous seed emails`);

    // Reset onboarding state so fresh sample is computed
    await OnboardingSample.deleteOne({ userEmail: USER_EMAIL });
    await EmailLabel.deleteMany({ userEmail: USER_EMAIL, source: 'onboarding' });
    console.log('Cleared onboarding state');

    // Insert seed emails
    const docs = SEED_EMAILS.map(e => ({
        userEmail: USER_EMAIL,
        to: USER_EMAIL,
        ...e
    }));

    // Add 30 identical-cluster emails to force the 25% cap (cap is floor(75 * 0.25) = 18)
    for (let i = 0; i < 30; i++) {
        docs.push({
            userEmail: USER_EMAIL,
            to: USER_EMAIL,
            messageId: `seed-bulk-${i}`,
            from: 'marketing@spammer.com',
            subject: `Daily update ${i}`,
            body: `Just another daily update ${i}. Nothing special here.`,
            createdAt: daysAgo(2)
        });
    }

    const insertResult = await Email.insertMany(docs, { ordered: false }).catch(err => {
        if (err.code === 11000) {
            console.log(`Some duplicates skipped, inserted: ${err.result?.insertedCount || 'unknown'}`);
            return err.result;
        }
        throw err;
    });

    console.log(`Inserted ${Array.isArray(insertResult) ? insertResult.length : insertResult?.insertedCount || '?'} seed emails`);

    // Verify total count
    const totalCount = await Email.countDocuments({ userEmail: USER_EMAIL });
    console.log(`Total emails for ${USER_EMAIL}: ${totalCount} (6 real + ${SEED_EMAILS.length} seeded)`);

    process.exit(0);
}

seed().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});
