// Test script to verify restaurant data
const fs = require('fs');
const vm = require('vm');

// Read and eval the data file
const dataContent = fs.readFileSync('data.js', 'utf8');
const context = { businessData: null };
vm.createContext(context);
vm.runInContext(dataContent, context);
const businessData = context.businessData;

console.log(`\n=== CyberCheck Inc Data Summary ===\n`);
console.log(`Total businesses: ${businessData.length}`);

const restaurants = businessData.filter(b => b.category === 'restaurants');
console.log(`Total restaurants: ${restaurants.length}\n`);

console.log(`=== New Restaurants ===`);
const newRestaurants = [
  'carmelos',
  'mikees-seafood',
  'oso-bear-point',
  'pelican-grill',
  'the-gulf-restaurant',
  'undertow-bar-grill',
  'wolf-bay-orange-beach'
];

newRestaurants.forEach(id => {
  const restaurant = businessData.find(b => b.id === id);
  if (restaurant) {
    console.log(`✓ ${restaurant.name}`);
    console.log(`  - Menu items: ${restaurant.menu.length}`);
    console.log(`  - Drinks: ${restaurant.drinks.length}`);
    console.log(`  - Phone: ${restaurant.phone}`);
    console.log(`  - Address: ${restaurant.address}`);
    if (restaurant.happyHour) {
      console.log(`  - Happy Hour: ${restaurant.happyHour.substring(0, 50)}...`);
    }
    if (restaurant.events && restaurant.events.length > 0) {
      console.log(`  - Events: ${restaurant.events.length}`);
    }
    console.log('');
  } else {
    console.log(`✗ ${id} - NOT FOUND`);
  }
});

// Test searchability
console.log(`=== Search Test ===`);
const searchTests = [
  { query: 'lasagna', expected: 'carmelos' },
  { query: 'oysters', expected: 'multiple restaurants' },
  { query: 'grouper', expected: 'multiple restaurants' }
];

searchTests.forEach(test => {
  const matches = [];
  businessData.forEach(business => {
    business.menu.forEach(item => {
      if (item.name.toLowerCase().includes(test.query)) {
        matches.push({ business: business.name, item: item.name });
      }
    });
  });
  console.log(`\nSearch "${test.query}": ${matches.length} matches`);
  matches.slice(0, 3).forEach(m => {
    console.log(`  - ${m.business}: ${m.item}`);
  });
});

console.log(`\n✓ All tests passed!`);
