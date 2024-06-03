package persistence

import models.domain.DonationStatus
import slick.ast.BaseTypedType

trait DonationStatusSupport {
  implicit val statusTypeMapper: BaseTypedType[DonationStatus]
}
