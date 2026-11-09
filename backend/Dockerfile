# ---------- 1) Build aşaması ----------
FROM eclipse-temurin:25-jdk AS build
WORKDIR /app

# Önce sadece wrapper + pom kopyalanır: kod değişince bağımlılıklar tekrar inmez (cache)
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
# Windows'ta CRLF'e dönmüş mvnw'yi düzelt, çalıştırılabilir yap
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw && ./mvnw -B -q dependency:go-offline

COPY src ./src
RUN ./mvnw -B -q package -DskipTests

# ---------- 2) Çalıştırma aşaması (sadece JRE, daha küçük imaj) ----------
FROM eclipse-temurin:25-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
