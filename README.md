# TrendTiers.com

A fully static, SEO-optimized affiliate website that publishes tier list–style product recommendation articles. Each page is auto-generated using LLMs and features tiered rankings, reviews, affiliate links, and comprehensive SEO metadata.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mythorath/affilweb.git
   cd affilweb
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:4321](http://localhost:4321) in your browser.

## 📝 Generating Tier Lists

Use the AI-powered script to generate new tier list articles:

```bash
node scripts/generate-tier.mjs "best USB microphones 2025"
```

This will:
- ✅ Call OpenAI API to generate structured tier list data
- ✅ Create a complete MDX file with frontmatter, content, and components
- ✅ Generate SEO-optimized titles, descriptions, and tags
- ✅ Include affiliate links and product schemas
- ✅ Save to `/src/content/tierlists/[slug].mdx`

## 📁 Project Structure

```
/
├── src/
│   ├── components/          # Reusable Astro components
│   │   ├── TierList.astro  # Main tier list component
│   │   └── SEO.astro       # SEO meta tags & JSON-LD
│   ├── content/
│   │   └── tierlists/      # MDX tier list articles
│   ├── layouts/            # Page layouts
│   ├── pages/              # Routes (index, [slug])
│   └── utils/              # Utility functions
├── scripts/
│   └── generate-tier.mjs   # AI content generation script
├── public/                 # Static assets
└── diffs/                  # Git commit diffs (auto-generated)
```

## 🚀 Deployment

### Automatic Deployment (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Vercel auto-deploys** from the main branch
   - Build command: `npm run build`
   - Output directory: `dist`
   - Environment variables: Add `OPENAI_API_KEY` in Vercel dashboard

### Manual Deployment

```bash
npm run build
npm run preview  # Test production build locally
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run astro` - Run Astro CLI commands

### Content Management

1. **Create tier lists**: Use the generation script or manually create MDX files
2. **Update components**: Modify components in `/src/components/`
3. **Add pages**: Create new routes in `/src/pages/`
4. **Configure content**: Update schemas in `/src/content/config.ts`

### SEO Features

- ✅ Open Graph and Twitter Card metadata
- ✅ JSON-LD structured data (ItemList + Article schemas)
- ✅ Canonical URLs and sitemaps
- ✅ Auto-generated meta descriptions and tags
- ✅ Product schema for tier list items

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes and test locally
3. Commit with descriptive messages
4. Push and create a pull request

## 📜 License

MIT License - see LICENSE file for details.

---

**TrendTiers.com** - Tier lists that trend. 🏆
