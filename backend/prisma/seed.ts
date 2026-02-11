import { PrismaClient, Rarity } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // --- Create a placeholder Set ---
  const placeholderSet = await prisma.set.upsert({
    where: { name: 'Starter Set' },
    update: {},
    create: {
      name: 'Starter Set',
      image: 'http://localhost:3001/assets/packs/starter_pack.png', // Placeholder image URL
      totalCards: 10, // Will be updated by cards
    },
  });
  console.log(`Created placeholder set with ID: ${placeholderSet.id}`);

  // --- Create placeholder Cards ---
  const rarities = Object.values(Rarity);
  const cardsData = [
    { name: 'Common Card 1', rarity: Rarity.COMMON, description: 'A common but reliable card.', image: 'http://localhost:3001/assets/cards/common_card_1.png' },
    { name: 'Common Card 2', rarity: Rarity.COMMON, description: 'Another common card.', image: 'http://localhost:3001/assets/cards/common_card_2.png' },
    { name: 'Uncommon Card 1', rarity: Rarity.UNCOMMON, description: 'Slightly less common.', image: 'http://localhost:3001/assets/cards/uncommon_card_1.png' },
    { name: 'Uncommon Card 2', rarity: Rarity.UNCOMMON, description: 'A useful uncommon card.', image: 'http://localhost:3001/assets/cards/uncommon_card_2.png' },
    { name: 'Rare Card 1', rarity: Rarity.RARE, description: 'A powerful rare card.', image: 'http://localhost:3001/assets/cards/rare_card_1.png' },
    { name: 'Super Rare Card 1', rarity: Rarity.SUPER_RARE, description: 'An extremely rare card.', image: 'http://localhost:3001/assets/cards/super_rare_card_1.png' },
    { name: 'Epic Card 1', rarity: Rarity.EPIC, description: 'A legendary beast, almost.', image: 'http://localhost:3001/assets/cards/epic_card_1.png' },
    { name: 'Legendary Card 1', rarity: Rarity.LEGENDARY, description: 'The pinnacle of power!', image: 'http://localhost:3001/assets/cards/legendary_card_1.png' },
    { name: 'Legendary Alt Card 1', rarity: Rarity.LEGENDARY_ALT, description: 'An alternate, even rarer legend.', image: 'http://localhost:3001/assets/cards/legendary_alt_card_1.png' },
    { name: 'Common Card 3', rarity: Rarity.COMMON, description: 'A third common for good measure.', image: 'http://localhost:3001/assets/cards/common_card_3.png' },
  ];

  for (const cardData of cardsData) {
    await prisma.card.upsert({
      where: { name: cardData.name },
      update: { ...cardData, setId: placeholderSet.id },
      create: { ...cardData, setId: placeholderSet.id },
    });
    console.log(`Created card: ${cardData.name}`);
  }

  // Update totalCards count for the set
  const cardsInSetCount = await prisma.card.count({ where: { setId: placeholderSet.id } });
  await prisma.set.update({
    where: { id: placeholderSet.id },
    data: { totalCards: cardsInSetCount },
  });
  console.log(`Updated totalCards for Starter Set to: ${cardsInSetCount}`);

  // --- Create default DropRates ---
  const defaultDropRates = {
    [Rarity.COMMON]: 0.50,
    [Rarity.UNCOMMON]: 0.25,
    [Rarity.RARE]: 0.15,
    [Rarity.SUPER_RARE]: 0.07,
    [Rarity.EPIC]: 0.02,
    [Rarity.LEGENDARY]: 0.007,
    [Rarity.LEGENDARY_ALT]: 0.003,
  };

  for (const rarity of rarities) {
    const rate = defaultDropRates[rarity] || 0; // Default to 0 if not explicitly defined
    await prisma.dropRate.upsert({
      where: { rarity },
      update: { rate },
      create: { rarity, rate },
    });
    console.log(`Created DropRate for ${rarity}: ${rate}`);
  }

  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
