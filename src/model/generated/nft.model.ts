import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_, OneToMany as OneToMany_} from "typeorm"
import * as marshal from "./marshal"
import {Collection} from "./collection.model"
import {NFT} from "./nft.model"
import {Account} from "./account.model"
import {NFTStatus} from "./_nftStatus"
import {Call} from "./call.model"

@Entity_()
export class NFT {
  constructor(props?: Partial<NFT>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Index_()
  @ManyToOne_(() => Collection, {nullable: false})
  collection!: Collection

  @Column_("text", {nullable: false})
  symbol!: string

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  transferable!: bigint

  @Column_("text", {nullable: false})
  sn!: string

  @Column_("text", {nullable: false})
  metadata!: string

  @Column_("text", {nullable: false})
  properties!: string

  @Column_("text", {nullable: false})
  owner!: string

  @Index_()
  @ManyToOne_(() => NFT, {nullable: true})
  parent!: NFT | undefined | null

  @Index_()
  @ManyToOne_(() => Account, {nullable: false})
  rootowner!: Account

  @OneToMany_(() => NFT, e => e.parent)
  children!: NFT[]

  @Column_("text", {nullable: false})
  equipped!: string

  @Column_("bool", {nullable: false})
  pending!: boolean

  @Column_("text", {array: true, nullable: true})
  priority!: (string | undefined | null)[] | undefined | null

  @Column_("varchar", {length: 6, nullable: false})
  status!: NFTStatus

  @OneToMany_(() => Call, e => e.nft)
  logs!: Call[]
}
