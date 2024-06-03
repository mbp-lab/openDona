package controllers

import com.google.inject.Inject
import play.api.i18n.I18nSupport
import play.api.mvc._
import org.slf4j.LoggerFactory

import scala.concurrent.ExecutionContext.Implicits.global

final class DownloadController @Inject()(cc: ControllerComponents) extends AbstractController(cc) with I18nSupport {


  private val logger = LoggerFactory.getLogger(classOf[AbstractController])

  def informedConsent: Action[AnyContent] = Action { implicit request: Request[AnyContent] =>
    val isolocaleString = request.lang.language

    var filepath = "/public/informedConsents/informedConsent_eng.pdf"
      if (isolocaleString == "en") {
        filepath = "/public/informedConsents/informedConsent_eng.pdf"
      } else if (isolocaleString == "de") {
        filepath = "/public/informedConsents/informedConsent_de.pdf"
      }

    val file = new java.io.File(filepath)
    Ok.sendFile(file, inline = false).withHeaders(
      CACHE_CONTROL -> "max-age=0",
      CONTENT_DISPOSITION -> s"attachment; filename=${file.getName}"
    )
  }


}
