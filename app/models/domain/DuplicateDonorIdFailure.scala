package models.domain

import java.sql.SQLException

case class DuplicateDonorIdFailure(donorId: ExternalDonorId)

object DuplicateDonorIdFailure {
  private val UniqueConstraintViolationPrefix = "23"

  def unapply(exception: Throwable): Boolean = exception match {
    case sqlEx: SQLException if sqlEx.getSQLState.startsWith(UniqueConstraintViolationPrefix) => true
    case _                                                                                    => false
  }
}
