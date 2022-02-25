import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_, OneToMany as OneToMany_} from "typeorm"
import {Base} from "./base.model"
import {ResourcePart} from "./resourcePart.model"
import {BaseTheme} from "./baseTheme.model"
import {NFT} from "./nft.model"

@Entity_()
export class Resource {
  constructor(props?: Partial<Resource>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Column_("text", {nullable: true})
  src!: string | undefined | null

  @Column_("text", {nullable: true})
  metadata!: string | undefined | null

  @Column_("text", {nullable: true})
  license!: string | undefined | null

  @Column_("text", {nullable: true})
  thumb!: string | undefined | null

  @Index_()
  @ManyToOne_(() => Base, {nullable: true})
  base!: Base | undefined | null

  @OneToMany_(() => ResourcePart, e => e.resource)
  parts!: ResourcePart[]

  @Index_()
  @ManyToOne_(() => BaseTheme, {nullable: true})
  theme!: BaseTheme | undefined | null

  @Column_("text", {nullable: false})
  slot!: string

  @Index_()
  @ManyToOne_(() => NFT, {nullable: false})
  nft!: NFT
}
