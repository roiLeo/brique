import {
    CollectionEntity,
    Emote,
    NFTEntity,
    Event,
} from '../model/generated'

import { RemarkResult } from './utils'
import {
    attributeFrom,
    Collection,
    eventFrom,
    getNftId,
    TokenMetadata,
    NFT,
    Optional,
    RmrkEvent,
    RmrkInteraction,
    collectionEventFrom,
} from './utils/types'
import NFTUtils from './utils/NftUtils'
import {
    canOrElseError,
    exists,
    hasMeta,
    isBurned,
    isBuyLegalOrElseError,
    isOwnerOrElseError,
    isPositiveOrElseError,
    isTransferable,
    validateInteraction,
} from './utils/consolidator'
import { emoteId, ensure, ensureInteraction, isEmpty, eventId } from './utils/helper'
import { Context } from './utils/types'
import logger, { logError } from './utils/logger'
import { create, get } from './utils/entity'
import { fetchMetadata } from './utils/metadata'
import { Store } from '@subsquid/substrate-processor'

export async function mint(remark: RemarkResult, { store }: Context): Promise<void> {
    let collection: Optional<Collection> = null
    try {
        collection = NFTUtils.unwrap(remark.value) as Collection
        canOrElseError<string>(exists, collection.id, true)
        const entity = await get<CollectionEntity>(
            store,
            CollectionEntity,
            collection.id
        )
        canOrElseError<CollectionEntity>(exists, entity as CollectionEntity)

        const final = create<CollectionEntity>(CollectionEntity, collection.id, {})

        final.name = collection.name.trim()
        final.max = Number(collection.max) || 0
        final.issuer = remark.caller
        final.currentOwner = remark.caller
        final.symbol = collection.symbol.trim()
        final.blockNumber = BigInt(remark.blockNumber)
        final.metadata = collection.metadata
        final.createdAt = remark.timestamp
        // final.events = []
        final.events = [collectionEventFrom(RmrkEvent.MINT, remark, '')]

        // logger.watch(`[MINT] ${final.events[0]}`)

        const metadata = await handleMetadata(final.metadata, final.name, store)
        final.meta = metadata

        logger.success(`[COLLECTION] ${final.id}`)
        await store.save(final)
    } catch (e) {
        logError(e, (e) =>
            logger.error(`[COLLECTION] ${e.message}, ${JSON.stringify(collection)}`)
        )

        // await logFail(JSON.stringify(collection), e.message, RmrkEvent.MINT)
    }
}

export async function mintNFT(
    remark: RemarkResult,
    { store }: Context
): Promise<void> {
    let nft: Optional<NFT> = null
    try {
        nft = NFTUtils.unwrap(remark.value) as NFT
        canOrElseError<string>(exists, nft.collection, true)
        const collection = ensure<CollectionEntity>(
            await get<CollectionEntity>(store, CollectionEntity, nft.collection)
        )
        canOrElseError<CollectionEntity>(exists, collection, true)
        isOwnerOrElseError(collection, remark.caller)
        const final = create<NFTEntity>(NFTEntity, collection.id, {})

        final.id = getNftId(nft, remark.blockNumber)
        final.issuer = remark.caller
        final.currentOwner = remark.caller
        final.blockNumber = BigInt(remark.blockNumber)
        final.name = nft.name
        final.instance = nft.instance
        final.transferable = nft.transferable
        final.collection = collection
        final.sn = nft.sn
        final.metadata = nft.metadata
        final.price = BigInt(0)
        final.burned = false
        final.createdAt = remark.timestamp
        final.updatedAt = remark.timestamp
        // final.events = [eventFrom(RmrkEvent.MINTNFT, remark, '')]

        const metadata = await handleMetadata(final.metadata, final.name, store)
        final.meta = metadata

        logger.success(`[MINT] ${final.id}`)
        await store.save(final)
        await createEvent(final, RmrkEvent.MINTNFT, remark, '', store)

    } catch (e) {
        logError(e, (e) =>
            logger.error(`[MINT] ${e.message}, ${JSON.stringify(nft)}`)
        )
        // await logFail(JSON.stringify(nft), e.message, RmrkEvent.MINTNFT)
    }
}

export async function send(remark: RemarkResult, { store }: Context) {
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

        nft.currentOwner = interaction.metadata
        nft.price = BigInt(0)
        nft.updatedAt = remark.timestamp

        logger.success(`[SEND] ${nft.id} to ${interaction.metadata}`)
        await store.save(nft)
        await createEvent(nft, RmrkEvent.SEND, remark, interaction.metadata || '', store)
    } catch (e) {
        logError(e, (e) =>
            logger.error(`[SEND] ${e.message} ${JSON.stringify(interaction)}`)
        )
        // await logFail(JSON.stringify(interaction), e.message, RmrkEvent.SEND)
    }
}

export async function buy(remark: RemarkResult, { store }: Context) {
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
        await createEvent(nft, RmrkEvent.BUY, remark, String(originalPrice), store)
    } catch (e) {
        logError(e, (e) =>
            logger.error(`[BUY] ${e.message} ${JSON.stringify(interaction)}`)
        )
    }
}

export async function consume(remark: RemarkResult, { store }: Context) {
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
        await createEvent(nft, RmrkEvent.CONSUME, remark, '', store)
    } catch (e) {
        logError(e, (e) =>
            logger.warn(`[CONSUME] ${e.message} ${JSON.stringify(interaction)}`)
        )

        // await logFail(JSON.stringify(interaction), e.message, RmrkEvent.CONSUME)
    }
}

export async function list(remark: RemarkResult, { store }: Context) {
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
        await createEvent(nft, RmrkEvent.LIST, remark, String(price), store)
    } catch (e) {
        logError(e, (e) =>
            logger.warn(`[LIST] ${e.message} ${JSON.stringify(interaction)}`)
        )

        // await logFail(JSON.stringify(interaction), e.message, RmrkEvent.LIST)
    }
}

export async function changeIssuer(remark: RemarkResult, { store }: Context) {
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
                RmrkEvent.CHANGEISSUER,
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
        // await logFail(JSON.stringify(interaction), e.message, RmrkEvent.CHANGEISSUER)
    }
}

export async function emote(remark: RemarkResult, { store }: Context) {
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
        // await logFail(JSON.stringify(interaction), e.message, RmrkEvent.EMOTE)
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


async function createEvent(final: NFTEntity, interaction: RmrkEvent, remark: RemarkResult, meta: string, store: Store) {
    try {
        const newEventId = eventId(final.id, interaction)
        const event = create<Event>(Event, newEventId, eventFrom(interaction, remark, meta))
        event.nft = final
        await store.save(event)
    } catch (e) {
        logError(e, (e) => logger.warn(`[[${interaction}]]: ${final.id} Reason: ${e.message}`))
    }

}
