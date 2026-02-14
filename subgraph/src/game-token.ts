import { Transfer as TransferEvent } from "../generated/GameToken/GameToken"
import { Player, TokenTransfer } from "../generated/schema"
import { BigInt } from "@graphprotocol/graph-ts"

export function handleTransfer(event: TransferEvent): void {
  let fromPlayer = Player.load(event.params.from.toHexString())
  if (fromPlayer) {
    fromPlayer.tokenBalance = fromPlayer.tokenBalance.minus(event.params.value)
    fromPlayer.save()
  }

  let toPlayer = Player.load(event.params.to.toHexString())
  if (toPlayer == null) {
    toPlayer = new Player(event.params.to.toHexString())
    toPlayer.tokenBalance = BigInt.fromI32(0)
    toPlayer.totalStaked = 0
  }
  toPlayer.tokenBalance = toPlayer.tokenBalance.plus(event.params.value)
  toPlayer.save()

  let transfer = new TokenTransfer(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  )
  transfer.from = event.params.from
  transfer.to = event.params.to
  transfer.amount = event.params.value
  transfer.blockNumber = event.block.number
  transfer.timestamp = event.block.timestamp
  transfer.save()
}
