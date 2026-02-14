import {
  CharacterBred as CharacterBredEvent,
  CharactersFused as CharactersFusedEvent
} from "../generated/CharacterBreeding/CharacterBreeding"
import { Character, BreedingEvent } from "../generated/schema"

export function handleCharacterBred(event: CharacterBredEvent): void {
  let parent1 = Character.load(event.params.parent1.toString())
  let parent2 = Character.load(event.params.parent2.toString())
  
  if (parent1) {
    parent1.breedingCount = parent1.breedingCount + 1
    parent1.save()
  }
  if (parent2) {
    parent2.breedingCount = parent2.breedingCount + 1
    parent2.save()
  }

  // Offspring character should be created by handleCharacterMinted from GameCharacter contract
  // But we link it here
  let offspring = Character.load(event.params.offspring.toString())
  if (offspring && parent1 && parent2) {
    offspring.father = parent1.id
    offspring.mother = parent2.id
    offspring.generation = event.params.generation.toI32()
    offspring.save()

    let breeding = new BreedingEvent(
      event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
    )
    breeding.parent1 = parent1.id
    breeding.parent2 = parent2.id
    breeding.offspring = offspring.id
    breeding.generation = offspring.generation
    breeding.timestamp = event.block.timestamp
    breeding.save()
  }
}

export function handleCharactersFused(event: CharactersFusedEvent): void {
  let token1 = Character.load(event.params.token1.toString())
  let token2 = Character.load(event.params.token2.toString())

  if (token1 && token2) {
    token1.isFused = true
    token1.fusedWith = token2.id
    token1.save()

    token2.isFused = true
    token2.fusedWith = token1.id
    token2.save()
  }
}
