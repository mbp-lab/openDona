package models.api

import play.api.libs.json.{Format, Json, JsonConfiguration}
import play.api.libs.json.JsonNaming.SnakeCase

case class ConversationMessage(
  wordCount: Int,
  timestampMs: Long,
  sender: Option[String],
)

object ConversationMessage {
  implicit val config: JsonConfiguration = JsonConfiguration(SnakeCase)
  implicit val jsonFormat: Format[ConversationMessage] = Json.format[ConversationMessage]
}
