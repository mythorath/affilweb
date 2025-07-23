# TierList Astro Component

A semantic, SEO-optimized Astro component for displaying tier list-style product recommendations with affiliate links.

## Features

✅ **Semantic HTML Structure** - Uses proper headings and sections for SEO  
✅ **Tailwind CSS Styling** - Minimal, responsive design with hover effects  
✅ **Affiliate Link Support** - Includes `rel="sponsored"` and `target="_blank"`  
✅ **TypeScript Support** - Full type definitions for props and data  
✅ **Flexible Tier System** - Supports S, A, B, C, D, F tier rankings  
✅ **Optional Button Component** - Can use AffiliateButton for enhanced styling  

## Usage

### Basic Usage

```astro
---
import TierList from '../components/TierList.astro';

const tiers = {
  "S": [
    { 
      name: "Premium Product", 
      review: "Exceptional quality and performance", 
      link: "https://amzn.to/premium" 
    }
  ],
  "A": [
    { 
      name: "Great Product", 
      review: "Excellent value for money", 
      link: "https://amzn.to/great" 
    }
  ]
};
---

<TierList tiers={tiers} />
```

### With AffiliateButton Component

```astro
<TierList tiers={tiers} useButtons={true} />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tiers` | `TierData` | required | Object with tier keys and product arrays |
| `useButtons` | `boolean` | `false` | Use AffiliateButton component instead of basic links |

## Data Structure

```typescript
interface Product {
  name: string;      // Product name
  review: string;    // Short review/description
  link: string;      // Affiliate URL
}

interface TierData {
  [tierKey: string]: Product[];  // e.g., "S": [products], "A": [products]
}
```

## Styling

The component uses Tailwind CSS classes:

- `mb-6` - Margin bottom for sections
- `text-xl` - Large text for tier headings  
- `bg-gray-100 p-4 rounded` - Styled tier headers
- `bg-white border p-4 rounded` - Product cards
- `hover:` effects for interactivity

## SEO Features

- Semantic HTML with proper heading hierarchy (`h2` for tiers, `h3` for products)
- `rel="sponsored"` on all affiliate links
- `target="_blank"` for external links
- Accessibility attributes and hover states

## Example Output

The component renders as:

```html
<div class="tier-list">
  <section class="tier-section mb-6">
    <h2 class="tier-heading text-xl font-bold mb-4 bg-gray-100 p-4 rounded">
      Tier S
    </h2>
    <div class="products-grid">
      <div class="product-card bg-white border p-4 rounded mb-4">
        <h3 class="product-name text-lg font-semibold mb-2">
          Premium Product
        </h3>
        <p class="product-review text-gray-700 mb-3">
          Exceptional quality and performance
        </p>
        <a href="https://amzn.to/premium" 
           class="buy-now-button" 
           rel="sponsored" 
           target="_blank">
          Buy Now
        </a>
      </div>
    </div>
  </section>
</div>
```

## Files Created

- `src/components/TierList.astro` - Main component
- `src/components/AffiliateButton.astro` - Optional button component
- `src/types.ts` - TypeScript definitions
- `src/utils/affiliates.json` - Affiliate link management
- `src/pages/demo.astro` - Component demonstration
- `src/content/tierlists/best-gaming-headsets-2025.mdx` - Example content

## Integration

This component is designed for the TrendTiers affiliate website and integrates with:

- Astro static site generation
- MDX content files
- Tailwind CSS styling
- GitHub + Vercel deployment
- SEO optimization features

The component follows the specifications in `# TrendTiers.md` reference file.
