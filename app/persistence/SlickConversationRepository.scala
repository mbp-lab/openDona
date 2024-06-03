package persistence

import com.google.inject.Inject
import models.domain.DonationDataSourceType.DonationDataSourceType
import models.domain.{Conversation, ConversationId, DonationDataSourceType, DonationId, ParticipantId}
import play.api.db.slick.{DatabaseConfigProvider, HasDatabaseConfigProvider}
import slick.jdbc.JdbcProfile

import scala.concurrent.{ExecutionContext, Future}

final class SlickConversationRepository @Inject()(protected val dbConfigProvider: DatabaseConfigProvider)(
  implicit ec: ExecutionContext
) extends HasDatabaseConfigProvider[JdbcProfile]
    with ConversationRepository {
  import profile.api._

  private val Conversations = TableQuery[ConversationsTable]

  override def insertBatch(conversations: Seq[Conversation]): Future[Unit] = {
    db.run(Conversations ++= conversations).map(_ => ())
  }

  implicit private val mappedColumnType =
    MappedColumnType.base[DonationDataSourceType, Int](_.id, DonationDataSourceType.apply)

  private class ConversationsTable(tag: Tag) extends Table[Conversation](tag, "conversations") {
    def id = column[ConversationId]("id", O.PrimaryKey)
    def donationId = column[DonationId]("donation_id")
    def isGroupConversation = column[Boolean]("is_group_conversation")
    def dataSourceType = column[DonationDataSourceType]("data_source_id")

    override def * =
      (id, donationId, isGroupConversation, dataSourceType) <> ((Conversation.apply _).tupled, Conversation.unapply)
  }
}
