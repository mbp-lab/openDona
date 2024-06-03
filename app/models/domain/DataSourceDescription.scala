package models.domain

import java.net.URI

import models.domain.DataSourceDescription._
import models.domain.DonationDataSourceType.DonationDataSourceType

case class DataSourceDescription(
  name: DonationDataSourceType,
  description: String,
  parsingDetails: ParsingDetails,
  documentation: String,
  animation: Option[AnimatedImage] = None,
  dataDownloadSteps: List[String],
  illustration: Option[String] = None,
  logo: Option[String] = None,
  requiresAlias: Boolean = true
)

object DataSourceDescription {

  case class DescriptionTooLargeException() extends Exception

  case class ParsingDetails(
    script: String,
    specificFileExtensionAccepted: Option[String] = None //empty => accept all
  )

  case class AnimatedImage(source: String, height: Int, width: Int)
}
