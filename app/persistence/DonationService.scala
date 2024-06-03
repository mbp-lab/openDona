package persistence

import models.domain.ExternalDonorId

import scala.concurrent.Future

trait DonationService {
  def beginOnlineConsentDonation(): Future[ExternalDonorId]
}
