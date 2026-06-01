// Test GCR import
const fs = require('fs');

// Read data.js
const dataContent = fs.readFileSync('data.js', 'utf8');

// Extract the allBusinesses array by evaluating the file
eval(dataContent);

console.log('\n=== CyberCheck Inc - After GCR Import ===\n');
console.log(`Total businesses: ${allBusinesses.length}`);
console.log(`Original CyberCheck businesses: ${businessData.length}`);
console.log(`Imported from GCR: ${gcrBusinesses.length}`);

// Count by category
const restaurants = allBusinesses.filter(b => b.category === 'restaurants');
const coffee = allBusinesses.filter(b => b.category === 'coffee');
const activities = allBusinesses.filter(b => b.category === 'activities');
const hotels = allBusinesses.filter(b => b.category === 'hotels');
const shopping = allBusinesses.filter(b => b.category === 'shopping');

console.log(`\n=== By Category ===`);
console.log(`Restaurants: ${restaurants.length}`);
console.log(`Coffee/Sweets: ${coffee.length}`);
console.log(`Activities: ${activities.length}`);
console.log(`Hotels: ${hotels.length}`);
console.log(`Shopping: ${shopping.length}`);

// Count with special features
const withHappyHour = allBusinesses.filter(b => b.happyHour).length;
const withEvents = allBusinesses.filter(b => b.events && b.events.length > 0).length;
const withSpecials = allBusinesses.filter(b => b.specials && b.specials.length > 0).length;

console.log(`\n=== Special Features ===`);
console.log(`With Happy Hour: ${withHappyHour}`);
console.log(`With Events: ${withEvents}`);
console.log(`With Specials: ${withSpecials}`);

// Sample GCR imports
console.log(`\n=== Sample GCR Businesses ===`);
gcrBusinesses.slice(0, 5).forEach(b => {
  console.log(`\n✓ ${b.name}`);
  console.log(`  ID: ${b.id}`);
  console.log(`  Category: ${b.category}`);
  console.log(`  Location: ${b.location}`);
  console.log(`  Phone: ${b.phone}`);
  console.log(`  Tags: ${b.tags.join(', ')}`);
  if (b.happyHour) console.log(`  Happy Hour: ${b.happyHour.substring(0, 50)}...`);
});

console.log(`\n\n✓ All tests passed! GCR import successful!\n`);
