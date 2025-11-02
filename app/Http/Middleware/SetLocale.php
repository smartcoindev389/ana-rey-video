<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Session;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Get locale from URL parameter (e.g., /api/es/faqs or /api/es/admin/users)
        $pathSegments = explode('/', trim($request->path(), '/'));
        $locale = null;

        // Check if first segment is a locale (en, es, pt)
        if (!empty($pathSegments) && in_array(strtolower($pathSegments[0]), ['en', 'es', 'pt'])) {
            $locale = strtolower($pathSegments[0]);
        }

        // Fallback to Accept-Language header, session, or default to 'en'
        if (!$locale) {
            $acceptLanguage = $request->header('Accept-Language', '');
            if ($acceptLanguage) {
                // Extract locale from Accept-Language header (e.g., "es" from "es,en-US;q=0.9")
                $localeParts = explode(',', $acceptLanguage);
                $primaryLocale = trim(explode(';', $localeParts[0])[0]);
                $locale = in_array(strtolower(substr($primaryLocale, 0, 2)), ['en', 'es', 'pt']) 
                    ? strtolower(substr($primaryLocale, 0, 2)) 
                    : null;
            }
            
            // Fallback to session or default
            if (!$locale) {
                $locale = Session::get('locale') ?? config('app.locale', 'en');
            }
        }

        // Normalize locale code (en, es, pt)
        $locale = strtolower(substr($locale, 0, 2));
        
        if (!in_array($locale, ['en', 'es', 'pt'])) {
            $locale = 'en';
        }

        // Store in session for next request
        Session::put('locale', $locale);
        App::setLocale($locale);

        return $next($request);
    }
}

