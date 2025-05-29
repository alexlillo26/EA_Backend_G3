# MINIMO_2
LINKS:
Frontend (Flutter): https://github.com/alexlillo26/EA_Flutter_G3 rama: minimo2-reda
Backend: https://github.com/alexlillo26/EA_Backend_G3 rama: minimo2-reda
BACKEND:
En el backend, se trabaja en local, hay que crear 2 veces un fichero .env para que funcione: uno dentro de la carpeta build, y otro debajo del dockerignore (no dentro), el contenido esta en el pdf que entregué ya que no me deja ponerlo en readme (informacion sensible).

FRONTEND:
En el frontend todo funciona bien.
Como usuario test puedes usar: kim@gmail.com 123RedaMakroum?
Para probarlo en la base de datos tengo usuarios en la ciudad “gava” y en la categoria
“Peso pluma






## Descripció

Una API bàsica desenvolupada en Node.js amb TypeScript, utilitzant Express i Mongoose per a la gestió de dades en MongoDB. A més, s'inclou
documentació amb Swagger.

## Requisits previs

Abans d'executar el projecte, assegura't de tenir instal·lat:

-   [Node.js](https://nodejs.org/)
-   [MongoDB](https://www.mongodb.com/)

## Instal·lació

Clona el repositori i executa la següent comanda per instal·lar les dependències:

```sh
npm install
```

## Configuració

Crea un fitxer `.env` a la arrel del projecte i defineix les següents variables d'entorn//canviar les strings directament en el codi a les línies 16
(Port) i 69 (uri mongo) :

```env
MONGO_URI=mongodb://localhost:27017/proyecto
PORT=9000
```

## Execució

Per iniciar l'API (tsc + cd ./build + node server.js):

```sh
npm start
```

## Documentació

Swagger està disponible a:

```
http://localhost:9000/api-docs
```

## Dependències Principals

-   `dotenv`: Gestió de variables d'entorn.
-   `mongodb` i `mongoose`: Base de dades MongoDB.
-   `swagger-jsdoc` i `swagger-ui-express`: Generació de documentació.
-   `express`: Framework per a l'API.

## Dependències de Desenvolupament

-   `typescript`: Suport per a TypeScript.
-   `@types/*`: Definicions de tipus per a biblioteques utilitzades.
