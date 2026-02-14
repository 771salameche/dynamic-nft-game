import {
  AchievementUnlocked as AchievementUnlockedEvent,
  AchievementAdded as AchievementAddedEvent
} from "../generated/AchievementTracker/AchievementTracker"
import { Achievement, PlayerAchievement, Player } from "../generated/schema"
import { BigInt } from "@graphprotocol/graph-ts"

export function handleAchievementAdded(event: AchievementAddedEvent): void {
  let achievement = new Achievement(event.params.achievementId.toString())
  achievement.name = event.params.name
  achievement.tier = event.params.tier
  achievement.save()
}

export function handleAchievementUnlocked(event: AchievementUnlockedEvent): void {
  let player = Player.load(event.params.player.toHexString())
  if (player == null) {
    player = new Player(event.params.player.toHexString())
    player.tokenBalance = BigInt.fromI32(0)
    player.totalStaked = 0
    player.save()
  }

  let achievement = Achievement.load(event.params.achievementId.toString())
  if (achievement) {
    let playerAchievement = new PlayerAchievement(
      event.params.player.toHexString() + "-" + event.params.achievementId.toString()
    )
    playerAchievement.player = player.id
    playerAchievement.achievement = achievement.id
    playerAchievement.unlockedAt = event.block.timestamp
    playerAchievement.xpReward = event.params.xpReward
    playerAchievement.tokenReward = event.params.tokenReward
    playerAchievement.save()
  }
}
