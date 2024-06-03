#!groovy

@Library(value='pipeline-lib@master', changelog=false) _

def buildCacheImage = { cacheImage, registries ->
    // Build cache image when at least one registry is missing it
    registries.each { registry ->
        if (!utilDocker.dockerTagExists(cacheImage, registry)) {
            echo("Warning: Docker image ${cacheImage} missing in registry ${registry}")
            sh("docker build -t ${cacheImage} -f Dockerfile.cache .")
            return true // this is a 'break' - build local version only once
        }
    }
}

def pushCacheImage = { cacheImage, registries ->
    // Push cache image to all registries
    registries.each { registry ->
        if (!utilDocker.dockerTagExists(cacheImage, registry)) {
            echo("Info: Pushing Docker image ${cacheImage} to registry ${registry}")
            utilDocker.TagAndPush(cacheImage, registry)
        }
    }
}

def buildFunction = { imageName, imageVersion, registries ->

    def cacheImageVersion = '1'
    def cacheImage = "${imageName}-cache:${cacheImageVersion}" // local image only - needs to be pushed to a registry later
    buildCacheImage(cacheImage, registries)
    pushCacheImage(cacheImage, registries)

    // Build (no push, no tag)
    def image = "${imageName}:${imageVersion}"
    def firstRepo = registries.first().replaceAll('/$', "")
    sh("docker build -t ${image} --build-arg CACHE_DOCKER_REPO=${firstRepo} -f Dockerfile .")
}

def twistlockScanExtraFunction = { imageName, imageVersion, registries -> }

buildPipeline projectName: 'hc-rp-kalinka',
            testFunction: null,
            buildFunction: buildFunction,
            twistlockScanExtraFunction: twistlockScanExtraFunction
