import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_, OneToMany as OneToMany_} from "typeorm"
import * as marshal from "./marshal"
import {Account} from "./account.model"
import {NFT} from "./nft.model"
import {CollectionStatus} from "./_collectionStatus"
import {Call} from "./call.model"

@Entity_()
export class Collection {
  constructor(props?: Partial<Collection>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  max!: bigint

  @Index_()
  @ManyToOne_(() => Account, {nullable: false})
  issuer!: Account

  @Column_("text", {nullable: false})
  symbol!: string

  @Column_("text", {nullable: true})
  metadata!: string | undefined | null

  @Column_("text", {nullable: true})
  properties!: string | undefined | null

  @OneToMany_(() => NFT, e => e.collection)
  nfts!: NFT[]

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  nftAmount!: bigint

  @Column_("varchar", {length: 9, nullable: false})
  status!: CollectionStatus

  @OneToMany_(() => Call, e => e.collection)
  logs!: Call[]
}
