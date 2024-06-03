package controllers

import akka.stream.Materializer
import com.google.inject.Inject
import play.api.i18n.{I18nSupport, Lang, MessagesApi}
import play.api.mvc.{Filter, Headers, RequestHeader, Result}

import scala.concurrent.{ExecutionContext, Future}

class LanguageFilter @Inject()(implicit val mat: Materializer, ec: ExecutionContext, val messagesApi: MessagesApi)
    extends Filter
    with I18nSupport {

  override def apply(nextFilter: RequestHeader => Future[Result])(request: RequestHeader): Future[Result] = {
    val language = request.queryString.get("lang").flatMap(_.headOption).flatMap(Lang.get)
    language match {
      case Some(lang) =>
        nextFilter(request.withHeaders(Headers("Accept-Language" -> lang.code)))
      case None => nextFilter(request)
    }
  }
}
