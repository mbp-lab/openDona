package config

import akka.http.scaladsl.model.Uri
import models.domain.ExternalDonorId
import org.scalatest.{FreeSpec, Matchers}

final class SurveyConfigSpec extends FreeSpec with Matchers {
  "Generating a donor's URL" - {
    "for a base URL already without a query parameter" - {
      val url = Uri("http://survey-host.com/survey")
      val config = SurveyConfig(url)
      val donorId = ExternalDonorId("testId")

      "should add their ID as a query parameter and language english" in {
        config.createDonorLink(donorId, "en").query() should contain theSameElementsAs List(
          "UID" -> "testId",
          "lang" -> "en"
        )
      }

      "should add their ID as a query parameter and language german" in {
        config.createDonorLink(donorId, "de").query() should contain theSameElementsAs List(
          "UID" -> "testId",
          "lang" -> "de"
        )
      }
    }

    "for a base URL already containing a query parameter" - {
      "should add their ID as an additional parameter" in {
        val url = Uri("http://survey-host.com/survey?act=1234")
        val config = SurveyConfig(url)
        val donorId = ExternalDonorId("testId")
        config.createDonorLink(donorId, "en").query() should contain theSameElementsAs List(
          "UID" -> "testId",
          "act" -> "1234",
          "lang" -> "en"
        )
      }
    }
  }
}
