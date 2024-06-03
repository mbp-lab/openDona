package controllers

import config.FeedbackSurveyConfig
import javax.inject._
import models.api._
import models.domain.DonationDataSourceType.{DonationDataSourceType, _}
import models.domain.ExternalDonorId
import org.slf4j.LoggerFactory
import persistence.DonationService
import play.api.data.Form
import play.api.i18n.{I18nSupport, Messages}
import play.api.libs.json._
import play.api.mvc._
import scalaz.{-\/, \/-}
import services._

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

@Singleton
final class FeedbackSurveyController @Inject()(
                                                    feedbackSurveyConfig: FeedbackSurveyConfig,
                                                    cc: ControllerComponents
                                                  ) extends AbstractController(cc)
  with I18nSupport {

  private val logger = LoggerFactory.getLogger(classOf[AbstractController])

  private val GeneratedDonorIdKey = "GeneratedDonorId"

  def goToFeedback(donorId: String): Action[AnyContent] = Action { implicit request: Request[AnyContent] =>
    val isolocaleString = messagesApi.preferred(request).lang.locale.getLanguage
    val link = feedbackSurveyConfig.createFeedbackLink(donorId, isolocaleString).toString
    Redirect(link)
  }

}
