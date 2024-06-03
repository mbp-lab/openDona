package persistence

import models.domain.ConversationParticipant

import scala.concurrent.Future

trait ConversationParticipantRepository {
  def insertBatch(participants: List[ConversationParticipant]): Future[Unit]
}
