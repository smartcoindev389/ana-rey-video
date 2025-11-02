<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Category;
use App\Models\Video;
use App\Models\Faq;
use App\Models\Feedback;
use App\Models\VideoComment;

class TranslateExistingContent extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'content:translate-existing';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Translate existing content to Spanish and Portuguese';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting translation of existing content...');

        // Translate Categories
        $this->info('Translating Categories...');
        $categories = Category::all();
        $categoryCount = 0;
        foreach ($categories as $category) {
            if ($category->name || $category->description) {
                $category->autoTranslate(['name', 'description', 'short_description']);
                $categoryCount++;
            }
        }
        $this->info("Translated {$categoryCount} categories");

        // Translate Videos
        $this->info('Translating Videos...');
        $videos = Video::all();
        $videoCount = 0;
        foreach ($videos as $video) {
            if ($video->title || $video->description) {
                $video->autoTranslate(['title', 'description', 'short_description', 'intro_description']);
                $videoCount++;
            }
        }
        $this->info("Translated {$videoCount} videos");

        // Translate FAQs
        $this->info('Translating FAQs...');
        $faqs = Faq::all();
        $faqCount = 0;
        foreach ($faqs as $faq) {
            if ($faq->question || $faq->answer) {
                $faq->autoTranslate(['question', 'answer']);
                $faqCount++;
            }
        }
        $this->info("Translated {$faqCount} FAQs");

        // Translate Feedback
        $this->info('Translating Feedback...');
        $feedback = Feedback::all();
        $feedbackCount = 0;
        foreach ($feedback as $fb) {
            if ($fb->description) {
                $fb->autoTranslate(['description']);
                $feedbackCount++;
            }
        }
        $this->info("Translated {$feedbackCount} feedback items");

        // Translate Video Comments
        $this->info('Translating Video Comments...');
        $comments = VideoComment::all();
        $commentCount = 0;
        foreach ($comments as $comment) {
            if ($comment->comment) {
                $comment->autoTranslate(['comment']);
                $commentCount++;
            }
        }
        $this->info("Translated {$commentCount} comments");

        $totalTranslations = \App\Models\ContentTranslation::count();
        $this->info("Translation complete! Total content translations: {$totalTranslations}");
    }
}