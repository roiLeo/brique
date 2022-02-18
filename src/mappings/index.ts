
import { extractRemark, Records } from './utils'
import { RmrkEvent } from './utils/types'
import NFTUtils, { hexToString } from './utils/NftUtils'
import { SystemRemarkCall } from '../types/calls'
import { Context } from './utils/types'
import logger from './utils/logger'
import * as InteractionMaps from "./interactions"


export async function handleRemark(context: Context): Promise<void> {
  const remark = new SystemRemarkCall(context).asV1020.remark
  const records = extractRemark(remark.toString(), context)
  await mainFrame(records, context)
}

export async function handleBatch(context: Context): Promise<void> {
  const records = extractRemark(context.extrinsic, context)
  await mainFrame(records, context)
}

export async function handleBatchAll(context: Context): Promise<void> {
  const records = extractRemark(context.extrinsic, context)
  await mainFrame(records, context)
}

async function mainFrame(records: Records, context: Context): Promise<void> {
  for (const remark of records) {
    try {
      const decoded = hexToString(remark.value)
      const event: RmrkEvent = NFTUtils.getAction(decoded)
      logger.pending(`[${remark.blockNumber}] Event ${event} `)

      switch (event) {
        case RmrkEvent.CREATE:
          await InteractionMaps.mint(remark, context)
          break
        case RmrkEvent.MINT:
          await InteractionMaps.mintNFT(remark, context)
          break
        case RmrkEvent.SEND:
          await InteractionMaps.send(remark, context)
          break
        case RmrkEvent.BUY:
          await InteractionMaps.buy(remark, context)
          break
        case RmrkEvent.BURN:
          await InteractionMaps.consume(remark, context)
          break
        case RmrkEvent.LIST:
          await InteractionMaps.list(remark, context)
          break
        case RmrkEvent.CHANGEISSUER:
          await InteractionMaps.changeIssuer(remark, context)
          break
        case RmrkEvent.EMOTE:
          await InteractionMaps.emote(remark, context)
          break
        default:
          logger.error(
            `[SKIP] ${event}::${remark.value}::${remark.blockNumber}`
          )
      }
    } catch (e) {
      logger.warn(
        `[MALFORMED] ${remark.blockNumber}::${hexToString(remark.value)}`
      )
    }
  }
}

