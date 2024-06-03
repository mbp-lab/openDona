package models.domain

import java.util.UUID

import play.api.libs.json.Format
import slick.lifted.MappedTo

import scala.util.Random

case class Donation(
  id: DonationId,
  externalDonorId: ExternalDonorId,
  donorId: Option[DonorId],
  status: DonationStatus,
)

object DonationDataSourceType extends Enumeration(1) {
  type DonationDataSourceType = Value
  val Facebook, WhatsApp, Instagram, Multiple = Value

  implicit val jsonFormat: Format[DonationDataSourceType] = EnumFormat.format(DonationDataSourceType)
}

sealed trait DonationStatus {
  def toSqlString: String = this.toString.toLowerCase
}

object DonationStatus {
  case object NotStarted extends DonationStatus
  case object Pending extends DonationStatus
  case object Complete extends DonationStatus
  case object Deleted extends DonationStatus

  def apply(string: String): DonationStatus =
    unapply(string).getOrElse(throw new IllegalArgumentException(s"$string is not a valid donation status."))

  def unapply(string: String): Option[DonationStatus] = string.toLowerCase match {
    case "notstarted" => Some(NotStarted)
    case "pending"    => Some(Pending)
    case "complete"   => Some(Complete)
    case "deleted"    => Some(Deleted)
    case _            => None
  }
}

case class DonorId(value: UUID) extends MappedTo[UUID] {
  def asParticipant = ParticipantId(value)
}
object DonorId extends IdSupport[DonorId]

case class DonationId(value: UUID) extends MappedTo[UUID]
object DonationId extends IdSupport[DonationId]

case class ExternalDonorId(id: String) {
  override def toString: String = id
}

object ExternalDonorId {
  def generate(random: Random) = ExternalDonorId(random.alphanumeric.take(6).mkString("").toLowerCase)
}
