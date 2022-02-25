import { Call, Interaction} from '../../model/generated'
import { ExtrinsicHandlerContext } from '@subsquid/substrate-processor'


export const getNftId = (nft: any, blocknumber: string | number): string => {
  return `${blocknumber}-${nft.collection}-${nft.symbol}-${nft.sn}`
}



export const isNFTID = (reciepent: string):boolean => {
  const re = /^\d+-\S+-\S+-\S+-\d+$/gm
  return re.test(reciepent)
}

export function CallFrom(interaction: Interaction, value: string, ctx: ExtrinsicHandlerContext): Call {
  const blockHash = ctx.block.hash
  const timestamp = new Date(ctx.block.timestamp)
  const caller = ctx.extrinsic.signer
  const blockNumber = String(ctx.block.height)
  const extrinsicId = ctx.extrinsic.id
  
  return new Call({
    interaction,
    value,
    caller,
    blockNumber,
    blockHash,
    extrinsicId,
    timestamp,
  })
}

export type Optional<T> = T | null


export interface RmrkInteraction {
  id: string;
  metadata?: string;
}

export type EntityConstructor<T> = {
  new (...args: any[]): T;
};

export type BatchArg = {
  args: Record<string, any>,
  callIndex: string,  
}

export type SomethingWithMeta = {
  metadata: string
}

export type SanitizerFunc = (url: string) => string

