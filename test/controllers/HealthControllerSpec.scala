package controllers

import org.scalatestplus.play.PlaySpec
import org.scalatestplus.play.guice.GuiceOneAppPerTest
import play.api.test.{FakeRequest, Injecting}
import play.api.test.Helpers._

final class HealthControllerSpec extends PlaySpec {
  "HealthController GET" should {
    "return status 200 with JSON body" in {
      val controller = new HealthController(stubControllerComponents())
      val health = controller.status().apply(FakeRequest(GET, "/health"))

      status(health) mustBe OK
      contentType(health) mustBe Some("application/json")
    }
  }
}
