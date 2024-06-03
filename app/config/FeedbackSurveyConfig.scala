package config

import akka.http.scaladsl.model.Uri
import com.typesafe.config.Config
import controllers.routes

case class FeedbackSurveyConfig(baseUrl: Uri) {

  def createFeedbackLink(donorIdString: String, iso3localeString: String): Uri = {
    baseUrl.withQuery(("lang" -> iso3localeString) +: ("UID" -> donorIdString) +: baseUrl.query())
  }
}

object FeedbackSurveyConfig {

  def apply(config: Config): FeedbackSurveyConfig = {
    FeedbackSurveyConfig(Uri(config.getString("url")))
  }
}
