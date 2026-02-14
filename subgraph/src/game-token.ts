import { BigInt } from "@graphprotocol/graph-ts";
import { Transfer } from "../generated/GameToken/GameToken";
import { TokenTransfer, Player } from "../generated/schema";
import { getOrCreatePlayer } from "./game-character";

export function handleTransfer(event: Transfer): void {
  let transfer = new TokenTransfer(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  
  let fromPlayer = getOrCreatePlayer(event.params.from);
  let toPlayer = getOrCreatePlayer(event.params.to);
  
  transfer.from = fromPlayer.id;
  transfer.to = toPlayer.id;
  transfer.amount = event.params.value;
  transfer.timestamp = event.block.timestamp;
  transfer.transactionHash = event.transaction.hash;
  
  transfer.save();
  
  fromPlayer.lastActiveAt = event.block.timestamp;
  fromPlayer.save();
  
  toPlayer.lastActiveAt = event.block.timestamp;
  toPlayer.save();
}
