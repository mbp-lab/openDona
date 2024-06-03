import java.io.FilenameFilter

import sbt.internal.io.Source

import scala.sys.process._

name := "hc-rp-kalinka"

version := "0.1.1"

scalaVersion := "2.12.10"

resolvers += "Sonatype OSS Snapshots" at "https://oss.sonatype.org/content/repositories/snapshots/"

lazy val root = (project in file(".")).enablePlugins(PlayScala)

libraryDependencies += guice
libraryDependencies += ws
libraryDependencies += jdbc
libraryDependencies += "org.scalaz" %% "scalaz-core" % "7.2.27"
libraryDependencies += "org.webjars" % "bootstrap" % "4.3.1" exclude("org.webjars", "jquery")
libraryDependencies += "org.webjars" % "jquery" % "3.4.1"
libraryDependencies += "org.webjars" % "font-awesome" % "4.7.0"
libraryDependencies += "net.logstash.logback" % "logstash-logback-encoder" % "5.1"
libraryDependencies += "org.scalatestplus.play" %% "scalatestplus-play" % "3.1.2" % Test
libraryDependencies += specs2 % Test
libraryDependencies += "org.flywaydb" %% "flyway-play" % "5.0.0"
libraryDependencies += "org.postgresql" % "postgresql" % "42.2.5"
libraryDependencies += "com.typesafe.play" %% "play-json" % "2.6.10"
libraryDependencies += "com.typesafe.slick" %% "slick" % "3.2.3"
libraryDependencies += "com.typesafe.play"  %% "play-slick" % "3.0.3"
libraryDependencies += "com.github.tminglei" %% "slick-pg" % "0.17.0"
libraryDependencies += "javax.xml.bind" % "jaxb-api" % "2.1" // Required for JRE-11 compatibility

assemblyJarName in assembly := "hc-rp-kalinka.jar"

mainClass in assembly := Some("play.core.server.ProdServerStart")
fullClasspath in assembly += Attributed.blank(PlayKeys.playPackageAssets.value)

javaOptions in Test ++= Seq("-Dconfig.resource=test.conf")

assemblyMergeStrategy in assembly := {
  case manifest if manifest.contains("MANIFEST.MF") => MergeStrategy.discard
  case referenceOverrides if referenceOverrides.contains("reference-overrides.conf") =>  MergeStrategy.concat
  case x =>
    val oldStrategy = (assemblyMergeStrategy in assembly).value
    oldStrategy(x)
}

test in assembly := {}

val browserifyTask = taskKey[Seq[File]]("Run browserify")

val browserifyOutputDir = settingKey[File]("Browserify output directory")
browserifyOutputDir := new File("public").getAbsoluteFile / "javascripts"

val bundleOutput = settingKey[File]("Location of generated bundle.js")
bundleOutput := browserifyOutputDir.value / "bundle.js"

val plotOutput = settingKey[File]("Location of generated plot.js")
plotOutput := browserifyOutputDir.value / "plot.js"

browserifyTask := {
  val cacheFunction = FileFunction.cached(streams.value.cacheDirectory) { _ =>
    println("Running browserify")
    browserifyOutputDir.value.mkdirs
    val shell: Seq[String] = if (sys.props("os.name").contains("Windows")) Seq("cmd", "/c") else Seq("bash", "-c")
    val mainCmd = shell :+ "browserify javascripts/main.js -o " + bundleOutput.value.getPath
    val plotCmd = shell :+ "browserify javascripts/thanks.js -o" + plotOutput.value.getPath
    val status: Int = (mainCmd #&& plotCmd !)
    if (status != 0) throw new IllegalStateException("browserify failed!")
    Set(bundleOutput.value, plotOutput.value)
  }
  cacheFunction(new File("javascripts").listFiles().toSet)
  List()
}

unmanagedResourceDirectories in Compile += new File("javascripts")

sourceGenerators in Compile +=  browserifyTask.taskValue

cleanFiles ++= Seq(bundleOutput.value, plotOutput.value)
