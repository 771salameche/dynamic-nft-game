import { BigInt } from "@graphprotocol/graph-ts";
import {
  AchievementAdded,
  AchievementUnlocked
} from "../generated/AchievementTracker/AchievementTracker";
import {
  Achievement,
  PlayerAchievement,
  Player
} from "../generated/schema";
import { getOrCreatePlayer } from "./game-character";

export function handleAchievementAdded(event: AchievementAdded): void {
  let achievement = new Achievement(event.params.achievementId.toString());
  achievement.achievementId = event.params.achievementId;
  achievement.name = event.params.name;
  achievement.description = ""; // Not in event
  achievement.category = ""; // Not in event
  achievement.tier = event.params.tier;
  achievement.xpReward = BigInt.fromI32(0); // Not in event
  achievement.tokenReward = BigInt.fromI32(0); // Not in event
  achievement.isActive = true;
  achievement.totalUnlocks = 0;
  achievement.createdAt = event.block.timestamp;
  achievement.save();
}

export function handleAchievementUnlocked(event: AchievementUnlocked): void {
  let player = getOrCreatePlayer(event.params.player);
  let achievement = Achievement.load(event.params.achievementId.toString());
  
  if (achievement) {
    let id = event.params.player.toHex() + "-" + event.params.achievementId.toString();
    let playerAchievement = new PlayerAchievement(id);
    playerAchievement.player = player.id;
    playerAchievement.achievement = achievement.id;
    playerAchievement.unlockedAt = event.block.timestamp;
    playerAchievement.transactionHash = event.transaction.hash;
    playerAchievement.save();
    
    achievement.totalUnlocks = achievement.totalUnlocks + 1;
    achievement.save();
    
    player.achievementCount = player.achievementCount + 1;
    player.lastActiveAt = event.block.timestamp;
    player.save();
  }
}
