package persistence

import com.google.inject.Inject
import models.domain.{ConversationId, ConversationParticipant, ConversationParticipantId, ParticipantId}
import play.api.db.slick.{DatabaseConfigProvider, HasDatabaseConfigProvider}
import slick.jdbc.JdbcProfile

import scala.concurrent.{ExecutionContext, Future}

final class SlickConversationParticipantRepository @Inject()(protected val dbConfigProvider: DatabaseConfigProvider)(
  implicit ec: ExecutionContext
) extends HasDatabaseConfigProvider[JdbcProfile]
    with ConversationParticipantRepository {
  import profile.api._

  private val Participants = TableQuery[ConversationParticipantsTable]

  override def insertBatch(participants: List[ConversationParticipant]): Future[Unit] = {
    db.run(Participants ++= participants).map(_ => ())
  }

  private class ConversationParticipantsTable(tag: Tag)
      extends Table[ConversationParticipant](tag, "conversation_participants") {
    def id = column[ConversationParticipantId]("id", O.PrimaryKey)
    def conversationId = column[ConversationId]("conversation_id")
    def participantId = column[ParticipantId]("participant_id")

    override def * =
      (id, conversationId, participantId) <> ((ConversationParticipant.apply _).tupled, ConversationParticipant.unapply)
  }
}
