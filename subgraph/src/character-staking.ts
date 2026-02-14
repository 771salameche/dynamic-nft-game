import { BigInt } from "@graphprotocol/graph-ts";
import {
  Staked,
  Unstaked,
  RewardsClaimed
} from "../generated/CharacterStaking/CharacterStaking";
import {
  StakedCharacter,
  Character,
  Player,
  RewardClaim,
  GlobalStats
} from "../generated/schema";
import { getOrCreatePlayer } from "./game-character";

export function handleStaked(event: Staked): void {
  let player = getOrCreatePlayer(event.params.user);
  let character = Character.load(event.params.tokenId.toString());
  
  if (character) {
    character.isStaked = true;
    character.save();
    
    let stakedId = event.params.user.toHex() + "-" + event.params.tokenId.toString();
    let stakedCharacter = new StakedCharacter(stakedId);
    stakedCharacter.character = character.id;
    stakedCharacter.player = player.id;
    stakedCharacter.tokenId = event.params.tokenId;
    stakedCharacter.stakedAt = event.params.timestamp;
    stakedCharacter.isActive = true;
    stakedCharacter.totalRewardsEarned = BigInt.fromI32(0);
    stakedCharacter.lastClaimAt = event.params.timestamp;
    stakedCharacter.save();
    
    character.stakeInfo = stakedCharacter.id;
    character.save();
  }
  
  player.charactersStaked = player.charactersStaked + 1;
  player.lastActiveAt = event.block.timestamp;
  player.save();
  
  let stats = GlobalStats.load("global");
  if (stats) {
    stats.totalStaked = stats.totalStaked.plus(BigInt.fromI32(1));
    stats.save();
  }
}

export function handleUnstaked(event: Unstaked): void {
  let player = getOrCreatePlayer(event.params.user);
  let character = Character.load(event.params.tokenId.toString());
  
  if (character) {
    character.isStaked = false;
    character.save();
    
    let stakedId = event.params.user.toHex() + "-" + event.params.tokenId.toString();
    let stakedCharacter = StakedCharacter.load(stakedId);
    if (stakedCharacter) {
      stakedCharacter.isActive = false;
      stakedCharacter.unstakedAt = event.params.timestamp;
      stakedCharacter.save();
    }
  }
  
  player.charactersStaked = player.charactersStaked - 1;
  player.lastActiveAt = event.block.timestamp;
  player.save();
  
  let stats = GlobalStats.load("global");
  if (stats) {
    stats.totalStaked = stats.totalStaked.minus(BigInt.fromI32(1));
    stats.save();
  }
}

export function handleRewardsClaimed(event: RewardsClaimed): void {
  let player = getOrCreatePlayer(event.params.user);
  
  let claim = new RewardClaim(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  claim.player = player.id;
  claim.amount = event.params.amount;
  claim.timestamp = event.block.timestamp;
  claim.transactionHash = event.transaction.hash;
  claim.save();
  
  player.rewardsClaimed = player.rewardsClaimed.plus(event.params.amount);
  player.totalRewardsEarned = player.totalRewardsEarned.plus(event.params.amount);
  player.lastActiveAt = event.block.timestamp;
  player.save();
  
  let stats = GlobalStats.load("global");
  if (stats) {
    stats.totalRewardsDistributed = stats.totalRewardsDistributed.plus(event.params.amount);
    stats.save();
  }
}
