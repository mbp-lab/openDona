package models.api

import play.api.libs.json.JsonNaming.SnakeCase
import play.api.libs.json.{Format, Json, JsonConfiguration}

case class ConversationMessageAudio(
  lengthSeconds: Int,
  timestampMs: Long,
  sender: Option[String],
)

object ConversationMessageAudio {
  implicit val config: JsonConfiguration = JsonConfiguration(SnakeCase)
  implicit val jsonFormat: Format[ConversationMessageAudio] = Json.format[ConversationMessageAudio]
}
