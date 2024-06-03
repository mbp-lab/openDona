package models.domain

import java.util.UUID

import slick.lifted.MappedTo

// separate ID is necessary because FB data results in a single "placeholder" user representing all deleted accounts
// this means the same "user" can be participating in a group conversation multiple times
case class ConversationParticipant(
  id: ConversationParticipantId,
  conversationId: ConversationId,
  participantId: ParticipantId
)

case class ConversationParticipantId(value: UUID) extends MappedTo[UUID]
object ConversationParticipantId extends IdSupport[ConversationParticipantId]
