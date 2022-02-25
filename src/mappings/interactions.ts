import {
    Collection,
    CollectionStatus,
    Call,
    Interaction,
    NFT,
    Account,
    NFTStatus
} from '../model/generated'

import { RemarkResult } from './utils'
import {
    CallFrom,
    Optional,
    getNftId,
    isNFTID,
} from './utils/types'
import NFTUtils from './utils/NftUtils'
import {
    canOrElseError,
    exists,
    hasMeta,
    isBurned,
    isOwner,
    isIssuerOrElseError,
    isPositiveOrElseError,
    isTransferable,
    validateNFT,
    isOwnerOrElseError,
} from './utils/consolidator'
import { emoteId, ensure, ensureInteraction, isEmpty, eventId } from './utils/helper'
import {ExtrinsicHandlerContext } from '@subsquid/substrate-processor'
import logger, { logError } from './utils/logger'
import { create, get, getOrCreate} from './utils/entity'
import { fetchMetadata } from './utils/metadata'
import { Store } from '@subsquid/substrate-processor'

export async function createCollection(params: Array<string>, ctx: ExtrinsicHandlerContext, rmrkString: string): Promise<void> {
    const store = ctx.store
    let collection: Optional<Collection> = null
    let call = CallFrom(Interaction.CREATE,rmrkString, ctx)
    try {
        collection =  JSON.parse(params[3]) as Collection
        
        canOrElseError<string>(exists, collection.id, true)
       
        const final = create<Collection>(Collection, collection.id, collection)
        const issuerAccount = await getOrCreate(store, Account, ctx.extrinsic.signer, {})
        final.issuer = issuerAccount
        final.status = CollectionStatus.ACTIVE
        final.nftAmount = 0n
        logger.success(`[COLLECTION] ${final.id}`)
        await store.save(final)
        call.collection = final
        call.success = true
    } catch (e) {
        logError(e, (e) => {
            logger.error(`[COLLECTION] ${e.message}, ${JSON.stringify(collection)}`)
            call.success = false
            call.error = e.message
        }
        )
    }
    await store.save(call)
}

export async function mintNFT(
    params: Array<string>,
    ctx : ExtrinsicHandlerContext,
    rmrkString: string
): Promise<void> {
    const store = ctx.store
    let call = CallFrom(Interaction.MINT,rmrkString, ctx)
    try {
        const nftRaw = JSON.parse(params[3])
        canOrElseError<string>(exists, nftRaw.collection, true)
        const collection = ensure<Collection>(
            await get<Collection>(store, Collection, nftRaw.collection)
        )
        canOrElseError<Collection>(exists, collection, true)
        isIssuerOrElseError(collection, ctx.extrinsic.signer)
        canOrElseError<Collection>( (coll) => (coll.nftAmount + 1n <= coll.max), collection, true )

        const nftId = getNftId(nftRaw,ctx.block.height)
        
        const final = create<NFT>(NFT, nftId, {})

        const reciepent = params[4]
        
        let ownerAcc: Optional<Account> = null
        if (exists(reciepent)){
            if (isNFTID(reciepent)) {
                const parentEntitity = await get(store,NFT,reciepent)
                canOrElseError(exists,parentEntitity, true)
                final.parent = parentEntitity
            }
            else  {
                ownerAcc = await getOrCreate(store,Account,reciepent,{})
            }
            final.owner = reciepent
        }
        else {
            ownerAcc = await getOrCreate(store,Account,ctx.extrinsic.signer,{})
            final.owner = ownerAcc.id
        }
        
        final.rootowner = ownerAcc as Account
        final.symbol = nftRaw.symbol
        final.transferable = nftRaw.transferable
        final.sn = nftRaw.sn
        final.metadata = nftRaw.metadata
        final.collection = collection
        final.status = NFTStatus.FIXED
        final.pending = false
        final.equipped = ""
        collection.nftAmount += 1n
        
        await store.save(ownerAcc)
        await store.save(final)
        await store.save(collection)

        
        logger.success(`[MINT] ${final.id}`)
        call.success = true
        call.nft  = final
    } catch (e) {
        logError(e, (e) => {
            logger.error(`[MINT] ${e.message}, ${rmrkString}`)
            call.success = false
            call.error = e.message
        }
        )
    }
    await store.save(call)
}

export async function send(params: Array<string>, ctx: ExtrinsicHandlerContext, rmrkString: string): Promise<void>  {
    const {store,extrinsic} = ctx
    let call = CallFrom(Interaction.SEND,rmrkString, ctx)
    try {
        
        const nftID = params[3]
        const reciepent = params[4]

        const nft = ensure<NFT>(
            await get<NFT>(store, NFT, nftID)
        )
        validateNFT(nft)
        isOwnerOrElseError(nft, extrinsic.signer)

        if  (isNFTID(reciepent)) {
            const parentNFT = ensure<NFT>(
                await get<NFT>(store, NFT, nftID)
            )
            canOrElseError(exists,parentNFT,true)
            nft.parent = parentNFT
            if (nft.rootowner === parentNFT.rootowner) 
                nft.pending = false
            else 
                nft.pending = true
        }
        else
            nft.rootowner = await getOrCreate(store, Account, reciepent, {})
        
        nft.status = NFTStatus.FIXED
        
        
        logger.success(`[SEND] ${nft.id} to ${reciepent}`)
        await store.save(nft)
        call.success = true
        call.nft = nft
    } catch (e) {
        logError(e, (e) => {
            logger.error(`[SEND] ${e.message} ${rmrkString}`)
            call.error = e.message
            call.success = false
        }
        )
        // await logFail(JSON.stringify(interaction), e.message, Interaction.SEND)
    }
    await store.save(call)
}

export async function buy(remark: RemarkResult, { store }: ExtrinsicHandlerContext) {
    let interaction: Optional<RmrkInteraction> = null

    try {
        interaction = ensureInteraction(
            NFTUtils.unwrap(remark.value) as RmrkInteraction
        )
        const nft = ensure<NFTEntity>(
            await get<NFTEntity>(store, NFTEntity, interaction.id)
        )
        canOrElseError<NFTEntity>(exists, nft, true)
        canOrElseError<NFTEntity>(isBurned, nft)
        canOrElseError<NFTEntity>(isTransferable, nft, true)
        isPositiveOrElseError(nft.price, true)
        isBuyLegalOrElseError(nft, remark.extra || [])
        const originalPrice = nft.price
        nft.currentOwner = remark.caller
        nft.price = BigInt(0)
        nft.updatedAt = remark.timestamp

        logger.success(`[BUY] ${nft.id} from ${remark.caller}`)
        await store.save(nft)
        await createEvent(nft, Interaction.BUY, remark, String(originalPrice), store)
    } catch (e) {
        logError(e, (e) =>
            logger.error(`[BUY] ${e.message} ${JSON.stringify(interaction)}`)
        )
    }
}

export async function consume(remark: RemarkResult, { store }: ExtrinsicHandlerContext) {
    let interaction: Optional<RmrkInteraction> = null

    try {
        interaction = ensureInteraction(
            NFTUtils.unwrap(remark.value) as RmrkInteraction
        )
        const nft = ensure<NFTEntity>(
            await get<NFTEntity>(store, NFTEntity, interaction.id)
        )
        canOrElseError<NFTEntity>(exists, nft, true)
        canOrElseError<NFTEntity>(isBurned, nft)
        isOwnerOrElseError(nft, remark.caller)
        nft.price = BigInt(0)
        nft.burned = true
        nft.updatedAt = remark.timestamp

        logger.success(`[CONSUME] ${nft.id} from ${remark.caller}`)
        await store.save(nft)
        await createEvent(nft, Interaction.CONSUME, remark, '', store)
    } catch (e) {
        logError(e, (e) =>
            logger.warn(`[CONSUME] ${e.message} ${JSON.stringify(interaction)}`)
        )

        // await logFail(JSON.stringify(interaction), e.message, Interaction.CONSUME)
    }
}

export async function list(remark: RemarkResult, { store }: ExtrinsicHandlerContext) {
    let interaction: Optional<RmrkInteraction> = null

    try {
        interaction = ensureInteraction(
            NFTUtils.unwrap(remark.value) as RmrkInteraction
        )
        const nft = ensure<NFTEntity>(
            await get<NFTEntity>(store, NFTEntity, interaction.id)
        )
        validateInteraction(nft, interaction)
        isOwnerOrElseError(nft, remark.caller)
        const price = BigInt(interaction.metadata || '0')
        isPositiveOrElseError(price)
        nft.price = price
        nft.updatedAt = remark.timestamp

        logger.success(`[LIST] ${nft.id} from ${remark.caller}`)
        await store.save(nft)
        await createEvent(nft, Interaction.LIST, remark, String(price), store)
    } catch (e) {
        logError(e, (e) =>
            logger.warn(`[LIST] ${e.message} ${JSON.stringify(interaction)}`)
        )

        // await logFail(JSON.stringify(interaction), e.message, Interaction.LIST)
    }
}

export async function changeIssuer(remark: RemarkResult, { store }: ExtrinsicHandlerContext) {
    let interaction: Optional<RmrkInteraction> = null

    try {
        interaction = ensureInteraction(
            NFTUtils.unwrap(remark.value) as RmrkInteraction
        )
        canOrElseError<RmrkInteraction>(hasMeta, interaction, true)
        const collection = ensure<CollectionEntity>(
            await get<CollectionEntity>(store, CollectionEntity, interaction.id)
        )
        canOrElseError<CollectionEntity>(exists, collection, true)
        isOwnerOrElseError(collection, remark.caller)
        collection.currentOwner = interaction.metadata
        collection.events?.push(
            collectionEventFrom(
                Interaction.CHANGEISSUER,
                remark,
                ensure<string>(interaction.metadata)
            )
        )

        logger.success(`[CHANGEISSUER] ${collection.id} from ${remark.caller}`)
        await store.save(collection)
    } catch (e) {
        logError(e, (e) =>
            logger.warn(`[CHANGEISSUER] ${e.message} ${JSON.stringify(interaction)}`)
        )
        // await logFail(JSON.stringify(interaction), e.message, Interaction.CHANGEISSUER)
    }
}

export async function emote(remark: RemarkResult, { store }: ExtrinsicHandlerContext) {
    let interaction: Optional<RmrkInteraction> = null

    try {
        interaction = ensureInteraction(
            NFTUtils.unwrap(remark.value) as RmrkInteraction
        )
        canOrElseError<RmrkInteraction>(hasMeta, interaction, true)
        const nft = ensure<NFTEntity>(
            await get<NFTEntity>(store, NFTEntity, interaction.id)
        )
        canOrElseError<NFTEntity>(exists, nft, true)
        canOrElseError<NFTEntity>(isBurned, nft)
        const id = emoteId(interaction, remark.caller)
        let emote = await get<Emote>(store, Emote, interaction.id)

        if (emote) {
            await store.remove(emote)
            return
        }

        emote = create<Emote>(Emote, id, {
            id,
            caller: remark.caller,
            value: interaction.metadata,
        })

        emote.nft = nft

        logger.success(`[EMOTE] ${nft.id} from ${remark.caller}`)
        await store.save(emote)
    } catch (e) {
        logError(e, (e) => logger.warn(`[EMOTE] ${e.message}`))
        // await logFail(JSON.stringify(interaction), e.message, Interaction.EMOTE)
    }

    // exists
    // not burned
    // transferable
    // has meta
}

export async function handleMetadata(
    id: string,
    name: string,
    store: Store
): Promise<Optional<Metadata>> {
    const meta = await get<Metadata>(store, Metadata, id)
    if (meta) {
        return meta
    }

    const metadata = await fetchMetadata<TokenMetadata>({ metadata: id })
    if (isEmpty(metadata)) {
        return null
    }

    const partial: Partial<Metadata> = {
        id,
        description: metadata.description || '',
        image: metadata.image,
        animationUrl: metadata.animation_url,
        attributes: metadata.attributes?.map(attributeFrom) || [],
        name: metadata.name || name,
    }

    const final = create<Metadata>(Metadata, id, partial)
    await store.save(final)
    return final
}


async function createEvent(final: NFTEntity, interaction: Interaction, remark: RemarkResult, meta: string, store: Store) {
    try {
        const newEventId = eventId(final.id, interaction)
        const event = create<Event>(Event, newEventId, eventFrom(interaction, remark, meta))
        event.nft = final
        await store.save(event)
    } catch (e) {
        logError(e, (e) => logger.warn(`[[${interaction}]]: ${final.id} Reason: ${e.message}`))
    }

}
