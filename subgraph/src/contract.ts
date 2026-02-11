import {
  AdminChanged as AdminChangedEvent,
  Approval as ApprovalEvent,
  ApprovalForAll as ApprovalForAllEvent,
  AutoXPEnabled as AutoXPEnabledEvent,
  BeaconUpgraded as BeaconUpgradedEvent,
  CharacterMinted as CharacterMintedEvent,
  ClassValidationDebug as ClassValidationDebugEvent,
  ExperienceGained as ExperienceGainedEvent,
  Initialized as InitializedEvent,
  LevelUp as LevelUpEvent,
  MintRequested as MintRequestedEvent,
  MutationApplied as MutationAppliedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  PassiveXPGranted as PassiveXPGrantedEvent,
  TraitsRevealed as TraitsRevealedEvent,
  TraitsUpdated as TraitsUpdatedEvent,
  Transfer as TransferEvent,
  Upgraded as UpgradedEvent,
  UpkeepPerformed as UpkeepPerformedEvent
} from "../generated/Contract/Contract"
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
} from "../generated/schema"

export function handleAdminChanged(event: AdminChangedEvent): void {
  let entity = new AdminChanged(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.previousAdmin = event.params.previousAdmin
  entity.newAdmin = event.params.newAdmin

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleApproval(event: ApprovalEvent): void {
  let entity = new Approval(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.owner = event.params.owner
  entity.approved = event.params.approved
  entity.tokenId = event.params.tokenId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleApprovalForAll(event: ApprovalForAllEvent): void {
  let entity = new ApprovalForAll(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.owner = event.params.owner
  entity.operator = event.params.operator
  entity.approved = event.params.approved

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleAutoXPEnabled(event: AutoXPEnabledEvent): void {
  let entity = new AutoXPEnabled(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tokenId = event.params.tokenId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleBeaconUpgraded(event: BeaconUpgradedEvent): void {
  let entity = new BeaconUpgraded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.beacon = event.params.beacon

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleCharacterMinted(event: CharacterMintedEvent): void {
  let entity = new CharacterMinted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tokenId = event.params.tokenId
  entity.owner = event.params.owner
  entity.characterClass = event.params.characterClass

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleClassValidationDebug(
  event: ClassValidationDebugEvent
): void {
  let entity = new ClassValidationDebug(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.providedClass = event.params.providedClass
  entity.providedHash = event.params.providedHash
  entity.isValid = event.params.isValid

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleExperienceGained(event: ExperienceGainedEvent): void {
  let entity = new ExperienceGained(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tokenId = event.params.tokenId
  entity.amount = event.params.amount
  entity.newTotalExperience = event.params.newTotalExperience

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleInitialized(event: InitializedEvent): void {
  let entity = new Initialized(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.version = event.params.version

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleLevelUp(event: LevelUpEvent): void {
  let entity = new LevelUp(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tokenId = event.params.tokenId
  entity.oldLevel = event.params.oldLevel
  entity.newLevel = event.params.newLevel

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleMintRequested(event: MintRequestedEvent): void {
  let entity = new MintRequested(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.requestId = event.params.requestId
  entity.tokenId = event.params.tokenId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleMutationApplied(event: MutationAppliedEvent): void {
  let entity = new MutationApplied(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tokenId = event.params.tokenId
  entity.mutationCount = event.params.mutationCount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.previousOwner = event.params.previousOwner
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePassiveXPGranted(event: PassiveXPGrantedEvent): void {
  let entity = new PassiveXPGranted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tokenId = event.params.tokenId
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTraitsRevealed(event: TraitsRevealedEvent): void {
  let entity = new TraitsRevealed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tokenId = event.params.tokenId
  entity.traits = event.params.traits

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTraitsUpdated(event: TraitsUpdatedEvent): void {
  let entity = new TraitsUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tokenId = event.params.tokenId
  entity.newLevel = event.params.newLevel
  entity.newStrength = event.params.newStrength
  entity.newAgility = event.params.newAgility
  entity.newIntelligence = event.params.newIntelligence
  entity.newExperience = event.params.newExperience

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTransfer(event: TransferEvent): void {
  let entity = new Transfer(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.from = event.params.from
  entity.to = event.params.to
  entity.tokenId = event.params.tokenId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleUpgraded(event: UpgradedEvent): void {
  let entity = new Upgraded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.implementation = event.params.implementation

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleUpkeepPerformed(event: UpkeepPerformedEvent): void {
  let entity = new UpkeepPerformed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.timestamp = event.params.timestamp

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
