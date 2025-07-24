# Tierlist Auto-Enhancement Guide

This guide shows how to use the automated enhancement scripts to improve your tierlist content with images and AI-generated reviews.

## 🤖 Available Enhancement Scripts

### 1. Image Enhancement (`enhance-tierlists-with-images.mjs`)
- **Purpose**: Adds missing product images using SerpAPI Google Images search
- **API**: Requires `SERPAPI_KEY` environment variable
- **Features**: Prioritizes retail domains (Amazon, Apple, Corsair, etc.), high-quality images, source tracking

### 2. Review Enhancement (`enhance-tierlists-with-reviews.mjs`)
- **Purpose**: Generates detailed product reviews using OpenAI
- **API**: Requires `OPENAI_API_KEY` environment variable  
- **Features**: Category-aware, tier-appropriate language, technical focus, placeholder detection

## 🚀 Usage Examples

### Enhance a Single Tierlist

```bash
# Add missing images
node scripts/enhance-tierlists-with-images.mjs src/content/tierlists/best-gaming-mice-2025.mdx

# Generate AI reviews
node scripts/enhance-tierlists-with-reviews.mjs src/content/tierlists/best-gaming-mice-2025.mdx
```

### Batch Enhance All Tierlists

```bash
# Add images to all files with missing images
node scripts/enhance-tierlists-with-images.mjs

# Generate reviews for all files with placeholder/missing reviews
node scripts/enhance-tierlists-with-reviews.mjs
```

### Complete Enhancement Pipeline

```bash
# Step 1: Add missing images (SerpAPI)
node scripts/enhance-tierlists-with-images.mjs

# Step 2: Generate missing reviews (OpenAI)
node scripts/enhance-tierlists-with-reviews.mjs

# Step 3: Review and commit changes
git add .
git commit -m "Enhanced tierlists with images and AI reviews"
```

## 🔧 Configuration

### Environment Variables
```env
# Required for image enhancement
SERPAPI_KEY=your_serpapi_key_here

# Required for review enhancement  
OPENAI_API_KEY=sk-proj-your_openai_key_here
```

### What Gets Enhanced

#### Images (SerpAPI)
- ✅ **Enhanced**: Products with missing `image` field
- ✅ **Enhanced**: Products with empty `image: ""`
- ❌ **Skipped**: Products with existing image URLs

#### Reviews (OpenAI)
- ✅ **Enhanced**: Missing reviews
- ✅ **Enhanced**: Short reviews (< 15 words or < 80 characters)
- ✅ **Enhanced**: Placeholder text ("Great product", "Good option", etc.)
- ❌ **Skipped**: Detailed reviews (> 15 words and > 80 characters)

## 📊 Sample Output

### Before Enhancement
```mdx
<TierList
  tiers={{
    "S": [
      { 
        name: "Logitech G Pro X Superlight", 
        review: "Great mouse",
        link: "https://amzn.to/logitech-pro-superlight"
      }
    ]
  }}
/>
```

### After Enhancement
```mdx
<TierList
  tiers={{
    "S": [
      { 
        name: "Logitech G Pro X Superlight", 
        review: "Ultra-lightweight wireless gaming mouse preferred by esports professionals. Exceptional sensor accuracy and build quality with 70-hour battery life.",
        link: "https://amzn.to/logitech-pro-superlight",
        image: "https://m.media-amazon.com/images/I/615CE5wL-tL.jpg",
        imageSource: "serpapi_retail"
      }
    ]
  }}
/>
```

## 🎯 Best Practices

### Order of Operations
1. **Images First**: Run image enhancement before reviews to ensure complete product data
2. **Reviews Second**: AI can generate better reviews when it has access to complete product information
3. **Review Changes**: Always review AI-generated content before committing

### Quality Control
- **Image Sources**: Prefer `serpapi_retail` (Amazon, official sites) over `unsplash` 
- **Review Length**: Aim for 20-40 words per review for optimal SEO and readability
- **Category Accuracy**: Ensure file names/titles clearly indicate product category for better AI reviews

### Performance Tips
- **Batch Processing**: Use batch mode for multiple files to process efficiently
- **API Limits**: Scripts include 1-second delays between API calls to respect rate limits
- **Error Handling**: Scripts continue processing other products if one fails

## 🚨 Troubleshooting

### Common Issues

**"SERPAPI_KEY not found"**
- Add your SerpAPI key to `.env` file
- Ensure environment variables are loaded in production

**"No TierList component found"**
- Check MDX file format matches expected structure
- Ensure `<TierList tiers={{...}} />` syntax is correct

**"Invalid review generated"**  
- Check OpenAI API key and credits
- Review may be too short/long - manual adjustment may be needed

**Rate limiting errors**
- Scripts include delays, but you may need to increase them for large batches
- Consider processing files in smaller groups

## 📈 Monitoring Enhancement

### Check Enhancement Status
```bash
# See which files need enhancement
grep -r "review.*Great\|Good\|Solid" src/content/tierlists/
grep -r "image.*\"\"" src/content/tierlists/

# Count enhanced vs total products
node scripts/validate-images.mjs  # Shows image coverage statistics
```

### Track Enhancement History
```bash
# See recent enhancements in git
git log --oneline --grep="Enhanced\|enhanced"

# Compare before/after
git diff HEAD~1 src/content/tierlists/
```

This automation ensures your tierlists always have high-quality images and informative reviews without manual effort!
