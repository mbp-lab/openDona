package persistence

import com.google.inject.Inject
import models.domain._
import play.api.db.slick.{DatabaseConfigProvider, HasDatabaseConfigProvider}
import slick.ast.BaseTypedType
import slick.jdbc.JdbcProfile

import scala.concurrent.{ExecutionContext, Future}

class SlickDonationRepository @Inject()(protected val dbConfigProvider: DatabaseConfigProvider)(
  implicit ec: ExecutionContext
) extends HasDatabaseConfigProvider[JdbcProfile with DonationStatusSupport]
    with DonationRepository {
  import profile.api._
  import profile.statusTypeMapper

  private val Donations = TableQuery[DonationTable]

  override def insert(donation: Donation): Future[Either[DuplicateDonorIdFailure, Unit]] = {
    for {
      existing <- getByDonor(donation.externalDonorId)
      result <- if (existing.isDefined) Future.successful(Left(DuplicateDonorIdFailure(donation.externalDonorId)))
      else db.run(Donations += donation).map(_ => Right(()))
    } yield result
  }

  override def update(donation: Donation): Future[Unit] = {
    db.run(Donations.filter(_.externalDonorId === donation.externalDonorId).update(donation)).map {
      case 0 => throw new IllegalArgumentException(s"No donation with ID ${donation.externalDonorId} exists.")
      case _ => ()
    }
  }

  override def getByDonor(donorId: ExternalDonorId): Future[Option[Donation]] = {
    db.run(Donations.filter(_.externalDonorId === donorId).result.headOption)
  }

  protected implicit val donorIdMapper: BaseTypedType[ExternalDonorId] =
    MappedColumnType.base[ExternalDonorId, String](_.toString, ExternalDonorId.apply)

  private class DonationTable(tag: Tag) extends Table[Donation](tag, "donations") {
    def id = column[DonationId]("id", O.PrimaryKey)
    def externalDonorId = column[ExternalDonorId]("external_donor_id")
    def donorId = column[Option[DonorId]]("donor_id")
    def status = column[DonationStatus]("status")

    override def * =
      (id, externalDonorId, donorId, status) <> ((Donation.apply _).tupled, Donation.unapply)
  }

}
