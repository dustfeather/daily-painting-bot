/**
 * Fallback prompt system for when AI generation fails
 * Provides pre-defined painting prompts with images for all skill levels and languages
 */

import { SkillLevel, Language, PaintingPrompt } from '../types';

/**
 * Fallback prompt data structure
 * Key format: "skillLevel-language"
 */
const fallbackPromptsData: Record<string, Array<{ text: string; imageUrl: string }>> = {
  // Beginner - Romanian
  'beginner-ro': [
    {
      text: 'Pictează un apus de soare simplu cu culori calde. Folosește doar portocaliu, roșu și galben pentru cer, și o siluetă neagră pentru pământ. Concentrează-te pe amestecarea culorilor pentru tranziții line.',
      imageUrl: 'https://imagedelivery.net/placeholder/beginner-sunset-ro.jpg',
    },
    {
      text: 'Creează o natură moartă cu trei mere. Practică formele rotunde și umbrele simple. Folosește o singură sursă de lumină și observă cum cade umbra.',
      imageUrl: 'https://imagedelivery.net/placeholder/beginner-apples-ro.jpg',
    },
    {
      text: 'Pictează un copac simplu în patru anotimpuri. Folosește culori diferite pentru fiecare anotimp: verde pentru primăvară, verde închis pentru vară, portocaliu pentru toamnă, și alb pentru iarnă.',
      imageUrl: 'https://imagedelivery.net/placeholder/beginner-tree-seasons-ro.jpg',
    },
  ],

  // Beginner - English
  'beginner-en': [
    {
      text: 'Paint a simple sunset with warm colors. Use only orange, red, and yellow for the sky, and a black silhouette for the ground. Focus on blending colors for smooth transitions.',
      imageUrl: 'https://imagedelivery.net/placeholder/beginner-sunset-en.jpg',
    },
    {
      text: 'Create a still life with three apples. Practice round shapes and simple shadows. Use a single light source and observe how the shadow falls.',
      imageUrl: 'https://imagedelivery.net/placeholder/beginner-apples-en.jpg',
    },
    {
      text: 'Paint a simple tree in four seasons. Use different colors for each season: green for spring, dark green for summer, orange for autumn, and white for winter.',
      imageUrl: 'https://imagedelivery.net/placeholder/beginner-tree-seasons-en.jpg',
    },
  ],

  // Intermediate - Romanian
  'intermediate-ro': [
    {
      text: 'Pictează un peisaj urban cu perspectivă în două puncte. Include clădiri, străzi și oameni în mișcare. Concentrează-te pe proporții corecte și pe crearea adâncimii prin perspectivă.',
      imageUrl: 'https://imagedelivery.net/placeholder/intermediate-cityscape-ro.jpg',
    },
    {
      text: 'Creează un portret expresiv folosind tehnica chiaroscuro. Joacă-te cu contrastul puternic între lumină și umbră pentru a crea dramă și profunzime. Concentrează-te pe expresia feței.',
      imageUrl: 'https://imagedelivery.net/placeholder/intermediate-portrait-ro.jpg',
    },
    {
      text: 'Pictează o scenă de pădure cu multiple planuri: prim-plan detaliat, plan mediu și fundal estompat. Folosește perspectiva atmosferică pentru a crea adâncime.',
      imageUrl: 'https://imagedelivery.net/placeholder/intermediate-forest-ro.jpg',
    },
  ],

  // Intermediate - English
  'intermediate-en': [
    {
      text: 'Paint an urban landscape with two-point perspective. Include buildings, streets, and people in motion. Focus on correct proportions and creating depth through perspective.',
      imageUrl: 'https://imagedelivery.net/placeholder/intermediate-cityscape-en.jpg',
    },
    {
      text: 'Create an expressive portrait using the chiaroscuro technique. Play with strong contrast between light and shadow to create drama and depth. Focus on facial expression.',
      imageUrl: 'https://imagedelivery.net/placeholder/intermediate-portrait-en.jpg',
    },
    {
      text: 'Paint a forest scene with multiple planes: detailed foreground, middle ground, and blurred background. Use atmospheric perspective to create depth.',
      imageUrl: 'https://imagedelivery.net/placeholder/intermediate-forest-en.jpg',
    },
  ],

  // Advanced - Romanian
  'advanced-ro': [
    {
      text: 'Creează o compoziție abstractă inspirată de emoția "nostalgie". Folosește stratificări complexe, texturi variate și o paletă de culori neconvențională. Experimentează cu tehnici mixte și transparențe.',
      imageUrl: 'https://imagedelivery.net/placeholder/advanced-abstract-nostalgia-ro.jpg',
    },
    {
      text: 'Pictează o scenă figurativă complexă cu multiple personaje în interacțiune. Concentrează-te pe anatomie dinamică, compoziție narativă și iluminare dramatică. Creează o poveste vizuală.',
      imageUrl: 'https://imagedelivery.net/placeholder/advanced-figurative-ro.jpg',
    },
    {
      text: 'Realizează un peisaj hiper-realist cu reflexii în apă. Captează detalii fine, texturi complexe și jocul subtil al luminii pe suprafețe diferite. Acordă atenție perspectivei reflexiei.',
      imageUrl: 'https://imagedelivery.net/placeholder/advanced-hyperrealistic-ro.jpg',
    },
  ],

  // Advanced - English
  'advanced-en': [
    {
      text: 'Create an abstract composition inspired by the emotion "nostalgia". Use complex layering, varied textures, and an unconventional color palette. Experiment with mixed media and transparencies.',
      imageUrl: 'https://imagedelivery.net/placeholder/advanced-abstract-nostalgia-en.jpg',
    },
    {
      text: 'Paint a complex figurative scene with multiple characters in interaction. Focus on dynamic anatomy, narrative composition, and dramatic lighting. Create a visual story.',
      imageUrl: 'https://imagedelivery.net/placeholder/advanced-figurative-en.jpg',
    },
    {
      text: 'Create a hyper-realistic landscape with water reflections. Capture fine details, complex textures, and the subtle play of light on different surfaces. Pay attention to reflection perspective.',
      imageUrl: 'https://imagedelivery.net/placeholder/advanced-hyperrealistic-en.jpg',
    },
  ],
};

/**
 * Get a fallback prompt for a given skill level and language
 * Returns a random prompt from the available fallbacks for that combination
 *
 * @param skillLevel - User's skill level (beginner, intermediate, advanced)
 * @param language - User's preferred language (ro, en)
 * @returns PaintingPrompt object with text and image URL
 */
export function getFallbackPrompt(skillLevel: SkillLevel, language: Language): PaintingPrompt {
  const key = `${skillLevel}-${language}`;
  const prompts = fallbackPromptsData[key];

  if (!prompts || prompts.length === 0) {
    // Fallback to English if language not found
    const fallbackKey = `${skillLevel}-en`;
    const fallbackPrompts = fallbackPromptsData[fallbackKey];

    if (!fallbackPrompts || fallbackPrompts.length === 0) {
      // Ultimate fallback - should never happen with proper data
      return {
        text: 'Paint something that inspires you today.',
        imageUrl: 'https://imagedelivery.net/placeholder/default.jpg',
        skillLevel,
        language,
      };
    }

    // Return random prompt from fallback language
    const randomIndex = Math.floor(Math.random() * fallbackPrompts.length);
    return {
      ...fallbackPrompts[randomIndex],
      skillLevel,
      language,
    };
  }

  // Return random prompt from available prompts
  const randomIndex = Math.floor(Math.random() * prompts.length);
  return {
    ...prompts[randomIndex],
    skillLevel,
    language,
  };
}

/**
 * Get all fallback prompts for a specific skill level and language
 * Useful for testing or displaying multiple options
 *
 * @param skillLevel - User's skill level
 * @param language - User's preferred language
 * @returns Array of PaintingPrompt objects
 */
export function getAllFallbackPrompts(skillLevel: SkillLevel, language: Language): PaintingPrompt[] {
  const key = `${skillLevel}-${language}`;
  const prompts = fallbackPromptsData[key];

  if (!prompts || prompts.length === 0) {
    return [];
  }

  return prompts.map((prompt) => ({
    ...prompt,
    skillLevel,
    language,
  }));
}

/**
 * Check if fallback prompts exist for a given skill level and language combination
 *
 * @param skillLevel - User's skill level
 * @param language - User's preferred language
 * @returns true if fallback prompts exist, false otherwise
 */
export function hasFallbackPrompts(skillLevel: SkillLevel, language: Language): boolean {
  const key = `${skillLevel}-${language}`;
  const prompts = fallbackPromptsData[key];
  return prompts !== undefined && prompts.length > 0;
}
