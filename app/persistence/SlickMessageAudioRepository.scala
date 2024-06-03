package persistence

import com.google.inject.Inject
import models.domain.{ConversationId, MessageAudio, MessageId, ParticipantId}
import play.api.db.slick.{DatabaseConfigProvider, HasDatabaseConfigProvider}
import slick.jdbc.JdbcProfile

import java.sql.Timestamp
import java.time.Instant
import scala.concurrent.{ExecutionContext, Future}

final class SlickMessageAudioRepository @Inject()(protected val dbConfigProvider: DatabaseConfigProvider)(
  implicit ec: ExecutionContext
) extends HasDatabaseConfigProvider[JdbcProfile]
    with MessageAudioRepository {
  import profile.api._

  private val Messages = TableQuery[MessagesAudioTable]
  override def insertBatch(message: Seq[MessageAudio]): Future[Unit] = {
    db.run(Messages ++= message).map(_ => ())
  }

  implicit val timeConversion = MappedColumnType.base[Instant, Timestamp](
    Timestamp.from,
    _.toInstant
  )

  private class MessagesAudioTable(tag: Tag) extends Table[MessageAudio](tag, "messages_audio") {
    def id = column[MessageId]("id", O.PrimaryKey)
    def conversationId = column[ConversationId]("conversation_id")
    def lengthSeconds = column[Int]("length_seconds")
    def sender = column[Option[ParticipantId]]("sender_id")
    def timestamp = column[Instant]("datetime")

    override def * = (id, conversationId, lengthSeconds, sender, timestamp) <> ((MessageAudio.apply _).tupled, MessageAudio.unapply)
  }
}
