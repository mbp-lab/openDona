package controllers

import akka.http.scaladsl.model.Uri
import config.{FeedbackConfig, SurveyConfig}
import models.api.{Conversation, ConversationMessage, ConversationMessageAudio, SocialData}
import models.domain.{DonationDataSourceType, ExternalDonorId}
import org.mockito.Mockito._
import org.scalatestplus.play._
import org.specs2.mock._
import persistence.DonationService
import play.api.mvc.Result
import play.api.test.CSRFTokenHelper._
import play.api.test.Helpers._
import play.api.test._
import scalaz.EitherT
import scalaz.Scalaz._
import services.{Feature, FeatureFlagService, InMemoryDataSourceDescriptionService, MessageAnalysisService, SocialDataService}

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.duration._
import scala.concurrent.Future

class SocialDataDonationControllerSpec extends PlaySpec with Mockito {

  private val fakeDonorId = "dummy-id"
  private val fakeSurveyUrl = Uri("https://survey.com/survey")

  "Getting the index" should {

    "render the index page from a new instance of controller" in {
      val (controller, _, _) = systemUnderTest()
      val home = controller.landing().apply(FakeRequest(GET, "/").withCSRFToken)

      status(home) mustBe OK
      contentType(home) mustBe Some("text/html")
    }
    //TODO: would be better to have a check for the most important elements
    // (eg. Call to action button, cookie banner, Data privacy policy etc...)
  }

  "Donating data from Facebook" should {
    def postRequestFacebook(
      controller: SocialDataDonationController,
      setSession: Boolean,
      body: (String, String)*
    ): Future[Result] = {
      val baseFakeRequest = FakeRequest(POST, "/upload")

      val maybeSessionRequest =
        if (setSession) baseFakeRequest.withSession("GeneratedDonorId" -> fakeDonorId)
        else baseFakeRequest

      val request = maybeSessionRequest.withFormUrlEncodedBody(body: _*)

      controller.postData().apply(request)
    }

    "redirect to the thank you page with a valid JSON body and save the social data" in {

      val (controller, sender, _) = systemUnderTest()

      val validJsonString =
        """
          |{
          |  "donor_id": "1A2B3C",
          |  "conversations": [
          |    {
          |      "is_group_conversation": false,
          |      "conversation_id": "FooBar",
          |      "participants": ["1A2B3C", "AD44FF"],
          |      "messages": [
          |        {
          |          "word_count": 40,
          |          "timestamp_ms": 1528101324250,
          |          "sender": "1A2B3C"
          |        }
          |      ],
          |      "messages_audio": [
          |        {
          |          "length_seconds": 20,
          |          "timestamp_ms": 1528101324250,
          |          "sender": "1A2B3C"
          |        }
          |      ],
          |      "donation_data_source_type": "WhatsApp",
          |      "selected": true
          |    }
          |  ]
          |}
        """.stripMargin

      val upload = postRequestFacebook(controller, setSession = true, "inputJson" -> validJsonString)

      status(upload) mustBe OK

      verify(sender).saveData(
        SocialData(
          "1A2B3C",
          List(
            Conversation(
              isGroupConversation = false,
              "FooBar",
              List("1A2B3C", "AD44FF"),
              List(ConversationMessage(40, 1528101324250L, Some("1A2B3C"))),
              List(ConversationMessageAudio(20, 1528101324250L, Some("1A2B3C"))),
              DonationDataSourceType.WhatsApp,
              true
            )
          )
        )
      )
    }

    "redirect to the donation page with an invalid JSON body" in {
      val (controller, _, _) = systemUnderTest()
      val invalidJsonString =
        """
        |{{
        """.stripMargin

      val upload = postRequestFacebook(controller, setSession = true, "inputJson" -> invalidJsonString)

      status(upload) mustBe SEE_OTHER
      redirectLocation(upload) mustBe Some("/data-donation")
    }

    "render Unauthorized if the POST request doesn't have a session value" in {
      val (controller, _, _) = systemUnderTest()

      val upload = postRequestFacebook(controller, setSession = false, "inputJson" -> "{}")

      status(upload) mustBe UNAUTHORIZED
    }
  }

  "Accepting the T&C" should {
    "redirect to the donation page with a donor ID in the session if survey integration is turned off" in {
      val (controller, _, _) = systemUnderTest()
      val fakeRequest = FakeRequest("POST", "/consent-to-study")

      val result = controller.consentToStudy()(fakeRequest)

      status(result) mustBe SEE_OTHER
      redirectLocation(result) mustBe Some("/data-donation")
      session(result).get("GeneratedDonorId") mustBe Some(fakeDonorId)
    }

    "redirect to the external survey page with a donor ID in the session if survey integration is turned on" in {
      val (controller, _, _) = systemUnderTest(isSurveyEnabled = true)
      val fakeRequest = FakeRequest("POST", "/consent-to-study")

      val result = controller.consentToStudy()(fakeRequest)

      status(result) mustBe SEE_OTHER
      redirectLocation(result) mustBe Some(
        SurveyConfig(fakeSurveyUrl).createDonorLink(ExternalDonorId(fakeDonorId), "en").toString
      )
      session(result).get("GeneratedDonorId") mustBe Some(fakeDonorId)
    }
  }

  private def systemUnderTest(isSurveyEnabled: Boolean = false): (
    SocialDataDonationController,
    SocialDataService,
    DonationService
  ) = {
    val mockSocialDataService = mock[SocialDataService]
    mockSocialDataService.saveData(any[SocialData]).returns(EitherT.rightT(Future.unit))

    val mockService = mock[DonationService]
    mockService.beginOnlineConsentDonation().returns(Future.successful { ExternalDonorId(fakeDonorId) })

    val controller =
      new SocialDataDonationController(
        mockSocialDataService,
        mockService,
        SurveyConfig(fakeSurveyUrl, isSurveyEnabled),
        stubControllerComponents(),
        new MessageAnalysisService(FeedbackConfig(1.day, 1000)),
        new InMemoryDataSourceDescriptionService()
      )

    (controller, mockSocialDataService, mockService)
  }
}
