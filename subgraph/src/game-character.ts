import {
  CharacterMinted as CharacterMintedEvent,
  LevelUp as LevelUpEvent,
  TraitsUpdated as TraitsUpdatedEvent,
  ExperienceGained as ExperienceGainedEvent
} from "../generated/GameCharacter/GameCharacter"
import { Character, Player, LevelUp, ExperienceGained } from "../generated/schema"
import { BigInt } from "@graphprotocol/graph-ts"

export function handleCharacterMinted(event: CharacterMintedEvent): void {
  let player = Player.load(event.params.owner.toHexString())
  if (player == null) {
    player = new Player(event.params.owner.toHexString())
    player.tokenBalance = BigInt.fromI32(0)
    player.totalStaked = 0
    player.save()
  }

  let character = new Character(event.params.tokenId.toString())
  character.owner = player.id
  character.characterClass = event.params.characterClass
  character.level = 1
  character.strength = 0
  character.agility = 0
  character.intelligence = 0
  character.experience = 0
  character.generation = 0
  character.lastTrainedAt = event.block.timestamp
  character.staked = false
  character.breedingCount = 0
  character.isFused = false
  character.save()
}

export function handleLevelUp(event: LevelUpEvent): void {
  let character = Character.load(event.params.tokenId.toString())
  if (character) {
    character.level = event.params.newLevel.toI32()
    character.save()

    let levelUp = new LevelUp(
      event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
    )
    levelUp.character = character.id
    levelUp.newLevel = character.level
    levelUp.blockNumber = event.block.number
    levelUp.timestamp = event.block.timestamp
    levelUp.save()
  }
}

export function handleTraitsUpdated(event: TraitsUpdatedEvent): void {
  let character = Character.load(event.params.tokenId.toString())
  if (character) {
    character.level = event.params.newLevel.toI32()
    character.strength = event.params.newStrength.toI32()
    character.agility = event.params.newAgility.toI32()
    character.intelligence = event.params.newIntelligence.toI32()
    character.experience = event.params.newExperience.toI32()
    character.save()
  }
}

export function handleExperienceGained(event: ExperienceGainedEvent): void {
  let character = Character.load(event.params.tokenId.toString())
  if (character) {
    character.experience = event.params.newTotalExperience.toI32()
    character.save()

    let expGained = new ExperienceGained(
      event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
    )
    expGained.character = character.id
    expGained.amount = event.params.amount
    expGained.newTotalExperience = character.experience
    expGained.blockNumber = event.block.number
    expGained.timestamp = event.block.timestamp
    expGained.save()
  }
}
