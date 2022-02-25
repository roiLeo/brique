
import { extractRemark, Records } from './utils'
import { Call, Interaction } from '../model'
import NFTUtils, { hexToString } from './utils/NftUtils'
import { SystemRemarkCall } from '../types/calls'
import { ExtrinsicHandlerContext } from '@subsquid/substrate-processor'
import logger from './utils/logger'
import * as InteractionMaps from "./interactions"


const RMRK_VERSION = "2.0.0"

export async function handleRemark(context: ExtrinsicHandlerContext): Promise<void> {
  const remark = new SystemRemarkCall(context).asV1020.remark
  const records = extractRemark(remark.toString(), context)
  await mainFrame(records, context)
}

export async function handleBatch(context: ExtrinsicHandlerContext): Promise<void> {
  const records = extractRemark(context.extrinsic, context)
  await mainFrame(records, context)
}

export async function handleBatchAll(context: ExtrinsicHandlerContext): Promise<void> {
  const records = extractRemark(context.extrinsic, context)
  await mainFrame(records, context)
}

async function mainFrame(records: Records, context: ExtrinsicHandlerContext): Promise<void> {
  for (const remark of records) {
    try {
      const decoded = hexToString(remark.value)
      const params = NFTUtils.unwrap(decoded)
      const specVersion = params[2]
      if (specVersion != RMRK_VERSION) throw new Error(`Wrong RMRK version ${specVersion}`);
      const event: Interaction = NFTUtils.getAction(params[1])
      logger.pending(`[${remark.blockNumber}] Event ${event} `)
      switch (event) {
        case Interaction.CREATE:
          await InteractionMaps.createCollection(params, context, decoded)
          break
        case Interaction.MINT:
          await InteractionMaps.mintNFT(params, context, decoded)
          break
        case Interaction.SEND:
          await InteractionMaps.send(params, context)
          break
        case Interaction.BUY:
          await InteractionMaps.buy(params, context)
          break
        case Interaction.BURN:
          await InteractionMaps.consume(params, context)
          break
        case Interaction.LIST:
          await InteractionMaps.list(params, context)
          break
        case Interaction.CHANGEISSUER:
          await InteractionMaps.changeIssuer(params, context)
          break
        case Interaction.EMOTE:
          await InteractionMaps.emote(params, context)
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

