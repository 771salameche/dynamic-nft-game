import { BigInt, Address } from "@graphprotocol/graph-ts";
import {
  CharacterMinted,
  LevelUp,
  TraitsUpdated,
  ExperienceGained
} from "../generated/GameCharacter/GameCharacter";
import {
  Character,
  Player,
  LevelUpEvent,
  ExperienceGainEvent,
  GlobalStats
} from "../generated/schema";

export function handleCharacterMinted(event: CharacterMinted): void {
  let character = new Character(event.params.tokenId.toString());
  let player = getOrCreatePlayer(event.params.owner);
  
  character.tokenId = event.params.tokenId;
  character.owner = player.id;
  character.level = 1;
  character.strength = 10;
  character.agility = 10;
  character.intelligence = 10;
  character.experience = 0;
  character.characterClass = event.params.characterClass;
  character.generation = 0;
  character.mintedAt = event.block.timestamp;
  character.lastTrainedAt = event.block.timestamp;
  character.isStaked = false;
  character.totalXPGained = BigInt.fromI32(0);
  character.levelUpCount = 0;
  character.breedCount = 0;
  character.powerScore = calculatePowerScore(1, 10, 10, 10);
  
  character.save();
  
  // Update player stats
  player.charactersMinted = player.charactersMinted + 1;
  player.lastActiveAt = event.block.timestamp;
  player.save();
  
  // Update global stats
  updateGlobalStats(event.block.timestamp);
}

export function handleLevelUp(event: LevelUp): void {
  let character = Character.load(event.params.tokenId.toString());
  if (!character) return;
  
  let oldLevel = character.level;
  character.level = event.params.newLevel.toI32();
  character.levelUpCount = character.levelUpCount + 1;
  character.powerScore = calculatePowerScore(
    character.level,
    character.strength,
    character.agility,
    character.intelligence
  );
  character.save();
  
  // Create level up event
  let levelUpEvent = new LevelUpEvent(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  levelUpEvent.character = character.id;
  levelUpEvent.oldLevel = oldLevel;
  levelUpEvent.newLevel = character.level;
  levelUpEvent.timestamp = event.block.timestamp;
  levelUpEvent.transactionHash = event.transaction.hash;
  levelUpEvent.save();
}

export function handleTraitsUpdated(event: TraitsUpdated): void {
  let character = Character.load(event.params.tokenId.toString());
  if (!character) return;
  
  // Update traits from event
  character.strength = event.params.newStrength.toI32();
  character.agility = event.params.newAgility.toI32();
  character.intelligence = event.params.newIntelligence.toI32();
  character.experience = event.params.newExperience.toI32();
  character.level = event.params.newLevel.toI32();
  
  character.powerScore = calculatePowerScore(
    character.level,
    character.strength,
    character.agility,
    character.intelligence
  );
  
  character.save();
}

export function handleExperienceGained(event: ExperienceGained): void {
  let character = Character.load(event.params.tokenId.toString());
  if (!character) return;
  
  character.totalXPGained = character.totalXPGained.plus(
    BigInt.fromI32(event.params.amount)
  );
  character.save();
  
  // Create XP gain event
  let xpEvent = new ExperienceGainEvent(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  xpEvent.character = character.id;
  xpEvent.amount = event.params.amount;
  xpEvent.newTotal = event.params.newTotalExperience.toI32();
  xpEvent.timestamp = event.block.timestamp;
  xpEvent.transactionHash = event.transaction.hash;
  xpEvent.save();
}

// Helper functions
export function getOrCreatePlayer(address: Address): Player {
  let player = Player.load(address.toHex());
  
  if (!player) {
    player = new Player(address.toHex());
    player.rewardsClaimed = BigInt.fromI32(0);
    player.totalRewardsEarned = BigInt.fromI32(0);
    player.achievementCount = 0;
    player.charactersMinted = 0;
    player.charactersStaked = 0;
    player.breedingCount = 0;
    player.createdAt = BigInt.fromI32(0);
    player.lastActiveAt = BigInt.fromI32(0);
  }
  
  return player as Player;
}

export function calculatePowerScore(
  level: i32,
  strength: i32,
  agility: i32,
  intelligence: i32
): BigInt {
  let totalStats = strength + agility + intelligence;
  let power = totalStats * level;
  return BigInt.fromI32(power);
}

export function updateGlobalStats(timestamp: BigInt): void {
  let stats = GlobalStats.load("global");
  
  if (!stats) {
    stats = new GlobalStats("global");
    stats.totalCharacters = BigInt.fromI32(0);
    stats.totalPlayers = BigInt.fromI32(0);
    stats.totalStaked = BigInt.fromI32(0);
    stats.totalRewardsDistributed = BigInt.fromI32(0);
    stats.totalBreedings = BigInt.fromI32(0);
    stats.totalFusions = BigInt.fromI32(0);
    stats.highestLevel = 0;
    stats.highestPowerScore = BigInt.fromI32(0);
    stats.lastUpdated = timestamp;
  }
  
  stats.totalCharacters = stats.totalCharacters.plus(BigInt.fromI32(1));
  stats.lastUpdated = timestamp;
  stats.save();
}
