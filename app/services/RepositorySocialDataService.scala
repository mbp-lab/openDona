package services
import com.google.inject.Inject
import models.api.SocialData
import models.domain.{DonationStatus, ExternalDonorId, SocialDataDonation}
import persistence.{ConversationParticipantRepository, ConversationRepository, DonationRepository, DonationService, MessageAudioRepository, MessageRepository}
import scalaz.{EitherT, OptionT}
import scalaz.Scalaz._

import scala.concurrent.{ExecutionContext, Future}

final class RepositorySocialDataService @Inject()(
                                                   donationRepository: DonationRepository,
                                                   conversationRepository: ConversationRepository,
                                                   messageRepository: MessageRepository,
                                                   messageAudioRepository: MessageAudioRepository,
                                                   participantRepository: ConversationParticipantRepository
)(implicit ec: ExecutionContext)
    extends SocialDataService {

  override def saveData(socialData: SocialData): EitherT[Future, String, Unit] = {
    val externalDonorId = ExternalDonorId(socialData.donorId)
    for {
      donation <- OptionT(donationRepository.getByDonor(externalDonorId))
        .toRight(s"No donation for donor ID $externalDonorId present.")
      SocialDataDonation(internalDonorId, conversations, messages, messagesAudio, participants) = SocialDataTransformer(
        donation.id,
        socialData
      )
      newDonation = donation.copy(donorId = Some(internalDonorId), status = DonationStatus.Complete)
      _ <- EitherT.rightT(conversationRepository.insertBatch(conversations))
      _ <- EitherT.rightT(messageRepository.insertBatch(messages))
      _ <- EitherT.rightT(messageAudioRepository.insertBatch(messagesAudio))
      _ <- EitherT.rightT(participantRepository.insertBatch(participants))
      _ <- EitherT.rightT(donationRepository.update(newDonation))
    } yield ()
  }
}
