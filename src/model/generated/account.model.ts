import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, OneToMany as OneToMany_} from "typeorm"
import {Base} from "./base.model"
import {Collection} from "./collection.model"
import {NFT} from "./nft.model"
import {Emotion} from "./emotion.model"

@Entity_()
export class Account {
  constructor(props?: Partial<Account>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @OneToMany_(() => Base, e => e.issuer)
  bases!: Base[]

  @OneToMany_(() => Collection, e => e.issuer)
  collections!: Collection[]

  @OneToMany_(() => NFT, e => e.rootowner)
  nfts!: NFT[]

  @OneToMany_(() => Emotion, e => e.sender)
  emoted!: Emotion[]
}
