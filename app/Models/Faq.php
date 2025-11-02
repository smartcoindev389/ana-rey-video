<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTranslations;

class Faq extends Model
{
    use HasFactory, HasTranslations;

    protected $fillable = [
        'question',
        'answer',
        'category',
        'sort_order',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer'
    ];

    /**
     * Get translatable fields for this model
     */
    protected function getTranslatableFields(): array
    {
        return ['question', 'answer'];
    }

    /**
     * Get question in current locale
     */
    public function getQuestionAttribute($value): ?string
    {
        $locale = app()->getLocale();
        if ($locale === 'en') {
            return $value;
        }
        // Use raw attribute to avoid recursion
        $rawValue = $this->attributes['question'] ?? $value;
        $translation = $this->getTranslation('question', $locale);
        return $translation ?: $rawValue;
    }

    /**
     * Get answer in current locale
     */
    public function getAnswerAttribute($value): ?string
    {
        $locale = app()->getLocale();
        if ($locale === 'en') {
            return $value;
        }
        // Use raw attribute to avoid recursion
        $rawValue = $this->attributes['answer'] ?? $value;
        $translation = $this->getTranslation('answer', $locale);
        return $translation ?: $rawValue;
    }

    /**
     * Get raw question (English original)
     */
    public function getRawQuestion(): ?string
    {
        return $this->attributes['question'] ?? null;
    }

    /**
     * Get raw answer (English original)
     */
    public function getRawAnswer(): ?string
    {
        return $this->attributes['answer'] ?? null;
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('created_at');
    }
}