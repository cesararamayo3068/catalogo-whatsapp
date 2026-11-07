FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B -ntp dependency:go-offline
COPY src src
RUN mvn -B -ntp verify

FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S commerce && adduser -S commerce -G commerce && mkdir /uploads && chown commerce:commerce /uploads
WORKDIR /app
COPY --from=build /app/target/commerce-0.1.0-SNAPSHOT.jar app.jar
USER commerce
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
