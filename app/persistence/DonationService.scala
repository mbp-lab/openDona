package persistence

import models.domain.ExternalDonorId

import scala.concurrent.Future

trait DonationService {
  def beginOnlineConsentDonation(donorIdInputValue: String, donorIdMethod: String): Future[Either[String, ExternalDonorId]]
}
