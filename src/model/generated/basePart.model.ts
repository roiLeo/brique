import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import {BasePartType} from "./_basePartType"
import {Base} from "./base.model"

@Entity_()
export class BasePart {
  constructor(props?: Partial<BasePart>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Column_("text", {nullable: false})
  fullID!: string

  @Column_("text", {nullable: false})
  innerID!: string

  @Column_("varchar", {length: 5, nullable: false})
  type!: BasePartType

  @Column_("text", {array: true, nullable: false})
  equippable!: (string)[]

  @Column_("text", {nullable: true})
  src!: string | undefined | null

  @Column_("text", {nullable: true})
  thumb!: string | undefined | null

  @Column_("integer", {nullable: false})
  z!: number

  @Index_()
  @ManyToOne_(() => Base, {nullable: false})
  base!: Base

  @Column_("text", {nullable: true})
  metadata!: string | undefined | null
}
