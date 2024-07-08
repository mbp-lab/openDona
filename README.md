# Dona - Social Data Gathering Platform
Dona is a platform developed to collect and de-identify social data to be later used as part of a research effort to characterize mental wellbeing.

## Overview
The platform is deployed in two Docker containers, one containing the website and one containing the database.
 
### Website
The website is built using the play framework with the scala backend. The user journey looks like this:

Upon reaching the landing page the user is given information on the study. The next page gives the user instructions on how to download their data from WhatsApp, Facebook and Instagram. Users are urged to do so before continuing. If the user chooses to take part in the study, they are shown the digital consent form that must be agreed to. Upon agreeing, a cookie is set that must be present for later steps and a donor_id is created and stored in database with the status 'pending'.

The user is then forwarded to a survey website where they need to complete a questionnaire. Once completed, they come back to the upload page of Dona where they can select the platforms that they want to upload data for.

After selecting the files, participants will see a visualisation of the anonymized data to confirm that the data is indeed anonymized. No data from the participants' files has been sent to the server so far.

Once the user chooses to send the data it is transferred in the back-end of the application and stored in the database. The donation status is updated to 'completed'.

The user will then see insightful visualizations of their own chat behavior.

Afterwards, additional surveys can be displayed.

### Database
The database docker container uses postgreSQL and has the following tables:

| donations                                                           | conversations                                                       | conversation_participants                                                                                                                       | messages                                                                              |
| ------------------------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **id**: A unique ID per donation (primary key)                      | **id**: A unique ID per conversation (primary key)                  | **id**: A unique ID per person-conversation pair (primary key)                                                                                  | **id**: A unique ID per message (primary key)                                         |
| **status**: 'notstarted', 'pending', 'complete', 'deleted'          | **is_group_conversation**: A flag indicating group conversations    | **conversation_id**: A foreign key for conversations.id                                                                                         | **conversation_id**: A foreign key for conversations.id                               |
| **external_donor_id**: An ID used to connect individuals to surveys | **data_source_id**: 1 for Facebook, 2 for WhatsApp, 3 for Instagram | **participant_id**: An ID to identify participants across conversations. For messages sent by the donor, this is the same as donations.donor_id | **sender_id**: A foreign key for conversation_participants.participant_id             |
| **donor_id**: An ID used to identify the donor in conversations     | **donation_id**: Foreign key for donations.id                       | **participant_pseudonym**: The pseudonym that chats get when being shown to the participants in feedback, e.g. "Chat W1"                        | **datetime**: A UNIX timestamp for each message.                                      |
|                                                                     |                                                                     |                                                                                                                                                 | **word_count**: The length of messages either in words or in seconds (audio messages) |

## Setup Instructions

First, clone this repository and make sure that [Docker is installed](https://docs.docker.com/engine/install/) on your server.

### Environment Variables

The following need to be set up in the environment to run the application. 
* `APPLICATION_SECRET` Play framework application secret, we recommend you to choose a random character string.
* `KALINKA_HOST` The host of the application. Required for the domain field of the cookie.
* `DATABASE_HOST` Host of Postgres instance
* `DATABASE_PORT` Port of Postgres instance
* `DATABASE_NAME` Name of Postgres database
* `DATABASE_USER` Postgres user
* `DATABASE_PASSWORD` Password for postgres user, we recommend you to choose a random character string.
* `DONOR_SURVEY_ENABLED` Whether the user should be forwarded to an external survey or not
* `DONOR_SURVEY_LINK` The link to the external survey.
* `SOCIAL_DATA_INGESTION_ENABLED` Toggle if data is stored or not (e.g. for demo purposes)
* `DONOR_ID_INPUT_METHOD` "default", "showid" or "manually" to either generate the id and don't show it, generate it and show it or enter an ID manually and show it

Most of these variables can be changed in the `docker-compose.yml`. For the more delicate ones, read below.

### The .env-file

`APPLICATION_SECRET`, `DATABASE_USER` and `DATABASE_PASSWORD` do not directly get assigned a value in docker-compose.yml so that no credentials are pushed to the remote repository. Thats why you have to create a file called ".env" in your local project-root-directory which sets those environment variables, which in turn are referenced in docker-compose.yml. You can find a template called `.env.example` in the remote repository. Just change the values as you like (passwords should be strong for production), rename it to `.env` and copy it into your local project-root-directory.

### docker-compose

In order build and start the application locally using docker you can run
```sh
docker-compose up
```
or if you want to make sure the image is rebuilt you can add the `--build` flag. You also might consider using background mode, if you plan to leave the process up while you are not working on it.
```sh
docker-compose up -d
```

This will bring up the Dona service and a postgres database for it to connect to. You can now access the [application](localhost:9000)

For a deeper undersanding of the docker compose setup take a look at the yaml file [docker-compose.yml](docker-compose.yml)

### Web Server

To make the platform accessible from the internet, a web server such as [Nginx](https://nginx.org/en/) needs to be set up to forward outside requests to the locally running docker containers. Your server's firewall configuration might need to be adapted to allow incoming requests.

Additionally, you should get a DNS entry for your IP such that participants can reach the platform via a domain instead of an IP address.

To make sure that participant data is securely transmitted, an SSL certificate should be issued for your domain. For that, we recommend [certbot](https://certbot.eff.org/).

## Development Instructions

### SBT Cache Container
Running sbt update takes a long time (~10 mins) so we do not want to do 
this unless something has changed in the sbt dependency chain. In order 
to do this a "cache container" is built. To build this cache container 
run the following.  

```sh
docker build . --file Dockerfile.cache --tag dona.tf.uni-bielfeld.de/hc-rp-kalinka-cache:1 
```

### Running without docker (faster for development)

#### NPM

NPM is required to build the javascript code.  
 
Steps:  
1. install npm (currently v6 is used as part of node v12) 
Get the latest version of npm through the usual way for your system or
check out the [npmjs side](https://www.npmjs.com/package/npm) or, as is 
done in docker, you can run: 
```sh
curl -sL https://deb.nodesource.com/setup_12.x | bash - && apt-get install -y nodejs
```

2. npm install

Run the `npm install` command to install the dependencies required.

3. install and run browserify

[browserify](https://github.com/browserify/browserify) is used for having a node-style `require()` import in browser. In this project it is used to create two required files:   
* `bundle.js` - de-identification, parsing and show the data to the user 
* `plot.js` - show the user their results using plotly.js 

To generate these files run the following:

```sh
npm install -g browserify
mkdir public/javascripts
browserify javascripts/main.js > ./public/javascripts/bundle.js
browserify javascripts/thanks.js > ./public/javascripts/plot.js
```

These files are imported into the html using a normal script tag. 

#### SBT

This is the [Interactive Build Tool](https://www.scala-sbt.org/) and is used to package the scala code and assemble everything into a jar file that will run in the docker container.

### local config

In order to use developer specific settings locally, add a file `/conf/local.conf` with settings specific to your local development setup. This file is on the gitignore list, so it won't interfere with others.

Example that overrides default development database settings:

```conf
# local config

include "development.conf"

# example, add your local database details
db.default {
  url="jdbc:postgresql://localhost:5432/kalinka"
  username="postgres"
  password="postgres"
}

```
Then run

```sh
sbt -Dconfig.resource=local.conf run
```

### In other environments

For other environments you can inject different configuration files for
example: 

```sh
sbt -Dconfig.resource=development.conf run
```

### Testing

There are tests for both scala and javascript code. Coverage is not at 100% so there is room for improvement but this give some confidence when making changes.

To run the tests run the following commands:
```sh
npm test
sbt test
``` 