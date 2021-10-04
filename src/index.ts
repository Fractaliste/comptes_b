import "reflect-metadata";
import { createConnection } from "typeorm";
import { Categorie } from "./entity/Categorie";

createConnection().then(async connection => {

    console.log("Inserting a new user into the database...");
    const c = new Categorie()
    c.name = "hello"
    c.type = "COURANTE"
    await connection.manager.save(c);
    console.log("Saved a new user with id: " + c.id);


    console.log("Here you can setup and run express/koa/any other framework.");

}).catch(error => console.log(error));
