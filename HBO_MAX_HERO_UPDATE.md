# HBO Max Style Hero Section Update

## Changes Made

### Hero Section Transformation

#### 1. **Layout Changes**
- **Before**: Centered content layout
- **After**: Left-aligned content (HBO Max style)
- **Container Padding**: Increased from `px-4 lg:px-8` to `px-6 md:px-12 lg:px-16 xl:px-24`
- **Hero Height**: Increased from `h-[70vh] lg:h-[85vh]` to `h-[75vh] lg:h-[90vh]`

#### 2. **Content Positioning**
- Changed from `justify-center` (centered) to left-aligned with `items-center`
- Content max-width: `max-w-2xl` (left-aligned)
- Text alignment: Changed from `text-center` to `text-left`

#### 3. **Gradient Overlay (HBO Max Style)**
- **Horizontal Gradient**: `bg-gradient-to-r from-black via-black/80 to-transparent`
  - Creates strong left-to-right fade
  - Image visible on the right side
  - Content clearly readable on the left
- **Bottom Fade**: Enhanced from `h-32` to `h-40`
- Image positioning: `object-right` to show subject on right side

#### 4. **Typography Updates**
- **Headline**: 
  - New text: "Must-see series,<br />sculpting & more."
  - Size increased: `text-4xl sm:text-5xl lg:text-6xl xl:text-7xl`
  - HBO Max inspired wording
- **Subheadline**: 
  - "Choose a SACRART plan to start streaming."
  - Lighter weight: `font-light`
  - Size: `text-lg lg:text-xl xl:text-2xl`

#### 5. **Pricing Display**
- Simple, prominent pricing: "Plans start at **$9.99**/month"
- Large price number: `text-2xl lg:text-3xl font-bold`
- Clean, minimal design

#### 6. **Call-to-Action Button**
- **Style**: HBO Max white button
- **Text**: "GET SACRART" (all caps, HBO Max style)
- **Colors**: 
  - Background: White
  - Text: Black
  - Hover: `bg-white/90`
- **Size**: `px-8 lg:px-10 py-6 lg:py-7`
- **Effect**: Hover scale effect

### Content Sections Padding

#### Updated Spacing
- **Parent Container**: `px-6 md:px-12 lg:px-16 xl:px-24`
- **Vertical Spacing**: `py-12 lg:py-20`
- **Section Gaps**: `space-y-8 lg:space-y-14`

#### Carousel Sections
- **Title Color**: Changed to `text-white`
- **Icon Color**: Changed to `text-white`
- **View All Button**: Updated to white text with hover effect
- **Card Spacing**: Increased to `space-x-3 lg:space-x-4`
- Removed redundant padding since parent container now provides it

## Visual Comparison

### Before (Netflix Style - Centered)
```
┌────────────────────────────────────────┐
│         [ Centered Content ]           │
│                                        │
│     "Unlimited series, videos..."      │
│         Watch Now | More Info          │
└────────────────────────────────────────┘
```

### After (HBO Max Style - Left Aligned)
```
┌────────────────────────────────────────┐
│  Must-see series,                   [IMG]
│  sculpting & more.                  [...]
│                                        │
│  Choose a SACRART plan to start        │
│  streaming.                            │
│                                        │
│  Plans start at $9.99/month            │
│  [ GET SACRART ]                       │
└────────────────────────────────────────┘
```

## Key HBO Max Design Elements

1. **Left-Aligned Content**: Content on left, hero image visible on right
2. **Strong Left-to-Right Gradient**: Black on left fading to transparent
3. **Bold Typography**: Large, bold headlines with breathing room
4. **White CTA Button**: Prominent white button with black text
5. **Simple Pricing**: Clear, upfront pricing display
6. **Generous Padding**: Substantial left/right padding (24px on XL screens)
7. **Minimal Elements**: Clean, uncluttered design

## Responsive Behavior

- **Mobile**: Full padding maintained, text scales down appropriately
- **Tablet**: Increased padding, larger text sizes
- **Desktop**: Maximum padding and text sizes for dramatic effect
- **XL Screens**: Maximum `px-24` padding for HBO Max aesthetic

## Files Modified

- `frontend/src/pages/Home.tsx`
  - Hero section layout and content
  - Content sections padding
  - Carousel section styling

## Result

The hero section now perfectly matches the HBO Max aesthetic with:
- ✅ Left-aligned content
- ✅ Image visible on the right side
- ✅ HBO Max style gradient overlay
- ✅ White "GET SACRART" button
- ✅ Simple pricing display
- ✅ Generous left/right padding
- ✅ Clean, professional streaming platform look
