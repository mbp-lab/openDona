package models.api

import models.domain.DonationDataSourceType.DonationDataSourceType
import play.api.libs.json.{Format, Json, JsonConfiguration}
import play.api.libs.json.JsonNaming.SnakeCase

case class Conversation(
  isGroupConversation: Boolean,
  conversationId: String,
  participants: List[String],
  messages: List[ConversationMessage],
  messagesAudio: List[ConversationMessageAudio],
  donationDataSourceType: DonationDataSourceType,
  selected: Boolean
)

object Conversation {
  implicit val config: JsonConfiguration = JsonConfiguration(SnakeCase)
  implicit val jsonFormat: Format[Conversation] = Json.format[Conversation]
}
