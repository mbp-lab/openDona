package models.api

import play.api.libs.json.{Format, Json}

case class BasicStatistics(
                            sentMessagesTotal: Int,
                            receivedMessagesTotal: Int,
                            sentWordsTotal: Int,
                            receivedWordsTotal: Int,
                            numberOfActiveMonths: Int,
                            numberOfActiveYears: Int,
                            sentPerActiveMonth: Int,
                            receivedPerActiveMonth: Int
)

object BasicStatistics {
  implicit val jsonFormat: Format[BasicStatistics] = Json.format[BasicStatistics]
}
