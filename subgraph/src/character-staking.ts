import {
  Staked as StakedEvent,
  Unstaked as UnstakedEvent,
  RewardsClaimed as RewardsClaimedEvent
} from "../generated/CharacterStaking/CharacterStaking"
import { Character, Player, StakedCharacter, RewardClaim } from "../generated/schema"
import { BigInt, store } from "@graphprotocol/graph-ts"

export function handleStaked(event: StakedEvent): void {
  let player = Player.load(event.params.user.toHexString())
  if (player == null) {
    player = new Player(event.params.user.toHexString())
    player.tokenBalance = BigInt.fromI32(0)
    player.totalStaked = 0
    player.save()
  }
  player.totalStaked = player.totalStaked + 1
  player.save()

  let character = Character.load(event.params.tokenId.toString())
  if (character) {
    character.staked = true
    character.save()
  }

  let stakedChar = new StakedCharacter(event.params.tokenId.toString())
  stakedChar.player = player.id
  stakedChar.stakedAt = event.block.timestamp
  stakedChar.lastClaimAt = event.block.timestamp
  stakedChar.save()
}

export function handleUnstaked(event: UnstakedEvent): void {
  let player = Player.load(event.params.user.toHexString())
  if (player) {
    player.totalStaked = player.totalStaked - 1
    player.save()
  }

  let character = Character.load(event.params.tokenId.toString())
  if (character) {
    character.staked = false
    character.save()
  }

  store.remove("StakedCharacter", event.params.tokenId.toString())
}

export function handleRewardsClaimed(event: RewardsClaimedEvent): void {
  let player = Player.load(event.params.user.toHexString())
  if (player) {
    let claim = new RewardClaim(
      event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
    )
    claim.player = player.id
    claim.amount = event.params.amount
    claim.timestamp = event.block.timestamp
    claim.save()
  }
}
