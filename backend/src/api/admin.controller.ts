import { Router, Request, Response, NextFunction } from 'express';
import { CardService } from '../services/card.service';
import { SetService } from '../services/set.service';
import { DropRateService } from '../services/drop-rate.service';
import { CardRepository } from '../repositories/card.repository'; // Needed for SetService constructor
import { SetRepository } from '../repositories/set.repository'; // Needed for CardService constructor
import { DropRateRepository } from '../repositories/drop-rate.repository';
import prisma from '../repositories/prisma.client';
import { Rarity } from '@prisma/client';

// Initialize Repositories
const cardRepository = new CardRepository();
const setRepository = new SetRepository();
const dropRateRepository = new DropRateRepository();

// Initialize Services
const cardService = new CardService(cardRepository, setRepository);
const setService = new SetService(setRepository, cardRepository); // CardRepository also needed for deletion check
const dropRateService = new DropRateService(dropRateRepository);

const router = Router();

// Middleware for error handling
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// --- Set Routes ---
router.get('/sets', asyncHandler(async (req: Request, res: Response) => {
  const sets = await setService.findAllSets();
  res.json(sets);
}));

router.post('/sets', asyncHandler(async (req: Request, res: Response) => {
  const newSet = await setService.createSet(req.body);
  res.status(201).json(newSet);
}));

router.get('/sets/:id', asyncHandler(async (req: Request, res: Response) => {
  const set = await setService.findSetById(req.params.id);
  if (!set) {
    return res.status(404).send('Set not found');
  }
  res.json(set);
}));

router.put('/sets/:id', asyncHandler(async (req: Request, res: Response) => {
  const updatedSet = await setService.updateSet(req.params.id, req.body);
  res.json(updatedSet);
}));

router.delete('/sets/:id', asyncHandler(async (req: Request, res: Response) => {
  await setService.deleteSet(req.params.id);
  res.status(204).send();
}));

// --- Card Routes ---
router.get('/cards', asyncHandler(async (req: Request, res: Response) => {
  const cards = await cardService.findAllCards();
  res.json(cards);
}));

router.post('/cards', asyncHandler(async (req: Request, res: Response) => {
  const newCard = await cardService.createCard(req.body);
  res.status(201).json(newCard);
}));

router.get('/cards/:id', asyncHandler(async (req: Request, res: Response) => {
  const card = await cardService.findCardById(req.params.id);
  if (!card) {
    return res.status(404).send('Card not found');
  }
  res.json(card);
}));

router.put('/cards/:id', asyncHandler(async (req: Request, res: Response) => {
  const updatedCard = await cardService.updateCard(req.params.id, req.body);
  res.json(updatedCard);
}));

router.delete('/cards/:id', asyncHandler(async (req: Request, res: Response) => {
  await cardService.deleteCard(req.params.id);
  res.status(204).send();
}));

// --- Drop Rate Routes ---
router.get('/drop-rates', asyncHandler(async (req: Request, res: Response) => {
  const dropRates = await dropRateService.findAllDropRates();
  res.json(dropRates);
}));

router.put('/drop-rates/:rarity', asyncHandler(async (req: Request, res: Response) => {
  const { rarity } = req.params;
  const { rate } = req.body;

  // Basic validation for rarity enum
  if (!Object.values(Rarity).includes(rarity as Rarity)) {
    return res.status(400).send(`Invalid rarity: ${rarity}`);
  }

  const updatedDropRate = await dropRateService.updateDropRate(rarity as Rarity, rate);
  res.json(updatedDropRate);
}));


// Global error handler for this router (or can be moved to main app)
router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  if (err.message.includes('not found')) {
    res.status(404).send(err.message);
  } else if (err.message.includes('Cannot delete')) { // Specific for SetService
    res.status(400).send(err.message);
  } else if (err.message.includes('Drop rate must be between 0 and 1')) { // Specific for DropRateService
    res.status(400).send(err.message);
  }
  else {
    res.status(500).send('Something broke!');
  }
});

export default router;
