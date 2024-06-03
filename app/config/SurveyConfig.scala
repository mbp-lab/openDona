package config

import akka.http.scaladsl.model.Uri
import com.typesafe.config.Config
import controllers.routes
import models.domain.ExternalDonorId

case class SurveyConfig(baseUrl: Uri, surveyEnabled: Boolean = true) {

  def createDonorLink(donorId: ExternalDonorId, iso3localeString: String): Uri = {
    if (surveyEnabled) {
      baseUrl.withQuery(("lang" -> iso3localeString) +: ("UID" -> donorId.toString) +: baseUrl.query())
    } else {
      routes.SocialDataDonationController.showDataDonationPage().url
    }
  }
}

object SurveyConfig {

  def apply(config: Config, surveyEnabled: Boolean): SurveyConfig = {
    SurveyConfig(Uri(config.getString("url")), surveyEnabled)
  }
}
