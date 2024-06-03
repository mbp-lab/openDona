package services

import java.time.Instant

import models.api.{SocialData => ApiSocialData, Conversation => ApiConversation}
import models.domain._

object SocialDataTransformer extends ((DonationId, ApiSocialData) => SocialDataDonation) {


  def apply(
    donationId: DonationId,
    socialData: ApiSocialData
  ): SocialDataDonation = {
    val donorId = DonorId.generate
    var mappedParticipantIds = Map(socialData.donorId -> donorId.asParticipant)
    var mappedConversationIds = Map[String, ConversationId]()

    def getParticipantId(id: String) = {
      mappedParticipantIds.get(id) match {
        case Some(participant) => participant
        case None =>
          val mappedId = ParticipantId.generate
          mappedParticipantIds = mappedParticipantIds.updated(id, mappedId)
          mappedId
      }
    }

    def getConversationId(id: String) = {
      mappedConversationIds.get(id) match {
        case Some(conversation) =>
          conversation
        case None =>
          val mappedId = ConversationId.generate
          mappedConversationIds = mappedConversationIds.updated(id, mappedId)
          mappedId
      }
    }

    def transformConversationMessages(conversation: ApiConversation) = {
      val conversationId = getConversationId(conversation.conversationId)
      conversation.messages.map { message =>
        import message._
        Message(
          MessageId.generate,
          conversationId,
          wordCount,
          sender.map(getParticipantId),
          Instant.ofEpochMilli(timestampMs)
        )
      }
    }

    def transformConversationMessagesAudio(conversation: ApiConversation) = {
      val conversationId = getConversationId(conversation.conversationId)
      conversation.messagesAudio.map { messageAudio =>
        import messageAudio._
        MessageAudio(
          MessageId.generate,
          conversationId,
          lengthSeconds,
          sender.map(getParticipantId),
          Instant.ofEpochMilli(timestampMs)
        )
      }
    }

    def transformConversationParticipants(conversation: ApiConversation) = {
      val conversationId = getConversationId(conversation.conversationId)
      conversation.participants.map(
        id => {
          ConversationParticipant(ConversationParticipantId.generate, conversationId, getParticipantId(id))
        }
      )
    }

    def transformConversation(conversation: ApiConversation) = {
      import conversation._
      Conversation(
        getConversationId(conversationId),
        donationId,
        isGroupConversation,
        donationDataSourceType
      )
    }

    val conversations = socialData.conversations.map(conversation => transformConversation(conversation))
    val messages = socialData.conversations.flatMap(transformConversationMessages)
    val messagesAudio = socialData.conversations.flatMap(transformConversationMessagesAudio)
    val participants = socialData.conversations.flatMap(transformConversationParticipants)

    SocialDataDonation(donorId, conversations, messages, messagesAudio, participants)
  }
}
