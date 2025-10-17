<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Faq;

class FaqSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faqs = [
            // Account & Registration
            [
                'question' => 'When does SACRART open and how do I sign up?',
                'answer' => 'SACRART is now open! You can sign up anytime by clicking "Get Started" on our homepage. Simply enter your email address and choose your preferred plan. Registration takes less than 2 minutes.',
                'category' => 'account',
                'sort_order' => 1,
                'is_active' => true
            ],
            [
                'question' => 'How do I reset my password?',
                'answer' => 'To reset your password, go to the login page and click "Forgot Password". Enter your email address and follow the instructions sent to your email.',
                'category' => 'account',
                'sort_order' => 2,
                'is_active' => true
            ],
            [
                'question' => 'How do I change my email address?',
                'answer' => 'You can change your email address from your Profile page. Click "Edit Profile" and update your email address. You will need to verify the new email.',
                'category' => 'account',
                'sort_order' => 3,
                'is_active' => true
            ],

            // Billing & Subscriptions
            [
                'question' => 'How can I upgrade my subscription?',
                'answer' => 'You can upgrade your subscription by going to your Profile page and clicking "Upgrade Plan". Choose your desired plan and follow the payment process.',
                'category' => 'billing',
                'sort_order' => 1,
                'is_active' => true
            ],
            [
                'question' => 'Can I cancel my subscription anytime?',
                'answer' => 'Yes, you can cancel your subscription anytime from your Profile page. Your access will continue until the end of your current billing period.',
                'category' => 'billing',
                'sort_order' => 2,
                'is_active' => true
            ],
            [
                'question' => 'What payment methods do you accept?',
                'answer' => 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers. All payments are processed securely through our payment partners.',
                'category' => 'billing',
                'sort_order' => 3,
                'is_active' => true
            ],

            // Technical Support
            [
                'question' => 'Why is my video not playing?',
                'answer' => 'If your video is not playing, try refreshing the page, clearing your browser cache, or checking your internet connection. If the problem persists, contact support.',
                'category' => 'technical',
                'sort_order' => 1,
                'is_active' => true
            ],
            [
                'question' => 'What devices are supported?',
                'answer' => 'SACRART works on all modern devices including desktop computers, laptops, tablets, and smartphones. We support all major browsers including Chrome, Firefox, Safari, and Edge.',
                'category' => 'technical',
                'sort_order' => 2,
                'is_active' => true
            ],
            [
                'question' => 'Do you have a mobile app?',
                'answer' => 'Yes! Our mobile app is available for both iOS and Android devices. You can download it from the App Store or Google Play Store.',
                'category' => 'technical',
                'sort_order' => 3,
                'is_active' => true
            ],

            // Content & Learning
            [
                'question' => 'How do I download course materials?',
                'answer' => 'Course materials can be downloaded from the video player page. Look for the "Downloadable Materials" section on the right side of the video player.',
                'category' => 'content',
                'sort_order' => 1,
                'is_active' => true
            ],
            [
                'question' => 'Can I access courses offline?',
                'answer' => 'Yes! With our mobile app, you can download videos and course materials for offline viewing. This feature is available for all subscription plans.',
                'category' => 'content',
                'sort_order' => 2,
                'is_active' => true
            ],
            [
                'question' => 'How often is new content added?',
                'answer' => 'We add new courses and content regularly. Premium subscribers get early access to new content and exclusive masterclasses.',
                'category' => 'content',
                'sort_order' => 3,
                'is_active' => true
            ],

            // Plans & Pricing
            [
                'question' => 'What\'s the difference between subscription plans?',
                'answer' => 'Freemium includes basic content and community support. Basic includes HD streaming and intermediate content. Premium includes 4K streaming, all content, and 1-on-1 mentoring sessions.',
                'category' => 'plans',
                'sort_order' => 1,
                'is_active' => true
            ],
            [
                'question' => 'Do you offer student discounts?',
                'answer' => 'Yes! We offer a 50% discount for students with valid student ID. Contact support with your student verification to get the discount applied to your account.',
                'category' => 'plans',
                'sort_order' => 2,
                'is_active' => true
            ],
            [
                'question' => 'Is there a free trial?',
                'answer' => 'Yes! All plans include a 14-day free trial. You can cancel anytime during the trial period without being charged.',
                'category' => 'plans',
                'sort_order' => 3,
                'is_active' => true
            ]
        ];

        foreach ($faqs as $faq) {
            Faq::create($faq);
        }
    }
}