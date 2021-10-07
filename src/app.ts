import * as express from "express";
import { Request, Response } from "express";
import { Connection, createConnection, Entity } from "typeorm";
import "reflect-metadata";

const app = express();
createConnection().then(connection => {

    listenToDefault(connection, "categorie")
    listenToDefault(connection, "compte")
    listenToDefault(connection, "ligne")
    listenToDefault(connection, "releve")
    listenToDefault(connection, "tier")

    // create and setup express app
    app.use(express.json());

    app.listen(3000);
    console.log("Listening port 3000");

})

function listenToDefault<Type>(connection: Connection, dtoName: string) {
    const repo = connection.getRepository(dtoName);
    const baseUrl = `/${dtoName}`
    app.post(baseUrl, function (req: Request, res: Response) {
        const entity = repo.create(req.body);
        repo.save(entity)
            .then(() => res.sendStatus(200))
            .catch(error => {
                res.sendStatus(500)
                console.error(error);
            })
    });

    app.get(baseUrl, function (req: Request, res: Response) {
        repo.find()
            .then((entities) => {
                res.status(200)
                res.send(entities)
            })
            .catch(error => {
                res.sendStatus(500)
                console.error(error);
            })
    });
}

