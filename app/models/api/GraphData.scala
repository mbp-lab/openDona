package models.api

import play.api.libs.json.{Format, Json}

case class GraphData(
                      sentReceivedPerMonthPerConversation: List[List[SentReceivedPoint]],
                      dailyWordsSentReceived: List[DailySentReceivedPoint],
                      slidingWindowMeanPerConv: List[List[DailySentReceivedPoint]],
                      dailySentReceivedPerConversation: List[List[DailySentReceivedPoint]],
                      dailySentHoursPerConversation: List[List[DailyHourPoint]],
                      dailyReceivedHoursPerConversation: List[List[DailyHourPoint]],
                      responseTimes: List[AnswerTimePoint],
                      //responseTimesPerConversation: List[List[AnswerTimePoint]],
                      basicStatistics: BasicStatistics,
                      conversationsFriends: List[List[String]],
)

object GraphData {
  implicit val jsonFormat: Format[GraphData] = Json.format[GraphData]
}
