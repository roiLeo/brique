import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import {Base} from "./base.model"

@Entity_()
export class BaseTheme {
  constructor(props?: Partial<BaseTheme>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Column_("text", {nullable: false})
  name!: string

  @Column_("text", {nullable: false})
  theme!: string

  @Index_()
  @ManyToOne_(() => Base, {nullable: false})
  base!: Base
}
