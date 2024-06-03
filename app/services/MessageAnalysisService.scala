package services

import java.time.{Instant, LocalDateTime, Month, ZoneOffset}
import config.FeedbackConfig

import javax.inject.{Inject, Singleton}
import models.api._
import models.domain.DonationDataSourceType
import models.domain.DonationDataSourceType.DonationDataSourceType

import scala.collection.mutable.ListBuffer


@Singleton
class MessageAnalysisService @Inject()(config: FeedbackConfig) {

  private case class TimeFrame(year: Int, month: Month)
  private case class TimeFrameInts(year: Int, month: Int)
  private case class TimeFrameWithDaysInts(year: Int, month: Int, date: Int)

  //private case class FriendTimeFrame(friend: Option[String], year: Int, month: Month)

  //private case class FromToTimeFrame(from: String, to: String, year: Int, month: Int)

  private case class TimeFrameWithDays(year: Int, month: Month, date: Int)

  private case class TimeFrameWithDaysHourMinute(year: Int, month: Month, date: Int, hour: Int, minute: Int)

  private case class ConversationWordCountOverall(conversation: Conversation, wordCount: Int, wordCountDonor: Int)

  private case class dailySentReceivedWithConvId(dailySentReceived: DailySentReceivedPoint, convId: Int)


  /**
   * produces the GraphData object by calling all the different data transformation functions
   *
   * @param socialData : all the socialData for message analysis -> feedback page
   * @return the produced GraphData needed for feedback page
   */
  def produceGraphData(socialData: SocialData): Map[DonationDataSourceType, GraphData] = {
    socialData.conversations
      .groupBy(_.donationDataSourceType)
      .map { case (dataSourceType, originalConversations) =>
        var conversations = originalConversations


        val sentReceivedMessagesMonthly = produceSentReceivedMessagedMonthly(socialData.donorId, conversations)
        //val sentReceivedWords = produceSentReceivedWordsGraphData(socialData.donorId, conversations)
        //val dailyMessageGraphData = produceDailyMessageGraphData(socialData.donorId, conversations)
        val dailyWordsGraphData = produceDailyWordsGraphData(socialData.donorId, conversations)
        val dailyWordsGraphDataPerConversation = conversations.map(conversation => produceDailyWordsGraphDataPerConversation(socialData.donorId, conversation))

        //val dailySentHourMinutesPerConversation = conversations.map(conversation => produceDailyHourMinutesPerConversation(socialData.donorId, conversation, true))
        //val dailyReceivedHourMinutesPerConversation = conversations.map(conversation => produceDailyHourMinutesPerConversation(socialData.donorId, conversation, false))
        //val dailySentHoursPerConversation = conversations.map(conversation => produceDailyHoursPerConversation(socialData.donorId, conversation, true))
        val dailyWordCountSentHoursPerConversation = conversations.map(conversation => produceWordCountDailyHoursPerConversation(socialData.donorId, conversation, sent = true))
        //val dailyReceivedHoursPerConversation = conversations.map(conversation => produceDailyHoursPerConversation(socialData.donorId, conversation, false))
        val dailyWordCountReceivedHoursPerConversation = conversations.map(conversation => produceWordCountDailyHoursPerConversation(socialData.donorId, conversation, sent = false))


        val answerTimesPerConversation = conversations.map(conversation => produceAnswerTimesPerConv(socialData.donorId, conversation))
        val answerTimes = answerTimesPerConversation.flatten


        val conversationsFriends = conversations.map(c => {
          c.participants.filter(
            participant => {
              participant != socialData.donorId
            })
        })
        //val sentPerFriendPerMonth = produceAggregatedSentPerFriend(socialData.donorId, conversations)
        //val sentPerFriendInConversationPerMonth = conversations.map(c => produceMonthlySentPerFriendInConversation(socialData.donorId, c))
        val sentReceivedPerMonthPerConversation = conversations.map(c => produceSentReceivedWordsPerMonthPerConversation(socialData.donorId, c))

        val average = produceBasicStatistics(sentReceivedMessagesMonthly, sentReceivedPerMonthPerConversation.flatten)

        //find months with only one conv
        val monthsOnlyOneConv = findMonthsWithOnlyOneConv(sentReceivedPerMonthPerConversation.flatten)

        //println(produceSlidingWindowMean(dailyWordsGraphData))
        val allDays = new ListBuffer[TimeFrameWithDaysInts]()
        var allDaysList = List[TimeFrameWithDaysInts]()
        if (dailyWordsGraphData.length > 0) {
          allDaysList = produceAllDays(dailyWordsGraphData.head.epochSeconds * 1000, dailyWordsGraphData.last.epochSeconds * 1000, allDays).toList

        }
        val slidingWindowMeanPerConv = dailyWordsGraphDataPerConversation.map(c => produceSlidingWindowMeanPerConv(c, allDaysList))


        (dataSourceType,
          GraphData(
            sentReceivedPerMonthPerConversation,
            dailyWordsGraphData,
            slidingWindowMeanPerConv,
            dailyWordsGraphDataPerConversation,
            dailyWordCountSentHoursPerConversation,
            dailyWordCountReceivedHoursPerConversation,
            answerTimes,
            //answerTimesPerConversation,
            average,
            conversationsFriends
          )
        )
      }
  }


  /**
   * filter conversations to only have nToTake conversations with most exchanged words left -> for facebook
   *
   * @param conversations are all the conversations from the current dataSource
   * @param nToTake       -> determines how many conversations are taken at most
   * @return the nToTake many conversations with most exchanged words
   */
  private def produceFilteredConversations(conversations: List[Conversation], nToTake: Int, donorId: String): List[Conversation] = {

    val thresholdData = conversations.map(conversation => {
      ConversationWordCountOverall(conversation, conversation.messages.map(_.wordCount).sum, conversation.messages.filter(_.sender.contains(donorId)).map(_.wordCount).sum)
    }).filter(((conv) => {
      if ((conv.wordCountDonor == 0) || (conv.wordCount == 0)) {
        false
      }
      else if (conv.conversation.participants.length <= 2) {
        !((conv.wordCountDonor.toFloat/conv.wordCount <= 0.1) || (conv.wordCountDonor.toFloat/conv.wordCount >= 0.9))
      } else {
        val toCompare = conv.wordCountDonor.toFloat/(conv.wordCount.toFloat/conv.conversation.participants.length)
        !((toCompare <= 0.1) || (toCompare >= 0.9))
      }
    }))

    if (thresholdData.length >= 7) {
      thresholdData
        .sortBy(_.wordCount)
        .takeRight(nToTake)
        .map(_.conversation)
    } else {
      conversations.map(conversation => {
        ConversationWordCountOverall(conversation, conversation.messages.map(_.wordCount).sum, conversation.messages.filter(_.sender.contains(donorId)).map(_.wordCount).sum)
      })
        .sortBy(_.wordCount)
        .takeRight(nToTake)
        .map(_.conversation)
    }

  }



  /**
   * find months with only one active conversation
   *
   * @param sentReceivedMonthly is a list of SentReceivedPoints per conversation so for each conversation per year-
   *                            month combinations where there was activity
   * @return all the year-month combinations with only one active conversation
   */
  private def findMonthsWithOnlyOneConv(sentReceivedMonthly: List[SentReceivedPoint]): List[TimeFrameInts] = {

    sentReceivedMonthly
      .map {
      case SentReceivedPoint(year, month, sentCount, receivedCount) =>
        TimeFrameInts(year, month)
    }
      .groupBy(_.copy())
      .map {
        case (key: TimeFrameInts, values: List[TimeFrameInts]) =>
          (key, values.length)
      }

      .filter {
        case (key: TimeFrameInts, value: Int) =>
          value == 1
      }
      .map {
        case (key: TimeFrameInts, value: Int) =>
          key
      }
      .toList
  }


  private def produceAllDays(startDateMs: Long, endDateMs: Long, dates: ListBuffer[TimeFrameWithDaysInts]): ListBuffer[TimeFrameWithDaysInts] = {

    val timestampStart = LocalDateTime.ofInstant(Instant.ofEpochMilli(startDateMs), ZoneOffset.UTC)
    val timeFrameStart = TimeFrameWithDaysInts(timestampStart.getYear, timestampStart.getMonth.getValue, timestampStart.getDayOfMonth)
    val timestampEnd = LocalDateTime.ofInstant(Instant.ofEpochMilli(endDateMs), ZoneOffset.UTC)
    val timeFrameEnd = TimeFrameWithDaysInts(timestampEnd.getYear, timestampEnd.getMonth.getValue, timestampEnd.getDayOfMonth)
    if (timeFrameStart == timeFrameEnd) {
      return dates += timeFrameStart
    } else {
      dates += timeFrameStart
      val nextDateMs = startDateMs + 8.64e+7.toLong
      val timestampNext = LocalDateTime.ofInstant(Instant.ofEpochMilli(nextDateMs), ZoneOffset.UTC)
      val timeFrameNext = TimeFrameWithDaysInts(timestampNext.getYear, timestampNext.getMonth.getValue, timestampNext.getDayOfMonth)
      produceAllDays(nextDateMs, endDateMs, dates)
    }
  }

  private def produceSlidingWindowMeanPerConv(allSentReceivedCounts: List[DailySentReceivedPoint], allDaysList: List[TimeFrameWithDaysInts]) : List[DailySentReceivedPoint] = {

    var iterList = allSentReceivedCounts

    val result = new ListBuffer[DailySentReceivedPoint]()

    val allDailySentReceived = allDaysList.map {
      case (TimeFrameWithDaysInts(year, month, date)) =>
        if (iterList.isEmpty) {
          DailySentReceivedPoint(year, month, date, 0, 0, LocalDateTime.of(year, month, date, 12, 30).toEpochSecond(ZoneOffset.UTC))
        }
        else if (iterList.head.year == year
          && iterList.head.month == month
        && iterList.head.date == date) {
          val cur = iterList.head
          // remove head
          iterList = iterList.drop(1)
          DailySentReceivedPoint(year, month, date, cur.sentCount, cur.receivedCount, cur.epochSeconds)
        } else {
          DailySentReceivedPoint(year, month, date, 0, 0, LocalDateTime.of(year, month, date, 12, 30).toEpochSecond(ZoneOffset.UTC))
        }
    }
      .zipWithIndex


    allDailySentReceived
      .foreach{
      case (DailySentReceivedPoint(year, month, date, sent, received, epochSeconds), index) => {
        if (index >= 15 && index <= allDaysList.length) {
          val meanSentWindow = allDailySentReceived.slice(index-15, index+15).map(x => x._1.sentCount).sum / 30
          val meanReceivedWindow = allDailySentReceived.slice(index-15, index+15).map(x => x._1.receivedCount).sum / 30

          result += DailySentReceivedPoint(year, month, date, meanSentWindow, meanReceivedWindow, epochSeconds)
        }
      }
    }

    result.toList
  }


  /**
   * counts total received and sent messages per month
   *
   * @param donorId       : donors ID
   * @param conversations : all conversations
   * @return List of SentReceivedPoints -> i.e. per year-month the amount of sent and received messages
   */
  private def produceSentReceivedMessagedMonthly(
                                                  donorId: String,
                                                  conversations: List[Conversation]
                                                ): List[SentReceivedPoint] = {
    conversations
      .flatMap(_.messages)
      .foldRight(Map[TimeFrame, (Int, Int)]()) {
        case (message, map) =>
          val timestamp = LocalDateTime.ofInstant(Instant.ofEpochMilli(message.timestampMs), ZoneOffset.UTC)
          val mapKey = TimeFrame(timestamp.getYear, timestamp.getMonth)
          val (oldSent, oldReceived) = map.getOrElse(mapKey, (0, 0))
          val newValue = message.sender match {
            case Some(sender) if sender == donorId => (oldSent + 1, oldReceived)
            case _ => (oldSent, oldReceived + 1)
          }
          map.updated(mapKey, newValue)
      }
      .map {
        case (TimeFrame(year, month), (sent, received)) =>
          SentReceivedPoint(year, month.getValue, sent, received)
      }
      .toList
      .sorted
      .reverse
  }


  /**
   * @param donorId      : the donors ID
   * @param conversation : the given conversation
   * @return the total amounts of sent and received words per month for one conversation
   */
  private def produceSentReceivedWordsPerMonthPerConversation(
                                                               donorId: String,
                                                               conversation: Conversation
                                                             ): List[SentReceivedPoint] = {
    conversation.messages
      .foldRight(Map[TimeFrame, (Int, Int)]()) {
        case (message, map) =>
          val timestamp = LocalDateTime.ofInstant(Instant.ofEpochMilli(message.timestampMs), ZoneOffset.UTC)
          val mapKey = TimeFrame(timestamp.getYear, timestamp.getMonth)
          val (oldSent, oldReceived) = map.getOrElse(mapKey, (0, 0))
          val newValue = message.sender match {
            case Some(sender) if sender == donorId => (oldSent + message.wordCount, oldReceived)
            case _ => (oldSent, oldReceived + message.wordCount)
          }
          map.updated(mapKey, newValue)
      }
      .map {
        case (TimeFrame(year, month), (sent, received)) =>
          SentReceivedPoint(year, month.getValue, sent, received)
      }
      .toList
      .sorted
      .reverse
  }


  /*
  /**
   * produces a list of FromToListYearMonthSentCount objects
   * One object per sender and per month contains the information:
   * from: sender, to: List[receivers], year, month, sentWords
   *
   * @param donorId      : the donors ID
   * @param conversation : the given conversation
   * @return list of FromToListYearMonthSentCount objects
   */
  private def produceMonthlySentPerFriendInConversation(
                                                         donorId: String,
                                                         conversation: Conversation
                                                       ): List[FromToListYearMonthSentCount] = {

    val conversationFriends = conversation.participants.filter(participant => {
      participant != donorId
    })

    conversation.messages
      .foldRight(Map[FriendTimeFrame, Int]()) {
        case (message, map) =>
          val timestamp = LocalDateTime.ofInstant(Instant.ofEpochMilli(message.timestampMs), ZoneOffset.UTC)
          val mapKey = FriendTimeFrame(message.sender, timestamp.getYear, timestamp.getMonth)
          // weird behavior here when testing files with only a few entries -> date and month gets confused (probably an international problem?)
          // maybe does not matter, as small files like that wont actually appear
          //println("HERE IS SENDER: " + message.sender)
          //println("HERE IS GETMONTH:" + timestamp.getMonth)
          //println("HERE IS GetValue:" + timestamp.getMonth.getValue)
          val oldSent = map.getOrElse(mapKey, 0)
          val newValue = oldSent + message.wordCount
          map.updated(mapKey, newValue)
      }
      .map {
        case (FriendTimeFrame(friend, year, month), sent) =>

          friend match {
            case Some(friend) if friend == donorId => FromToListYearMonthSentCount("donor", conversationFriends, year, month.getValue, sent)
            case Some(friend) => FromToListYearMonthSentCount(friend, conversationFriends, year, month.getValue, sent)
          }
      }
      .toList
      .sorted
      .reverse
  }

   */


  /*
  /**
   * @param donorId       is the donor's id
   * @param conversations are the conversations
   * @return aggregates the information returned from produceMonthlySentPerFriendInConversation
   *         in the end the information is a List of FromToYearMonthSentCount objects
   *         that is: per month per sender-receiver pair the amount of sent words
   *         List[{form: sender, to: receiver, year, month, sentWords}]
   */
  private def produceAggregatedSentPerFriend(
                                              donorId: String,
                                              conversations: List[Conversation]
                                            ): List[FromToYearMonthSentCount] = {


    conversations
      .flatMap(c => produceMonthlySentPerFriendInConversation(donorId, c))
      .foldRight(Map[FromToTimeFrame, Int]()) {
        case (friendSent, map) =>

          friendSent.from match {
            case sender if sender == "donor" =>
              var mapToReturn = map
              friendSent.to.foreach(receiver => {
                val mapKey = FromToTimeFrame("donor", receiver, friendSent.year, friendSent.month)
                val oldSent = mapToReturn.getOrElse(mapKey, 0)
                val newValue = oldSent + friendSent.sentCount
                mapToReturn = mapToReturn.updated(mapKey, newValue)
              })
              // this will be returned:
              mapToReturn
            case sender if sender != "donor" =>
              val mapKey = FromToTimeFrame(sender, "donor", friendSent.year, friendSent.month)
              val oldSent = map.getOrElse(mapKey, 0)
              val newValue = oldSent + friendSent.sentCount
              map.updated(mapKey, newValue)
          }
      }
      .map {
        case (FromToTimeFrame(from, to, year, month), sent) =>
          FromToYearMonthSentCount(from, to, year, month, sent)
      }
      .toList
      .sorted
      .reverse
  }

   */

  /*
  /**
   * counts total received and sent messages per day
   *
   * @param donorId       : donors ID
   * @param conversations : all conversations
   * @return List of DailySentReceivedPoints -> i.e. per year-month-date and epochSeconds the amount of sent and received messages
   */
  private def produceDailyMessageGraphData(
                                            donorId: String,
                                            conversations: List[Conversation]
                                          ): List[DailySentReceivedPoint] = {

    conversations
      .flatMap(_.messages)
      .foldRight(Map[TimeFrameWithDays, (Int, Int)]()) {
        case (message, map) =>
          val timestamp = LocalDateTime.ofInstant(Instant.ofEpochMilli(message.timestampMs), ZoneOffset.UTC)
          val mapKey = TimeFrameWithDays(timestamp.getYear, timestamp.getMonth, timestamp.getDayOfMonth)
          val (oldSent, oldReceived) = map.getOrElse(mapKey, (0, 0))
          val newValue = message.sender match {
            case Some(sender) if sender == donorId => (oldSent + 1, oldReceived)
            case _ => (oldSent, oldReceived + 1)
          }
          map.updated(mapKey, newValue)
      }
      .map {
        case (TimeFrameWithDays(year, month, day), (sent, received)) =>
          //hour and minute do not matter here, but are needed for providing epochSeconds
          DailySentReceivedPoint(year, month.getValue, day, sent, received, LocalDateTime.of(year, month, day, 12, 30).toEpochSecond(ZoneOffset.UTC))
      }
      .toList
      .sorted
      .reverse
  }

   */

  /**
   * counts total received and sent WORDS per day
   *
   * @param donorId       : donors ID
   * @param conversations : all conversations
   * @return List of DailySentReceivedPoints -> i.e. per year-month-date and epochSeconds the amount of sent and received words
   */
  private def produceDailyWordsGraphData(
                                          donorId: String,
                                          conversations: List[Conversation]
                                        ): List[DailySentReceivedPoint] = {

    conversations
      .flatMap(_.messages)
      .foldRight(Map[TimeFrameWithDays, (Int, Int)]()) {
        case (message, map) =>
          val timestamp = LocalDateTime.ofInstant(Instant.ofEpochMilli(message.timestampMs), ZoneOffset.UTC)
          val mapKey = TimeFrameWithDays(timestamp.getYear, timestamp.getMonth, timestamp.getDayOfMonth)
          val (oldSent, oldReceived) = map.getOrElse(mapKey, (0, 0))
          val newValue = message.sender match {
            case Some(sender) if sender == donorId => (oldSent + message.wordCount, oldReceived)
            case _ => (oldSent, oldReceived + message.wordCount)
          }
          map.updated(mapKey, newValue)
      }
      .map {
        case (TimeFrameWithDays(year, month, day), (sent, received)) =>
          //hour and minute do not matter here, but are needed for providing epochSeconds
          DailySentReceivedPoint(year, month.getValue, day, sent, received, LocalDateTime.of(year, month, day, 12, 30).toEpochSecond(ZoneOffset.UTC))
      }
      .toList
      .sorted
      .reverse
  }


  /**
   * counts total received and sent WORDS per day for a given conversation
   *
   * @param donorId      : donors ID
   * @param conversation : specific given conversation
   * @return List of DailySentReceivedPoints -> i.e. per year-month-date and epochSeconds the amount of sent and received words
   */
  private def produceDailyWordsGraphDataPerConversation(
                                                         donorId: String,
                                                         conversation: Conversation
                                                       ): List[DailySentReceivedPoint] = {

    conversation.messages
      .foldRight(Map[TimeFrameWithDays, (Int, Int)]()) {
        case (message, map) =>
          val timestamp = LocalDateTime.ofInstant(Instant.ofEpochMilli(message.timestampMs), ZoneOffset.UTC)
          val mapKey = TimeFrameWithDays(timestamp.getYear, timestamp.getMonth, timestamp.getDayOfMonth)
          val (oldSent, oldReceived) = map.getOrElse(mapKey, (0, 0))
          val newValue = message.sender match {
            case Some(sender) if sender == donorId => (oldSent + message.wordCount, oldReceived)
            case _ => (oldSent, oldReceived + message.wordCount)
          }
          map.updated(mapKey, newValue)
      }
      .map {
        case (TimeFrameWithDays(year, month, date), (sent, received)) =>
          DailySentReceivedPoint(year, month.getValue, date, sent, received, LocalDateTime.of(year, month, date, 12, 30).toEpochSecond(ZoneOffset.UTC))
      }
      .toList
      .sorted
      .reverse

  }

  /*
  /**
   *
   * @param donorId      is the donor's id
   * @param conversation is the current conversation -> so the method can be used to map over all conversations
   * @param sent         determines if sent or received should be calculated
   * @return Per day-hour-minute one point if at least one message was sent/received
   */
  private def produceDailyHourMinutesPerConversation(
                                                      donorId: String,
                                                      conversation: Conversation,
                                                      sent: Boolean,
                                                    ): List[DailyHourPoint] = {
    conversation.messages
      .filter(message => {
        if (sent) {
          message.sender match {
            case Some(sender) if sender == donorId => true
            case _ => false
          }
        } else {
          message.sender match {
            case Some(sender) if sender != donorId => true
            case _ => false
          }
        }
      })
      .map(message => {
        val timestamp = LocalDateTime.ofInstant(Instant.ofEpochMilli(message.timestampMs), ZoneOffset.UTC)
        TimeFrameWithDaysHourMinute(timestamp.getYear, timestamp.getMonth, timestamp.getDayOfMonth, timestamp.getHour, timestamp.getMinute)
      })
      .distinct
      .map {
        case TimeFrameWithDaysHourMinute(year, month, date, hour, minute) =>
          DailyHourPoint(year, month.getValue, date, hour, minute, 1, LocalDateTime.of(year, month, date, hour, minute).toEpochSecond(ZoneOffset.UTC))
      }

  }

   */

  /*
  /**
   *
   * @param donorId      is the donor's id
   * @param conversation is the current conversation -> so the method can be used to map over all conversations
   * @param sent         determines if sent or received should be calculated
   * @return Per day, per hour one point if at least one message was sent/received
   */
  private def produceDailyHoursPerConversation(
                                                donorId: String,
                                                conversation: Conversation,
                                                sent: Boolean,
                                              ): List[DailyHourPoint] = {
    conversation.messages
      .filter(message => {
        if (sent) {
          message.sender match {
            case Some(sender) if sender == donorId => true
            case _ => false
          }
        } else {
          message.sender match {
            case Some(sender) if sender != donorId => true
            case _ => false
          }
        }
      })
      .map(message => {
        val timestamp = LocalDateTime.ofInstant(Instant.ofEpochMilli(message.timestampMs), ZoneOffset.UTC)
        TimeFrameWithDaysHourMinute(timestamp.getYear, timestamp.getMonth, timestamp.getDayOfMonth, timestamp.getHour, 0)
      })
      .distinct
      .map {
        case TimeFrameWithDaysHourMinute(year, month, date, hour, minute) =>
          DailyHourPoint(year, month.getValue, date, hour, minute, 1, LocalDateTime.of(year, month, date, hour, minute).toEpochSecond(ZoneOffset.UTC))
      }

  }

   */

  /**
   *
   * @param donorId      is the donor's id
   * @param conversation is the current conversation -> so the method can be used to map over all conversations
   * @param sent         determines if sent or received should be calculated
   * @return Per day, per hour the sent or received word count
   */
  private def produceWordCountDailyHoursPerConversation(
                                                         donorId: String,
                                                         conversation: Conversation,
                                                         sent: Boolean,
                                                       ): List[DailyHourPoint] = {

    conversation.messages
      .filter(message => {
        if (sent) {
          message.sender match {
            case Some(sender) if sender == donorId => true
            case _ => false
          }
        } else {
          message.sender match {
            case Some(sender) if sender != donorId => true
            case _ => false
          }
        }
      })
      .foldRight(Map[TimeFrameWithDaysHourMinute, Int]()) {
        case (message, map) =>
          val timestamp = LocalDateTime.ofInstant(Instant.ofEpochMilli(message.timestampMs), ZoneOffset.UTC)
          val mapKey = TimeFrameWithDaysHourMinute(timestamp.getYear, timestamp.getMonth, timestamp.getDayOfMonth, timestamp.getHour, timestamp.getMinute)
          val oldWordCount = map.getOrElse(mapKey, 0)
          val newWordCount = oldWordCount + message.wordCount
          map.updated(mapKey, newWordCount)
      }
      .map {
        case (TimeFrameWithDaysHourMinute(year, month, date, hour, minute), wordCount) =>
          DailyHourPoint(year, month.getValue, date, hour, minute, wordCount, LocalDateTime.of(year, month, date, hour, minute).toEpochSecond(ZoneOffset.UTC))
      }
      .toList
      .sorted
      .reverse

  }

  /**
   * @param donorId      is the donor's id
   * @param conversation is the current conversation -> so the method can be used to map over all conversations
   * @return all responseTimes for the given conversation with a boolean if it is from the donor or from a friend
   */
  private def produceAnswerTimesPerConv(donorId: String, conversation: Conversation): List[AnswerTimePoint] = {
    /* This was done before -> ignores answers in the same minute !
    def isAnswer(message1: ConversationMessage, message2: ConversationMessage) = {
      message1.sender != message2.sender &&
        message2.timestampMs > message1.timestampMs &&
        message2.timestampMs - message1.timestampMs < config.maximumResponseWait.toMillis
    }

     */

    def isAnswer(message1: ConversationMessage, message2: ConversationMessage) = {
      message1.sender != message2.sender &&
        message2.timestampMs >= message1.timestampMs
    }


    conversation.messages
      .sortBy(message => message.timestampMs)
      .sliding(2)
      .collect {
        case message1 :: message2 :: Nil if isAnswer(message1, message2) =>
          AnswerTimePoint(
            (message2.timestampMs - message1.timestampMs).toInt,
            message2.sender.contains(donorId),
            message2.timestampMs,
          )
      }
      .toList

  }


  /**
   *
   * @param points  the sentReceivedPoints -> year, month and sent and received count
   * @return the BasicStatistics object
   */
  private def produceBasicStatistics(pointsMessages: List[SentReceivedPoint], pointsWords: List[SentReceivedPoint]): BasicStatistics = {
    val overallSentMessages = pointsMessages.map(_.sentCount).sum
    val overallReceivedMessages = pointsMessages.map(_.receivedCount).sum

    val overallSentWords = pointsWords.map(_.sentCount).sum
    val overallReceivedWords = pointsWords.map(_.receivedCount).sum

    val activeMonths = pointsMessages.length
    val activeYears = getNumberOfDistinctYears(pointsMessages)

    var averageSentPerActiveMonth = 0
    var averageReceivedPerActiveMonth = 0
    if (activeMonths != 0) {
      averageSentPerActiveMonth = overallSentMessages / activeMonths
      averageReceivedPerActiveMonth = overallReceivedMessages / activeMonths
    }

    BasicStatistics(
      sentMessagesTotal = overallSentMessages,
      receivedMessagesTotal = overallReceivedMessages,
      sentWordsTotal = overallSentWords,
      receivedWordsTotal = overallReceivedWords,
      numberOfActiveMonths = activeMonths,
      numberOfActiveYears = activeYears,
      sentPerActiveMonth = averageSentPerActiveMonth,
      receivedPerActiveMonth = averageReceivedPerActiveMonth
    )
  }

  /**
   * @param graphDataPoints the sentReceivedPoints -> year, month and sent and received count
   * @return number of distinct years
   */
  private def getNumberOfDistinctYears(graphDataPoints: List[SentReceivedPoint]): Int = {
    graphDataPoints.map(_.year).distinct.length
  }
}
