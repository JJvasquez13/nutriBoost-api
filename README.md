# nutriBoost-api


Empezar con un

  - npm install

Crear una carpeta .env y pegarle lo siguiente:
Tiene que agregarle la apikey de open ai visitando la pagina:
https://platform.openai.com/api-keys

PORT=5000
MONGO_URI=mongodb://localhost:27017/NutriBoost
SECURITY_API_URL=http://localhost:5002
SECURITY_API_KEY=6a106c6b37e40ffbe031bc99a51f0f37a9dc231d91d2d68b3a80e0de7df2e6bf
JWT_SECRET=6a106c6b37e40ffbe031bc99a51f0f37a9dc231d91d2d68b3a80e0de7df2e6bf
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini

Para correr el api se utiliza

  - npm start

Para acceder a la Documentacion de Swagger utilizar el siguiente link:
http://localhost/5000/docs
