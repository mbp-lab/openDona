package controllers

import javax.inject.Inject
import play.api.libs.json.Json
import play.api.mvc.{AbstractController, Action, AnyContent, ControllerComponents}

final class HealthController @Inject()(cc: ControllerComponents) extends AbstractController(cc) {

  def status: Action[AnyContent] = Action {
    Ok(Json.obj("status" -> "alive"))
  }
}
