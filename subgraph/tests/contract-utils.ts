import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import {
  AdminChanged,
  Approval,
  ApprovalForAll,
  AutoXPEnabled,
  BeaconUpgraded,
  CharacterMinted,
  ClassValidationDebug,
  ExperienceGained,
  Initialized,
  LevelUp,
  MintRequested,
  MutationApplied,
  OwnershipTransferred,
  PassiveXPGranted,
  TraitsRevealed,
  TraitsUpdated,
  Transfer,
  Upgraded,
  UpkeepPerformed
} from "../generated/Contract/Contract"

export function createAdminChangedEvent(
  previousAdmin: Address,
  newAdmin: Address
): AdminChanged {
  let adminChangedEvent = changetype<AdminChanged>(newMockEvent())

  adminChangedEvent.parameters = new Array()

  adminChangedEvent.parameters.push(
    new ethereum.EventParam(
      "previousAdmin",
      ethereum.Value.fromAddress(previousAdmin)
    )
  )
  adminChangedEvent.parameters.push(
    new ethereum.EventParam("newAdmin", ethereum.Value.fromAddress(newAdmin))
  )

  return adminChangedEvent
}

export function createApprovalEvent(
  owner: Address,
  approved: Address,
  tokenId: BigInt
): Approval {
  let approvalEvent = changetype<Approval>(newMockEvent())

  approvalEvent.parameters = new Array()

  approvalEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  approvalEvent.parameters.push(
    new ethereum.EventParam("approved", ethereum.Value.fromAddress(approved))
  )
  approvalEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )

  return approvalEvent
}

export function createApprovalForAllEvent(
  owner: Address,
  operator: Address,
  approved: boolean
): ApprovalForAll {
  let approvalForAllEvent = changetype<ApprovalForAll>(newMockEvent())

  approvalForAllEvent.parameters = new Array()

  approvalForAllEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  approvalForAllEvent.parameters.push(
    new ethereum.EventParam("operator", ethereum.Value.fromAddress(operator))
  )
  approvalForAllEvent.parameters.push(
    new ethereum.EventParam("approved", ethereum.Value.fromBoolean(approved))
  )

  return approvalForAllEvent
}

export function createAutoXPEnabledEvent(tokenId: BigInt): AutoXPEnabled {
  let autoXpEnabledEvent = changetype<AutoXPEnabled>(newMockEvent())

  autoXpEnabledEvent.parameters = new Array()

  autoXpEnabledEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )

  return autoXpEnabledEvent
}

export function createBeaconUpgradedEvent(beacon: Address): BeaconUpgraded {
  let beaconUpgradedEvent = changetype<BeaconUpgraded>(newMockEvent())

  beaconUpgradedEvent.parameters = new Array()

  beaconUpgradedEvent.parameters.push(
    new ethereum.EventParam("beacon", ethereum.Value.fromAddress(beacon))
  )

  return beaconUpgradedEvent
}

export function createCharacterMintedEvent(
  tokenId: BigInt,
  owner: Address,
  characterClass: string
): CharacterMinted {
  let characterMintedEvent = changetype<CharacterMinted>(newMockEvent())

  characterMintedEvent.parameters = new Array()

  characterMintedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  characterMintedEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  characterMintedEvent.parameters.push(
    new ethereum.EventParam(
      "characterClass",
      ethereum.Value.fromString(characterClass)
    )
  )

  return characterMintedEvent
}

export function createClassValidationDebugEvent(
  providedClass: string,
  providedHash: Bytes,
  isValid: boolean
): ClassValidationDebug {
  let classValidationDebugEvent =
    changetype<ClassValidationDebug>(newMockEvent())

  classValidationDebugEvent.parameters = new Array()

  classValidationDebugEvent.parameters.push(
    new ethereum.EventParam(
      "providedClass",
      ethereum.Value.fromString(providedClass)
    )
  )
  classValidationDebugEvent.parameters.push(
    new ethereum.EventParam(
      "providedHash",
      ethereum.Value.fromFixedBytes(providedHash)
    )
  )
  classValidationDebugEvent.parameters.push(
    new ethereum.EventParam("isValid", ethereum.Value.fromBoolean(isValid))
  )

  return classValidationDebugEvent
}

export function createExperienceGainedEvent(
  tokenId: BigInt,
  amount: i32,
  newTotalExperience: BigInt
): ExperienceGained {
  let experienceGainedEvent = changetype<ExperienceGained>(newMockEvent())

  experienceGainedEvent.parameters = new Array()

  experienceGainedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  experienceGainedEvent.parameters.push(
    new ethereum.EventParam(
      "amount",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(amount))
    )
  )
  experienceGainedEvent.parameters.push(
    new ethereum.EventParam(
      "newTotalExperience",
      ethereum.Value.fromUnsignedBigInt(newTotalExperience)
    )
  )

  return experienceGainedEvent
}

export function createInitializedEvent(version: i32): Initialized {
  let initializedEvent = changetype<Initialized>(newMockEvent())

  initializedEvent.parameters = new Array()

  initializedEvent.parameters.push(
    new ethereum.EventParam(
      "version",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(version))
    )
  )

  return initializedEvent
}

export function createLevelUpEvent(
  tokenId: BigInt,
  oldLevel: BigInt,
  newLevel: BigInt
): LevelUp {
  let levelUpEvent = changetype<LevelUp>(newMockEvent())

  levelUpEvent.parameters = new Array()

  levelUpEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  levelUpEvent.parameters.push(
    new ethereum.EventParam(
      "oldLevel",
      ethereum.Value.fromUnsignedBigInt(oldLevel)
    )
  )
  levelUpEvent.parameters.push(
    new ethereum.EventParam(
      "newLevel",
      ethereum.Value.fromUnsignedBigInt(newLevel)
    )
  )

  return levelUpEvent
}

export function createMintRequestedEvent(
  requestId: BigInt,
  tokenId: BigInt
): MintRequested {
  let mintRequestedEvent = changetype<MintRequested>(newMockEvent())

  mintRequestedEvent.parameters = new Array()

  mintRequestedEvent.parameters.push(
    new ethereum.EventParam(
      "requestId",
      ethereum.Value.fromUnsignedBigInt(requestId)
    )
  )
  mintRequestedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )

  return mintRequestedEvent
}

export function createMutationAppliedEvent(
  tokenId: BigInt,
  mutationCount: i32
): MutationApplied {
  let mutationAppliedEvent = changetype<MutationApplied>(newMockEvent())

  mutationAppliedEvent.parameters = new Array()

  mutationAppliedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  mutationAppliedEvent.parameters.push(
    new ethereum.EventParam(
      "mutationCount",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(mutationCount))
    )
  )

  return mutationAppliedEvent
}

export function createOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferred {
  let ownershipTransferredEvent =
    changetype<OwnershipTransferred>(newMockEvent())

  ownershipTransferredEvent.parameters = new Array()

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownershipTransferredEvent
}

export function createPassiveXPGrantedEvent(
  tokenId: BigInt,
  amount: BigInt
): PassiveXPGranted {
  let passiveXpGrantedEvent = changetype<PassiveXPGranted>(newMockEvent())

  passiveXpGrantedEvent.parameters = new Array()

  passiveXpGrantedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  passiveXpGrantedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return passiveXpGrantedEvent
}

export function createTraitsRevealedEvent(
  tokenId: BigInt,
  traits: Array<BigInt>
): TraitsRevealed {
  let traitsRevealedEvent = changetype<TraitsRevealed>(newMockEvent())

  traitsRevealedEvent.parameters = new Array()

  traitsRevealedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  traitsRevealedEvent.parameters.push(
    new ethereum.EventParam(
      "traits",
      ethereum.Value.fromUnsignedBigIntArray(traits)
    )
  )

  return traitsRevealedEvent
}

export function createTraitsUpdatedEvent(
  tokenId: BigInt,
  newLevel: BigInt,
  newStrength: BigInt,
  newAgility: BigInt,
  newIntelligence: BigInt,
  newExperience: BigInt
): TraitsUpdated {
  let traitsUpdatedEvent = changetype<TraitsUpdated>(newMockEvent())

  traitsUpdatedEvent.parameters = new Array()

  traitsUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  traitsUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newLevel",
      ethereum.Value.fromUnsignedBigInt(newLevel)
    )
  )
  traitsUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newStrength",
      ethereum.Value.fromUnsignedBigInt(newStrength)
    )
  )
  traitsUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newAgility",
      ethereum.Value.fromUnsignedBigInt(newAgility)
    )
  )
  traitsUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newIntelligence",
      ethereum.Value.fromUnsignedBigInt(newIntelligence)
    )
  )
  traitsUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newExperience",
      ethereum.Value.fromUnsignedBigInt(newExperience)
    )
  )

  return traitsUpdatedEvent
}

export function createTransferEvent(
  from: Address,
  to: Address,
  tokenId: BigInt
): Transfer {
  let transferEvent = changetype<Transfer>(newMockEvent())

  transferEvent.parameters = new Array()

  transferEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  )
  transferEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )
  transferEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )

  return transferEvent
}

export function createUpgradedEvent(implementation: Address): Upgraded {
  let upgradedEvent = changetype<Upgraded>(newMockEvent())

  upgradedEvent.parameters = new Array()

  upgradedEvent.parameters.push(
    new ethereum.EventParam(
      "implementation",
      ethereum.Value.fromAddress(implementation)
    )
  )

  return upgradedEvent
}

export function createUpkeepPerformedEvent(timestamp: BigInt): UpkeepPerformed {
  let upkeepPerformedEvent = changetype<UpkeepPerformed>(newMockEvent())

  upkeepPerformedEvent.parameters = new Array()

  upkeepPerformedEvent.parameters.push(
    new ethereum.EventParam(
      "timestamp",
      ethereum.Value.fromUnsignedBigInt(timestamp)
    )
  )

  return upkeepPerformedEvent
}
