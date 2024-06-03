package models.domain

import java.util.UUID

import slick.lifted.MappedTo

trait IdSupport[T <: MappedTo[UUID]] {
  def generate: T = apply(UUID.randomUUID())

  def apply(uuid: UUID): T
}
