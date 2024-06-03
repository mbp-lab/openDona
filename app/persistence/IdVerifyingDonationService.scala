package persistence

import com.google.inject.Inject
import models.domain._

import scala.concurrent.{ExecutionContext, Future}

final class IdVerifyingDonationService @Inject()(dao: DonationRepository, generateDonorId: () => ExternalDonorId)(
  implicit ec: ExecutionContext
) extends DonationService {

  override def beginOnlineConsentDonation(): Future[ExternalDonorId] = {
    val id = generateDonorId()
    // try to insert, and retry if the ID already exists
    // we don't bother to do any check beforehand, or to avoid the infinite loop if it can't find an unused ID
    // because duplicate IDs should only occur extremely rarely given the expected number of donors.
    dao
      .insert(Donation(DonationId.generate, id, None, DonationStatus.Pending))
      .flatMap {
        case Right(_)                         => Future.successful(id)
        case Left(_: DuplicateDonorIdFailure) => beginOnlineConsentDonation()
      }
  }
}
