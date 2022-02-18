import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_, OneToMany as OneToMany_} from "typeorm"
import {BaseType} from "./_baseType"
import {Account} from "./account.model"
import {BasePart} from "./basePart.model"
import {BaseTheme} from "./baseTheme.model"
import {Resource} from "./resource.model"
import {Call} from "./call.model"

@Entity_()
export class Base {
  constructor(props?: Partial<Base>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Column_("varchar", {length: 5, nullable: false})
  type!: BaseType

  @Column_("text", {nullable: false})
  symbol!: string

  @Index_()
  @ManyToOne_(() => Account, {nullable: false})
  issuer!: Account

  @OneToMany_(() => BasePart, e => e.base)
  parts!: BasePart[]

  @OneToMany_(() => BaseTheme, e => e.base)
  themes!: BaseTheme[]

  @OneToMany_(() => Resource, e => e.base)
  attachedToResources!: Resource[]

  @OneToMany_(() => Call, e => e.base)
  logs!: Call[]
}
