package services

import java.time.Instant

import models.api.{SocialData, Conversation => ApiConversation, ConversationMessage => ApiMessage, ConversationMessageAudio => ApiMessageAudio}
import models.domain.{DonationDataSourceType, DonationId, SocialDataDonation}
import org.scalatest.{FreeSpec, Matchers}

final class SocialDataTransformerTest extends FreeSpec with Matchers {
  private val donationId = DonationId.generate
  "transforming passed social data" - {
    "should retain message-conversation structure" in {
      val socialData = SocialData(
        "donorId",
        List(
          ApiConversation(
            false,
            "someId",
            List("donorId", "other"),
            List(ApiMessage(1, 12413123L, Some("other")), ApiMessage(2, 5243234L, Some("donorId"))),
            List(ApiMessageAudio(1, 12413123L, Some("other")), ApiMessageAudio(2, 5243234L, Some("donorId"))),
            DonationDataSourceType.WhatsApp,
            true
          ),
          ApiConversation(
            true,
            "someOtherId",
            List("donorId", "other", "other2"),
            List(ApiMessage(3, 13413412L, None)),
            List(ApiMessageAudio(3, 13413412L, None)),
            DonationDataSourceType.Facebook,
            true
          )
        )
      )

      val SocialDataDonation(_, mappedConversations, mappedMessages, mappedMessagesAudio, _) = SocialDataTransformer(donationId, socialData)

      mappedConversations.length shouldBe 2
      mappedMessages.length shouldBe 3
      mappedMessagesAudio.length shouldBe 3

      val messagesByWordCount = mappedMessages.groupBy(_.wordCount).mapValues(_.head)

      messagesByWordCount(1).conversationId shouldBe messagesByWordCount(2).conversationId
      messagesByWordCount(1).conversationId should not be messagesByWordCount(3).conversationId
    }
    "should retain data source and group conversation properties" in {
      val socialData = SocialData(
        "donorId",
        List(
          ApiConversation(
            false,
            "someId",
            List("donorId", "other"),
            List(ApiMessage(15, 12355132L, Some("other"))),
            List(ApiMessageAudio(15, 12355132L, Some("other"))),
            DonationDataSourceType.WhatsApp,
            true
          ),
          ApiConversation(
            true,
            "someOtherId",
            List("yetAnother", "another", "donorId"),
            List(ApiMessage(12, 134131414L, Some("donorId"))),
            List(ApiMessageAudio(12, 134131414L, Some("donorId"))),
            DonationDataSourceType.Facebook,
            true
          )
        )
      )

      val SocialDataDonation(_, mappedConversations, _, _, _) = SocialDataTransformer(donationId, socialData)

      val (groupConversation :: Nil, singleConversation :: Nil) = mappedConversations.partition(_.isGroupConversation)

      singleConversation.isGroupConversation shouldBe false
      singleConversation.donationDataSourceType shouldBe DonationDataSourceType.WhatsApp

      groupConversation.isGroupConversation shouldBe true
      groupConversation.donationDataSourceType shouldBe DonationDataSourceType.Facebook

    }

    "should transform timestamps using epoch milliseconds" in {
      val originalTime = Instant.now()
      val socialData = SocialData(
        "donorId",
        List(
          ApiConversation(
            false,
            "someId",
            List("donorId", "other"),
            List(ApiMessage(15, originalTime.toEpochMilli, Some("other"))),
            List(ApiMessageAudio(15, originalTime.toEpochMilli, Some("other"))),
            DonationDataSourceType.WhatsApp,
            true
          )
        )
      )

      val SocialDataDonation(_, _, message :: Nil, messageAudio :: Nil, _) = SocialDataTransformer(donationId, socialData)
      message.timestamp shouldBe originalTime
      messageAudio.timestamp shouldBe originalTime
    }

    "should consistently map the donor" in {
      val donorId = "donorId"
      val socialData = SocialData(
        donorId,
        List(
          ApiConversation(
            false,
            "someId",
            List(donorId, "other"),
            List(ApiMessage(15, 12355132L, Some(donorId))),
            List(ApiMessageAudio(15, 12355132L, Some(donorId))),
            DonationDataSourceType.Facebook,
            true
          )
        )
      )

      val SocialDataDonation(mappedDonorId, _, mappedMessage :: Nil, mappedMessageAudio :: Nil, mappedParticipants) =
        SocialDataTransformer(donationId, socialData)

      mappedParticipants.map(_.participantId) should contain(mappedDonorId.asParticipant)
      mappedMessage.sender shouldBe Some(mappedDonorId.asParticipant)
      mappedMessageAudio.sender shouldBe Some(mappedDonorId.asParticipant)
    }
  }

  "should consistently map other participants" in {
    val otherId = "other"
    val socialData = SocialData(
      "donorId",
      List(
        ApiConversation(
          false,
          "someId",
          List("donorId", otherId),
          List(ApiMessage(15, 12355132L, Some(otherId))),
          List(ApiMessageAudio(15, 12355132L, Some(otherId))),
          DonationDataSourceType.Facebook,
          true
        ),
        ApiConversation(
          true,
          "someOtherId",
          List(otherId, "another", "donorId"),
          List(ApiMessage(12, 134131414L, Some("donorId"))),
          List(ApiMessageAudio(15, 12355132L, Some(otherId))),
          DonationDataSourceType.Facebook,
          true
        )
      )
    )

    val SocialDataDonation(mappedDonorId, mappedConversations, mappedMessages, mappedMessagesAudio, mappedParticipants) =
      SocialDataTransformer(donationId, socialData)
    val (mappedGroupConversation :: Nil, _) = mappedConversations.partition(_.isGroupConversation)
    val (groupParticipants, singleParticipants) =
      mappedParticipants.partition(_.conversationId == mappedGroupConversation.id)
    val (_, singleMessage :: Nil) = mappedMessages.partition(_.conversationId == mappedGroupConversation.id)

    (mappedConversations should have).length(2)
    val mappedOtherId = singleParticipants
      .filter(_.participantId != mappedDonorId.asParticipant)
      .head
      .participantId

    groupParticipants.map(_.participantId) should contain(mappedOtherId)

    singleMessage.sender shouldBe Some(mappedOtherId)
  }
}
