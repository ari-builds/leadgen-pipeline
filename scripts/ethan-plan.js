// Ethan Grandet (ArcTik Dev) — Targeted lead gen plan
// ICP: Local businesses in US/Canada with weak/outdated websites
// Industries: Restaurants, contractors, salons, gyms, retail, local services
// Target: 30 high-quality leads (have email/phone, real business, has website)

const QUERIES = [
  // === NEW ENGLAND (tourist towns, small cities, food scenes) ===
  // Restaurants
  "restaurant Portland Maine website contact",
  "restaurant Burlington Vermont website email",
  "restaurant Portsmouth New Hampshire website",
  "restaurant Providence Rhode Island contact",
  "restaurant New Haven Connecticut website",
  
  // Salons & Spas
  "hair salon Portland Maine website",
  "spa Burlington Vermont website contact",
  "nail salon Portsmouth New Hampshire",
  
  // Gyms
  "gym Burlington Vermont website",
  "fitness center Portland Maine website",
  
  // Contractors
  "plumber Burlington Vermont website contact",
  "electrician Portland Maine website",
  "contractor Portsmouth New Hampshire website",
  
  // === MID-ATLANTIC (historic towns, growing cities) ===
  // Restaurants
  "restaurant Richmond Virginia website contact",
  "restaurant Charlottesville Virginia website",
  "restaurant Annapolis Maryland website contact",
  "restaurant Wilmington Delaware website",
  
  // Salons
  "salon Richmond Virginia website",
  "spa Charlottesville Virginia website",
  
  // Contractors
  "plumber Richmond Virginia website contact",
  "contractor Annapolis Maryland website",
  
  // === SOUTHEAST (tourist destinations, food cities) ===
  // Restaurants
  "restaurant Asheville North Carolina website contact",
  "restaurant Savannah Georgia website contact",
  "restaurant Charleston South Carolina website",
  "restaurant Greenville South Carolina website",
  "restaurant Chattanooga Tennessee website contact",
  
  // Salons
  "salon Asheville North Carolina website",
  "spa Savannah Georgia website",
  "hair salon Charleston South Carolina website",
  
  // Gyms
  "gym Asheville North Carolina website",
  "fitness gym Chattanooga Tennessee website",
  
  // === MIDWEST (college towns, growing cities) ===
  // Restaurants
  "restaurant Madison Wisconsin website contact",
  "restaurant Grand Rapids Michigan website contact",
  "restaurant Duluth Minnesota website",
  "restaurant Traverse City Michigan website",
  
  // Salons
  "salon Madison Wisconsin website",
  "spa Grand Rapids Michigan website",
  
  // Contractors
  "plumber Madison Wisconsin website contact",
  "electrician Grand Rapids Michigan website",
  "contractor Duluth Minnesota website",
  
  // === MOUNTAIN WEST (outdoor towns, growing fast) ===
  // Restaurants
  "restaurant Boise Idaho website contact",
  "restaurant Spokane Washington website contact",
  "restaurant Missoula Montana website",
  "restaurant Bend Oregon website contact",
  
  // Salons
  "salon Boise Idaho website",
  "spa Spokane Washington website",
  
  // Gyms
  "gym Boise Idaho website",
  "fitness center Bend Oregon website",
  
  // === CANADA (small cities, strong local scenes) ===
  // Restaurants
  "restaurant Victoria BC website contact",
  "restaurant Kelowna BC website contact",
  "restaurant Halifax Nova Scotia website",
  
  // Salons
  "salon Victoria BC website",
  "spa Kelowna BC website",
  
  // Contractors
  "plumber Victoria BC website contact",
  "contractor Kelowna BC website",
  "electrician Halifax Nova Scotia website",
  
  // === BONUS: Tourist towns with high restaurant density ===
  "restaurant Bar Harbor Maine website",
  "restaurant Stowe Vermont website",
  "restaurant Beaufort South Carolina website",
  "restaurant Blue Ridge Georgia website",
  "restaurant Taos New Mexico website",
  "restaurant Sedona Arizona website contact",
  "restaurant Park City Utah website",
  "restaurant Jackson Hole Wyoming website",
  "restaurant Whitefish Montana website",
  "restaurant Bayfield Wisconsin website",
];

// Quality criteria for each lead:
// 1. Must have email OR phone (preferably both)
// 2. Must have a website URL
// 3. Company name must be real business name (not page title)
// 4. Must be in US/Canada
// 5. Not a franchise (no 800/855/866/877 numbers)
// 6. Not a competitor (no web dev, marketing agency, SaaS)
// 7. Not a directory or article page
// 8. Industry must match ICP (restaurant, salon, gym, contractor, retail, local service)

console.log(`Total queries: ${QUERIES.length}`);
console.log(`Expected results: ~${QUERIES.length * 8} raw leads`);
console.log(`After quality gate: ~40-50 leads`);
console.log(`Final target: 30 leads`);
