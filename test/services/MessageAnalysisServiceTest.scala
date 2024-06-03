package services

import java.time.{LocalDateTime, ZoneOffset}

import config.FeedbackConfig
import models.api._
import models.domain.DonationDataSourceType
import models.domain.DonationDataSourceType.DonationDataSourceType
import org.scalatest.{FreeSpec, Matchers}

import scala.concurrent.duration._

final class MessageAnalysisServiceTest extends FreeSpec with Matchers {

  import MessageAnalysisServiceTest._

  "Producing graph data for social data" - {
    lazy val service = createService()

    testCases.foreach {
      case TestCase(name, socialData, expectedGraph) =>
        name - {
          lazy val result = service.produceGraphData(socialData)

          "should produce the correct data sources" in {
            result.keySet should contain theSameElementsAs expectedGraph.keySet
          }

          for (key <- result.keySet) {
            lazy val (
              expectedSentReceivedPerMonthPerConversation,
              expectedDailyWordsSentReceived,
              expectedDailySentReceivedPerConversation,
              expectedDailySentHoursPerConversation,
              expectedDailyReceivedHoursPerConversation,
              expectedResponseTimes,
              expectedAverageNumberOfMessages,
              expectedConversationsFriends) = expectedGraph(key)

            s"should produce the expected $key graph data points" in {
              result(key).sentReceivedPerMonthPerConversation should contain theSameElementsAs expectedSentReceivedPerMonthPerConversation
              result(key).dailyWordsSentReceived should contain theSameElementsAs expectedDailyWordsSentReceived
              result(key).dailySentReceivedPerConversation should contain theSameElementsAs expectedDailySentReceivedPerConversation
              result(key).dailySentHoursPerConversation should contain theSameElementsAs expectedDailySentHoursPerConversation
              result(key).dailyReceivedHoursPerConversation should contain theSameElementsAs expectedDailyReceivedHoursPerConversation
              result(key).responseTimes should contain theSameElementsAs expectedResponseTimes
              result(key).basicStatistics shouldBe expectedAverageNumberOfMessages
              result(key).conversationsFriends should contain theSameElementsAs expectedConversationsFriends
            }
          }
        }
    }
  }


  private def createService(responseTimeCutoff: Duration = 1.day, maxSampleSize: Int = 1000) =
    new MessageAnalysisService(new FeedbackConfig(responseTimeCutoff, maxSampleSize))
}


object MessageAnalysisServiceTest {
  case class TestCase(
                       name: String,
                       socialData: SocialData,
                       expectedGraph: Map[DonationDataSourceType, (
                           List[List[SentReceivedPoint]],
                           List[DailySentReceivedPoint],
                           List[List[DailySentReceivedPoint]],
                           List[List[DailyHourPoint]],
                           List[List[DailyHourPoint]],
                           List[AnswerTimePoint],
                           BasicStatistics,
                           List[List[String]]
                         )],
                     )

  private val donorName = "donor"

  private lazy val testCases =
    List[TestCase](singleConvoSingleMonth, singleConvoMultipleMonths, multipleConvos) // TODO should test more cases...

  lazy val singleConvoSingleMonth: TestCase = {
    val conversation =
      createConversation(DonationDataSourceType.Facebook, (2017, 1, donorName), (2017, 1, "4"), (2017, 1, donorName))
    val socialData = SocialData(donorName, List(conversation))
    TestCase(
      "containing one conversation with three messages taking place in one month at the same date-time",
      socialData,
      Map(
        DonationDataSourceType.Facebook -> (
          List(List(SentReceivedPoint(2017, 1, 30, 15))), //sentReceivedPerMonthPerConversation -> wordCounts
          List(DailySentReceivedPoint(2017, 1, 1, 30, 15, getEpochSeconds(2017, 1, 1, 12, 30))), // dailyWordsGraphData
          List(List(DailySentReceivedPoint(2017, 1, 1, 30, 15, getEpochSeconds(2017, 1, 1, 12, 30)))), //dailyWordsGraphDataPerConversation
          List(List(DailyHourPoint(2017, 1, 1, 12, 0, 30, getEpochSeconds(2017, 1, 1, 12, 0)))), // dailyWordCountSentHoursPerConversation
          List(List(DailyHourPoint(2017, 1, 1, 12, 0, 15, getEpochSeconds(2017, 1, 1, 12, 0)))), // dailyWordCountReceivedHoursPerConversation
          List(
            AnswerTimePoint(0, isDonor = false, LocalDateTime.of(2017, 1, 1, 12, 0).toInstant(ZoneOffset.UTC).toEpochMilli),
            AnswerTimePoint(0, isDonor = true, LocalDateTime.of(2017, 1, 1, 12, 0).toInstant(ZoneOffset.UTC).toEpochMilli)
          ), // answerTimes
          BasicStatistics(2, 1, 30, 15, 1, 1, 2, 1), // average
          List(List("4")) // conversationsFriends
        )
      ),
    )
  }


  lazy val singleConvoMultipleMonths: TestCase = {
    val conversation = createConversation(
      DonationDataSourceType.Facebook,
      (2017, 1, donorName),
      (2018, 3, donorName),
      (2008, 12, "someone")
    )
    val socialData = SocialData(donorName, List(conversation))
    TestCase(
      "containing one conversation spanning multiple months",
      socialData,
      Map(
        DonationDataSourceType.Facebook -> (
          List(List(SentReceivedPoint(2008, 12, 0, 15), SentReceivedPoint(2017, 1, 15, 0), SentReceivedPoint(2018, 3, 15, 0))), //sentReceivedPerMonthPerConversation -> wordCounts
          List(
            DailySentReceivedPoint(2008, 12, 1, 0, 15, getEpochSeconds(2008, 12, 1, 12, 30)),
            DailySentReceivedPoint(2017, 1, 1, 15, 0, getEpochSeconds(2017, 1, 1, 12, 30)),
            DailySentReceivedPoint(2018, 3, 1, 15, 0, getEpochSeconds(2018, 3, 1, 12, 30)),
          ), // dailyWordsGraphData
          List(
            List(
              DailySentReceivedPoint(2008, 12, 1, 0, 15, getEpochSeconds(2008, 12, 1, 12, 30)),
              DailySentReceivedPoint(2017, 1, 1, 15, 0, getEpochSeconds(2017, 1, 1, 12, 30)),
              DailySentReceivedPoint(2018, 3, 1, 15, 0, getEpochSeconds(2018, 3, 1, 12, 30))
            )
          ), //dailyWordsGraphDataPerConversation
          List(
            List(
              DailyHourPoint(2017, 1, 1, 12, 0, 15, getEpochSeconds(2017, 1, 1, 12, 0)),
              DailyHourPoint(2018, 3, 1, 12, 0, 15, getEpochSeconds(2018, 3, 1, 12, 0))
            )
          ), // dailyWordCountSentHoursPerConversation
          List(List(DailyHourPoint(2008, 12, 1, 12, 0, 15, getEpochSeconds(2008, 12, 1, 12, 0)))), // dailyWordCountReceivedHoursPerConversation
          List(
            AnswerTimePoint(
              (LocalDateTime.of(2017, 1, 1, 12, 0).toInstant(ZoneOffset.UTC).toEpochMilli - LocalDateTime.of(2008, 12, 1, 12, 0).toInstant(ZoneOffset.UTC).toEpochMilli).toInt,
              isDonor = true,
              LocalDateTime.of(2017, 1, 1, 12, 0).toInstant(ZoneOffset.UTC).toEpochMilli)
          ), // answerTimes
          BasicStatistics(2, 1, 30, 15,3, 3, 0, 0), // average
          List(List("someone")) // conversationsFriends
        )
      )
    )
  }


    lazy val multipleConvos: TestCase = {
      val firstConversation = createConversation(DonationDataSourceType.Facebook, (2017, 1, donorName))
      val secondConversation =
        createConversation(DonationDataSourceType.Facebook, (2017, 1, "someone else"), (2017, 2, donorName))
      val socialData =
        SocialData(
          donorName,
          List(firstConversation, secondConversation)
        )
      TestCase(
        "containing two conversations from different sources",
        socialData,
        Map(
          DonationDataSourceType.Facebook -> (
            List(List(SentReceivedPoint(2017, 1, 15, 0)), List(SentReceivedPoint(2017, 1, 0 ,15), SentReceivedPoint(2017, 2, 15, 0))), //sentReceivedPerMonthPerConversation -> wordCounts
            List(
              DailySentReceivedPoint(2017, 1, 1, 15, 15, getEpochSeconds(2017, 1, 1, 12, 30)),
              DailySentReceivedPoint(2017, 2, 1, 15, 0, getEpochSeconds(2017, 2, 1, 12, 30)),
            ), // dailyWordsGraphData
            List(
              List(
                DailySentReceivedPoint(2017, 1, 1, 15, 0, getEpochSeconds(2017, 1, 1, 12, 30)),
              ),
              List(
                DailySentReceivedPoint(2017, 1, 1, 0, 15, getEpochSeconds(2017, 1, 1, 12, 30)),
                DailySentReceivedPoint(2017, 2, 1, 15, 0, getEpochSeconds(2017, 2, 1, 12, 30)),
              )
            ), //dailyWordsGraphDataPerConversation
            List(
              List(
                DailyHourPoint(2017, 1, 1, 12, 0, 15, getEpochSeconds(2017, 1, 1, 12, 0)),
              ),
              List(
                DailyHourPoint(2017, 2, 1, 12, 0, 15, getEpochSeconds(2017, 2, 1, 12, 0)),
              )
            ), // dailyWordCountSentHoursPerConversation
            List(
              List(),
              List(DailyHourPoint(2017, 1, 1, 12, 0, 15, getEpochSeconds(2017, 1, 1, 12, 0)))
            ), // dailyWordCountReceivedHoursPerConversation
            List(
              AnswerTimePoint(
                (LocalDateTime.of(2017, 2, 1, 12, 0).toInstant(ZoneOffset.UTC).toEpochMilli - LocalDateTime.of(2017, 1, 1, 12, 0).toInstant(ZoneOffset.UTC).toEpochMilli).toInt,
                isDonor = true,
                LocalDateTime.of(2017, 2, 1, 12, 0).toInstant(ZoneOffset.UTC).toEpochMilli)
            ), // answerTimes
            BasicStatistics(2, 1, 30, 15, 2, 1, 1, 0), // average
            List(List(), List("someone else")) // conversationsFriends
          )
        )

      )

    }


  private def createConversation(
                                  donationDataSourceType: DonationDataSourceType,
                                  messages: (Int, Int, String)*
                                ): Conversation = {
    val parsedMessages = messages.map {
      case (year, month, donor) =>
        val timestamp = LocalDateTime.of(year, month, 1, 12, 0).toInstant(ZoneOffset.UTC).toEpochMilli
        ConversationMessage(15, timestamp, Some(donor))
    }.toList

    val parsedMessagesAudio = messages.map {
      case (year, month, donor) =>
        val timestamp = LocalDateTime.of(year, month, 1, 12, 0).toInstant(ZoneOffset.UTC).toEpochMilli
        ConversationMessageAudio(15, timestamp, Some(donor))
    }.toList

    val participants = messages.map { case (_, _, sender) => sender }.distinct.toList

    Conversation(participants.lengthCompare(2) > 0, "123", participants, parsedMessages, parsedMessagesAudio, donationDataSourceType, true)
  }

  private def getEpochSeconds(year: Int, month: Int, date: Int, hour: Int, minute: Int): Long = {
    LocalDateTime.of(year, month, date, hour, minute).toEpochSecond(ZoneOffset.UTC)
  }

}
