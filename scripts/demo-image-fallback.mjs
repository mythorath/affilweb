#!/usr/bin/env node

/**
 * Demo script to showcase enhanced image fallback logic in TierListCard
 */

console.log('🎨 Enhanced Image Fallback Logic Demo\n');

console.log('📋 Image Priority Hierarchy:');
console.log('   1️⃣ post.data.image (frontmatter override)');
console.log('   2️⃣ post.data.products[0].image (first product image)');
console.log('   3️⃣ image prop (backward compatibility)');
console.log('   4️⃣ /images/placeholder-tierlist.svg (fallback)\n');

console.log('🧪 Test Scenarios:\n');

// Scenario 1: Frontmatter override takes priority
console.log('Scenario 1: Frontmatter Override');
console.log('✅ post.data.image = "/images/custom-hero.jpg"');
console.log('   post.data.products[0].image = "/images/product-1.jpg"');
console.log('   → Result: "/images/custom-hero.jpg" (frontmatter wins)');
console.log('');

// Scenario 2: First product image used
console.log('Scenario 2: First Product Image');
console.log('   post.data.image = null');
console.log('✅ post.data.products[0].image = "/images/gaming-mouse.jpg"');
console.log('   → Result: "/images/gaming-mouse.jpg" (first product wins)');
console.log('');

// Scenario 3: Backward compatibility with image prop
console.log('Scenario 3: Backward Compatibility');
console.log('   post.data.image = null');
console.log('   post.data.products = []');
console.log('✅ image prop = "/images/legacy-image.jpg"');
console.log('   → Result: "/images/legacy-image.jpg" (prop wins)');
console.log('');

// Scenario 4: Fallback to placeholder
console.log('Scenario 4: Fallback to Placeholder');
console.log('   post.data.image = null');
console.log('   post.data.products = []');
console.log('   image prop = null');
console.log('✅ → Result: "/images/placeholder-tierlist.svg" (fallback wins)');
console.log('');

console.log('🔧 Implementation Code:');
console.log('```javascript');
console.log('const productImage = ');
console.log('  post?.data?.image || ');
console.log('  post?.data?.products?.[0]?.image || ');
console.log('  image || ');
console.log('  \'/images/placeholder-tierlist.svg\';');
console.log('```\n');

console.log('🎯 Benefits:');
console.log('✅ Flexible image source selection');
console.log('✅ Automatic product image discovery');
console.log('✅ Backward compatibility maintained');
console.log('✅ Graceful fallback handling');
console.log('✅ No broken images on homepage');
console.log('');

console.log('🔗 Preview your enhanced cards at: http://localhost:4321');
console.log('');
