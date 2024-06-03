package controllers

import com.google.inject.Inject
import play.api.i18n.I18nSupport
import play.api.mvc._

final class AboutController @Inject()(cc: ControllerComponents) extends AbstractController(cc) with I18nSupport {

  def dataProtection: Action[AnyContent] = Action { implicit request: Request[AnyContent] =>
    Ok(views.html.dataProtection())
  }
}
