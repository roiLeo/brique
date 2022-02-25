import { BatchArg, RmrkInteraction } from './types'
import { Collection, NFT, Base, NFTStatus, Account } from '../../model/generated'
// import { decodeAddress } from '@polkadot/util-crypto'
type Entity = Collection | Base

export function exists<T>(entity: T | undefined): boolean {
  return !!entity
}

export function isBurned(nft: NFT) {
  return nft.status === NFTStatus.BURNED
}

export function isTransferable(nft: NFT) {
  return !!nft.transferable
}

export function hasMeta(nft: RmrkInteraction): nft is RmrkInteraction  {
  return !!nft.metadata
}

export function isOwner(entity: NFT, caller: string) {
  return entity.rootowner.id === caller
}

export function isIssuer(entity: Entity, caller: string) {
  return entity.issuer.id === caller
}


export function isIssuerOrElseError(entity: Entity, caller: string) {
  if (!isIssuer(entity, caller)) {
    throw new ReferenceError(`[CONSOLIDATE Bad Issuer] Entity: ${entity.issuer} Caller: ${caller}`)
  }
}

export function isOwnerOrElseError(nft: NFT, caller: string) {
  if (!isOwner(nft, caller)) {
    throw new ReferenceError(`[CONSOLIDATE Bad Owner] NFT: ${nft.rootowner} Caller: ${caller}`)
  }
}

export function canOrElseError<T>(callback: (arg: T) => boolean, entity: T, negation?: boolean) {
  if (negation ? !callback(entity) : callback(entity)) {
    throw new ReferenceError(`[CONSOLIDATE canOrElseError] Callback${negation ? ' not' : ''} ${callback.name}`)
  }
}

export function validateNFT(nft: NFT) {
  try {
    canOrElseError<NFT>(exists, nft, true)
    canOrElseError<NFT>(isBurned, nft)
    canOrElseError<NFT>(isTransferable, nft, true)
  } catch (e) {
    throw e
  }
}

export function isPositiveOrElseError(entity: bigint | number, excludeZero?: boolean): void {
  if (entity < Number(excludeZero)) {
    throw new ReferenceError(`[CONSOLIDATE isPositiveOrElseError] Entity: ${entity}`)
  }
}
