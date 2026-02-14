import { BigInt, Address } from "@graphprotocol/graph-ts";
import {
  CharacterBred,
  CharactersFused
} from "../generated/CharacterBreeding/CharacterBreeding";
import {
  Character,
  Player,
  BreedingEvent,
  FusionEvent,
  GlobalStats
} from "../generated/schema";
import { getOrCreatePlayer } from "./game-character";

export function handleCharacterBred(event: CharacterBred): void {
  let parent1 = Character.load(event.params.parent1.toString());
  let parent2 = Character.load(event.params.parent2.toString());
  let offspring = Character.load(event.params.offspring.toString());
  
  if (parent1 && parent2 && offspring) {
    let breeder = getOrCreatePlayer(Address.fromString(offspring.owner));
    
    let breedingEvent = new BreedingEvent(
      event.transaction.hash.toHex() + "-" + event.logIndex.toString()
    );
    breedingEvent.breeder = breeder.id;
    breedingEvent.parent1 = parent1.id;
    breedingEvent.parent2 = parent2.id;
    breedingEvent.offspring = offspring.id;
    breedingEvent.generation = event.params.generation.toI32();
    breedingEvent.timestamp = event.block.timestamp;
    breedingEvent.blockNumber = event.block.number;
    breedingEvent.transactionHash = event.transaction.hash;
    breedingEvent.save();
    
    // Update offspring parents
    let parents = offspring.parents;
    if (!parents) parents = [];
    parents.push(parent1.id);
    parents.push(parent2.id);
    offspring.parents = parents;
    offspring.generation = event.params.generation.toI32();
    offspring.save();
    
    // Update parent stats
    parent1.breedCount = parent1.breedCount + 1;
    parent1.save();
    parent2.breedCount = parent2.breedCount + 1;
    parent2.save();
    
    breeder.breedingCount = breeder.breedingCount + 1;
    breeder.save();
    
    let stats = GlobalStats.load("global");
    if (stats) {
      stats.totalBreedings = stats.totalBreedings.plus(BigInt.fromI32(1));
      stats.save();
    }
  }
}

export function handleCharactersFused(event: CharactersFused): void {
  let token1 = Character.load(event.params.token1.toString());
  let token2 = Character.load(event.params.token2.toString());
  let fused = Character.load(event.params.fusedToken.toString());
  
  if (token1 && token2 && fused) {
    let player = getOrCreatePlayer(Address.fromString(fused.owner));
    
    let fusionEvent = new FusionEvent(
      event.transaction.hash.toHex() + "-" + event.logIndex.toString()
    );
    fusionEvent.player = player.id;
    fusionEvent.token1 = token1.id;
    fusionEvent.token2 = token2.id;
    fusionEvent.fusedCharacter = fused.id;
    fusionEvent.combinedStats = event.params.totalStats;
    fusionEvent.timestamp = event.block.timestamp;
    fusionEvent.transactionHash = event.transaction.hash;
    fusionEvent.save();
    
    let stats = GlobalStats.load("global");
    if (stats) {
      stats.totalFusions = stats.totalFusions.plus(BigInt.fromI32(1));
      stats.save();
    }
  }
}
