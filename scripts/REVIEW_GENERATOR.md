# Product Review Generator

A Node.js script that uses OpenAI's GPT-4o-mini to generate detailed, engaging product reviews from structured product data.

## Features

- 🤖 **AI-Powered Reviews**: Uses OpenAI to generate 150-300 word detailed reviews
- 📝 **Markdown Formatting**: Reviews include proper markdown formatting for web use
- 🎯 **Customizable**: Configure word count, tone, category, and affiliate CTA inclusion
- 📦 **Batch Processing**: Processes multiple products with rate limiting
- 🔧 **Flexible Input**: Accepts JSON files with product arrays or objects
- 💾 **Structured Output**: Saves results with metadata and timestamps

## Installation

```bash
npm install openai dotenv
```

## Setup

1. Create a `.env` file with your OpenAI API key:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

## Usage

### Command Line

```bash
# Generate reviews from a JSON file
node scripts/generateReviews.mjs products.json

# Specify custom output file
node scripts/generateReviews.mjs products.json reviews.json
```

### As a Module

```javascript
import generateProductReviews from './scripts/generateReviews.mjs';

const products = [
  {
    name: "Product Name",
    price: "$99.99",
    description: "Product description",
    features: ["feature1", "feature2"],
    brand: "Brand Name"
  }
];

const options = {
  category: "office chairs",
  wordCount: "200-300",
  tone: "professional and enthusiastic",
  includeAffiliate: true
};

const reviewedProducts = await generateProductReviews(products, options);
```

## Input Format

### JSON File Structure

```json
{
  "products": [
    {
      "name": "Herman Miller Aeron Chair",
      "price": "$1,395",
      "description": "Iconic ergonomic office chair with breathable mesh design",
      "features": [
        "PostureFit SL lumbar support",
        "Breathable mesh material",
        "Adjustable armrests"
      ],
      "brand": "Herman Miller"
    }
  ],
  "options": {
    "category": "ergonomic office chairs",
    "wordCount": "200-250",
    "tone": "professional and helpful",
    "includeAffiliate": true
  }
}
```

### Product Object Properties

| Property | Required | Type | Description |
|----------|----------|------|-------------|
| `name` | ✅ | string | Product name |
| `price` | ❌ | string | Product price (e.g., "$99.99") |
| `description` | ❌ | string | Product description |
| `features` | ❌ | array/string | Key features list |
| `brand` | ❌ | string | Brand name |

### Options Object

| Option | Default | Type | Description |
|--------|---------|------|-------------|
| `wordCount` | "150-300" | string | Target word count range |
| `category` | "general products" | string | Product category for context |
| `tone` | "professional and helpful" | string | Writing tone |
| `includeAffiliate` | true | boolean | Include call-to-action |
| `batchSize` | 3 | number | Products per API batch |

## Output Format

```json
{
  "metadata": {
    "generatedAt": "2025-07-24T00:43:47.705Z",
    "totalProducts": 3,
    "options": { /* generation options */ }
  },
  "products": [
    {
      "name": "Product Name",
      "price": "$99.99",
      /* ...original product data... */
      "review": "Generated markdown review content...",
      "generatedAt": "2025-07-24T00:43:46.125Z"
    }
  ]
}
```

## Example Review Output

Each generated review includes:

- **Product strengths** and key benefits
- **Specific use cases** and target audience
- **Detailed feature analysis**
- **Balanced perspective** with considerations
- **Soft call-to-action** (if enabled)
- **Markdown formatting** for readability

Example:
> The **Herman Miller Aeron Chair** is a standout in the realm of ergonomic office seating, priced at $1,395. Its iconic design is complemented by innovative features such as **PostureFit SL lumbar support**, which effectively promotes healthy spinal alignment...

## Rate Limiting

The script includes built-in rate limiting:
- Processes products in batches (default: 3 per batch)
- 1-second delay between batches
- Individual error handling per product

## Error Handling

- Individual product failures don't stop the entire batch
- Failed products receive a fallback review message
- Full error logging for debugging
- Graceful degradation

## Integration with Tierlist Generator

This script works perfectly with the existing tierlist generation workflow:

```bash
# 1. Generate reviews for products
node scripts/generateReviews.mjs chair-products.json

# 2. Use reviewed products in tierlist generation
node scripts/generateTierlist.mjs chair-tierlist.json
```

## Tips

1. **API Costs**: Each product review costs ~$0.001-0.002 in API calls
2. **Quality**: More detailed product data = better reviews
3. **Customization**: Adjust tone and category for your audience
4. **Batch Size**: Reduce for slower but more reliable processing
5. **Validation**: Always review generated content before publishing

## Troubleshooting

### Common Issues

1. **API Key Error**: Check `.env` file and API key validity
2. **Rate Limits**: Reduce `batchSize` in options
3. **No Output**: Check file permissions and paths
4. **Poor Reviews**: Provide more detailed product information

### Debug Mode

The script includes extensive logging. Watch for:
- 🚀 Startup messages
- 📖 File reading status
- 🔍 Individual product processing
- ✅ Success confirmations
- ❌ Error messages
