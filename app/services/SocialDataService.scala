package services

import models.api.SocialData
import scalaz.EitherT

import scala.concurrent.Future

trait SocialDataService {

  def saveData(socialData: SocialData): EitherT[Future, String, Unit]
}
