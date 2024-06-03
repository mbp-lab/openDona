package models.api

import play.api.libs.json.JsonNaming.SnakeCase
import play.api.libs.json.{Format, Json, JsonConfiguration}

case class SocialData(
  donorId: String,
  conversations: List[Conversation]
)

object SocialData {
  implicit val config: JsonConfiguration = JsonConfiguration(SnakeCase)
  implicit val jsonFormat: Format[SocialData] = Json.format[SocialData]
}
