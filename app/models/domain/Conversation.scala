package models.domain

import java.time.Instant
import java.util.UUID

import models.domain.DonationDataSourceType.DonationDataSourceType
import slick.lifted.MappedTo

case class Conversation(
  id: ConversationId,
  donationId: DonationId,
  isGroupConversation: Boolean,
  donationDataSourceType: DonationDataSourceType
)

case class ConversationId(value: UUID) extends MappedTo[UUID]
object ConversationId extends IdSupport[ConversationId]

case class ParticipantId(value: UUID) extends MappedTo[UUID]
object ParticipantId extends IdSupport[ParticipantId]

case class Message(
  id: MessageId,
  conversationId: ConversationId,
  wordCount: Int,
  sender: Option[ParticipantId],
  timestamp: Instant
)

case class MessageAudio(
                    id: MessageId,
                    conversationId: ConversationId,
                    lengthSeconds: Int,
                    sender: Option[ParticipantId],
                    timestamp: Instant
)

case class MessageId(value: UUID) extends MappedTo[UUID]
object MessageId extends IdSupport[MessageId]
