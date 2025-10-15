import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Globe, 
  Plus,
  Edit,
  Save,
  Check,
  X,
  Flag,
  Languages,
  FileText,
  Settings
} from 'lucide-react';

const MultilingualSettings = () => {
  const [activeLanguage, setActiveLanguage] = useState('en');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingKey, setEditingKey] = useState(null);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸', isComplete: true },
    { code: 'es', name: 'Spanish', flag: '🇪🇸', isComplete: false },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹', isComplete: false }
  ];

  // Mock translation data - replace with real API calls
  const [translations, setTranslations] = useState({
    en: {
      'auth.welcome': 'Welcome Back',
      'auth.signin': 'Sign In',
      'auth.signup': 'Sign Up',
      'auth.email': 'Email',
      'auth.password': 'Password',
      'auth.forgot_password': 'Forgot Password?',
      'subscription.choose_plan': 'Choose Your Plan',
      'subscription.basic': 'Basic',
      'subscription.premium': 'Premium',
      'subscription.freemium': 'Freemium',
      'dashboard.overview': 'Dashboard Overview',
      'dashboard.total_users': 'Total Users',
      'dashboard.revenue': 'Revenue',
      'content.videos': 'Videos',
      'content.series': 'Series',
      'content.upload': 'Upload Video',
      'settings.general': 'General Settings',
      'settings.profile': 'Profile Settings'
    },
    es: {
      'auth.welcome': 'Bienvenido de Vuelta',
      'auth.signin': 'Iniciar Sesión',
      'auth.signup': 'Registrarse',
      'auth.email': 'Correo Electrónico',
      'auth.password': 'Contraseña',
      'auth.forgot_password': '¿Olvidaste tu contraseña?',
      'subscription.choose_plan': 'Elige Tu Plan',
      'subscription.basic': 'Básico',
      'subscription.premium': 'Premium',
      'subscription.freemium': 'Gratuito',
      'dashboard.overview': 'Resumen del Panel',
      'dashboard.total_users': 'Total de Usuarios',
      'dashboard.revenue': 'Ingresos',
      'content.videos': 'Videos',
      'content.series': 'Series',
      'content.upload': 'Subir Video',
      'settings.general': 'Configuración General',
      'settings.profile': 'Configuración de Perfil'
    },
    pt: {
      'auth.welcome': 'Bem-vindo de Volta',
      'auth.signin': 'Entrar',
      'auth.signup': 'Registrar',
      'auth.email': 'Email',
      'auth.password': 'Senha',
      'auth.forgot_password': 'Esqueceu sua senha?',
      'subscription.choose_plan': 'Escolha Seu Plano',
      'subscription.basic': 'Básico',
      'subscription.premium': 'Premium',
      'subscription.freemium': 'Gratuito',
      'dashboard.overview': 'Visão Geral do Painel',
      'dashboard.total_users': 'Total de Usuários',
      'dashboard.revenue': 'Receita',
      'content.videos': 'Vídeos',
      'content.series': 'Séries',
      'content.upload': 'Enviar Vídeo',
      'settings.general': 'Configurações Gerais',
      'settings.profile': 'Configurações de Perfil'
    }
  });

  const [editingTranslations, setEditingTranslations] = useState(translations);

  const getCompletionPercentage = (languageCode: string) => {
    const totalKeys = Object.keys(translations.en).length;
    const translatedKeys = Object.keys(translations[languageCode as keyof typeof translations]).length;
    return Math.round((translatedKeys / totalKeys) * 100);
  };

  const handleSaveTranslation = (key: string, value: string) => {
    setEditingTranslations(prev => ({
      ...prev,
      [activeLanguage]: {
        ...prev[activeLanguage as keyof typeof prev],
        [key]: value
      }
    }));
    setEditingKey(null);
  };

  const handleSaveAll = () => {
    setTranslations(editingTranslations);
    // Here you would typically save to your backend
    console.log('Saving translations:', editingTranslations);
  };

  const handleEditKey = (key: string) => {
    setEditingKey(key);
  };

  const getTranslationCategories = () => {
    const categories: { [key: string]: string[] } = {};
    Object.keys(translations.en).forEach(key => {
      const category = key.split('.')[0];
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(key);
    });
    return categories;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Multilingual Settings</h1>
          <p className="text-muted-foreground">Manage translations for Spanish, Portuguese, and English</p>
        </div>
        <Button onClick={handleSaveAll}>
          <Save className="mr-2 h-4 w-4" />
          Save All Changes
        </Button>
      </div>

      {/* Language Selection */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Available Languages</h3>
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Language
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {languages.map((language) => (
            <div
              key={language.code}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                activeLanguage === language.code
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setActiveLanguage(language.code)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{language.flag}</span>
                  <div>
                    <h4 className="font-medium">{language.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {getCompletionPercentage(language.code)}% complete
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {language.isComplete ? (
                    <Badge variant="default">
                      <Check className="h-3 w-3 mr-1" />
                      Complete
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <FileText className="h-3 w-3 mr-1" />
                      In Progress
                    </Badge>
                  )}
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${getCompletionPercentage(language.code)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Translation Editor */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{languages.find(l => l.code === activeLanguage)?.flag}</span>
            <div>
              <h3 className="text-lg font-semibold">
                {languages.find(l => l.code === activeLanguage)?.name} Translations
              </h3>
              <p className="text-sm text-muted-foreground">
                {getCompletionPercentage(activeLanguage)}% complete
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Auto Translate
            </Button>
            <Button variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {Object.entries(getTranslationCategories()).map(([category, keys]) => (
            <div key={category}>
              <h4 className="text-md font-semibold mb-3 capitalize flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                {category} ({keys.length} items)
              </h4>
              <div className="grid gap-3">
                {keys.map((key) => (
                  <div key={key} className="flex items-center space-x-4 p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">{key}</Label>
                        {editingKey === key ? (
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSaveTranslation(key, editingTranslations[activeLanguage as keyof typeof editingTranslations][key])}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingKey(null)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditKey(key)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      {editingKey === key ? (
                        <Textarea
                          value={editingTranslations[activeLanguage as keyof typeof editingTranslations][key] || ''}
                          onChange={(e) => setEditingTranslations(prev => ({
                            ...prev,
                            [activeLanguage]: {
                              ...prev[activeLanguage as keyof typeof prev],
                              [key]: e.target.value
                            }
                          }))}
                          className="min-h-[60px]"
                          placeholder={`Enter ${languages.find(l => l.code === activeLanguage)?.name} translation...`}
                        />
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          {editingTranslations[activeLanguage as keyof typeof editingTranslations][key] || 
                           translations[activeLanguage as keyof typeof translations][key] || 
                           'No translation available'}
                        </div>
                      )}
                      {activeLanguage !== 'en' && (
                        <div className="text-xs text-gray-500 mt-1">
                          English: {translations.en[key as keyof typeof translations.en]}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Translation Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {languages.map((language) => (
          <Card key={language.code} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{language.flag}</span>
                <div>
                  <p className="text-sm font-medium">{language.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {getCompletionPercentage(language.code)}% complete
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">
                  {Object.keys(translations[language.code as keyof typeof translations]).length}
                </p>
                <p className="text-xs text-muted-foreground">
                  of {Object.keys(translations.en).length}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MultilingualSettings;
