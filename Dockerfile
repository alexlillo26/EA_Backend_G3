FROM node:lts

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copiar los archivos de dependencias
COPY package*.json ./

# Instalar las dependencias
RUN npm install

# Copiar el resto del código fuente al contenedor
COPY . .

# Exponer el puerto en el que se ejecutará la aplicación
EXPOSE 9000

# Comando para compilar el TypeScript y ejecutar el servidor
CMD ["sh", "-c", "npm run start"]