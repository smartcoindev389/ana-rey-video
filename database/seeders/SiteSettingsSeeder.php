<?php

namespace Database\Seeders;

use App\Models\SiteSetting;
use Illuminate\Database\Seeder;

class SiteSettingsSeeder extends Seeder
{
    public function run(): void
    {
        // Hero Section Settings
        SiteSetting::setValue(
            'hero_title',
            'Sculpting Mastery',
            'text',
            'hero',
            'Hero Title',
            'Main title displayed in the hero section'
        );

        SiteSetting::setValue(
            'hero_subtitle',
            'Witness the artistry behind incredible sculpting techniques and restoration processes',
            'text',
            'hero',
            'Hero Subtitle',
            'Subtitle displayed below the main title'
        );

        SiteSetting::setValue(
            'hero_cta_text',
            'Start enjoying SACRART plans from only',
            'text',
            'hero',
            'CTA Text',
            'Call-to-action text above the price'
        );

        SiteSetting::setValue(
            'hero_price',
            '$9.99/month',
            'text',
            'hero',
            'Hero Price',
            'Price displayed in the hero section'
        );

        SiteSetting::setValue(
            'hero_cta_button_text',
            'GET SACRART',
            'text',
            'hero',
            'CTA Button Text',
            'Text displayed on the main call-to-action button'
        );

        SiteSetting::setValue(
            'hero_disclaimer',
            '*Requires subscription and the Premium add-on (its availability varies depending on the subscription provider). Automatic renewal unless canceled. Subject to Terms and Conditions. Content availability varies by plan. +18.',
            'text',
            'hero',
            'Hero Disclaimer',
            'Disclaimer text displayed below the CTA button'
        );

        // General Site Settings
        SiteSetting::setValue(
            'site_name',
            'SACRART',
            'text',
            'general',
            'Site Name',
            'The name of the website'
        );

        SiteSetting::setValue(
            'site_tagline',
            'Learn the art of sculpting',
            'text',
            'general',
            'Site Tagline',
            'Short tagline for the website'
        );

        SiteSetting::setValue(
            'contact_email',
            'support@sacrart.com',
            'text',
            'general',
            'Contact Email',
            'Main contact email address'
        );

        SiteSetting::setValue(
            'contact_phone',
            '+1 (555) 123-4567',
            'text',
            'general',
            'Contact Phone',
            'Main contact phone number'
        );

        // Footer Settings
        SiteSetting::setValue(
            'footer_copyright',
            '© 2024 SACRART. All rights reserved.',
            'text',
            'footer',
            'Copyright Text',
            'Copyright text displayed in the footer'
        );

        SiteSetting::setValue(
            'footer_description',
            'Master the art of sculpting with our comprehensive online courses and expert guidance.',
            'text',
            'footer',
            'Footer Description',
            'Description text displayed in the footer'
        );
    }
}