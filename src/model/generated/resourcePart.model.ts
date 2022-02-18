import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import {Resource} from "./resource.model"
import {BasePart} from "./basePart.model"

@Entity_()
export class ResourcePart {
  constructor(props?: Partial<ResourcePart>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Index_()
  @ManyToOne_(() => Resource, {nullable: false})
  resource!: Resource

  @Index_()
  @ManyToOne_(() => BasePart, {nullable: false})
  part!: BasePart
}
