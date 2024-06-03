package persistence

import java.time.ZoneOffset

import com.github.tminglei.slickpg.{ExPostgresProfile, PgEnumSupport}
import models.domain.DonationStatus
import slick.ast.BaseTypedType

trait EnumSupportingPostgresProfile extends ExPostgresProfile with PgEnumSupport with DonationStatusSupport {

  val ZoneOffsetUTC: ZoneOffset = ZoneOffset.UTC

  override implicit val statusTypeMapper: BaseTypedType[DonationStatus] =
    createEnumJdbcType("donation_status", _.toSqlString, DonationStatus.apply, false)
}

object EnumSupportingPostgresProfile extends EnumSupportingPostgresProfile
