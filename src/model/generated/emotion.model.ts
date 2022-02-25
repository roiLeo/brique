import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import {Account} from "./account.model"
import {NFT} from "./nft.model"

@Entity_()
export class Emotion {
  constructor(props?: Partial<Emotion>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Index_()
  @ManyToOne_(() => Account, {nullable: false})
  sender!: Account

  @Column_("text", {nullable: false})
  emoji!: string

  @Index_()
  @ManyToOne_(() => NFT, {nullable: false})
  nft!: NFT

  @Column_("integer", {nullable: false})
  count!: number
}
