import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import {Interaction} from "./_interaction"
import {Base} from "./base.model"
import {NFT} from "./nft.model"
import {Collection} from "./collection.model"

@Entity_()
export class Call {
  constructor(props?: Partial<Call>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Column_("varchar", {length: 12, nullable: true})
  interaction!: Interaction | undefined | null

  @Column_("text", {nullable: false})
  value!: string

  @Column_("text", {nullable: false})
  caller!: string

  @Index_()
  @ManyToOne_(() => Base, {nullable: true})
  base!: Base | undefined | null

  @Index_()
  @ManyToOne_(() => NFT, {nullable: true})
  nft!: NFT | undefined | null

  @Index_()
  @ManyToOne_(() => Collection, {nullable: true})
  collection!: Collection | undefined | null

  @Column_("bool", {nullable: false})
  success!: boolean

  @Column_("text", {nullable: true})
  error!: string | undefined | null

  @Column_("text", {nullable: false})
  extrinsicId!: string

  @Column_("text", {nullable: false})
  blockNumber!: string

  @Column_("text", {nullable: false})
  blockHash!: string

  @Column_("timestamp with time zone", {nullable: false})
  createdAt!: Date
}
