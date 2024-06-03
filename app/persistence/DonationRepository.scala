package persistence

import models.domain.{Donation, DuplicateDonorIdFailure, ExternalDonorId}

import scala.concurrent.Future

trait DonationRepository {
  def insert(donation: Donation): Future[Either[DuplicateDonorIdFailure, Unit]]
  def update(donation: Donation): Future[Unit]
  def getByDonor(donorId: ExternalDonorId): Future[Option[Donation]]
}
