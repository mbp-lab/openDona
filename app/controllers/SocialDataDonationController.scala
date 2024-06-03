package controllers

import config.SurveyConfig

import javax.inject._
import models.api._
import models.domain.DonationDataSourceType.{DonationDataSourceType, _}
import models.domain.ExternalDonorId
import org.slf4j.LoggerFactory
import persistence.DonationService
import play.api.data.Form
import play.api.i18n.{I18nSupport, Lang, Messages}
import play.api.libs.json._
import play.api.mvc._
import play.filters.csrf.CSRF
import scalaz.{-\/, \/-}
import services._

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

@Singleton
final class SocialDataDonationController @Inject()(
  socialDataService: SocialDataService,
  donationService: DonationService,
  surveyConfig: SurveyConfig,
  cc: ControllerComponents,
  messageAnalysisService: MessageAnalysisService,
  dataSourceDescriptionService: DataSourceDescriptionService
) extends AbstractController(cc)
    with I18nSupport {

  private val logger = LoggerFactory.getLogger(classOf[AbstractController])

  import SocialDataForm._

  private val GeneratedDonorIdKey = "GeneratedDonorId"

  def changeLanguage(language: String): Action[AnyContent] = Action { implicit request: Request[AnyContent] =>
    Redirect(request.headers.get(REFERER).getOrElse("/")).withLang(Lang(language)).withSession(request.session)
  }

  def landing: Action[AnyContent] = Action { implicit request: Request[AnyContent] =>
    val designVersion = request.queryString.get("design").flatMap(_.headOption).map(_.filter(_.isLetterOrDigit))
    logger.info(s"""{"status": "landing-page"}""")
    // only do a new session if there is no session yet
    // otherwise take the old session (as users might open two tabs to read information from earlier pages)
    // the donor id gets recreated later - so it is no problem that the session contains the donorId of the old session
    // furthermore, playframework takes care of removing a session cookie after one hour (check application.conf for that)
    if (request.session.isEmpty)
      Ok(views.html.landing(designVersion)).withNewSession
    else (
      Ok(views.html.landing(designVersion)).withSession(request.session)
    )

  }

  def learnMore: Action[AnyContent] = Action { implicit request: Request[AnyContent] =>
    Ok(views.html.learnMore()).withSession(request.session)
  }

  def impressum: Action[AnyContent] = Action { implicit request: Request[AnyContent] =>

    Ok(views.html.impressum()).withSession(request.session)
  }

  def donationInfo: Action[AnyContent] = Action { implicit request: Request[AnyContent] =>

    Ok(views.html.donationInformation()).withSession(request.session)
  }

  def instructions: Action[AnyContent] = Action { implicit request: Request[AnyContent] =>

    Ok(views.html.instructions(dataSourceDescriptionService.listAll)).withSession(request.session)

  }

  def consentToStudy: Action[AnyContent] = Action.async { implicit request: Request[AnyContent] =>
    val isolocaleString = messagesApi.preferred(request).lang.locale.getLanguage
    for {
      donorId <- donationService.beginOnlineConsentDonation()
      link = surveyConfig.createDonorLink(ExternalDonorId(donorId.toString), isolocaleString).toString
    } yield {
      logger.info(s"""{"status": "consent-given"}""")
      Redirect(link).withSession(request.session + (GeneratedDonorIdKey -> donorId.toString))
    }
  }

  def showDataDonationPage: Action[AnyContent] = Action { implicit request: Request[AnyContent] =>
    request.session.get(GeneratedDonorIdKey) match {
      case None => Redirect(routes.SocialDataDonationController.landing())
      case Some(donorId) =>

        logger.info(s"""{"status": "completed-survey"}""")
        Ok(views.html.anonymisation(socialDataForm, donorId.toString, dataSourceDescriptionService.listAll)).withSession(request.session + (GeneratedDonorIdKey -> donorId.toString))
    }
  }

  private def failDonationProcess(
    donationType: DonationDataSourceType,
    errorMessage: String = "An error occurred while trying to receive your de-identified data. Please try again."
  ): Result = {
    logger.error(s"ERROR: $errorMessage")
    Redirect(routes.SocialDataDonationController.showDataDonationPage()).flashing("errorMessage" -> errorMessage)
  }

  def postData: Action[AnyContent] = Action.async { implicit request: Request[AnyContent] =>
    val donationType = Multiple
    def formWithErrors(donorId: String)(formWithErrors: Form[SocialFormData]): Future[Result] = Future.successful {
      BadRequest {
        views.html.anonymisation(formWithErrors, donorId, dataSourceDescriptionService.listAll)
      }
    }

    val messages = implicitly[Messages]
    val donor = messages("donation.anonymisation.donor")

    def formWithoutErrors(donorId: String)(socialFormData: SocialFormData): Future[Result] = {

      def replaceDonorStringWithDonorId(inputJson: String) = {
        /* On the donation page the citizen's name is replaced with "donor". We need to replace this with the donorid
         so that the donor will be shown as a participant and a sender when ingested into the db
         */
        inputJson.replaceAll("\"" + donor + "\"", s""""$donorId"""")
      }

      def validateInput(inputJson: String): Either[String, SocialData] = {
        logger.error(inputJson)
        val parseError = "Error parsing social data from client."
        try {
          Json
            .parse(replaceDonorStringWithDonorId(inputJson))
            .validate[SocialData]
            .asEither
            .fold(
              _ => {
                logger.error(s"Unable to parse data for donorId '$donorId'!")
                Left(parseError)
              },
              data => {
                Right(data)
              }
            )
        } catch {
          case _: Exception => Left(parseError)
        }
      }

      def saveData(socialData: SocialData): Future[Result] = {

        socialDataService.saveData(socialData).run.map {
          case -\/(error) =>
            logger.error(error)
            failDonationProcess(donationType)
          case \/-(_) =>
            val filteredConversations = socialData.conversations.filter((c) => c.selected)
            val filteredSocialData = SocialData(socialData.donorId, filteredConversations)
            val messageAnalysisOut = messageAnalysisService.produceGraphData(filteredSocialData)
            logger.info(s"""{"status": "donated-successfully"}""")

            Ok(
              views.html.feedback(
                donorId,
                // we need to have string keys in order for the transformation to a JSON object to work correctly front-end
                messageAnalysisOut.map { case (key, value) => key.toString -> value }
              )
            ).withSession(request.session + (GeneratedDonorIdKey -> donorId.toString))
        }
      }

      validateInput(socialFormData.inputJson)
        .fold(_ => Future.successful(failDonationProcess(donationType)), saveData)
    }

    request.session.get(GeneratedDonorIdKey) match {
      case Some(donorId) =>
        socialDataForm.bindFromRequest().fold(formWithErrors(donorId), formWithoutErrors(donorId))
      case None =>
        logger.info(s"""{"status": "something-went-wrong"}""")
        Future.successful(Unauthorized(messages("donation.errors.something-went-wrong")))
    }
  }

}
