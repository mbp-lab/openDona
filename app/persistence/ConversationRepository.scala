package persistence

import models.domain.Conversation

import scala.concurrent.Future

trait ConversationRepository {
  def insertBatch(conversations: Seq[Conversation]): Future[Unit]
}
