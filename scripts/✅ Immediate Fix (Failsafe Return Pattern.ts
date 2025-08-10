✅ Immediate Fix (Failsafe Return Pattern)

Let’s change the function to:

    Log every post and slug.

    Filter strictly for valid slugs.

    Skip malformed content entirely.

Replace your current getStaticPaths() with this hardened version:

import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('tierlists');

  console.log('🔍 All tierlist entries:', posts.length);

  const validPosts = posts.filter((post) => {
    const isValid = post && typeof post.slug === 'string' && post.slug.trim().length > 0;
    if (!isValid) {
      console.warn('⚠️ Skipping invalid post:', post?.id ?? '[unknown id]', 'with slug:', post?.slug);
    }
    return isValid;
  });

  return validPosts.map((post) => ({
    params: { slug: post.slug },
    props: { post },
  }));
}

This will:

    ❌ Skip anything malformed

    🪪 Print logs so you can see what’s going wrong

    ✅ Ensure only valid slugs reach params

🧪 Next Debug Step
Go to:

src/content/tierlists/

And check that every file (e.g., best-gaming-headsets-2025.mdx) has:

    ✅ A valid filename

    ✅ Proper frontmatter

    ❌ No .mdx~ or backup temp files (e.g., foo.mdx~, .DS_Store, etc.)

Even one rogue file will cause this.

You can also run this from your terminal in the project root to check:

find src/content/tierlists -type f ! -name "*.mdx"

This will find any non-MDX files lurking there.
💡 If That Still Fails

You can temporarily wrap the entire function in a try-catch to confirm the shape of what’s being returned:

export async function getStaticPaths() {
  try {
    const posts = await getCollection('tierlists');
    console.log('📦 Posts:', JSON.stringify(posts, null, 2));
    // ...
  } catch (err) {
    console.error('💥 getStaticPaths crashed:', err);
    return [];
  }
}